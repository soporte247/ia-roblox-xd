/**
 * Sistema avanzado de logging y recuperación ante errores
 */
import fs from 'fs';
import path from 'path';

const LOG_DIR = 'logs';
const ERROR_LOG = path.join(LOG_DIR, 'errors.jsonl');
const REQUEST_LOG = path.join(LOG_DIR, 'requests.jsonl');

// Asegurar directorio de logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export class ErrorLogger {
  static levels = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
  };

  /**
   * Registra un error con contexto completo
   */
  static logError(message, error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      level: this.levels.ERROR,
      message,
      error: {
        message: error?.message || String(error),
        stack: error?.stack || null,
        code: error?.code || null,
      },
      context: {
        userId: context.userId || 'unknown',
        type: context.type || 'unknown',
        method: context.method || null,
        ...context,
      },
      retriable: this.isRetriable(error),
      suggestion: this.getSuggestion(error, context),
    };

    // Log en consola
    console.error(`[${errorEntry.level}] ${message}`, errorEntry.error);

    // Guardar en archivo
    this.appendLog(ERROR_LOG, errorEntry);

    return errorEntry;
  }

  /**
   * Registra una solicitud exitosa
   */
  static logRequest(method, userId, systemType, duration, success, details = {}) {
    const requestEntry = {
      timestamp: new Date().toISOString(),
      level: this.levels.INFO,
      method,
      userId,
      systemType,
      duration,
      success,
      details,
    };

    if (duration > 5000) {
      console.warn(`[SLOW REQUEST] ${method} took ${duration}ms`);
    }

    this.appendLog(REQUEST_LOG, requestEntry);
    return requestEntry;
  }

  /**
   * Determina si un error es recuperable (retriable)
   */
  static isRetriable(error) {
    const message = (error?.message || '').toLowerCase();
    const code = error?.code;

    // Errores de red y timeout son retriables
    if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ECONNABORTED') {
      return true;
    }

    // Algunos mensajes que indican que reintentar podría ayudar
    if (
      message.includes('timeout') ||
      message.includes('temporarily unavailable') ||
      message.includes('rate limit') ||
      message.includes('eai_retry')
    ) {
      return true;
    }

    // Errores de validación o sintaxis generalmente no son retriables
    if (
      message.includes('validation') ||
      message.includes('syntax') ||
      message.includes('invalid') ||
      message.includes('json')
    ) {
      return false;
    }

    return false;
  }

  /**
   * Obtiene una sugerencia basada en el error
   */
  static getSuggestion(error, context = {}) {
    const message = (error?.message || '').toLowerCase();
    const type = context.type || '';

    if (message.includes('timeout')) {
      return 'El servidor tardó demasiado. Intenta con una descripción más corta.';
    }

    if (message.includes('rate limit')) {
      return 'Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.';
    }

    if (message.includes('json') || message.includes('syntax')) {
      return 'El código generado tiene errores. Intenta describir el sistema de forma diferente.';
    }

    if (message.includes('api') || message.includes('openai') || message.includes('ollama')) {
      return 'Problemas con el servicio de IA. Intenta de nuevo en unos momentos.';
    }

    if (message.includes('database') || message.includes('db')) {
      return 'Error de base de datos. Por favor, contacta al administrador.';
    }

    return 'Hubo un error. Por favor intenta de nuevo.';
  }

  /**
   * Append log entry to JSONL file
   */
  static appendLog(filePath, entry) {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(filePath, line, 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Obtiene logs recientes (últimas N líneas)
   */
  static getRecentErrors(limit = 50) {
    try {
      if (!fs.existsSync(ERROR_LOG)) {
        return [];
      }

      const content = fs.readFileSync(ERROR_LOG, 'utf8');
      const lines = content
        .trim()
        .split('\n')
        .filter(line => line.trim());

      return lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Failed to read error logs:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de errores
   */
  static getErrorStats(hoursBack = 24) {
    const errors = this.getRecentErrors(1000);
    const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;

    const recentErrors = errors.filter(e => new Date(e.timestamp).getTime() > cutoff);

    const stats = {
      total: recentErrors.length,
      retriable: recentErrors.filter(e => e.retriable).length,
      byType: {},
      byUser: {},
      mostCommon: {},
    };

    recentErrors.forEach(error => {
      // Count by type
      const type = error.context.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by user
      const userId = error.context.userId || 'unknown';
      stats.byUser[userId] = (stats.byUser[userId] || 0) + 1;

      // Most common errors
      const msg = error.message;
      stats.mostCommon[msg] = (stats.mostCommon[msg] || 0) + 1;
    });

    return stats;
  }

  /**
   * Limpia logs antiguos
   */
  static cleanOldLogs(daysOld = 7) {
    try {
      const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;

      for (const logFile of [ERROR_LOG, REQUEST_LOG]) {
        if (!fs.existsSync(logFile)) continue;

        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content
          .trim()
          .split('\n')
          .filter(line => {
            try {
              const entry = JSON.parse(line);
              return new Date(entry.timestamp).getTime() > cutoff;
            } catch {
              return false;
            }
          });

        fs.writeFileSync(logFile, lines.join('\n') + '\n', 'utf8');
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }
}

/**
 * Sistema de reintentos inteligente
 */
export class RetryManager {
  static async executeWithRetry(
    fn,
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2
  ) {
    let lastError;
    let currentDelay = delayMs;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // No reintentar si no es retriable
        if (!ErrorLogger.isRetriable(error)) {
          throw error;
        }

        // Si es el último intento, lanzar
        if (attempt === maxRetries - 1) {
          throw error;
        }

        console.warn(
          `[RETRY] Attempt ${attempt + 1}/${maxRetries} failed. ` +
          `Retrying in ${currentDelay}ms...`,
          error.message
        );

        // Esperar antes de reintentar
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }

    throw lastError;
  }

  /**
   * Ejecuta con fallback automático
   */
  static async executeWithFallback(primaryFn, fallbackFn) {
    try {
      return await primaryFn();
    } catch (error) {
      console.warn('[FALLBACK] Primary function failed, using fallback:', error.message);
      return await fallbackFn();
    }
  }
}

export default ErrorLogger;
