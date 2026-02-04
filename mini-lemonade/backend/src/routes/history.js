import express from 'express';
import { dbAll, dbRun } from '../services/database.js';

const router = express.Router();

// Get history for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const rows = await dbAll(
      `SELECT id, userId, systemType, generatedCode, metadata, createdAt
       FROM generated_systems
       WHERE userId = ?
       ORDER BY createdAt DESC
       LIMIT 50`,
      [userId]
    );

    const history = rows.map((row) => {
      let metadata = {};
      try {
        metadata = row.metadata ? JSON.parse(row.metadata) : {};
      } catch {
        metadata = {};
      }

      return {
        id: row.id,
        type: row.systemType,
        prompt: metadata.prompt || '',
        fileCount: metadata.fileCount || 0,
        timestamp: row.createdAt,
        files: metadata.files || {},
        generatedCode: row.generatedCode || null,
      };
    });

    res.json({ history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save to history
export async function saveToHistory(userId, type, prompt, files) {
  try {
    const metadata = {
      prompt,
      fileCount: Object.keys(files || {}).length,
      files: files || {},
    };

    const generatedCode = JSON.stringify(files || {});

    await dbRun(
      `INSERT INTO generated_systems (userId, systemType, generatedCode, metadata)
       VALUES (?, ?, ?, ?)`,
      [userId, type, generatedCode, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

export default router;
