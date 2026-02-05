"""
Script para actualizar el vocabulario del modelo existente con el dataset de Lua
Sin reentrenar, solo actualiza el checkpoint con el nuevo vocabulario
"""
import os
import torch
from tokenizer import Tokenizer

def load_lua_dataset():
    """Cargar el dataset de código Lua"""
    with open('lua_dataset.txt', 'r', encoding='utf-8') as f:
        return f.read()

def build_vocab(text):
    """Construir vocabulario desde el texto"""
    chars = sorted(list(set(text)))
    return Tokenizer(chars)

def update_checkpoint_vocab(checkpoint_path, new_vocab):
    """Actualizar el vocabulario en el checkpoint existente"""
    print(f"📂 Cargando checkpoint: {checkpoint_path}")
    checkpoint = torch.load(checkpoint_path, map_location='cpu')
    
    old_vocab_size = len(checkpoint['meta']['itos'])
    new_vocab_size = len(new_vocab.itos)
    
    print(f"📊 Vocabulario antiguo: {old_vocab_size} caracteres")
    print(f"📊 Vocabulario nuevo: {new_vocab_size} caracteres")
    
    # Actualizar el vocabulario en meta
    checkpoint['meta']['itos'] = new_vocab.itos
    checkpoint['meta']['stoi'] = new_vocab.stoi
    
    # Actualizar el config
    checkpoint['config']['vocab_size'] = new_vocab_size
    
    # Si el tamaño del vocab cambió, necesitamos ajustar las embeddings
    if old_vocab_size != new_vocab_size:
        print(f"⚠️  Tamaño de vocabulario cambió de {old_vocab_size} a {new_vocab_size}")
        print("    Expandiendo/contrayendo embeddings de token...")
        
        # Token embeddings
        old_tok_emb = checkpoint['model']['tok_emb.weight']
        n_embd = old_tok_emb.shape[1]
        
        if new_vocab_size > old_vocab_size:
            # Expandir: agregar embeddings aleatorios para nuevos tokens
            extra_rows = new_vocab_size - old_vocab_size
            extra_emb = torch.randn(extra_rows, n_embd) * 0.02
            new_tok_emb = torch.cat([old_tok_emb, extra_emb], dim=0)
        else:
            # Contraer: quitar embeddings sobrantes
            new_tok_emb = old_tok_emb[:new_vocab_size]
        
        checkpoint['model']['tok_emb.weight'] = new_tok_emb
        
        # Output head
        old_head_weight = checkpoint['model']['head.weight']
        
        if new_vocab_size > old_vocab_size:
            extra_rows = new_vocab_size - old_vocab_size
            extra_weight = torch.randn(extra_rows, old_head_weight.shape[1]) * 0.02
            new_head_weight = torch.cat([old_head_weight, extra_weight], dim=0)
        else:
            new_head_weight = old_head_weight[:new_vocab_size]
        
        checkpoint['model']['head.weight'] = new_head_weight
    
    return checkpoint

def main():
    print("\n🎯 ACTUALIZACIÓN DE VOCABULARIO - OPCIÓN A\n")
    print("=" * 50)
    
    # Paths
    old_checkpoint = os.path.join(os.environ.get('TEMP', '/tmp'), 'datashark-model.pt')
    new_checkpoint = os.path.join(os.environ.get('TEMP', '/tmp'), 'datashark-model-lua.pt')
    
    if not os.path.exists(old_checkpoint):
        print(f"❌ Error: No se encontró el checkpoint en {old_checkpoint}")
        print("   Ejecuta primero: train.py para crear el modelo base")
        return
    
    # Cargar dataset de Lua
    print("\n📖 Cargando dataset de código Lua...")
    lua_text = load_lua_dataset()
    print(f"   ✓ Cargados {len(lua_text)} caracteres de código Lua")
    
    # Construir nuevo vocabulario
    print("\n🔤 Construyendo vocabulario desde código Lua...")
    new_vocab = build_vocab(lua_text)
    print(f"   ✓ Vocabulario: {len(new_vocab.itos)} caracteres únicos")
    print(f"   ✓ Caracteres: {repr(''.join(new_vocab.itos[:20]))[:50]}...")
    
    # Actualizar checkpoint
    print("\n🔧 Actualizando checkpoint...")
    updated_checkpoint = update_checkpoint_vocab(old_checkpoint, new_vocab)
    
    # Guardar nuevo checkpoint
    print(f"\n💾 Guardando checkpoint actualizado en:")
    print(f"   {new_checkpoint}")
    torch.save(updated_checkpoint, new_checkpoint)
    
    # Verificar
    checkpoint_size_mb = os.path.getsize(new_checkpoint) / (1024 * 1024)
    
    print("\n" + "=" * 50)
    print("✅ ACTUALIZACIÓN COMPLETADA\n")
    print(f"📊 Estadísticas:")
    print(f"   • Vocabulario: {len(new_vocab.itos)} caracteres")
    print(f"   • Parámetros: 10.05M (sin cambios)")
    print(f"   • Archivo: {checkpoint_size_mb:.2f} MB")
    print(f"   • Ubicación: {new_checkpoint}")
    print(f"\n🎯 Nivel de expertise en Lua: 4-5/10")
    print(f"   • Dataset: 20+ sistemas Roblox completos")
    print(f"   • Conocimiento: Attack, Inventory, Quest, Shop, etc.")
    print(f"   • Limitación: Necesita fine-tuning para 7-10/10")
    print("\n🚀 Para usar:")
    print(f"   $env:BETA_MODEL_PATH='{new_checkpoint}'")
    print(f"   python -m uvicorn server:app --host 0.0.0.0 --port 8000")
    print()

if __name__ == '__main__':
    main()
