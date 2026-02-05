/**
 * Ruta /sync-history - Sincronización de historial entre plugin y web
 */

import express from 'express';
import { dbRun, dbAll, dbGet } from '../services/database.js';

const router = express.Router();

/**
 * POST /api/sync-history/save
 * Guarda una entrada en el historial compartido
 */
router.post('/save', async (req, res) => {
  try {
    const {
      userId,
      originalPrompt,
      systemType,
      questions,
      answers,
      generatedCode,
      source = 'plugin',
      sessionId
    } = req.body;

    // Validar entrada
    if (!userId || !originalPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos: userId, originalPrompt'
      });
    }

    // Guardar en BD
    const result = await dbRun(
      `INSERT INTO clarification_history 
       (userId, originalPrompt, systemType, questions, answers, generatedCode, source, sessionId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        originalPrompt,
        systemType || null,
        questions ? JSON.stringify(questions) : null,
        answers ? JSON.stringify(answers) : null,
        generatedCode || null,
        source,
        sessionId || null
      ]
    );

    res.json({
      success: true,
      id: result.id,
      message: 'Historial guardado exitosamente'
    });
  } catch (err) {
    console.error('Error guardando historial:', err);
    res.status(500).json({
      success: false,
      error: 'Error al guardar historial: ' + err.message
    });
  }
});

/**
 * GET /api/sync-history/:userId
 * Obtiene el historial compartido del usuario
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Validar userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId requerido'
      });
    }

    // Obtener historial
    const history = await dbAll(
      `SELECT * FROM clarification_history
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    // Parsear JSON en questions, answers
    const parsedHistory = history.map(entry => ({
      ...entry,
      questions: entry.questions ? JSON.parse(entry.questions) : [],
      answers: entry.answers ? JSON.parse(entry.answers) : []
    }));

    res.json({
      success: true,
      history: parsedHistory,
      count: parsedHistory.length
    });
  } catch (err) {
    console.error('Error obteniendo historial:', err);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial: ' + err.message
    });
  }
});

/**
 * DELETE /api/sync-history/:userId/:id
 * Elimina una entrada del historial
 */
router.delete('/:userId/:id', async (req, res) => {
  try {
    const { userId, id } = req.params;

    // Validar que el registro pertenece al usuario
    const entry = await dbGet(
      'SELECT * FROM clarification_history WHERE id = ? AND userId = ?',
      [id, userId]
    );

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entrada no encontrada'
      });
    }

    // Eliminar
    await dbRun(
      'DELETE FROM clarification_history WHERE id = ? AND userId = ?',
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Entrada eliminada'
    });
  } catch (err) {
    console.error('Error eliminando entrada:', err);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar: ' + err.message
    });
  }
});

export default router;
