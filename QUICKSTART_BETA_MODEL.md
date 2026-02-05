# DataShark AI Beta Model - Quick Start

## 📋 Setup Rápido (2 minutos)

### 1. Instalar Python Dependencies
```bash
cd mini-lemonade/ai-beta
pip install -r requirements.txt
```

### 2. Iniciar Servidor Beta (Terminal 1)
```bash
# Windows
$env:BETA_MODEL_PATH="$env:TEMP\datashark-model.pt"
python -m uvicorn server:app --host 0.0.0.0 --port 8000

# Linux/Mac
export BETA_MODEL_PATH="/tmp/datashark-model.pt"
uvicorn server:app --host 0.0.0.0 --port 8000
```

Esperar a ver:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 3. Test Rápido (Terminal 2)
```bash
cd mini-lemonade/ai-beta
python test.py
```

Debería ver:
```
✅ Health check passed: {'status': 'ok'}
✅ Chat completion successful (X.XXs)
```

### 4. Iniciar Backend (Terminal 3)
```bash
cd mini-lemonade/backend
npm install
npm start
```

Configurar `.env`:
```env
BETA_MODEL_BASE_URL=http://localhost:8000
```

### 5. Usar en Plugin Roblox
El plugin detecta automáticamente la URL y usa el beta model.

---

## 🚀 Deployment Render

### Opción 1: Monorepo (Recomendado)

**render.yaml:**
```yaml
services:
  - type: web
    name: datashark-backend
    env: node
    buildCommand: "cd mini-lemonade/backend && npm install"
    startCommand: "cd mini-lemonade/backend && npm start"
    envVars:
      - key: BETA_MODEL_BASE_URL
        value: "https://<beta-service>.onrender.com"
        
  - type: web
    name: datashark-beta
    env: python
    buildCommand: "pip install -r mini-lemonade/ai-beta/requirements.txt"
    startCommand: "cd mini-lemonade/ai-beta && python -m uvicorn server:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: BETA_MODEL_PATH
        value: "/tmp/datashark-model.pt"
```

### Opción 2: Servicios Separados

**Backend:**
- Build: `cd mini-lemonade/backend && npm install`
- Start: `cd mini-lemonade/backend && npm start`

**Beta Model:**
- Build: `pip install -r mini-lemonade/ai-beta/requirements.txt`
- Start: `cd mini-lemonade/ai-beta && uvicorn server:app --host 0.0.0.0 --port $PORT`

---

## 📊 Características

✅ **10M Parámetros** - Modelo profesional
✅ **8 Capas** - Transformer architecture
✅ **OpenAI-Compatible** - API estándar
✅ **Fast Inference** - <2s por request
✅ **Auto Fallback** - DeepSeek/OpenAI si falla
✅ **Plugin Ready** - Integración Roblox completa

---

## 📚 Docs Completa

Ver: [README.md](./README.md)
Ver: [../BETA_MODEL_INTEGRATION.md](../BETA_MODEL_INTEGRATION.md)

---

## 🆘 Troubleshooting

**Error: "Model not found"**
```
Solución: Entrenar nuevamente
python train.py
```

**Error: "Connection refused"**
```
Solución: Verificar server está corriendo
curl http://localhost:8000/health
```

**Error: "Block size mismatch"**
```
✅ Ya solucionado automáticamente en server.py
```

---

**Status:** ✅ Producción Ready

**Última actualización:** 2026-02-05
