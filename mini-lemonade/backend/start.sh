#!/bin/bash

echo "🚀 Starting DataShark IA with Ollama..."

# Install Ollama if not exists
if ! command -v ollama &> /dev/null; then
  echo "📦 Installing Ollama..."
  curl -fsSL https://ollama.ai/install.sh | sh
else
  echo "✅ Ollama already installed"
fi

# Create model directory
mkdir -p /root/.ollama/models
export OLLAMA_MODELS=/root/.ollama/models

# Start Ollama in background
echo "🔄 Starting Ollama service..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
sleep 10

# Check if Ollama is responding
for i in {1..30}; do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is ready"
    break
  fi
  echo "⏳ Waiting... attempt $i/30"
  sleep 2
done

# Pull the model
echo "📥 Pulling qwen2.5-coder:7b model (this may take a few minutes)..."
ollama pull qwen2.5-coder:7b

if [ $? -eq 0 ]; then
  echo "✅ Model downloaded successfully"
else
  echo "⚠️ Model download failed, but continuing..."
fi

# Start Node.js server
echo "🌐 Starting Node.js server..."
node src/index.js
