import express from 'express';
import { getDatabase } from '../services/database.js';

const router = express.Router();

/**
 * POST /api/plugin/inject
 * Inyecta código generado directamente en el plugin de Roblox Studio
 */
router.post('/inject', async (req, res) => {
  try {
    const { userId, sessionId, code, systemType, description } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        error: 'userId and code are required',
      });
    }

    console.log(`[INJECT] Inyectando código para usuario ${userId}, tipo: ${systemType}`);

    // Guardar en BD que se inyectó
    const db = getDatabase();
    const timestamp = new Date().toISOString();

    db.run(
      `INSERT INTO plugin_injections (userId, sessionId, systemType, description, codeLength, status, injectedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, sessionId || 'unknown', systemType || 'unknown', description || '', code.length, 'sent', timestamp],
      (err) => {
        if (err) console.error('[INJECT] DB Error:', err);
      }
    );

    // Retornar éxito con el código
    res.json({
      success: true,
      message: 'Código enviado al plugin para inyección',
      injection: {
        userId,
        sessionId,
        systemType,
        codeLength: code.length,
        timestamp,
        target: 'ServerScriptService', // Donde se inyectará
      },
      code: code, // El código a inyectar
    });
  } catch (error) {
    console.error('[INJECT] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/plugin/pending/:userId
 * El plugin consulta si hay códigos pendientes para inyectar
 */
router.get('/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();

    db.all(
      `SELECT * FROM pending_injections 
       WHERE userId = ? AND status = 'pending' 
       ORDER BY createdAt DESC LIMIT 5`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('[PENDING] DB Error:', err);
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }

        res.json({
          success: true,
          pending: rows || [],
          count: (rows || []).length,
        });
      }
    );
  } catch (error) {
    console.error('[PENDING] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/plugin/injected
 * El plugin confirma que inyectó el código exitosamente
 */
router.post('/injected', async (req, res) => {
  try {
    const { injectionId, userId, systemType, scriptName, success, message } = req.body;

    console.log(`[INJECTED] Plugin confirmó inyección de ${systemType}`);

    const db = getDatabase();
    const timestamp = new Date().toISOString();

    // Actualizar estado en BD
    db.run(
      `UPDATE plugin_injections SET status = ?, completedAt = ?, scriptName = ? 
       WHERE userId = ? AND id = ?`,
      [success ? 'completed' : 'failed', timestamp, scriptName || null, userId, injectionId],
      (err) => {
        if (err) console.error('[INJECTED] DB Error:', err);
      }
    );

    res.json({
      success: true,
      message: 'Confirmación de inyección recibida',
      details: {
        injectionId,
        systemType,
        scriptName,
        status: success ? 'completed' : 'failed',
        pluginMessage: message,
        timestamp,
      },
    });
  } catch (error) {
    console.error('[INJECTED] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/plugin/injections/:userId
 * Obtener historial de inyecciones del usuario
 */
router.get('/injections/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDatabase();

    db.all(
      `SELECT * FROM plugin_injections 
       WHERE userId = ? 
       ORDER BY injectedAt DESC LIMIT 20`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('[INJECTIONS] DB Error:', err);
          return res.status(500).json({
            success: false,
            error: err.message,
          });
        }

        res.json({
          success: true,
          injections: rows || [],
          total: (rows || []).length,
        });
      }
    );
  } catch (error) {
    console.error('[INJECTIONS] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
