/**
 * ClarificationManager - Genera preguntas inteligentes para refinar solicitudes
 * Usa DeepSeek API (gratis) con fallback a Ollama local
 */

class ClarificationManager {
  constructor() {
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY || '';
    this.deepseekBaseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    this.ollamaBaseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
  }

  /**
   * Llama a DeepSeek para generar preguntas de clarificación
   */
  async callDeepSeek(prompt) {
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
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek error: ${response.status}`);
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling DeepSeek:', error.message);
      return null;
    }
  }

  /**
   * Llama a Ollama para generar preguntas de clarificación
   */
  async callOllama(prompt) {
    try {
      const response = await fetch(`${this.ollamaBaseURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: prompt,
          stream: false,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      console.error('Error calling Ollama:', error.message);
      return null;
    }
  }

  /**
   * Determina si un prompt necesita clarificación
   * Retorna preguntas relevantes según el tipo de sistema
   */
  async generateClarificationQuestions(prompt, systemType) {
    try {
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

      if (this.deepseekApiKey) {
        response = await this.callDeepSeek(finalPrompt);
      } else if (this.ollamaBaseURL) {
        response = await this.callOllama(finalPrompt);
      }

      if (response) {
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.questions && Array.isArray(parsed.questions)) {
              return parsed;
            }
          }
        } catch (parseError) {
          console.error('Error parsing Ollama response:', parseError);
        }
      }

      // Fallback a preguntas predefinidas
      return this.getDefaultQuestions(systemType);
    } catch (error) {
      console.error('Error generando preguntas:', error);
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
