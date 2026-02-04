import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Validation middleware
function validateFetchRequest(req, res, next) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ 
      error: 'UserId query parameter is required',
      success: false
    });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return res.status(400).json({ 
      error: 'UserId must be a valid UUID',
      success: false
    });
  }

  next();
}

router.get('/', validateFetchRequest, (req, res) => {
  try {
    const { userId } = req.query;
    console.log(`[Fetch] Request from user ${userId.substring(0, 8)}...`);

    const userDir = path.resolve(`generated/${userId}`);
    
    if (!fs.existsSync(userDir)) {
      console.log(`[Fetch] No directory found for user ${userId.substring(0, 8)}...`);
      return res.json({ 
        files: {}, 
        message: 'No generated files yet. Generate a system first.',
        success: true
      });
    }

    // Find the most recent system directory
    const dirs = fs.readdirSync(userDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name.endsWith('System'))
      .map(dirent => ({
        name: dirent.name,
        path: path.join(userDir, dirent.name),
        mtime: fs.statSync(path.join(userDir, dirent.name)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (dirs.length === 0) {
      console.log(`[Fetch] No system directories found for user ${userId.substring(0, 8)}...`);
      return res.json({ 
        files: {}, 
        message: 'No system directories found. Generate a system first.',
        success: true
      });
    }

    const latestSystem = dirs[0];
    const generatedDir = latestSystem.path;
    console.log(`[Fetch] Using directory: ${latestSystem.name}`);
    
    const files = {};
    const filenames = fs.readdirSync(generatedDir);
    let fileCount = 0;

    for (const filename of filenames) {
      if (filename.endsWith('.lua')) {
        try {
          const filePath = path.join(generatedDir, filename);
          const content = fs.readFileSync(filePath, 'utf8');
          files[filename] = content;
          fileCount++;
        } catch (error) {
          console.error(`[Fetch ERROR] Failed to read ${filename}:`, error.message);
        }
      }
    }

    if (fileCount === 0) {
      console.log(`[Fetch] No .lua files found in ${latestSystem.name}`);
      return res.json({ 
        files: {}, 
        message: 'No Lua files found in the latest system directory.',
        success: true
      });
    }

    console.log(`[Fetch] Sending ${fileCount} files from ${latestSystem.name}`);

    res.json({ 
      files, 
      message: `Files ready from ${latestSystem.name}`,
      systemName: latestSystem.name,
      fileCount: fileCount,
      success: true
    });
  } catch (error) {
    console.error('[Fetch ERROR]:', error.message);
    res.status(500).json({ 
      error: 'Error fetching files',
      message: error.message,
      success: false
    });
  }
});

export default router;
