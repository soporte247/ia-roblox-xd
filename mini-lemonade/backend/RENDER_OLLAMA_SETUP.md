# Render.com Configuration for DataShark IA with Ollama
# Este archivo documenta la configuración necesaria en Render

## PASOS PARA CONFIGURAR EN RENDER:

### 1. Ir a Dashboard de Render
- https://dashboard.render.com

### 2. Configurar Variables de Entorno
En tu servicio, ve a "Environment" y añade:

```
OLLAMA_MODEL=qwen2.5-coder:7b
OLLAMA_BASE_URL=http://localhost:11434
NODE_ENV=production
PORT=3000
```

### 3. Configurar Volumen Persistente (IMPORTANTE)
Para guardar el modelo descargado (no perderlo al redeploy):

- Ve a "Disks"
- Crea un nuevo disco con:
  - Nombre: `ollama-models`
  - Tamaño: 5GB (mínimo para qwen2.5-coder)
  - Mount path: `/root/.ollama/models`

### 4. Aumentar Timeout de Build (Importante)
El modelo tarda en descargar (5-10 minutos según conexión):

- En "Deploy Settings"
- Build timeout: 900 segundos (15 minutos)
- Health check path: `/api/health`

### 5. Redeploy
Una vez configurado todo, haz redeploy y espera a que:
1. Se instale Ollama
2. Se descargue el modelo (5-10 min)
3. Inicie Ollama
4. Inicie Node.js

Verás en los logs:
```
✅ Ollama is ready
📥 Pulling qwen2.5-coder:7b model...
✅ Model downloaded successfully
🌐 Starting Node.js server...
```

### ALTERNATIVA (Si Render Free falla por recursos):
Usar Render.com + DeepSeek API gratis:
- DeepSeek tiene API gratuita y buena para código
- Cambiar en .env: OPENAI_API_KEY o similar

### CARACTERISTICAS CON OLLAMA EN RENDER:
✅ IA funcionando completamente local (privado)
✅ Sin depender de OpenAI
✅ Modelo guardado en disco persistente
✅ Reintentos automáticos si falla
✅ Fallback a templates si hay error

### MONITOREO:
- `/api/health` - Estado del servidor
- `/api/logs/errors/recent` - Errores recientes
- `/api/logs/stats` - Estadísticas
