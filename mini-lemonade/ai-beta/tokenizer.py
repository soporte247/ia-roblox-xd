class Tokenizer:
    def __init__(self, itos):
        self.itos = list(itos)
        self.stoi = {ch: i for i, ch in enumerate(self.itos)}

    def encode(self, text):
        return [self.stoi.get(ch, 0) for ch in text]

    def decode(self, ids):
        return ''.join(self.itos[i] for i in ids)
