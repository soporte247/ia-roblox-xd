import express from 'express';
import { classifyPrompt } from '../services/classifier.js';
import { generateSystem } from '../services/generator.js';
import ResponseValidator from '../services/validator.js';
import { ErrorLogger } from '../services/errorLogger.js';

const router = express.Router();

// Request validation
function validateGenerateRequest(req, res, next) {
  const { prompt, userId, systemType } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    const errorDetails = ResponseValidator.getDetailedErrorMessage(
      new Error('Prompt is required')
    );
    return res.status(400).json({ 
      error: 'Prompt is required and must be a non-empty string',
      suggestion: errorDetails.suggestedFix,
      field: 'prompt'
    });
  }

  if (prompt.length > 1000) {
    return res.status(400).json({ 
      error: 'Prompt is too long (max 1000 characters)',
      field: 'prompt'
    });
  }

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ 
      error: 'UserId is required and must be a string',
      field: 'userId'
    });
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return res.status(400).json({ 
      error: 'UserId must be a valid UUID',
      field: 'userId'
    });
  }

  if (systemType && !['attack', 'shop', 'ui', 'inventory', 'quest'].includes(systemType)) {
    return res.status(400).json({ 
      error: 'Invalid systemType. Must be one of: attack, shop, ui, inventory, quest',
      field: 'systemType'
    });
  }

  next();
}

router.post('/', validateGenerateRequest, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt, userId, systemType } = req.body;

    console.log(`[Generate] Request from user ${userId.substring(0, 8)}... - Type: ${systemType || 'auto'}`);

    const type = systemType || classifyPrompt(prompt);
    const result = await generateSystem(type, prompt.trim(), userId);

    const duration = Date.now() - startTime;

    if (!result.success) {
      // Log failed generation
      ErrorLogger.logRequest('generateSystem', userId, type, duration, false, {
        error: result.message,
        code: result.code
      });

      return res.status(500).json({ 
        error: result.message || 'Generation failed',
        suggestion: result.suggestion,
        success: false,
        code: result.code,
        canRetry: result.code !== 'INVALID_PROMPT'
      });
    }

    // Log successful generation
    ErrorLogger.logRequest('generateSystem', userId, type, duration, true, {
      method: result.method,
      filesWritten: result.files?.length || 0
    });

    console.log(`[Generate] Completed in ${duration}ms - Success: ${result.success}`);

    res.json({
      success: true,
      type,
      result,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const { userId, systemType } = req.body;
    
    // Log unexpected error
    ErrorLogger.logError(`Unexpected error in generate route`, error, { 
      userId, 
      type: systemType,
      duration 
    });
    
    console.error(`[Generate ERROR] After ${duration}ms:`, error.message);
    
    const errorDetails = ResponseValidator.getDetailedErrorMessage(error);
    
    res.status(500).json({ 
      error: 'Internal server error during generation',
      message: errorDetails.userMessage,
      suggestion: errorDetails.suggestedFix,
      success: false,
      canRetry: errorDetails.canRetry
    });
  }
});

export default router;
