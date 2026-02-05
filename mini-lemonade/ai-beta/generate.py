import os
import torch
from model import GPT, GPTConfig
from tokenizer import Tokenizer


def load_checkpoint(path):
    return torch.load(path, map_location='cpu')


def main():
    model_path = os.environ.get('MODEL_PATH', os.path.join(os.path.dirname(__file__), 'model.pt'))
    prompt = os.environ.get('PROMPT', 'usuario: crea un sistema de inventario\nassistant:')
    max_new = int(os.environ.get('MAX_NEW', 200))
    temperature = float(os.environ.get('TEMPERATURE', 0.9))
    top_p = float(os.environ.get('TOP_P', 0.95))

    ckpt = load_checkpoint(model_path)
    itos = ckpt['meta']['itos']
    tokenizer = Tokenizer(itos)

    cfg = GPTConfig(
        vocab_size=len(itos),
        block_size=ckpt['config']['block_size'],
        n_layer=ckpt['config']['n_layer'],
        n_head=ckpt['config']['n_head'],
        n_embd=ckpt['config']['n_embd'],
        dropout=ckpt['config']['dropout'],
    )

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model = GPT(cfg).to(device)
    model.load_state_dict(ckpt['model'])
    model.eval()

    idx = torch.tensor([tokenizer.encode(prompt)], dtype=torch.long).to(device)
    out = model.generate(idx, max_new_tokens=max_new, temperature=temperature, top_p=top_p)
    text = tokenizer.decode(out[0].tolist())
    print(text)


if __name__ == '__main__':
    main()
