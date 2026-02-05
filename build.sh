#!/bin/bash

echo "=== DataShark Build Script ==="
echo "Current directory: $(pwd)"
echo "Listing mini-lemonade/ai-beta/:"
ls -la mini-lemonade/ai-beta/

echo -e "\n=== Installing Python dependencies ==="
pip install -r mini-lemonade/ai-beta/requirements.txt

echo -e "\n=== Installing Node.js dependencies ==="
npm install --prefix mini-lemonade/backend

echo -e "\n=== Build Complete ==="
