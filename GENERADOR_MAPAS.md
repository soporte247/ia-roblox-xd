# 🗺️ Generador de Mapas de DataShark IA

## Descripción General

DataShark IA ahora puede **generar mapas visuales y código Lua** para construir mundos en Roblox.

Características:
- ✅ Generación de mapas ASCII
- ✅ Visualización en SVG
- ✅ Código Lua automático para Roblox
- ✅ Mapas predefinidos (Laberinto, Dungeon, Isla, Aleatorio)
- ✅ Mapas personalizados por descripción IA
- ✅ Descarga directa de código

---

## Cómo Usar

### 1. Abrir el Generador de Mapas

```
Interface Web → Botón "🗺️ Generador de Mapas" → Se abre el modal
```

### 2. Opciones de Generación

#### A) Mapas Predefinidos

Los 4 tipos disponibles:

| Tipo | Botón | Descripción |
|------|-------|-------------|
| **Laberinto** | 🔀 | Caminos aleatorios con entrada y salida |
| **Dungeon** | 🏰 | Salas conectadas con caminos |
| **Isla** | 🏝️ | Isla rodeada de agua con montañas |
| **Aleatorio** | 🎲 | Mezcla aleatoria de terrenos |

**Uso:**
1. Ajusta Ancho y Alto (default: 20x15)
2. Haz clic en el botón del tipo que quieres
3. El mapa se genera instantáneamente

#### B) Mapas Personalizados

**Pasos:**
1. Escribe una descripción del mapa en el textarea
2. Ejemplo: `"Crea un mapa con un castillo en el centro, rodeado de fosos de agua"`
3. Ajusta dimensiones si es necesario
4. Haz clic en "🎨 Generar Mapa"
5. La IA genera un mapa basado en tu descripción

---

## Formatos de Salida

### 1. Mapa ASCII

```
████████████
█ ░░ █ ░░ █
█ ░░ █ ░░ █
████████████
```

**Símbolos:**
- `█` = Muro/Pared
- `░` = Piso/Suelo
- `≈` = Agua
- `▲` = Montaña
- `★` = Punto especial/Tesoro
- `@` = Punto de inicio

### 2. Código Lua

El sistema genera código Lua completo que:
- Crea una carpeta "GeneratedMap" en Workspace
- Construye bloques 3D en Roblox
- Asigna colores automáticos
- Coloca puntos de inicio y final

**Ejemplo generado:**
```lua
-- Auto-generated Map from DataShark IA
-- Dimensions: 20x15

local mapFolder = Instance.new("Folder")
mapFolder.Name = "GeneratedMap"
mapFolder.Parent = workspace

local function createBlock(blockType, x, y, z)
  local part = Instance.new("Part")
  part.Name = blockType
  part.Position = Vector3.new(x, y, z)
  -- ... resto del código
end

-- Build the map
createBlock("Part", 0, 0, 0)
createBlock("Floor", 10, 0, 0)
-- ... etc
```

### 3. Visualización SVG

Representación gráfica vectorial del mapa con:
- Colores para cada tipo de bloque
- Símbolos visibles
- Escalable a cualquier tamaño
- Compatible con navegadores web

---

## Acciones Disponibles

### En la Pantalla de Resultados:

1. **📋 Copiar Mapa ASCII**
   - Copia el mapa de texto al portapapeles
   - Úsalo en documentos o compartir

2. **💾 Descargar Código Lua**
   - Descarga un archivo `.lua` listo para copiar en Roblox Studio
   - Nombre: `map_[TIMESTAMP].lua`

---

## Endpoints de la API

### POST `/api/maps/generate`

**Genera un mapa personalizado**

Request:
```json
{
  "description": "Crea un laberinto con trampas",
  "width": 20,
  "height": 15,
  "format": "all"  // "ascii" | "all"
}
```

Response:
```json
{
  "success": true,
  "map": {
    "ascii": "████...",
    "legend": "█ = Wall...",
    "description": "..."
  },
  "lua": "-- Código Lua generado",
  "svg": "<svg>...</svg>"
}
```

### GET `/api/maps/generate/:type`

**Genera un mapa predefinido**

Parámetros:
- `type`: `maze` | `dungeon` | `island` | `random`
- `width`: 10-50 (default: 20)
- `height`: 10-40 (default: 15)

Ejemplo:
```
GET /api/maps/generate/dungeon?width=25&height=20
```

### POST `/api/maps/toLua`

**Convierte un mapa ASCII a código Lua**

Request:
```json
{
  "mapASCII": "████...",
  "cellSize": 10
}
```

### POST `/api/maps/toSVG`

**Convierte un mapa ASCII a SVG**

Request:
```json
{
  "mapASCII": "████...",
  "cellSize": 20
}
```

---

## Arquitectura

### Backend

