const { verifyJWT } = require('./auth');

// Middleware para verificar JWT desde cookies o header
const authMiddleware = (req, res, next) => {
  try {
    // Intentar obtener token de cookie
    let token = req.cookies?.jwt;

    // Si no está en cookies, intentar obtener del header Authorization
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const decoded = verifyJWT(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Adjuntar usuario a request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }
};

// Middleware para API Key (alternativa a JWT)
const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required'
      });
    }

    const { validateApiKey } = require('./apikeys');
    const userInfo = await validateApiKey(apiKey);

    if (!userInfo) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }

    // Adjuntar usuario a request
    req.user = {
      userId: userInfo.userId,
      robloxId: userInfo.robloxId,
      username: userInfo.username,
      displayName: userInfo.displayName
    };

    next();
  } catch (error) {
    console.error('❌ API key middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// Middleware flexible: JWT o API Key
const flexibleAuthMiddleware = async (req, res, next) => {
  // Intentar JWT primero
  const token = req.cookies?.jwt || (req.headers.authorization?.startsWith('Bearer ') 
    ? req.headers.authorization.substring(7) 
    : null);

  if (token) {
    const decoded = verifyJWT(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }

  // Si JWT falla, intentar API Key
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (apiKey) {
    const { validateApiKey } = require('./apikeys');
    try {
      const userInfo = await validateApiKey(apiKey);
      if (userInfo) {
        req.user = {
          userId: userInfo.userId,
          robloxId: userInfo.robloxId,
          username: userInfo.username,
          displayName: userInfo.displayName
        };
        return next();
      }
    } catch (error) {
      console.error('❌ API key validation failed:', error);
    }
  }

  return res.status(401).json({
    error: 'Unauthorized',
    message: 'No valid authentication provided'
  });
};

module.exports = {
  authMiddleware,
  apiKeyMiddleware,
  flexibleAuthMiddleware
};
