/**
 * Validador y sanitizador de respuestas de IA
 * Asegura que las respuestas sean válidas, seguras y funcionales
 */

export class ResponseValidator {
  /**
   * Sanitiza y valida prompts de entrada del usuario
   */
  static sanitizePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('El prompt debe ser texto válido');
    }

    // Limpiar espacios
    let cleaned = prompt.trim();

    // Validar longitud
    if (cleaned.length < 3) {
      throw new Error('El prompt es demasiado corto (mínimo 3 caracteres)');
    }

    if (cleaned.length > 2000) {
      throw new Error('El prompt es demasiado largo (máximo 2000 caracteres)');
    }

    // Detectar y bloquear patrones peligrosos
    const dangerousPatterns = [
      /require\s*\(\s*["']os["']\s*\)/gi,
      /require\s*\(\s*["']io["']\s*\)/gi,
      /loadstring/gi,
      /dofile/gi,
      /getfenv/gi,
      /setfenv/gi,
      /<script>/gi,
      /javascript:/gi,
      /on(load|error|click)/gi,
      /eval\(/gi,
      /exec\(/gi,
      /system\(/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(cleaned)) {
        throw new Error('El prompt contiene código potencialmente peligroso');
      }
    }

    // Remover caracteres especiales peligrosos pero mantener puntuación normal
    cleaned = cleaned.replace(/[<>{}\\]/g, '');

    // Limitar caracteres repetidos excesivos
    cleaned = cleaned.replace(/(.)\1{10,}/g, '$1$1$1');

    return cleaned;
  }

  /**
   * Valida sessionId/userId
   */
  static validateSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      return false;
    }

    // Debe ser UUID v4 o similar
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    return uuidPattern.test(sessionId);
  }
  /**
   * Valida que el JSON de respuesta sea válido y contenga estructura esperada
   */
  static validateJsonResponse(content, type) {
    if (!content || typeof content !== 'string') {
      throw new Error('Response must be a non-empty string');
    }

    let json;
    try {
      // Limpiar markdown y código blocks
      let cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Intentar extraer JSON si hay texto adicional
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      json = JSON.parse(cleaned);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }

    // Validar estructura esperada
    if (!json.files || typeof json.files !== 'object') {
      throw new Error('Response must contain "files" object');
    }

    if (Object.keys(json.files).length === 0) {
      throw new Error('Response must contain at least one file');
    }

    // Validar contenido de archivos
    for (const [fileName, content] of Object.entries(json.files)) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        throw new Error(`File "${fileName}" has invalid or empty content`);
      }

      // Validar nombre de archivo
      if (!/^[a-zA-Z0-9_\-\.]+\.lua$/.test(fileName)) {
        throw new Error(`Invalid filename: "${fileName}". Must be *.lua format`);
      }

      // Validar que sea código Lua válido
      this.validateLuaCode(content, fileName);
    }

    return json.files;
  }

  /**
   * Valida sintaxis básica de Lua
   */
  static validateLuaCode(code, fileName = 'code') {
    const errors = [];

    // Verificar balance de paréntesis, corchetes y llaves
    const pairs = { '(': ')', '[': ']', '{': '}' };
    const stack = [];

    for (let i = 0; i < code.length; i++) {
      const char = code[i];

      // Saltar comentarios
      if (char === '-' && code[i + 1] === '-') {
        i = code.indexOf('\n', i) || code.length - 1;
        continue;
      }

      // Saltar strings
      if (char === '"' || char === "'") {
        const quote = char;
        i++;
        while (i < code.length && code[i] !== quote) {
          if (code[i] === '\\') i++;
          i++;
        }
        continue;
      }

      if (pairs[char]) {
        stack.push(char);
      } else if (Object.values(pairs).includes(char)) {
        if (!stack.length || pairs[stack.pop()] !== char) {
          errors.push(`Unmatched closing "${char}" at position ${i}`);
        }
      }
    }

    if (stack.length > 0) {
      errors.push(`Unclosed bracket(s): ${stack.join(', ')}`);
    }

    // Validar palabras clave básicas
    const luaKeywords = ['function', 'end', 'if', 'then', 'else', 'elseif', 'while', 'do', 'for'];
    const functionCount = (code.match(/\bfunction\b/g) || []).length;
    const endCount = (code.match(/\bend\b/g) || []).length;

    if (functionCount !== endCount) {
      errors.push(`Mismatched function/end: ${functionCount} functions but ${endCount} ends`);
    }

    // Validar que no sea vacío o muy pequeño
    if (code.trim().length < 20) {
      errors.push('Code is too short to be functional');
    }

    // Validar línea de máximo 500 caracteres
    const longLines = code.split('\n').filter(line => line.length > 500);
    if (longLines.length > 0) {
      errors.push(`Found ${longLines.length} lines exceeding 500 characters`);
    }

    if (errors.length > 0) {
      throw new Error(
        `Lua syntax errors in ${fileName}:\n` + errors.join('\n')
      );
    }

    return true;
  }

  /**
   * Sanitiza prompt del usuario
   */
  static sanitizePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string');
    }

    let sanitized = prompt
      .trim()
      // Limitar caracteres especiales peligrosos
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '')
      // Remover múltiples espacios en blanco
      .replace(/\s+/g, ' ')
      // Remover caracteres de control SQL injection intents
      .replace(/([;'"])\1{2,}/g, '$1');

    // Validar longitud
    if (sanitized.length < 3) {
      throw new Error('Prompt must be at least 3 characters long');
    }

    if (sanitized.length > 1000) {
      throw new Error('Prompt cannot exceed 1000 characters');
    }

    // Validar que no sea solo números o caracteres especiales
    if (!/[a-zA-Z0-9]/i.test(sanitized)) {
      throw new Error('Prompt must contain at least some alphanumeric characters');
    }

    return sanitized;
  }

  /**
   * Valida que la respuesta no sea un template por defecto
   */
  static isUniqueResponse(files, defaultFiles) {
    if (!files || !defaultFiles) return true;

    const fileKeys = Object.keys(files).sort();
    const defaultKeys = Object.keys(defaultFiles).sort();

    // Si los nombres de archivo son idénticos, probablemente es template
    if (JSON.stringify(fileKeys) === JSON.stringify(defaultKeys)) {
      // Comparar contenido de los primeros bytes
      let allIdentical = true;
      for (const key of fileKeys) {
        if (files[key] !== defaultFiles[key]) {
          allIdentical = false;
          break;
        }
      }
      return !allIdentical;
    }

    return true;
  }

  /**
   * Obtiene errores detallados para mostrar al usuario
   */
  static getDetailedErrorMessage(error, context = {}) {
    const errorMessages = {
      'Invalid JSON format': 'La IA generó una respuesta con formato inválido. Intenta de nuevo con una descripción más clara.',
      'Response must contain': 'La respuesta no contiene la estructura esperada. Asegúrate de describir un sistema completo.',
      'Lua syntax errors': 'El código generado tiene errores de sintaxis. Por favor, intenta con una descripción diferente.',
      'Unmatched closing': 'Error de paréntesis no balanceados en el código generado.',
      'Invalid filename': 'La IA intentó generar un archivo con nombre inválido.',
      'Prompt must be': 'Tu descripción no es válida. Asegúrate de escribir una descripción clara y coherente.',
      'Code is too short': 'El código generado es muy pequeño para ser funcional.',
      'Empty response': 'La IA no generó una respuesta. Intenta de nuevo.',
    };

    const message = error.message || 'Error desconocido';
    let userMessage = 'Hubo un error en la generación. Por favor intenta de nuevo.';

    for (const [key, value] of Object.entries(errorMessages)) {
      if (message.includes(key)) {
        userMessage = value;
        break;
      }
    }

    return {
      userMessage,
      technicalMessage: message,
      canRetry: true,
      suggestedFix: this.getSuggestedFix(message),
    };
  }

  /**
   * Sugiere cómo arreglar el error
   */
  static getSuggestedFix(errorMessage) {
    if (errorMessage.includes('JSON')) {
      return 'Intenta con una descripción más detallada y específica del sistema que quieres crear.';
    }
    if (errorMessage.includes('Lua')) {
      return 'Describe más claramente lo que quieres que haga el sistema.';
    }
    if (errorMessage.includes('Prompt')) {
      return 'Asegúrate de escribir una descripción clara con al menos 3 palabras.';
    }
    return 'Intenta con una descripción diferente o más detallada.';
  }
}

export default ResponseValidator;
