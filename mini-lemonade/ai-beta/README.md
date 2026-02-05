# DataShark Beta Model - Sistema IA Personalizado

## Descripción

Sistema de IA entrenado desde cero con arquitectura GPT (Generative Pre-trained Transformer) implementada en PyTorch. **10.05 millones de parámetros** optimizados para:

- Conversación coherente y profesional
- Generación de código Lua/Roblox
- Integración con backend Node.js
- Deployment en servidor Render
- Compatible con plugin Roblox

## Arquitectura del Modelo

| Parámetro | Valor |
|-----------|-------|
| **Total Parámetros** | 10,052,480 (10.05M) |
| Capas Transformer | 8 |
| Dimensión Embedding | 320 |
| Cabezas de Atención | 8 |
| Block Size (Contexto) | 212 tokens |
| Vocabulario | 38 caracteres |
| **Entrenamiento** | 2000 iteraciones |
| **Loss Final** | train=0.0001, val=7.79 |

## Componentes

### 1. **model.py** - Arquitectura GPT
```
CausalSelfAttention → Multi-head masked attention
MLP → 4x feed-forward network  
Block → Residual + LayerNorm
GPT → Modelo completo con generación autoregresiva
```

### 2. **tokenizer.py** - Codificación Texto
- Character-level encoding (38 tokens únicos)
- Métodos: `encode(text)` → indices, `decode(indices)` → text

### 3. **train.py** - Pipeline Entrenamiento
```bash
# Configuración por variables de entorno:
BLOCK_SIZE=512        # Tamaño de contexto
N_LAYER=8            # Capas transformer
N_HEAD=8             # Cabezas atención
N_EMBD=320           # Dimensión embeddings
MAX_ITERS=2000       # Iteraciones
LEARNING_RATE=3e-4   # Learning rate
DATA_PATH=data.txt   # Archivo datos (opcional)
MODEL_OUT=model.pt   # Ruta salida modelo
```

**Ejecutar entrenamiento:**
```bash
python train.py
```

### 4. **server.py** - API FastAPI (OpenAI-compatible)

**Endpoints:**
- `GET /health` → Health check
- `POST /v1/chat/completions` → Chat completion (OpenAI format)

**Request:**
```json
{
  "model": "datashark-beta",
  "messages": [
    {"role": "system", "content": "Eres un asistente..."},
    {"role": "user", "content": "Crea un sistema de..."}
  ],
  "max_tokens": 256,
  "temperature": 0.9,
  "top_p": 0.95
}
```

**Response:**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "choices": [
    {
      "message": {"role": "assistant", "content": "..."},
      "finish_reason": "stop"
    }
  ],
  "usage": {"prompt_tokens": 10, "completion_tokens": 50}
}
```

### 5. **generate.py** - CLI Inference
```bash
# Generar texto desde línea de comandos
MODEL_PATH=model.pt PROMPT="Hola, " python generate.py
```

## Setup Local

### 1. Instalar Dependencias
```bash
cd mini-lemonade/ai-beta
pip install -r requirements.txt
```

### 2. Entrenar Modelo (opcional)
```bash
python train.py
```
Genera: `$TEMP/datashark-model.pt`

### 3. Iniciar Servidor
```bash
# Windows (PowerShell)
$env:BETA_MODEL_PATH="$env:TEMP\datashark-model.pt"
python -m uvicorn server:app --host 0.0.0.0 --port 8000

# Linux/Mac
export BETA_MODEL_PATH="/tmp/datashark-model.pt"
uvicorn server:app --host 0.0.0.0 --port 8000
```

Servidor disponible en: `http://localhost:8000`

## Integración Backend

### Variables de Entorno (.env)
```env
# Beta Model
BETA_MODEL_BASE_URL=http://localhost:8000
BETA_MODEL_API_KEY=
BETA_MODEL_NAME=datashark-beta
```

### Prioridad de Modelos (generator.js)
```
1. Beta Model (si BETA_MODEL_BASE_URL disponible)
2. DeepSeek (si DEEPSEEK_API_KEY disponible)
3. OpenAI (si OPENAI_API_KEY disponible)
4. Ollama Local (si OLLAMA_MODEL disponible)
5. Plantillas Predefinidas
```

### Métodos Backend
- `generator.js → generateWithBetaModel()` - Llamada a beta model
- `clarificationManager.js → callBetaModel()` - Preguntas aclaratorias
- `metricsService.js → ai.beta` - Tracking de llamadas

## Integración Plugin Roblox

El plugin (DataSharkPlugin.lua) detecta automáticamente:

```lua
-- Detecta beta model en:
-- 1. Variable de entorno: BETA_MODEL_BASE_URL
-- 2. Archivo .env local
-- 3. URL por defecto del backend

-- Usa beta model para:
-- - Generar código Lua
-- - Preguntas aclaratorias
-- - Análisis de sistemas
```

## Deployment Render

### 1. Preparar Repositorio
```bash
git add mini-lemonade/ai-beta/
git commit -m "Add beta model service"
git push
```

### 2. Crear Web Service en Render
- **Build Command:** `pip install -r mini-lemonade/ai-beta/requirements.txt`
- **Start Command:** 
  ```
  cd mini-lemonade/ai-beta && \
  python -m uvicorn server:app --host 0.0.0.0 --port $PORT
  ```
- **Environment:** Añadir `BETA_MODEL_PATH=/tmp/datashark-model.pt`

### 3. Actualizar .env Producción
```env
BETA_MODEL_BASE_URL=https://datashark-beta.onrender.com
BETA_MODEL_API_KEY=
BETA_MODEL_NAME=datashark-beta
```

## Monitoring & Métricas

### Health Check
```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### Backend Metrics
```bash
curl http://localhost:3000/api/metrics
# Incluye: ai.beta.calls, ai.beta.successes, ai.beta.failures, ai.beta.avgTime
```

## Mejoras Futuras

### Datos de Entrenamiento
- [ ] Agregar corpus Lua real (>10MB)
- [ ] Ejemplos Roblox API
- [ ] Conversaciones técnicas

### Modelo
- [ ] Aumentar a 50M+ parámetros
- [ ] BPE Tokenizer (vocabulario 10K+)
- [ ] Training en GPU
- [ ] Fine-tuning especializado

### Deployment
- [ ] Caché Redis para respuestas frecuentes
- [ ] Load balancing múltiples instancias
- [ ] Logging centralizado (ELK/Datadog)
- [ ] A/B testing con modelos

## Troubleshooting

### Error: "Model not found"
```
Verificar: BETA_MODEL_PATH ambiente apunta a checkpoint válido
ls $TEMP/datashark-model.pt
```

### Error: "Connection refused on port 8000"
```
Verificar servidor está corriendo:
curl http://localhost:8000/health
```

### Mismatch tamaño pos_emb
```
Asegurar server.py infiere block_size del checkpoint:
actual_block_size = ckpt['model']['pos_emb.weight'].shape[0]
```

## Estructura Archivos

```
mini-lemonade/ai-beta/
├── model.py           # Arquitectura GPT
├── tokenizer.py       # Character-level tokenizer
├── train.py          # Training pipeline
├── generate.py       # CLI inference
├── server.py         # API FastAPI
├── requirements.txt  # Dependencies
├── README.md         # Este archivo
└── data.txt         # (Opcional) Training data
```

## Referencias

- [PyTorch Docs](https://pytorch.org/docs/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Transformer Architecture](https://arxiv.org/abs/1706.03762)
- [OpenAI Chat API](https://platform.openai.com/docs/api-reference/chat)

## License

MIT - Ver LICENSE en raíz del proyecto
