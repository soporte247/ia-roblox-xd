import express from 'express';
import { ErrorLogger } from '../services/errorLogger.js';

const router = express.Router();

/**
 * GET /api/logs/errors/recent
 * Obtiene errores recientes (útil para debugging)
 */
router.get('/errors/recent', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const errors = ErrorLogger.getRecentErrors(limit);
    
    res.json({
      success: true,
      count: errors.length,
      errors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/logs/stats
 * Obtiene estadísticas de errores
 */
router.get('/stats', (req, res) => {
  try {
    const hoursBack = parseInt(req.query.hours) || 24;
    const stats = ErrorLogger.getErrorStats(hoursBack);
    
    res.json({
      success: true,
      hoursBack,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/logs/clean
 * Limpia logs antiguos (solo admin)
 */
router.post('/clean', (req, res) => {
  try {
    const daysOld = parseInt(req.body.daysOld) || 7;
    ErrorLogger.cleanOldLogs(daysOld);
    
    res.json({
      success: true,
      message: `Cleaned logs older than ${daysOld} days`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
