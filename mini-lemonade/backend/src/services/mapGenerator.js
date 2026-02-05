import * as fs from 'fs';
import axios from 'axios';

const OLLAMA_API = process.env.OLLAMA_API || 'http://localhost:11434';

class MapGenerator {
  /**
   * Genera un mapa ASCII basado en la descripción
   * @param {string} description - Descripción del mapa a generar
   * @param {number} width - Ancho del mapa (default 20)
   * @param {number} height - Alto del mapa (default 15)
   * @returns {Promise<Object>} Mapa ASCII y datos
   */
  async generateASCIIMap(description, width = 20, height = 15) {
    try {
      const prompt = `Generate a detailed ASCII map (${width}x${height}) for: "${description}"
      
      Requirements:
      - Use ASCII characters: █ (wall), ░ (floor), ≈ (water), ▲ (mountain), ★ (special), @ (player start)
      - Must be exactly ${width} characters wide
      - Must be exactly ${height} lines tall
      - Make it visually interesting with variety
      - Add a legend explaining the symbols
      
      Response format:
      [MAP START]
      <map_here>
      [MAP END]
      
      [LEGEND START]
      <legend_here>
      [LEGEND END]`;

      const response = await axios.post(`${OLLAMA_API}/api/generate`, {
        model: 'qwen2.5-coder:7b',
        prompt: prompt,
        stream: false,
        temperature: 0.7,
        num_predict: 500,
      }, { timeout: 60000 });

      const mapText = response.data.response;
      const mapMatch = mapText.match(/\[MAP START\]([\s\S]*?)\[MAP END\]/);
      const legendMatch = mapText.match(/\[LEGEND START\]([\s\S]*?)\[LEGEND END\]/);

      const mapContent = mapMatch ? mapMatch[1].trim() : this.generateDefaultMap(width, height, description);
      const legend = legendMatch ? legendMatch[1].trim() : '█ = Walls\n░ = Floor\n≈ = Water\n▲ = Mountain\n★ = Special\n@ = Start';

      return {
        success: true,
        type: 'ascii',
        map: mapContent,
        legend: legend,
        width,
        height,
        description,
      };
    } catch (error) {
      console.error('Error generating ASCII map:', error.message);
      return {
        success: false,
        error: error.message,
        map: this.generateDefaultMap(width, height, description),
      };
    }
  }

  /**
   * Genera código SVG para visualizar un mapa
   * @param {string} mapASCII - Mapa en formato ASCII
   * @param {number} cellSize - Tamaño de cada celda en píxeles
   * @returns {string} Código SVG
   */
  generateSVGFromASCII(mapASCII, cellSize = 20) {
    const lines = mapASCII.trim().split('\n');
    const height = lines.length;
    const width = Math.max(...lines.map(l => l.length));

    const colorMap = {
      '█': '#333333',  // Wall - Dark gray
      '░': '#cccccc',  // Floor - Light gray
      '≈': '#4da6ff',  // Water - Blue
      '▲': '#99cc00',  // Mountain - Green
      '★': '#ffcc00',  // Special - Yellow
      '@': '#ff6b6b',  // Start - Red
      ' ': '#ffffff',  // Empty - White
    };

    let svg = `<svg width="${width * cellSize}" height="${height * cellSize}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<style>
      .map-cell { stroke: #ddd; stroke-width: 0.5; }
      .map-text { font-size: 12px; text-anchor: middle; dominant-baseline: middle; }
    </style>`;

    lines.forEach((line, y) => {
      for (let x = 0; x < width; x++) {
        const char = line[x] || ' ';
        const color = colorMap[char] || '#ffffff';
        const rectX = x * cellSize;
        const rectY = y * cellSize;

        svg += `<rect class="map-cell" x="${rectX}" y="${rectY}" width="${cellSize}" height="${cellSize}" fill="${color}" />`;
        if (char !== ' ') {
          svg += `<text class="map-text" x="${rectX + cellSize / 2}" y="${rectY + cellSize / 2}">${char}</text>`;
        }
      }
    });

    svg += '</svg>';
    return svg;
  }

  /**
   * Genera un mapa procedural por defecto
   * @param {number} width - Ancho
   * @param {number} height - Alto
   * @param {string} description - Descripción
   * @returns {string} Mapa ASCII
   */
  generateDefaultMap(width, height, description) {
    const map = [];

    // Determinar tipo de mapa por descripción
    const isLabyrinth = description.toLowerCase().includes('laberinto') || description.toLowerCase().includes('maze');
    const isDungeon = description.toLowerCase().includes('dungeon') || description.toLowerCase().includes('mazmorra');
    const isIsland = description.toLowerCase().includes('isla') || description.toLowerCase().includes('island');

    if (isLabyrinth) {
      return this.generateLabyrinth(width, height);
    } else if (isDungeon) {
      return this.generateDungeon(width, height);
    } else if (isIsland) {
      return this.generateIsland(width, height);
    } else {
      return this.generateRandomMap(width, height);
    }
  }

