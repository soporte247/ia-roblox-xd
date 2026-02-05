#!/bin/bash
# DataShark Beta Model - Deployment Script para Render
# Instala y ejecuta el modelo en producción

set -e

echo "🚀 DataShark Beta Model - Starting..."

# 1. Instalar dependencias
echo "📦 Installing dependencies..."
pip install -r mini-lemonade/ai-beta/requirements.txt

# 2. Verificar modelo disponible
if [ ! -f "/tmp/datashark-model.pt" ]; then
    echo "⚠️  Modelo no encontrado. Descargando..."
    # Aquí iría descarga desde URL o creación de nuevo modelo
    echo "❌ Modelo requerido: /tmp/datashark-model.pt"
    exit 1
fi

# 3. Iniciar servidor
echo "✅ Starting API server on port $PORT..."
cd mini-lemonade/ai-beta
export BETA_MODEL_PATH="/tmp/datashark-model.pt"
python -m uvicorn server:app --host 0.0.0.0 --port $PORT