**Servicio: `mapGenerator.js`**
- `generateASCIIMap()` - Usa Ollama para generar mapas IA
- `generateLabyrinth()` - Algoritmo recursivo backtracker
- `generateDungeon()` - Generador de salas y conexiones
- `generateIsland()` - Simulación de isla circular
- `generateRandomMap()` - Mezcla aleatoria
- `generateSVGFromASCII()` - Conversión de ASCII a SVG
- `generateLuaMap()` - Generación de código Lua

**Ruta: `maps.js`**
- POST `/generate` - Mapa personalizado
- GET `/generate/:type` - Mapa predefinido
- POST `/toLua` - ASCII → Lua
- POST `/toSVG` - ASCII → SVG

### Frontend

**Elementos HTML:**
- `#mapsModal` - Modal del generador
- `#mapDescription` - Textarea de descripción
- `#mapWidth`, `#mapHeight` - Controles de dimensión
- `#generateMapBtn` - Botón generar personalizado
- `.preset-btn` - Botones de mapas predefinidos
- `#mapOutput` - Área de resultados

**Funciones JS:**
- `showMapsGenerator()` - Abre el modal
- `generateCustomMap()` - Genera mapa personalizado
- `generatePresetMap(type)` - Genera mapa predefinido
- `displayMapResult(data)` - Muestra resultados
- `setupMapsEventListeners()` - Configura listeners

---

## Ejemplos de Uso

### Ejemplo 1: Laberinto Clásico

```
1. Click "🗺️ Generador de Mapas"
2. Click "🔀 Laberinto"
3. El sistema genera un laberinto 20x15
4. Click "💾 Descargar Código Lua"
5. Copia el código en Roblox Studio
6. Ejecuta el código: ¡Tu laberinto está creado!
```

### Ejemplo 2: Mapa Personalizado

```
1. Escribe: "Un castle medieval rodeado de agua, con un puente de entrada"
2. Ajusta: Ancho=30, Alto=25
3. Click "🎨 Generar Mapa"
4. Ver visualización SVG del mapa
5. Copiar ASCII o descargar Lua
```

### Ejemplo 3: Isla con Montañas

```
1. Ajusta: Ancho=25, Alto=20
2. Click "🏝️ Isla"
3. Genera una isla aleatoria con agua y montañas
4. Personaliza el código Lua descargado
5. Importa en Roblox Studio
```

---

## Características Avanzadas

### Personalización del Código Lua

Después de descargar, puedes modificar:

```lua
-- Cambiar tamaño de bloque
local function createBlock(blockType, x, y, z)
  local part = Instance.new("Part")
  part.Size = Vector3.new(15, 15, 15)  -- Cambiar este valor
  -- ...
end

-- Cambiar colores
if blockType == "Part" then
  part.BrickColor = BrickColor.new("Dark red")  -- Tu color
elseif blockType == "Water" then
  part.BrickColor = BrickColor.new("Dark blue")
  -- ...
end

-- Agregar física
part.CanCollide = true
part.BodyVelocity = -- tu código
```

### Integración con Sistemas DataShark

Combina mapas con otros sistemas:

```lua
-- Import your generated map
local mapScript = require(game.Workspace.GeneratedMap.MapGenerator)

-- Add your attack system to the map
local attackSystem = require(game.ServerScriptService.AttackSystem)

-- Spawn enemies on the map
for _, part in pairs(mapScript.getMapParts()) do
  if part.Name == "Floor" then
    spawnEnemy(part.Position)
  end
end
```

---

## Limitaciones Actuales

- Mapas máximo 50x40 caracteres
- Generación de mapas IA requiere Ollama disponible
- Los mapas predefinidos son procedurales (no guardan estado)
- Cada generación es nueva (no hay historial)

---

## Próximas Mejoras

- [ ] Guardar mapas en historial
- [ ] Editor visual de mapas (drag & drop)
- [ ] Exportar a formatos: PNG, JSON
- [ ] Mapas más grandes (100x100+)
- [ ] Temas personalizados de colores
- [ ] Importación directa desde Roblox Studio

---

## Troubleshooting

### El botón "Generador de Mapas" no aparece

```
✓ Recarga la página (F5)
✓ Limpia el caché del navegador (Ctrl+Shift+Delete)
✓ Revisa la consola (F12) para errores
```

### Los mapas no se generan

```
✓ Verifica que Ollama esté ejecutándose (ollama list)
✓ Revisa la consola del backend para errores
✓ Intenta con un mapa predefinido primero
```

### El código Lua no funciona en Roblox Studio

```
✓ Asegúrate de estar en modo de edición
✓ Pega el código en ServerScriptService
✓ El script debe ejecutarse desde el servidor (es un Script, no LocalScript)
✓ Verifica que los cambios de tamaño sean válidos
```

---

## Versión

- **v1.0.0** - Lanzamiento inicial del generador de mapas
- Incluido en DataShark IA v1.1.0+
- Compatible con Roblox Studio 2024+

---

## Contacto & Soporte

Si tienes problemas o sugerencias:
- 📧 Abre un issue en el repositorio
- 💬 Comenta en las discusiones
- 🐛 Reporta bugs con detalles de generación
