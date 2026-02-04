const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { dbRun, dbGet, dbAll } = require('./database');

// Generar API Key segura
const generateApiKey = () => {
  return `dk_${crypto.randomBytes(32).toString('hex')}`;
};

// Crear nueva API Key para usuario
const createApiKey = async (userId) => {
  try {
    const keyId = uuidv4();
    const keyValue = generateApiKey();

    await dbRun(
      `INSERT INTO api_keys (id, userId, key) VALUES (?, ?, ?)`,
      [keyId, userId, keyValue]
    );

    return {
      id: keyId,
      key: keyValue,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error creating API key:', error);
    throw new Error('Failed to create API key');
  }
};

// Validar API Key y obtener usuario
const validateApiKey = async (apiKey) => {
  try {
    const result = await dbGet(
      `SELECT ak.id as keyId, ak.userId, u.robloxId, u.username, u.displayName 
       FROM api_keys ak
       JOIN users u ON ak.userId = u.id
       WHERE ak.key = ? AND ak.active = 1`,
      [apiKey]
    );

    if (!result) {
      return null;
    }

    // Actualizar lastUsed
    await dbRun(
      `UPDATE api_keys SET lastUsed = CURRENT_TIMESTAMP WHERE id = ?`,
      [result.keyId]
    );

    return result;
  } catch (error) {
    console.error('❌ Error validating API key:', error);
    return null;
  }
};

// Obtener todas las API Keys del usuario
const getUserApiKeys = async (userId) => {
  try {
    return await dbAll(
      `SELECT id, key, active, createdAt, lastUsed 
       FROM api_keys WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );
  } catch (error) {
    console.error('❌ Error fetching user API keys:', error);
    return [];
  }
};

// Revocar API Key
const revokeApiKey = async (keyId, userId) => {
  try {
    // Verificar que la clave pertenece al usuario
    const key = await dbGet(
      `SELECT userId FROM api_keys WHERE id = ?`,
      [keyId]
    );

    if (!key || key.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await dbRun(
      `UPDATE api_keys SET active = 0 WHERE id = ?`,
      [keyId]
    );

    return true;
  } catch (error) {
    console.error('❌ Error revoking API key:', error);
    throw error;
  }
};

module.exports = {
  generateApiKey,
  createApiKey,
  validateApiKey,
  getUserApiKeys,
  revokeApiKey
};