  generateLabyrinth(width, height) {
    const map = Array(height).fill(null).map(() => Array(width).fill('█'));

    // Crear caminos
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        map[y][x] = '░';
      }
    }

    // Conectar caminos
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        if (Math.random() > 0.5 && x + 2 < width) map[y][x + 1] = '░';
        if (Math.random() > 0.5 && y + 2 < height) map[y + 1][x] = '░';
      }
    }

    map[1][1] = '@';
    map[height - 2][width - 2] = '★';

    return map.map(row => row.join('')).join('\n');
  }

  generateDungeon(width, height) {
    const map = Array(height).fill(null).map(() => Array(width).fill('█'));
    const rooms = [];

    // Crear salas
    for (let i = 0; i < 5; i++) {
      const roomWidth = Math.floor(Math.random() * 6) + 4;
      const roomHeight = Math.floor(Math.random() * 5) + 3;
      const x = Math.floor(Math.random() * (width - roomWidth - 2)) + 1;
      const y = Math.floor(Math.random() * (height - roomHeight - 2)) + 1;

      rooms.push({ x, y, width: roomWidth, height: roomHeight });

      for (let ry = y; ry < y + roomHeight; ry++) {
        for (let rx = x; rx < x + roomWidth; rx++) {
          map[ry][rx] = '░';
        }
      }
    }

    // Conectar salas
    for (let i = 0; i < rooms.length - 1; i++) {
      const r1 = rooms[i];
      const r2 = rooms[i + 1];
      let x = r1.x + Math.floor(r1.width / 2);
      let y = r1.y + Math.floor(r1.height / 2);

      while (x !== r2.x + Math.floor(r2.width / 2)) {
        map[y][x] = '░';
        x += x < r2.x + Math.floor(r2.width / 2) ? 1 : -1;
      }

      while (y !== r2.y + Math.floor(r2.height / 2)) {
        map[y][x] = '░';
        y += y < r2.y + Math.floor(r2.height / 2) ? 1 : -1;
      }
    }

    map[rooms[0].y + 1][rooms[0].x + 1] = '@';
    map[rooms[rooms.length - 1].y + 1][rooms[rooms.length - 1].x + 1] = '★';

    return map.map(row => row.join('')).join('\n');
  }

  generateIsland(width, height) {
    const map = Array(height).fill(null).map(() => Array(width).fill('≈'));

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const maxRadius = Math.min(width, height) / 2 - 2;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (dist < maxRadius) {
          map[y][x] = '░';
          if (dist > maxRadius - 3 && Math.random() > 0.6) {
            map[y][x] = '▲';
          }
        }
      }
    }

    map[centerY][centerX] = '@';
    map[Math.floor(centerY / 2)][Math.floor(centerX / 2)] = '★';

    return map.map(row => row.join('')).join('\n');
  }

  generateRandomMap(width, height) {
    const map = [];
    for (let y = 0; y < height; y++) {
      let row = '';
      for (let x = 0; x < width; x++) {
        const rand = Math.random();
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          row += '█';
        } else if (rand < 0.15) {
          row += '▲';
        } else if (rand < 0.2) {
          row += '≈';
        } else if (rand < 0.25) {
          row += '★';
        } else {
          row += '░';
        }
      }
      map.push(row);
    }

    // Set start and end
    let firstRow = map[1].split('');
    firstRow[1] = '@';
    map[1] = firstRow.join('');

    let lastRow = map[height - 2].split('');
    lastRow[width - 2] = '★';
    map[height - 2] = lastRow.join('');

    return map.join('\n');
  }

  /**
   * Genera código Lua para construir el mapa en Roblox
   * @param {string} mapASCII - Mapa ASCII
   * @param {number} cellSize - Tamaño de cada bloque
   * @returns {string} Código Lua
   */
  generateLuaMap(mapASCII, cellSize = 10) {
    const lines = mapASCII.trim().split('\n');
    const height = lines.length;
    const width = Math.max(...lines.map(l => l.length));

    const blockMap = {
      '█': 'Part',      // Wall
      '░': 'BasePart',  // Floor
      '≈': 'Water',     // Water
      '▲': 'Mountain',  // Mountain
      '★': 'Spawn',     // Special
      '@': 'Start',     // Start point
    };

    let lua = `-- Auto-generated Map from DataShark IA
-- Dimensions: ${width}x${height}

local mapFolder = Instance.new("Folder")
mapFolder.Name = "GeneratedMap"
mapFolder.Parent = workspace

local function createBlock(blockType, x, y, z)
  local part = Instance.new("Part")
  part.Name = blockType
  part.Position = Vector3.new(x, y, z)
  part.Size = Vector3.new(${cellSize}, ${cellSize}, ${cellSize})
  
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
`;

    lines.forEach((line, y) => {
      for (let x = 0; x < width; x++) {
        const char = line[x] || ' ';
        if (char !== ' ') {
          const blockType = blockMap[char] || 'BasePart';
          const posX = x * cellSize;
          const posZ = y * cellSize;
          lua += `createBlock("${blockType}", ${posX}, 0, ${posZ})\n`;
        }
      }
    });

    lua += `\nprint("Map generated with ${width}x${height} cells")`;

    return lua;
  }
}

export default new MapGenerator();
