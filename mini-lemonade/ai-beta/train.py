import os
import time
import json
import torch
from model import GPT, GPTConfig
from tokenizer import Tokenizer


def load_text(data_path):
    if os.path.exists(data_path):
        with open(data_path, 'r', encoding='utf-8') as f:
            return f.read()
    return (
        "Eres un asistente experto en programación.\n"
        "Responde de forma clara, coherente y con buen estilo.\n"
        "Ejemplo: \n"
        "Usuario: crea un sistema de inventario en Roblox\n"
        "Asistente: {\"files\": {\"InventoryService.lua\": \"-- code\"}}\n"
    )


def build_vocab(text):
    chars = sorted(list(set(text)))
    itos = chars
    tokenizer = Tokenizer(itos)
    return tokenizer


def get_batch(data, block_size, batch_size, device):
    max_block = min(block_size, len(data) - 2)
    if max_block < 1:
        raise ValueError("Dataset too small for batching. Add more data to data.txt")
    ix = torch.randint(len(data) - max_block - 1, (batch_size,))
    x = torch.stack([data[i:i + max_block] for i in ix])
    y = torch.stack([data[i + 1:i + max_block + 1] for i in ix])
    return x.to(device), y.to(device)


@torch.no_grad()
def estimate_loss(model, data, block_size, batch_size, device, eval_iters=50):
    model.eval()
    losses = []
    for _ in range(eval_iters):
        xb, yb = get_batch(data, block_size, batch_size, device)
        _, loss = model(xb, yb)
        losses.append(loss.item())
    model.train()
    return sum(losses) / len(losses)


def main():
    data_path = os.environ.get('DATA_PATH', os.path.join(os.path.dirname(__file__), 'data.txt'))
    model_out = os.environ.get('MODEL_OUT', os.path.join(os.path.dirname(__file__), 'model.pt'))

    config = {
        'block_size': int(os.environ.get('BLOCK_SIZE', 512)),
        'batch_size': int(os.environ.get('BATCH_SIZE', 16)),
        'n_layer': int(os.environ.get('N_LAYER', 8)),
        'n_head': int(os.environ.get('N_HEAD', 8)),
        'n_embd': int(os.environ.get('N_EMBD', 320)),
        'dropout': float(os.environ.get('DROPOUT', 0.1)),
        'max_iters': int(os.environ.get('MAX_ITERS', 2000)),
        'eval_interval': int(os.environ.get('EVAL_INTERVAL', 200)),
        'learning_rate': float(os.environ.get('LEARNING_RATE', 3e-4)),
    }

    device = 'cuda' if torch.cuda.is_available() else 'cpu'

    text = load_text(data_path)
    tokenizer = build_vocab(text)
    data = torch.tensor(tokenizer.encode(text), dtype=torch.long)

    n = int(0.9 * len(data))
    train_data = data[:n]
    val_data = data[n:]

    effective_block = min(config['block_size'], max(8, len(data) - 2))
    config['block_size'] = effective_block

    cfg = GPTConfig(
        vocab_size=len(tokenizer.itos),
        block_size=effective_block,
        n_layer=config['n_layer'],
        n_head=config['n_head'],
        n_embd=config['n_embd'],
        dropout=config['dropout'],
    )

    model = GPT(cfg).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=config['learning_rate'])

    t0 = time.time()
    for step in range(config['max_iters'] + 1):
        xb, yb = get_batch(train_data, cfg.block_size, config['batch_size'], device)
        _, loss = model(xb, yb)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        optimizer.step()

        if step % config['eval_interval'] == 0:
            train_loss = estimate_loss(model, train_data, cfg.block_size, config['batch_size'], device)
            val_loss = estimate_loss(model, val_data, cfg.block_size, config['batch_size'], device)
            dt = time.time() - t0
            print(f"step {step}: train {train_loss:.4f} | val {val_loss:.4f} | {dt:.1f}s")
            t0 = time.time()

    checkpoint = {
        'model': model.state_dict(),
        'config': config,
        'meta': { 'itos': tokenizer.itos }
    }

    torch.save(checkpoint, model_out)
    print(f"Saved model to {model_out}")


if __name__ == '__main__':
    main()
