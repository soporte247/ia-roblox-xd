# DataShark Backend Integration Guide

## ✅ Beta Model Integración Completada

El backend Node.js ya está configurado para usar el beta model de IA. Aquí está el estado:

### 1. Archivos Modificados

**generator.js**
- ✅ `generateWithBetaModel()` - Llamada a API beta model
- ✅ Prioridad: Beta → DeepSeek → OpenAI → Ollama → Templates

**clarificationManager.js**
- ✅ `callBetaModel()` - Preguntas aclaratorias con beta model
- ✅ Métricas tracking automático

**metricsService.js**
- ✅ `ai.beta` tracking - calls, successes, failures, avgTime

**.env.example**
- ✅ Documentación completa de BETA_MODEL_* variables

### 2. Configuración Local

Para desarrollo local, crear `.env` en `mini-lemonade/backend/`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=./database.sqlite

# Beta Model (Local)
BETA_MODEL_BASE_URL=http://localhost:8000
BETA_MODEL_API_KEY=
BETA_MODEL_NAME=datashark-beta

# Fallbacks (Opcional)
DEEPSEEK_API_KEY=your_key
OPENAI_API_KEY=your_key
OLLAMA_MODEL=qwen2.5-coder:7b
OLLAMA_BASE_URL=http://localhost:11434
```

### 3. Ejecutar Localmente

**Terminal 1: Beta Model (Puerto 8000)**
```bash
cd mini-lemonade/ai-beta
$env:BETA_MODEL_PATH="$env:TEMP\datashark-model.pt"
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```

**Terminal 2: Backend Node.js (Puerto 3000)**
```bash
cd mini-lemonade/backend
npm install
npm start
```

**Terminal 3: Frontend (Puerto 3001)**
```bash
cd mini-lemonade/frontend
npx http-server -p 3001
```

Acceso:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- Beta Model: http://localhost:8000/health

### 4. Plugin Roblox

El DataSharkPlugin.lua detecta automáticamente la URL del backend:

```lua
-- Plugin busca:
-- 1. BETA_MODEL_BASE_URL en backend
-- 2. https://datashark-ia2.onrender.com por defecto

-- Usa beta model para:
-- - GenerarCodigo (type='attack' o 'defense')
-- - Preguntas aclaratorias
-- - Análisis de sistemas
```

### 5. Flujo de Datos

```
Plugin (Lua)
    ↓
Backend (Node.js)
    ↓
Beta Model (Python/FastAPI)
    ↓ (si falla)
DeepSeek / OpenAI / Ollama
```

### 6. Testing

**Health Check:**
```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

**API Test:**
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "datashark-beta",
    "messages": [
      {"role": "system", "content": "Eres un asistente de programación"},
      {"role": "user", "content": "Crea un sistema de inventario"}
    ],
    "temperature": 0.9
  }'
```

**Backend Metrics:**
```bash
curl http://localhost:3000/api/metrics | grep -A5 beta
```

### 7. Deployment Render

**Steps:**

1. **Deploy Backend + Beta Model juntos:**
   - Crear 1 solo Web Service con monorepo
   - Build: instala Node + Python
   - Start: ejecuta ambos servicios

2. **O 2 servicios separados:**
   - Web Service A: Backend Node.js
   - Web Service B: Beta Model Python/FastAPI

3. **Configurar URLs:**
```env
# En Service Backend
BETA_MODEL_BASE_URL=https://datashark-beta-py.onrender.com
BETA_MODEL_API_KEY=
BETA_MODEL_NAME=datashark-beta
```

4. **Archivo render.yaml:**
```yaml
services:
  - type: web
    name: datashark-backend
    env: node
    buildCommand: "cd mini-lemonade/backend && npm install"
    startCommand: "cd mini-lemonade/backend && npm start"
    
  - type: web
    name: datashark-beta
    env: python
    buildCommand: "pip install -r mini-lemonade/ai-beta/requirements.txt"
    startCommand: "cd mini-lemonade/ai-beta && uvicorn server:app --port $PORT"
```

### 8. Monitoreo

**Métricas Beta Model:**
```
GET /api/metrics
{
  "ai": {
    "beta": {
      "calls": 42,
      "successes": 40,
      "failures": 2,
      "successRate": 95.24,
      "totalTime": 125.5,
      "avgTime": 2.98
    }
  }
}
```

**Logs:**
```bash
# Backend
pm2 logs datashark-backend

# Beta Model (Render)
# Ver en Dashboard → Logs
```

### 9. Troubleshooting

**Error: "BETA_MODEL_BASE_URL unavailable"**
- Verificar que el servidor beta está corriendo
- Comprobar URL correcta en .env
- Ver logs en http://localhost:8000/health

**Error: "Connection timeout"**
- Aumentar timeout en generator.js (default: 30s)
- Verificar firewall/CORS

**Error: "Block size mismatch"**
- ✅ Ya solucionado en server.py
- Infiere block_size del checkpoint automáticamente

### 10. Status

| Componente | Estado | Detalles |
|-----------|--------|----------|
| Model | ✅ Completado | 10M params, 8 layers |
| Training | ✅ Completado | 2000 iters, loss=7.79 |
| Server | ✅ Corriendo | Puerto 8000 |
| Backend | ✅ Integrado | Priority #1 |
| Plugin | ✅ Compatible | Auto-detecta URL |
| Render | ⏳ Pendiente | Deploy en progreso |

---

**Próximos pasos:**
1. ✅ Testing local (backend + beta model)
2. ✅ Validación plugin Roblox
3. ⏳ Deploy a Render
4. ⏳ Monitoreo en producción
