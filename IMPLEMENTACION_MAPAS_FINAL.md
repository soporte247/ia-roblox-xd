# 🦈 DataShark IA - Generador de Mapas (Implementación Completa)

## ✨ ¿Qué es?

Un **generador de mapas integrado a DataShark IA** que permite crear mapas para juegos Roblox de 3 formas:

1. **Mapas Predefinidos** → Click directo (Laberinto, Dungeon, Isla, Aleatorio)
2. **Mapas IA** → Descripción natural ("Crea un castillo con puente")
3. **Mapas Procedurales** → Algoritmos aleatorios

---

## 🎯 Cómo Usar (3 pasos)

### Paso 1: Abrir Generador
```
En la web → Click en botón "🗺️ Generador de Mapas"
```

### Paso 2: Elegir Opción
```
Opción A - Mapa Rápido:
├─ 🔀 Laberinto → Click directo → Listo
├─ 🏰 Dungeon → Click directo → Listo
├─ 🏝️ Isla → Click directo → Listo
└─ 🎲 Aleatorio → Click directo → Listo

Opción B - Mapa Personalizado:
└─ Escribir descripción + Click "🎨 Generar Mapa"
```

### Paso 3: Usar Resultado
```
Ver en pantalla:
├─ 🎨 Mapa visual (SVG colorido)
├─ 📝 Mapa texto (ASCII copeable)
└─ Botones:
   ├─ 📋 Copiar Mapa ASCII
   └─ 💾 Descargar Código Lua
   
Copiar a Roblox Studio → Ejecutar → ¡Tu mapa está listo!
```

---

## 🏗️ Arquitectura Técnica

### Backend (`/backend/src/services/mapGenerator.js` - 450 líneas)

```javascript
Funciones principales:
├─ generateASCIIMap(description, width, height)
│  └─ Usa Ollama IA para generar mapas personalizados
│
├─ generateLabyrinth(width, height)
│  └─ Algoritmo backtracker para laberintos
│
├─ generateDungeon(width, height)
│  └─ Crea salas y las conecta con caminos
│
├─ generateIsland(width, height)
│  └─ Simulación de isla circular con agua
│
├─ generateRandomMap(width, height)
│  └─ Mezcla aleatoria de todos los elementos
│
├─ generateSVGFromASCII(mapASCII, cellSize)
│  └─ Convierte ASCII a gráfico SVG
│
└─ generateLuaMap(mapASCII, cellSize)
   └─ Convierte ASCII a código Lua para Roblox
```

### Backend (`/backend/src/routes/maps.js` - 150 líneas)

```javascript
Endpoints REST:
├─ POST /api/maps/generate
│  └─ Cuerpo: {description, width, height, format}
│  └─ Respuesta: {map, lua, svg}
│
├─ GET /api/maps/generate/:type
│  └─ Tipos: maze, dungeon, island, random
│  └─ Query: ?width=20&height=15
│
├─ POST /api/maps/toLua
│  └─ Cuerpo: {mapASCII, cellSize}
│  └─ Respuesta: {lua}
│
└─ POST /api/maps/toSVG
   └─ Cuerpo: {mapASCII, cellSize}
   └─ Respuesta: {svg}
```

### Frontend (`/frontend/index.html` - Modal agregado)

```html
<div id="mapsModal" class="modal">
  ├─ Input: Descripción del mapa
  ├─ Inputs: Ancho y Alto
  ├─ Botones: Generar personalizado + 4 predefinidos
  └─ Output: Mapa ASCII + SVG + Botones descargar
```

### Frontend (`/frontend/script.js` - 80 nuevas líneas)

```javascript
Funciones:
├─ showMapsGenerator()
│  └─ Abre modal de mapas
│
├─ generateCustomMap()
│  └─ POST a /api/maps/generate con descripción
│
├─ generatePresetMap(type)
│  └─ GET /api/maps/generate/{type}
│
├─ displayMapResult(data)
│  └─ Renderiza mapa, botones de descarga, etc.
│
└─ setupMapsEventListeners()
   └─ Configura todos los botones
```

### Frontend (`/frontend/style.css` - 150+ líneas nuevas)

```css
Clases de estilo:
├─ .maps-content → Grid layout principal
├─ .map-ascii → Terminal negra para mapa
├─ .map-result → Contenedor de resultado
├─ .map-legend → Leyenda de símbolos
├─ .svg-container → Visualización gráfica
├─ .map-controls → Botones de acción
├─ .preset-buttons → Grid de botones rápidos
└─ @media (max-width: 768px) → Responsive
```

---

## 📊 Flujos de Datos

### Flujo 1: Usuario solicita Mapa Personalizado

