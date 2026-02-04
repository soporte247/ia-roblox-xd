import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/plugin/status - Verificar si el plugin está disponible
router.get('/status', (req, res) => {
  try {
    const pluginPath = path.join(__dirname, '../../plugin/DataSharkPlugin.lua');
    const exists = fs.existsSync(pluginPath);
    
    if (exists) {
      const stats = fs.statSync(pluginPath);
      res.json({
        success: true,
        installed: true,
        message: '✅ Plugin DataShark detectado',
        path: pluginPath,
        size: stats.size,
        lastModified: stats.mtime
      });
    } else {
      res.json({
        success: true,
        installed: false,
        message: '❌ Plugin no encontrado',
        expectedPath: pluginPath
      });
    }
  } catch (error) {
    console.error('Error verificando plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/plugin/download - Descargar el plugin
router.get('/download', (req, res) => {
  try {
    const pluginPath = path.join(__dirname, '../../plugin/DataSharkPlugin.lua');
    
    if (!fs.existsSync(pluginPath)) {
      return res.status(404).json({ error: 'Plugin no encontrado' });
    }
    
    res.download(pluginPath, 'DataSharkPlugin.lua', (err) => {
      if (err) {
        console.error('Error descargando plugin:', err);
        res.status(500).json({ error: 'Error descargando plugin' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
