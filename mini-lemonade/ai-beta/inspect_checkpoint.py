"""
Inspeccionar estructura del checkpoint
"""
import torch
import os

checkpoint_path = os.path.join(os.environ.get('TEMP', '/tmp'), 'datashark-model.pt')

print(f"📂 Cargando: {checkpoint_path}\n")
ckpt = torch.load(checkpoint_path, map_location='cpu')

print("🔍 Claves principales:")
for key in ckpt.keys():
    print(f"   • {key}")

print("\n🔍 Claves del modelo:")
for i, key in enumerate(sorted(ckpt['model'].keys())):
    tensor = ckpt['model'][key]
    print(f"   {i+1:2d}. {key:30s} → {list(tensor.shape)}")

print("\n📊 Config:")
for key, value in ckpt['config'].items():
    print(f"   • {key}: {value}")

print("\n🔤 Vocabulario:")
print(f"   • Tamaño: {len(ckpt['meta']['itos'])}")
print(f"   • Caracteres: {repr(''.join(ckpt['meta']['itos'][:20]))}")
