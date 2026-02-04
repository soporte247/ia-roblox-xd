/**
 * ClarificationManager - Genera preguntas inteligentes para refinar solicitudes
 * Ayuda a la IA a crear código más pulido pidiendo detalles específicos
 */

import Anthropic from '@anthropic-ai/sdk';

class ClarificationManager {
  constructor() {
    // Initialize Anthropic client if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    } else {
      this.client = null;
    }
  }

  /**
   * Determina si un prompt necesita clarificación
   * Retorna preguntas relevantes según el tipo de sistema
   */
  async generateClarificationQuestions(prompt, systemType) {
    try {
      // If no client is available, return default questions
      if (!this.client) {
        return this.getDefaultQuestions(systemType);
      }

      const systemPrompts = {
        attack: `Eres un experto en sistemas de ataque para Roblox. 
El usuario quiere: "${prompt}"
Genera 3-4 preguntas cortas y específicas para entender mejor qué tipo de ataque necesita.
Las preguntas deben ser claras y respuestas cortas.
Formato: Devuelve JSON: { "questions": ["pregunta 1", "pregunta 2", ...] }`,

        shop: `Eres un experto en sistemas de tienda para Roblox. 
El usuario quiere: "${prompt}"
Genera 3-4 preguntas cortas para entender la tienda: tipos de items, moneda, categorías.
Formato: Devuelve JSON: { "questions": ["pregunta 1", "pregunta 2", ...] }`,

        ui: `Eres un experto en interfaces para Roblox. 
El usuario quiere: "${prompt}"
Genera 3-4 preguntas sobre: layout, colores, funcionalidad, elementos específicos.
Formato: Devuelve JSON: { "questions": ["pregunta 1", "pregunta 2", ...] }`,

        inventory: `Eres un experto en sistemas de inventario para Roblox. 
El usuario quiere: "${prompt}"
Genera 3-4 preguntas sobre: capacidad, tipos de items, organización, límites.
Formato: Devuelve JSON: { "questions": ["pregunta 1", "pregunta 2", ...] }`,

        quest: `Eres un experto en sistemas de misiones para Roblox. 
El usuario quiere: "${prompt}"
Genera 3-4 preguntas sobre: tipo de misión, recompensas, objetivos, dificultad.
Formato: Devuelve JSON: { "questions": ["pregunta 1", "pregunta 2", ...] }`
      };

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: systemPrompts[systemType] || systemPrompts.attack
          }
        ]
      });

      const content = message.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

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
