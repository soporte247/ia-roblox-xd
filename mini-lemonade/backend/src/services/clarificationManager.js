/**
 * ClarificationManager - Genera preguntas inteligentes para refinar solicitudes
 * Usa DeepSeek API (gratis) con fallback a Ollama local
 */

import cacheService from './cacheService.js';
import metricsService from './metricsService.js';

class ClarificationManager {
  constructor() {
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY || '';
    this.deepseekBaseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    this.betaModelBaseURL = process.env.BETA_MODEL_BASE_URL || '';
    this.betaModelApiKey = process.env.BETA_MODEL_API_KEY || '';
    this.betaModelName = process.env.BETA_MODEL_NAME || 'datashark-beta';

    this.ollamaBaseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';

    // Configuración de timeout y retry
    this.timeout = parseInt(process.env.AI_TIMEOUT || '30000'); // 30s por defecto
    this.maxRetries = parseInt(process.env.AI_MAX_RETRIES || '2'); // 2 reintentos
  }

  /**
   * Llama a Beta Model para generar preguntas de clarificación
   */
  async callBetaModel(prompt) {
    const startTime = Date.now();
    try {
      const operation = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const headers = { 'Content-Type': 'application/json' };

          if (this.betaModelApiKey) {
            headers.Authorization = `Bearer ${this.betaModelApiKey}`;
          }

          const response = await fetch(`${this.betaModelBaseURL}/v1/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: this.betaModelName,
              messages: [
                {
                  role: 'system',
                  content: 'Responde SOLO con JSON válido. No agregues texto adicional.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 500
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Beta model error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          const result = data?.choices?.[0]?.message?.content || '';

          metricsService.trackAICall('beta', true, Date.now() - startTime);
          return result;
        } finally {
          clearTimeout(timeoutId);
        }
      };

      return await this.withRetry(operation, this.maxRetries);
    } catch (error) {
      console.error('❌ Error calling Beta model:', error.message);
      metricsService.trackAICall('beta', false, Date.now() - startTime);
      return null;
    }
  }

  /**
   * Ejecuta una operación con timeout
   */
  async withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout excedido')), timeoutMs)
      )
    ]);
  }

  /**
   * Ejecuta una operación con retry logic
   */
  async withRetry(operation, maxRetries) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff
          console.log(`[Retry ${attempt + 1}/${maxRetries}] Waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  /**
   * Llama a DeepSeek para generar preguntas de clarificación
   */
  async callDeepSeek(prompt) {
    const startTime = Date.now();
    try {
      const operation = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(`${this.deepseekBaseURL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.deepseekApiKey}`
            },
            body: JSON.stringify({
              model: this.deepseekModel,
              messages: [
                {
                  role: 'system',
                  content: 'Responde SOLO con JSON válido. No agregues texto adicional.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 500 // Limitar tokens para respuestas más rápidas
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          const result = data?.choices?.[0]?.message?.content || '';
          
          metricsService.trackAICall('deepseek', true, Date.now() - startTime);
          return result;
        } finally {
          clearTimeout(timeoutId);
        }
      };

      return await this.withRetry(operation, this.maxRetries);
    } catch (error) {
      console.error('❌ Error calling DeepSeek:', error.message);
      metricsService.trackAICall('deepseek', false, Date.now() - startTime);
      return null;
    }
  }

  /**
   * Llama a Ollama para generar preguntas de clarificación
   */
  async callOllama(prompt) {
    const startTime = Date.now();
    try {
      const operation = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(`${this.ollamaBaseURL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: this.ollamaModel,
              prompt: prompt,
              stream: false,
              temperature: 0.7,
              options: {
                num_predict: 300 // Limitar longitud de respuesta
              }
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
          }

          const data = await response.json();
          const result = data.response || '';
          
          metricsService.trackAICall('ollama', true, Date.now() - startTime);
          return result;
        } finally {
          clearTimeout(timeoutId);
        }
      };

      return await this.withRetry(operation, this.maxRetries);
    } catch (error) {
      console.error('❌ Error calling Ollama:', error.message);
      metricsService.trackAICall('ollama', false, Date.now() - startTime);
      return null;
    }
  }

  /**
   * Determina si un prompt necesita clarificación
   * Retorna preguntas relevantes según el tipo de sistema
   */
  async generateClarificationQuestions(prompt, systemType) {
    const startTime = Date.now();
    try {
      // Intentar obtener del caché primero
      const cached = cacheService.get(`questions-${systemType}`, prompt);
      if (cached) {
        metricsService.trackClarification('questions', cached.questions?.length || 0, Date.now() - startTime);
        return cached;
      }

      const systemPrompts = {
        attack: `Eres un experto en sistemas de ataque para Roblox. 
El usuario quiere: "${prompt}"
Genera 3-4 preguntas cortas y específicas para entender mejor qué tipo de ataque necesita.
Las preguntas deben ser claras y respuestas cortas.
Formato: Devuelve SOLO JSON: { "questions": ["pregunta 1", "pregunta 2", ...] }`,

        shop: `Eres un experto en sistemas de tienda para Roblox. 
El usuario quiere: "${prompt}"
Genera 3-4 preguntas cortas para entender la tienda: tipos de items, moneda, categorías.
Formato: Devuelve SOLO JSON: { "questions": ["pregunta 1", "pregunta 2", ...] }`,

        ui: `Eres un experto en interfaces para Roblox. 
El usuario quiere: "${prompt}"
Genera 3-4 preguntas sobre: layout, colores, funcionalidad, elementos específicos.
Formato: Devuelve SOLO JSON: { "questions": ["pregunta 1", "pregunta 2", ...] }`,

        inventory: `Eres un experto en sistemas de inventario para Roblox. 
El usuario quiere: "${prompt}"
Genera 3-4 preguntas sobre: capacidad, tipos de items, organización, límites.
Formato: Devuelve SOLO JSON: { "questions": ["pregunta 1", "pregunta 2", ...] }`,

        quest: `Eres un experto en sistemas de misiones para Roblox. 
El usuario quiere: "${prompt}"
Genera 3-4 preguntas sobre: tipo de misión, recompensas, objetivos, dificultad.
Formato: Devuelve SOLO JSON: { "questions": ["pregunta 1", "pregunta 2", ...] }`
      };

      const finalPrompt = systemPrompts[systemType] || systemPrompts.attack;
      let response = null;

      // Intentar Beta Model primero (si está configurado)
      if (this.betaModelBaseURL) {
        console.log('🧪 Generando preguntas con Beta Model...');
        response = await this.callBetaModel(finalPrompt);
      }

      // Intentar DeepSeek primero
      if (!response && this.deepseekApiKey) {
        console.log('🤖 Generando preguntas con DeepSeek...');
        response = await this.callDeepSeek(finalPrompt);
      }

      // Fallback a Ollama si DeepSeek falla
      if (!response && this.ollamaBaseURL) {
        console.log('🔄 DeepSeek no disponible, usando Ollama...');
        response = await this.callOllama(finalPrompt);
      }

      if (response) {
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.questions && Array.isArray(parsed.questions)) {
              // Guardar en caché
              cacheService.set(`questions-${systemType}`, prompt, parsed);
              metricsService.trackClarification('questions', parsed.questions.length, Date.now() - startTime);
              return parsed;
            }
          }
        } catch (parseError) {
          console.error('❌ Error parsing AI response:', parseError);
        }
      }

      // Fallback a preguntas predefinidas
      console.log('⚠️ Usando preguntas predefinidas como fallback');
      const defaultQuestions = this.getDefaultQuestions(systemType);
      
      // Guardar fallback en caché por menos tiempo
      cacheService.set(`questions-${systemType}`, prompt, defaultQuestions);
      metricsService.trackClarification('questions', defaultQuestions.questions?.length || 0, Date.now() - startTime);
      metricsService.trackAICall('templates', true, 0);
      
      return defaultQuestions;
    } catch (error) {
      console.error('❌ Error generando preguntas:', error);
      metricsService.trackClarification('questions', 0, Date.now() - startTime);
      return this.getDefaultQuestions(systemType);
    }
  }

  /**
   * Retorna preguntas por defecto basadas en el tipo de sistema
   */
  getDefaultQuestions(systemType) {
    const defaultQuestions = {
      attack: [
        '¿Cuál es el daño base del ataque?',
        '¿Qué tipo de ataque es (melee, ranged, magic)?',
        '¿Necesita animaciones especiales?'
      ],
      shop: [
        '¿Qué tipos de items venderás?',
        '¿Cuál es la moneda del juego?',
        '¿Necesitas categorías de items?'
      ],
      ui: [
        '¿Qué layout prefieres (grid, lista, custom)?',
        '¿Qué colores principales?',
        '¿Elementos interactivos especiales?'
      ],
      inventory: [
        '¿Cuántos slots de inventario?',
        '¿Qué tipos de items almacena?',
        '¿Sistema de drop y organización?'
      ],
      quest: [
        '¿Qué tipo de misiones?',
        '¿Cuál es la recompensa principal?',
        '¿Sistema de progreso?'
      ]
    };

    return {
      questions: defaultQuestions[systemType] || [
        '¿Qué características específicas quieres?',
        '¿Hay algún parámetro importante?',
        '¿Necesitas algo adicional?'
      ]
    };
  }

  /**
   * Construye un prompt mejorado basado en respuestas del usuario
   */
  buildEnhancedPrompt(originalPrompt, questions, answers) {
    let enhanced = `${originalPrompt}\n\nDetalles específicos:\n`;
    
    for (let i = 0; i < questions.length && i < answers.length; i++) {
      if (answers[i] && answers[i].trim()) {
        enhanced += `- ${questions[i]}: ${answers[i]}\n`;
      }
    }

    return enhanced;
  }

  /**
   * Valida si las respuestas son suficientes
   */
  areAnswersSufficient(answers) {
    const filledAnswers = answers.filter(a => a && a.trim().length > 0);
    return filledAnswers.length >= 2; // Mínimo 2 respuestas
  }
}

export default ClarificationManager;
