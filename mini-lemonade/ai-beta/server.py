import os
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from model import GPT, GPTConfig
from tokenizer import Tokenizer


class Message(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: Optional[str] = None
    messages: List[Message]
    max_tokens: Optional[int] = 256
    temperature: Optional[float] = 0.9
    top_p: Optional[float] = 0.95


class ChatCompletionResponse(BaseModel):
    id: str
    object: str
    choices: list
    usage: dict


def load_model():
    model_path = os.environ.get('BETA_MODEL_PATH', os.path.join(os.path.dirname(__file__), 'model.pt'))
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")

    ckpt = torch.load(model_path, map_location='cpu')
    itos = ckpt['meta']['itos']
    tokenizer = Tokenizer(itos)

    # Inferir block_size real del checkpoint
    actual_block_size = ckpt['model']['pos_emb.weight'].shape[0]

    cfg = GPTConfig(
        vocab_size=len(itos),
        block_size=actual_block_size,
        n_layer=ckpt['config']['n_layer'],
        n_head=ckpt['config']['n_head'],
        n_embd=ckpt['config']['n_embd'],
        dropout=ckpt['config']['dropout'],
    )

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model = GPT(cfg).to(device)
    model.load_state_dict(ckpt['model'])
    model.eval()

    return model, tokenizer, device


app = FastAPI()
_model = None
_tokenizer = None
_device = None


@app.on_event("startup")
def startup_event():
    global _model, _tokenizer, _device
    _model, _tokenizer, _device = load_model()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/v1/chat/completions", response_model=ChatCompletionResponse)
def chat_completions(req: ChatCompletionRequest):
    if _model is None or _tokenizer is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    prompt = ""
    for m in req.messages:
        prompt += f"{m.role}: {m.content}\n"
    prompt += "assistant: "

    max_tokens = int(req.max_tokens or 256)
    temperature = float(req.temperature or 0.9)
    top_p = float(req.top_p or 0.95)

    idx = torch.tensor([_tokenizer.encode(prompt)], dtype=torch.long).to(_device)
    out = _model.generate(idx, max_new_tokens=max_tokens, temperature=temperature, top_p=top_p)
    text = _tokenizer.decode(out[0].tolist())

    completion = text[len(prompt):]

    return {
        "id": "chatcmpl-beta-1",
        "object": "chat.completion",
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": completion},
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": len(prompt),
            "completion_tokens": len(completion),
            "total_tokens": len(prompt) + len(completion)
        }
    }
