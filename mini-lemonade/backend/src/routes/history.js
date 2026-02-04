import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Get history for a user
router.get('/', (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const historyFile = path.resolve(`generated/${userId}/history.json`);

    if (!fs.existsSync(historyFile)) {
      return res.json({ history: [] });
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    res.json({ history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save to history
export function saveToHistory(userId, type, prompt, files) {
  try {
    const userDir = path.resolve(`generated/${userId}`);
    fs.mkdirSync(userDir, { recursive: true });

    const historyFile = path.join(userDir, 'history.json');
    let history = [];

    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }

    history.unshift({
      id: Date.now(),
      type,
      prompt,
      fileCount: Object.keys(files).length,
      timestamp: new Date().toISOString(),
      files: files,
    });

    // Keep only last 50 entries
    history = history.slice(0, 50);

    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

export default router;
