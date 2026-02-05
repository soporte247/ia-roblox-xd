# DataShark - Deploy en Render (Backend + Beta Model Juntos)

## 📋 Opción 1: Mismo Web Service (Recomendado)

**Ventajas:**
- ✅ Un solo Web Service = menos costo
- ✅ Comunicación interna (localhost:8000)
- ✅ Configuración centralizada
- ✅ Fácil de mantener

### Paso 1: Actualizar Render Dashboard

En https://dashboard.render.com:

1. **Actualizar servicio existente (datashark-ia2)**
   - Build Command: `pip install -r mini-lemonade/ai-beta/requirements.txt && npm install --prefix mini-lemonade/backend`
   - Start Command: `node start-combined.js`

2. **Environment Variables** (En el servicio):
   ```
   BETA_MODEL_BASE_URL=http://localhost:8000
   BETA_MODEL_API_KEY=
   BETA_MODEL_NAME=datashark-beta
   ```

### Paso 2: Push a GitHub

```bash
git add start-combined.js Procfile .env.example
git commit -m "Add combined start script for backend + beta model on Render"
git push
```

Render detectará el cambio y hará deploy automático.

### Paso 3: Verificar Deploy

```
Logs en Render:
- ✅ Backend starting on port 3000
- ✅ Beta model starting on port 8000
- ✅ Application startup complete
```

Acceso:
- Backend: https://datashark-ia2.onrender.com
- Health check: https://datashark-ia2.onrender.com/api/health
- Metrics: https://datashark-ia2.onrender.com/api/metrics

---

## 📋 Opción 2: Servicios Separados (Si prefieres)

Si necesitas flexibilidad para escalar independientemente:

1. **Web Service #1 (Backend)**
   - Start: `npm --prefix mini-lemonade/backend start`

2. **Web Service #2 (Beta Model)**
   - Start: `cd mini-lemonade/ai-beta && python -m uvicorn server:app --port $PORT`
   - Env: `BETA_MODEL_PATH=/tmp/datashark-model.pt`

3. **Backend .env**
   ```
   BETA_MODEL_BASE_URL=https://datashark-beta.onrender.com
   ```

---

## 🏗️ Arquitectura (Opción 1)

```
┌─────────────────────────────────────────┐
│  Render Web Service: datashark-ia2      │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Node.js Backend (Port 3000)      │  │
│  │ - API Endpoints                  │  │
│  │ - Database                       │  │
│  │ - Authentication                 │  │
│  └──────────────────────────────────┘  │
│                    ↓                    │
│  ┌──────────────────────────────────┐  │
│  │ Python Beta Model (Port 8000)    │  │
│  │ - LLM Inference                  │  │
│  │ - OpenAI-compatible API          │  │
│  │ - Chat Completions               │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
         ↑
    PUBLIC: Port 443 (HTTPS)
```

---

## 📚 Flujo de Datos

```
Plugin (Lua)
    ↓ HTTPS
https://datashark-ia2.onrender.com
    ↓
Backend Node.js (Port 3000)
    ↓ HTTP localhost
http://localhost:8000
    ↓
Beta Model Python (Port 8000)
    ↓
LLM Inference
    ↓
Response JSON
```

---

## ⚙️ Configuración Final

### Backend .env (Ya en Render)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=./database.sqlite
BETA_MODEL_BASE_URL=http://localhost:8000
BETA_MODEL_API_KEY=
BETA_MODEL_NAME=datashark-beta
```

### No necesita cambios adicionales
- Roblox OAuth ya configurado
- DeepSeek fallback configurado
- Ollama fallback configurado
- Base de datos SQLite automática

---

## 🧪 Testing Post-Deploy

```bash
# Health check
curl https://datashark-ia2.onrender.com/api/health

# Metrics
curl https://datashark-ia2.onrender.com/api/metrics

# Generate with beta model
curl -X POST https://datashark-ia2.onrender.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "crea un sistema de ataque",
    "type": "attack"
  }'
```

---

## 📊 Monitoreo

### Logs en Render Dashboard
- Servicios iniciando
- Errores de conexión
- Uso de memoria

### Métricas (GET /api/metrics)
```json
{
  "ai": {
    "beta": {
      "calls": 42,
      "successes": 40,
      "failures": 2,
      "successRate": 95.24,
      "avgTime": 2.5
    }
  }
}
```

---

## 🆘 Troubleshooting

**Error: "Port 8000 in use"**
- Render ya tiene el puerto reservado, no hay conflicto

**Error: "Beta model not responding"**
- Verificar logs de Python en Render
- Revisar BETA_MODEL_PATH existe

**Error: "Connection timeout"**
- Aumentar timeout en generator.js (default: 30s)
- Verificar ambos procesos están corriendo

---

## ✅ Checklist Final

- [ ] Descargar start-combined.js y Procfile
- [ ] Actualizar Build Command en Render
- [ ] Actualizar Start Command en Render
- [ ] Añadir environment variables
- [ ] Commit y push a GitHub
- [ ] Verificar deploy automático
- [ ] Test health endpoints
- [ ] Monitorear logs por 5 minutos
- [ ] Plugin Roblox conectando correctamente

---

**Status:** 🟢 Listo para Deploy
**Costo:** Mismo que antes (1 servicio, no 2)
**Tiempo Setup:** <5 minutos

Siguiente: Commit y push para deploy automático en Render ✨
