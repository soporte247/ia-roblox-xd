#!/bin/bash
# DataShark - Start both backend and beta model in the same service
# For Render deployment

set -e

echo "🚀 DataShark - Starting backend and beta model..."

# Kill any existing processes on ports
kill $(lsof -t -i:3000) 2>/dev/null || true
kill $(lsof -t -i:8000) 2>/dev/null || true
sleep 1

# Start backend Node.js on port 3000
echo "📊 Starting backend on port 3000..."
cd mini-lemonade/backend
node src/index.js &
BACKEND_PID=$!

sleep 2

# Start beta model Python on port 8000
echo "🤖 Starting beta model on port 8000..."
cd ../ai-beta
export BETA_MODEL_PATH="/tmp/datashark-model.pt"
python -m uvicorn server:app --host 0.0.0.0 --port 8000 &
BETA_PID=$!

echo "✅ Both services started:"
echo "   Backend (Node.js): http://localhost:3000"
echo "   Beta Model (Python): http://localhost:8000"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Beta Model PID: $BETA_PID"

# Wait for both processes
wait $BACKEND_PID $BETA_PID