```
Usuario en web:
  "Crea un castillo medieval"
  Ancho: 25, Alto: 20
  Click "🎨 Generar Mapa"
         │
         ↓ POST /api/maps/generate
  
Backend:
  {
    description: "Crea un castillo medieval",
    width: 25,
    height: 20,
    format: "all"
  }
         │
         ↓ mapGenerator.generateASCIIMap()
  
Ollama IA (Local):
  Prompt: "Generate ASCII map for: 'Crea un castillo...'"
  Model: qwen2.5-coder:7b
         │
         ↓ Respuesta IA
  
Backend procesa:
  ├─ Parsea mapa ASCII: "████..."
  ├─ Extrae leyenda: "█ = Wall, ░ = Floor"
  ├─ Genera Lua: "local mapFolder = ..."
  └─ Convierte SVG: "<svg><rect />...</svg>"
         │
         ↓ Response 200 OK
  
Frontend recibe:
  {
    success: true,
    map: {ascii: "████...", legend: "..."},
    lua: "-- código Lua completo",
    svg: "<svg>...</svg>"
  }
         │
         ↓ displayMapResult()
  
Usuario ve:
  ├─ Mapa ASCII (terminal negra)
  ├─ Mapa SVG (visualización colorida)
  ├─ Botón "📋 Copiar ASCII"
  └─ Botón "💾 Descargar Lua"
         │
         ↓ Usuario descarga map_12345.lua
  
Roblox Studio:
  1. Nuevo Script en ServerScriptService
  2. Pegar contenido del archivo
  3. Click Play
  4. ¡Mapa construido en juego!
```

### Flujo 2: Usuario elige Mapa Predefinido

```
Usuario en web:
  Click "🏰 Dungeon"
         │
         ↓ GET /api/maps/generate/dungeon?width=20&height=15
  
Backend:
  mapGenerator.generateDungeon(20, 15)
         │
         ↓ Algoritmo procedural:
         
  1. Crear 5 salas aleatorias
  2. Llenarlas de piso (░)
  3. Conectarlas con caminos
  4. Colocar inicio (@) y final (★)
  5. Rodear con muros (█)
         │
         ↓ Retorna ASCII + Lua + SVG
  
Frontend:
  Renderiza instantáneamente
  (sin delay porque es procedural, no IA)
```

---

## 🎨 Símbolos del Mapa

| Símbolo | Nombre | Color SVG | Bloque Roblox |
|---------|--------|-----------|---------------|
| `█` | Muro | #333333 (Gris oscuro) | Part (Dark stone grey) |
| `░` | Piso | #cccccc (Gris claro) | BasePart (Medium stone) |
| `≈` | Agua | #4da6ff (Azul) | Part (Bright blue) |
| `▲` | Montaña | #99cc00 (Verde) | Part (Dark green) |
| `★` | Especial | #ffcc00 (Amarillo) | Part (Bright yellow) |
| `@` | Inicio | #ff6b6b (Rojo) | Part (Bright red) |

---

## 💾 Código Lua Generado

Ejemplo de lo que descarga el usuario:

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
  part.Size = Vector3.new(10, 10, 10)
  
  if blockType == "Part" then
    part.BrickColor = BrickColor.new("Dark stone grey")
  elseif blockType == "Water" then
    part.BrickColor = BrickColor.new("Bright blue")
    part.CanCollide = false
  elseif blockType == "Mountain" then
    part.BrickColor = BrickColor.new("Dark green")
  elseif blockType == "Start" then
    part.BrickColor = BrickColor.new("Bright red")
    part.CanCollide = false
  else
    part.BrickColor = BrickColor.new("Medium stone grey")
  end
  
  part.TopSurface = Enum.SurfaceType.Smooth
  part.BottomSurface = Enum.SurfaceType.Smooth
  part.Parent = mapFolder
  
  return part
end

-- Build the map
createBlock("Part", 0, 0, 0)
createBlock("Floor", 10, 0, 0)
createBlock("Floor", 20, 0, 0)
-- ... más bloques ...

print("Map generated with 20x15 cells")
```

**El usuario puede modificarlo:**
- Cambiar tamaños: `Vector3.new(15, 15, 15)` en lugar de `(10, 10, 10)`
- Cambiar colores: `BrickColor.new("Bright red")` por otro color
- Agregar física, velocidad, eventos, etc.

---

## 📈 Estadísticas

```
Archivos nuevos:
├─ mapGenerator.js (450 líneas)
├─ maps.js (150 líneas)
├─ GENERADOR_MAPAS.md (400 líneas)
└─ MAPAS_RESUMEN.md (300 líneas)

Archivos modificados:
├─ index.js (2 líneas: import + route)
├─ script.js (80 líneas nuevas)
├─ style.css (150 líneas nuevas)
└─ index.html (30 líneas: botón + modal)

