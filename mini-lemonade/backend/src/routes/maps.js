import express from 'express';
import mapGenerator from '../services/mapGenerator.js';

const router = express.Router();

/**
 * POST /api/maps/generate
 * Genera un mapa ASCII basado en la descripción
 */
router.post('/generate', async (req, res) => {
  try {
    const { description, width = 20, height = 15, format = 'ascii' } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required',
      });
    }

    console.log(`[MAP] Generating ${format} map: ${description}`);

    if (format === 'ascii' || format === 'all') {
      const mapResult = await mapGenerator.generateASCIIMap(description, width, height);

      if (!mapResult.success) {
        return res.status(500).json(mapResult);
      }

      // Si pide ASCII + Lua
      if (format === 'all') {
        const luaCode = mapGenerator.generateLuaMap(mapResult.map, 10);
        const svgCode = mapGenerator.generateSVGFromASCII(mapResult.map, 20);

        return res.json({
          success: true,
          map: mapResult,
          lua: {
            code: luaCode,
            description: 'Lua code to build the map in Roblox Studio',
          },
          svg: {
            code: svgCode,
            description: 'SVG visualization of the map',
          },
        });
      }

      // Solo ASCII
      const svgCode = mapGenerator.generateSVGFromASCII(mapResult.map, 20);
      return res.json({
        success: true,
        map: mapResult,
        svg: svgCode,
      });
    }

    res.status(400).json({
      success: false,
      error: 'Invalid format. Use "ascii" or "all"',
    });
  } catch (error) {
    console.error('[MAP] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/maps/generate/:type
 * Genera un mapa predefinido
 * Types: maze, dungeon, island, random
 */
router.get('/generate/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { width = 20, height = 15 } = req.query;

    console.log(`[MAP] Generating predefined map: ${type}`);

    let mapASCII;
    let description;

    switch (type.toLowerCase()) {
      case 'maze':
      case 'laberinto':
        mapASCII = mapGenerator.generateLabyrinth(parseInt(width), parseInt(height));
        description = 'Randomly generated labyrinth/maze';
        break;
      case 'dungeon':
      case 'mazmorra':
        mapASCII = mapGenerator.generateDungeon(parseInt(width), parseInt(height));
        description = 'Randomly generated dungeon with connected rooms';
        break;
      case 'island':
      case 'isla':
        mapASCII = mapGenerator.generateIsland(parseInt(width), parseInt(height));
        description = 'Island surrounded by water with mountains';
        break;
      case 'random':
      case 'aleatorio':
        mapASCII = mapGenerator.generateRandomMap(parseInt(width), parseInt(height));
        description = 'Randomly generated map';
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid type. Use: maze, dungeon, island, random',
        });
    }

    const svgCode = mapGenerator.generateSVGFromASCII(mapASCII, 20);
    const luaCode = mapGenerator.generateLuaMap(mapASCII, 10);

    res.json({
      success: true,
      type,
      description,
      map: {
        ascii: mapASCII,
        width: parseInt(width),
        height: parseInt(height),
      },
      svg: svgCode,
      lua: luaCode,
    });
  } catch (error) {
    console.error('[MAP] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/maps/toLua
 * Convierte un mapa ASCII a código Lua
 */
router.post('/toLua', (req, res) => {
  try {
    const { mapASCII, cellSize = 10 } = req.body;

    if (!mapASCII) {
      return res.status(400).json({
        success: false,
        error: 'mapASCII is required',
      });
    }

    const luaCode = mapGenerator.generateLuaMap(mapASCII, cellSize);

    res.json({
      success: true,
      lua: luaCode,
    });
  } catch (error) {
    console.error('[MAP] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/maps/toSVG
 * Convierte un mapa ASCII a SVG
 */
router.post('/toSVG', (req, res) => {
  try {
    const { mapASCII, cellSize = 20 } = req.body;

    if (!mapASCII) {
      return res.status(400).json({
        success: false,
        error: 'mapASCII is required',
      });
    }

    const svgCode = mapGenerator.generateSVGFromASCII(mapASCII, cellSize);

    res.json({
      success: true,
      svg: svgCode,
    });
  } catch (error) {
    console.error('[MAP] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
