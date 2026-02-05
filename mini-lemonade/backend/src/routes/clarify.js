/**
 * Ruta /clarify - Procesa respuestas a preguntas de clarificación y genera código
 */

import express from 'express';
import ClarificationManager from '../services/clarificationManager.js';
import { generateSystem } from '../services/generator.js';
import { ErrorLogger, RetryManager } from '../services/errorLogger.js';
import { classifyPrompt } from '../services/classifier.js';
import { addLog } from './realtime-logs.js';

const router = express.Router();
const clarificationManager = new ClarificationManager();

/**
 * POST /api/clarify
 * Procesa respuestas a preguntas y genera código
 */
router.post('/', async (req, res) => {
  try {
    const {
      originalPrompt,
      systemType,
      questions,
      answers,
      sessionId
    } = req.body;

    // Validar entrada
    if (!originalPrompt || !questions || !answers) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos: originalPrompt, questions, answers',
        code: null
      });
    }

    // Validar que hay suficientes respuestas
    if (!clarificationManager.areAnswersSufficient(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Por favor responde al menos 2 preguntas',
        code: null,
        answered: answers.filter(a => a && a.trim().length > 0).length,
        required: 2
      });
    }

    // Construir prompt mejorado
    const enhancedPrompt = clarificationManager.buildEnhancedPrompt(
      originalPrompt,
      questions,
      answers
    );

    // Si no se detectó tipo, clasificar
    let detectedType = systemType;
    if (!detectedType) {
      detectedType = classifyPrompt(enhancedPrompt);
    }

    // Validar userId/sessionId
    let userId = sessionId;
    if (!userId || userId === 'default' || userId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Usuario inválido. Por favor recarga la página.',
        code: null
      });
    }

    // Registrar solicitud de clarificación
    ErrorLogger.logInfo('Clarification request', {
      prompt: originalPrompt,
      systemType: detectedType,
      hasContext: true
    });

    addLog(`🔍 Procesando clarificación para sistema ${detectedType}`, 'info', 'ai');

    // Generar código con contexto completo
    const result = await generateSystem(detectedType, enhancedPrompt, userId);

    if (result.success) {
      addLog(`✅ Código generado con clarificación: ${detectedType}`, 'success', 'ai');
      
      return res.json({
        success: true,
        code: result.code,
        systemType: detectedType,
        clarificationUsed: true,
        questions: questions,
        answers: answers
      });
    } else {
      // Si hay error, loguear y retornar
      ErrorLogger.logError('Generation failed', new Error(result.message), {
        prompt: enhancedPrompt,
        systemType: detectedType
      });

      return res.status(500).json({
        success: false,
        error: result.message,
        suggestion: result.suggestion,
        code: null
      });
    }
  } catch (error) {
    console.error('Error en /clarify:', error);

    ErrorLogger.logError('Clarification endpoint error', error, {});

    res.status(500).json({
      success: false,
      error: 'Error procesando clarificación: ' + error.message,
      suggestion: 'Intenta de nuevo con respuestas más específicas',
      code: null
    });
  }
});

/**
 * POST /api/clarify/generate-questions
 * Solo genera preguntas sin generar código aún
 */
router.post('/generate-questions', async (req, res) => {
  try {
    const { prompt, systemType } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere prompt'
      });
    }

    // Detectar tipo si no se proporciona
    let detectedType = systemType;
    if (!detectedType) {
      detectedType = classifyPrompt(prompt);
    }

    // Generar preguntas
    const result = await clarificationManager.generateClarificationQuestions(
      prompt,
      detectedType
    );

    res.json({
      success: true,
      questions: result.questions,
      systemType: detectedType,
      originalPrompt: prompt
    });
  } catch (error) {
    console.error('Error generando preguntas:', error);
    res.status(500).json({
      success: false,
      error: 'Error generando preguntas: ' + error.message
    });
  }
});

export default router;