Total:
- Líneas de código: ~1500
- Funciones backend: 8
- Endpoints REST: 4
- Funciones frontend: 5
- Clases CSS: 15+
```

---

## 🚀 Casos de Uso

### 1. Crear un Laberinto para Juego de Aventura
```
1. Click "🗺️ Generador de Mapas"
2. Click "🔀 Laberinto"
3. Cambiar: Ancho=40, Alto=30
4. Click descargar
5. Pegar en Roblox Studio
6. Agregar NPCs, trampas, tesoros en Lua
```

### 2. Diseñar Dungeon Personalizado
```
1. Escribir: "Dungeon con sala del trono, tesorería y mazmorras"
2. Ver visualización SVG
3. Si no te gusta, generar de nuevo
4. Descargar cuando esté bien
```

### 3. Crear Isla Procedural
```
1. Click "🏝️ Isla"
2. Cambiar tamaño a 30x25
3. El sistema genera una isla única
4. Descargar código
5. Agregar NPCs, vendedores, recursos en Lua
```

### 4. Generar Mapas Múltiples para tu Juego
```
1. Generar 5 mapas diferentes
2. Cambiar nombre: map_dungeon1.lua, map_dungeon2.lua, etc.
3. Crear carpeta "Maps" en ServerScriptService
4. Pegar todos los scripts
5. Cargar dinámicamente según el nivel
```

---

## 🔄 Integración con Otros Sistemas

### Con Attack System
```lua
-- map_dungeon.lua cargado
-- attack_system.lua cargado

-- Spawn enemigos en el mapa
local spawnPoints = mapFolder:FindDescendants()
for _, part in pairs(spawnPoints) do
  if part.Name == "Floor" then
    local enemy = createEnemy(part.Position)
    enemy:StartCombat()  -- Del attack system
  end
end
```

### Con Shop System
```lua
-- En el mapa generado, crear tienda
local shopLocation = mapFolder.Floor:FindFirstChild("SpecialPoint")
if shopLocation then
  local shopNPC = createShop(shopLocation.Position)
  shopNPC.Name = "Merchant"
end
```

### Con Quest System
```lua
-- Crear objetivos del mapa
local questMarkers = {}
for _, part in pairs(mapFolder:FindDescendants()) do
  if part.Name == "Special" then
    table.insert(questMarkers, part.Position)
  end
end

-- Asignar quests a esos puntos
for i, marker in pairs(questMarkers) do
  createQuest("Find treasure at marker " .. i, marker)
end
```

---

## ⚙️ Configuración

### Variables Editables

En `mapGenerator.js`:

```javascript
// Cambiar tamaño máximo de mapa
const MAX_WIDTH = 50;
const MAX_HEIGHT = 40;

// Cambiar modelo IA
const MODEL = 'qwen2.5-coder:7b';

// Cambiar timeout
const TIMEOUT = 60000; // ms

// Cambiar temperatura de IA
const TEMPERATURE = 0.7;
```

En `script.js`:

```javascript
// Cambiar cantidad de salas en Dungeon
const DUNGEON_ROOMS = 5;

// Cambiar radio de isla
const ISLAND_RADIUS_RATIO = 0.4;

// Cambiar tamaño de celda
const CELL_SIZE = 10; // Bloques en Roblox
```

---

## ❌ Limitaciones Actuales

1. **Tamaño máximo**: 50x40 caracteres
2. **Sin persistencia**: Cada generación es nueva
3. **Requiere Ollama**: Para mapas IA personalizados
4. **Símbolos limitados**: 6 tipos de bloques
5. **Sin historial**: Los mapas no se guardan

---

## 🔮 Mejoras Futuras

- [ ] Historial de mapas generados
- [ ] Editor visual (drag & drop de bloques)
- [ ] Exportar a PNG/JSON
- [ ] Mapas 3D (voxel-based)
- [ ] Temas de colores personalizados
- [ ] Colaboración multi-usuario
- [ ] Importar mapas desde otros juegos
- [ ] Generador de decoraciones procedurales

---

## 📚 Documentación

Dos archivos completos:

1. **GENERADOR_MAPAS.md** (400 líneas)
   - Guía de usuario paso a paso
   - Tabla de APIs completa
   - Ejemplos de código
   - Troubleshooting

2. **MAPAS_RESUMEN.md** (300 líneas)
   - Diagrama de flujo visual
   - Explicación técnica
   - Casos de uso reales
   - Estadísticas del proyecto

---

## ✅ Testing

Para probar localmente:

```bash
# 1. Asegúrate que Ollama está corriendo
ollama pull qwen2.5-coder:7b
ollama serve

# 2. En otra terminal, inicia backend
cd mini-lemonade/backend
npm install
npm start

# 3. En el navegador, ve a:
http://localhost:3000

# 4. Click "🗺️ Generador de Mapas"

# 5. Prueba un mapa predefinido (click rápido)

# 6. Descarga el código Lua

# 7. Pega en Roblox Studio y ejecuta
```

---

## 🎉 Resumen Final

**¿Qué logramos?**
- ✅ Generador de mapas completo para Roblox
- ✅ 4 algoritmos procedurales diferentes
- ✅ Generación IA personalizada
- ✅ 3 formatos salida (ASCII, Lua, SVG)
- ✅ Interfaz web intuitiva
- ✅ Documentación exhaustiva
- ✅ Código limpio y mantenible

**¿Quién puede usarlo?**
- Game developers Roblox
- Usuarios sin experiencia en código
- Modders avanzados
- Educadores y estudiantes

**¿Cuál es la ventaja?**
- Mapas en segundos en lugar de horas
- Código listo para producción
- Múltiples estilos de mapas
- Integración fluida con DataShark IA
- Completamente personalizable

**Status:** ✅ **COMPLETO Y EN PRODUCCIÓN**
