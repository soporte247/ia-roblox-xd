/**
 * MetricsService - Recopila métricas y estadísticas del backend
 * Útil para monitoreo, debugging y optimización
 */

class MetricsService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byRoute: {},
        byMethod: {},
        errors: 0,
        success: 0
      },
      ai: {
        beta: { calls: 0, successes: 0, failures: 0, totalTime: 0 },
        deepseek: { calls: 0, successes: 0, failures: 0, totalTime: 0 },
        ollama: { calls: 0, successes: 0, failures: 0, totalTime: 0 },
        templates: { uses: 0 }
      },
      generation: {
        total: 0,
        byType: {},
        avgTime: 0,
        totalTime: 0
      },
      clarification: {
        questionsGenerated: 0,
        codeGenerated: 0,
        avgQuestions: 0,
        totalTime: 0
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      performance: {
        slowRequests: 0, // Requests > 5s
        fastRequests: 0, // Requests < 1s
        avgResponseTime: 0
      }
    };

    this.startTime = Date.now();
    this.responseTimes = [];
    this.maxRecentErrors = 50;

    // Limpiar métricas antiguas cada hora
    setInterval(() => this.cleanup(), 1000 * 60 * 60);
  }

  /**
   * Registra una nueva request
   */
  trackRequest(route, method) {
    this.metrics.requests.total++;
    this.metrics.requests.byRoute[route] = (this.metrics.requests.byRoute[route] || 0) + 1;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
  }

  /**
   * Registra una request exitosa
   */
  trackSuccess() {
    this.metrics.requests.success++;
  }

  /**
   * Registra un error en request
   */
  trackError(error, route, context = {}) {
    this.metrics.requests.errors++;
    this.metrics.errors.total++;

    const errorType = error.name || 'Unknown';
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;

    // Agregar a errores recientes
    this.metrics.errors.recent.unshift({
      message: error.message,
      type: errorType,
      route,
      context,
      timestamp: new Date().toISOString()
    });

    // Mantener solo los últimos N errores
    if (this.metrics.errors.recent.length > this.maxRecentErrors) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(0, this.maxRecentErrors);
    }
  }

  /**
   * Registra tiempo de respuesta
   */
  trackResponseTime(timeMs) {
    this.responseTimes.push(timeMs);

    // Mantener solo las últimas 1000 mediciones
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Actualizar métricas de performance
    if (timeMs > 5000) {
      this.metrics.performance.slowRequests++;
    } else if (timeMs < 1000) {
      this.metrics.performance.fastRequests++;
    }

    // Calcular promedio
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.performance.avgResponseTime = Math.round(sum / this.responseTimes.length);
  }

  /**
   * Registra uso de IA
   */
  trackAICall(provider, success, timeMs) {
    const providerMetrics = this.metrics.ai[provider];
    if (providerMetrics) {
      providerMetrics.calls++;
      if (success) {
        providerMetrics.successes++;
      } else {
        providerMetrics.failures++;
      }
      providerMetrics.totalTime += timeMs;
    }
  }

  /**
   * Registra generación de sistema
   */
  trackGeneration(type, timeMs) {
    this.metrics.generation.total++;
    this.metrics.generation.byType[type] = (this.metrics.generation.byType[type] || 0) + 1;
    this.metrics.generation.totalTime += timeMs;
    
    if (this.metrics.generation.total > 0) {
      this.metrics.generation.avgTime = Math.round(
        this.metrics.generation.totalTime / this.metrics.generation.total
      );
    }
  }

  /**
   * Registra uso de clarificación
   */
  trackClarification(type, questionsCount, timeMs) {
    if (type === 'questions') {
      this.metrics.clarification.questionsGenerated++;
      if (questionsCount) {
        const total = this.metrics.clarification.questionsGenerated;
        this.metrics.clarification.avgQuestions = 
          (this.metrics.clarification.avgQuestions * (total - 1) + questionsCount) / total;
      }
    } else if (type === 'code') {
      this.metrics.clarification.codeGenerated++;
    }
    this.metrics.clarification.totalTime += timeMs;
  }

  /**
   * Obtiene todas las métricas
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    
    return {
      ...this.metrics,
      system: {
        uptime: uptime,
        uptimeHuman: this.formatUptime(uptime),
        startTime: new Date(this.startTime).toISOString()
      },
      successRate: this.metrics.requests.total > 0
        ? ((this.metrics.requests.success / this.metrics.requests.total) * 100).toFixed(2)
        : 0,
      ai: {
        ...this.metrics.ai,
        beta: {
          ...this.metrics.ai.beta,
          successRate: this.metrics.ai.beta.calls > 0
            ? ((this.metrics.ai.beta.successes / this.metrics.ai.beta.calls) * 100).toFixed(2)
            : 0,
          avgTime: this.metrics.ai.beta.calls > 0
            ? Math.round(this.metrics.ai.beta.totalTime / this.metrics.ai.beta.calls)
            : 0
        },
        deepseek: {
          ...this.metrics.ai.deepseek,
          successRate: this.metrics.ai.deepseek.calls > 0
            ? ((this.metrics.ai.deepseek.successes / this.metrics.ai.deepseek.calls) * 100).toFixed(2)
            : 0,
          avgTime: this.metrics.ai.deepseek.calls > 0
            ? Math.round(this.metrics.ai.deepseek.totalTime / this.metrics.ai.deepseek.calls)
            : 0
        },
        ollama: {
          ...this.metrics.ai.ollama,
          successRate: this.metrics.ai.ollama.calls > 0
            ? ((this.metrics.ai.ollama.successes / this.metrics.ai.ollama.calls) * 100).toFixed(2)
            : 0,
          avgTime: this.metrics.ai.ollama.calls > 0
            ? Math.round(this.metrics.ai.ollama.totalTime / this.metrics.ai.ollama.calls)
            : 0
        }
      }
    };
  }

  /**
   * Formatea uptime en formato legible
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Limpia métricas antiguas
   */
  cleanup() {
    // Mantener solo errores de las últimas 24 horas
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.metrics.errors.recent = this.metrics.errors.recent.filter(
      e => new Date(e.timestamp).getTime() > oneDayAgo
    );

    console.log('[Metrics] Cleanup completed');
  }

  /**
   * Resetea todas las métricas
   */
  reset() {
    const oldStartTime = this.startTime;
    this.metrics = {
      requests: { total: 0, byRoute: {}, byMethod: {}, errors: 0, success: 0 },
      ai: {
        beta: { calls: 0, successes: 0, failures: 0, totalTime: 0 },
        deepseek: { calls: 0, successes: 0, failures: 0, totalTime: 0 },
        ollama: { calls: 0, successes: 0, failures: 0, totalTime: 0 },
        templates: { uses: 0 }
      },
      generation: { total: 0, byType: {}, avgTime: 0, totalTime: 0 },
      clarification: { questionsGenerated: 0, codeGenerated: 0, avgQuestions: 0, totalTime: 0 },
      errors: { total: 0, byType: {}, recent: [] },
      performance: { slowRequests: 0, fastRequests: 0, avgResponseTime: 0 }
    };
    this.startTime = Date.now();
    this.responseTimes = [];
    
    console.log(`[Metrics] Reset completed. Previous uptime: ${this.formatUptime(Date.now() - oldStartTime)}`);
  }
}

// Singleton
const metricsService = new MetricsService();

export default metricsService;
