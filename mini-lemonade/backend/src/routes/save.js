import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Save edited code
router.post('/', (req, res) => {
  try {
    const { userId, files } = req.body;

    if (!userId || !files) {
      return res.status(400).json({ error: 'UserId and files are required' });
    }

    const baseDir = path.resolve(`generated/${userId}/AttackSystem`);
    fs.mkdirSync(baseDir, { recursive: true });

    for (const [filename, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(baseDir, filename), content);
    }

    res.json({ success: true, message: 'Code saved successfully' });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
