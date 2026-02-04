# 🦈 DataShark IA - v1.1

Un asistente inteligente de generación de sistemas Lua para Roblox. Este es un proyecto **real y ejecutable**.

## 📋 Características Principales

### Core Features
- ✅ **Generador de sistemas:** Crea código Lua completo basado en prompts
- ✅ **Clasificación inteligente:** Detecta el tipo de sistema (Attack, Shop, UI, Inventory, Quest)
- ✅ **Web UI:** Interfaz con modo oscuro y editor de código
- ✅ **API REST:** 6 endpoints completos (generate, fetch, history, export, templates, save)
- ✅ **Multi-usuario:** Aislamiento por UUID
- ✅ **IA Local:** Integración con Ollama (Qwen2.5-Coder 7B)

### Plugin de Roblox (v1.1)
- ✅ **DockWidget visual:** Interfaz moderna con tema azul tiburón 🦈
- ✅ **URL configurable:** Conecta a diferentes backends/puertos
- ✅ **Progress bar animada:** Feedback visual durante importación
- ✅ **Botón Refresh:** Actualiza sin cerrar el widget
- ✅ **Validación UUID:** Previene errores de entrada
- ✅ **Lista de archivos:** Muestra todos los archivos importados
- ✅ **Retry automático:** Reintenta hasta 3 veces en caso de fallo

### Backend Mejorado (v1.1)
- ✅ **Timeout configurables:** 60s para Ollama
- ✅ **Retry logic:** 2 reintentos con backoff exponencial
- ✅ **Validación robusta:** UUID, longitud de prompt, tipos de sistema
- ✅ **Logging estructurado:** Sistema de logs detallado
- ✅ **Métricas de performance:** Tiempo de generación incluido
- ✅ **Manejo de errores mejorado:** Fallback automático a plantillas

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Iniciar el servidor

```bash
npm start
```

El servidor estará en `http://localhost:3000`

### 3. Abrir la web

Abre tu navegador en:
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
datashark-ia/
├─ backend/
│  ├─ src/
│  │  ├─ index.js                    # Servidor Express
│  │  ├─ routes/
│  │  │  ├─ generate.js              # POST /generate
│  │  │  ├─ fetch.js                 # GET /fetch
│  │  │  ├─ history.js               # GET/POST /history
│  │  │  ├─ export.js                # GET /export/:userId
│  │  │  ├─ templates.js             # GET /templates
│  │  │  └─ save.js                  # POST /save
│  │  └─ services/
│  │     ├─ classifier.js            # Clasifica prompts
│  │     └─ generator.js             # Genera código Lua
│  └─ package.json
├─ frontend/
│  ├─ index.html
│  ├─ style.css
│  └─ script.js
├─ plugin/
│  ├─ DataSharkPlugin.lua            # Plugin de Roblox Studio
│  ├─ README.md
│  ├─ PUBLICACION_GUIA.md
│  └─ INSTRUCCIONES.lua
├─ generated/                         # Archivos generados por usuario
│  └─ {userId}/
│     ├─ AttackSystem/
│     ├─ ShopSystem/
│     ├─ UISystem/
│     ├─ InventorySystem/
│     └─ QuestSystem/
└─ README.md
```

## 🎮 Flujo Completo

1. **Usuario escribe prompt** en la web (http://localhost:3000)
2. **Frontend envía POST** a `/generate` con userId y prompt
3. **Backend clasifica** el tipo de sistema (Attack/Shop/UI/Inventory/Quest)
4. **IA genera código** usando Ollama o plantillas predefinidas
5. **Archivos se guardan** en generated/{userId}/{SystemType}/
6. **Plugin Roblox** consume `/fetch` y crea scripts automáticamente en Studio

## 🔌 Endpoints de API

### `POST /generate`

Genera un nuevo sistema.

**Request:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "prompt": "Quiero un sistema de ataque con cooldown",
  "systemType": "attack"
}
```

**Response:**
```json
{
  "success": true,
  "type": "attack",
  "result": {
    "message": "Attack system generated successfully",
    "files": ["AttackService.lua", "DamageService.lua", "CooldownService.lua"]
  }
}
```

### `GET /fetch?userId={userId}`

Obtiene los archivos generados más recientes (para el plugin Roblox).

**Response:**
```json
{
  "files": {
    "AttackService.lua": "-- código lua...",
    "DamageService.lua": "-- código lua..."
  },
  "message": "Files ready for Roblox Studio"
}
```

### `GET /history?userId={userId}`

Obtiene el historial de generaciones del usuario (últimas 50).

**Response:**
```json
{
  "history": [
    {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "prompt": "sistema de ataque con cooldown",
      "type": "attack",
      "files": ["AttackService.lua", ...]
    }
  ]
}
```

### `GET /export/:userId`

Descarga todos los sistemas generados como archivo ZIP.

### `GET /templates`

Obtiene las plantillas predefinidas disponibles.

### `POST /save`

Guarda código editado manualmente por el usuario.

## 🛠️ Tecnologías

| Componente | Tecnología |
|-----------|-----------|
| Backend   | Node.js + Express |
| Frontend  | HTML + CSS + JavaScript |
| IA        | Ollama (Qwen2.5-Coder 7B) |
| Lenguaje objetivo | Roblox Lua |
| Comunicación | HTTP / REST |
| Almacenamiento | Sistema de archivos |

## 📝 Tipos de Sistemas Soportados

### ✅ Attack
Sistema completo de combate con:
- Daño configurable
- Cooldowns
- Lógica servidor/cliente
- Detección de hits

### ✅ Shop
Sistema de tienda con:
- Catálogo de items
- Compra/venta
- Moneda virtual
- Inventario integrado

### ✅ UI
Interfaz de usuario con:
- Controles personalizados
- Menús interactivos
- HUD dinámico
- Animaciones

### ✅ Inventory
Sistema de inventario con:
- Slots configurables
- Stack de items
- Drag & drop
- Persistencia de datos

### ✅ Quest
Sistema de misiones con:
- Objetivos múltiples
- Recompensas
- Progreso guardado
- UI de tracking

## 🚀 Características Implementadas

- ✅ Generación de código Lua con IA local (Ollama)
- ✅ 5 tipos de sistemas completos
- ✅ Sistema multi-usuario con UUID
- ✅ Historial de generaciones (últimas 50)
- ✅ Exportación a ZIP con README
- ✅ Plantillas predefinidas
- ✅ Editor de código inline
- ✅ Modo oscuro en frontend
- ✅ Plugin visual con DockWidget
- ✅ Documentación completa de publicación

## 🤖 Configuración de IA

DataShark IA usa **Ollama** con el modelo **Qwen2.5-Coder 7B** para generación local:

### Instalar Ollama

1. Descarga desde: https://ollama.ai
2. Instala el modelo:
```bash
ollama pull qwen2.5-coder:7b
```

### Alternativa: OpenAI

Si prefieres usar OpenAI, crea un archivo `.env` en backend/:

```env
OPENAI_API_KEY=tu_clave_api_aqui
USE_OPENAI=true
```

El sistema detectará automáticamente qué IA usar.

## 📄 Licencia

MIT

## ✨ Créditos

**DataShark IA v1.0.0** - 2024

Proyecto desarrollado con:
- 🦈 Inteligencia artificial local (Ollama)
- ⚡ Node.js & Express
- 🎮 Integración nativa con Roblox Studio
