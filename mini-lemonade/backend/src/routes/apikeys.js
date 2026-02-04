import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { dbRun, dbGet, dbAll } from '../services/database.js';

const router = express.Router();

// Generar API Key
const generateApiKey = () => `dk_${crypto.randomBytes(32).toString('hex')}`;

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.jwt || (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : null);

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// POST /api/keys - Generar nueva API Key
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const keyId = uuidv4();
    const keyValue = generateApiKey();

    await dbRun(
      `INSERT INTO api_keys (id, userId, key) VALUES (?, ?, ?)`,
      [keyId, userId, keyValue]
    );

    res.json({
      success: true,
      message: 'API key created successfully',
      data: {
        id: keyId,
        key: keyValue,
        createdAt: new Date().toISOString(),
        keyDisplay: `${keyValue.substring(0, 10)}...${keyValue.substring(keyValue.length - 10)}`
      }
    });
  } catch (error) {
    console.error('❌ Error creating API key:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/keys - Obtener todas las API Keys del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const keys = await dbAll(
      `SELECT id, key, active, createdAt, lastUsed FROM api_keys WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );

    const maskedKeys = keys.map(key => ({
      id: key.id,
      keyDisplay: `${key.key.substring(0, 10)}...${key.key.substring(key.key.length - 10)}`,
      active: key.active,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed
    }));

    res.json({ success: true, data: maskedKeys });
  } catch (error) {
    console.error('❌ Error fetching API keys:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/keys/:keyId - Revocar API Key
router.delete('/:keyId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { keyId } = req.params;

    const key = await dbGet(`SELECT userId FROM api_keys WHERE id = ?`, [keyId]);
    if (!key || key.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await dbRun(`UPDATE api_keys SET active = 0 WHERE id = ?`, [keyId]);
    res.json({ success: true, message: 'API key revoked successfully' });
  } catch (error) {
    console.error('❌ Error revoking API key:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
