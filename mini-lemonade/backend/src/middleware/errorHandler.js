// Middleware de protección contra errores en rutas
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch((error) => {
        console.error('❌ Error en ruta:', {
          path: req.path,
          method: req.method,
          error: error.message,
          stack: error.stack
        });
        
        next({
          statusCode: error.statusCode || 500,
          message: error.message || 'Error interno del servidor'
        });
      });
  };
};

// Middleware de logging de requets
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Status: ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Middleware de validación de entrada
export const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.validate(req.body);
      if (validated.error) {
        return res.status(400).json({
          success: false,
          error: 'Validación fallida',
          details: validated.error.details
        });
      }
      req.validatedData = validated.value;
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Error en validación'
      });
    }
  };
};

// Timeout para prevenir requests colgadas
export const requestTimeout = (ms = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          message: 'La solicitud tardó demasiado tiempo'
        });
      }
    }, ms);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
};

// Rate limiting básico en memoria
const rateLimitStore = new Map();

export const rateLimit = (windowMs = 60000, maxRequests = 100) => {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }
    
    let requests = rateLimitStore.get(key);
    
    // Limpiar requests antiguos
    requests = requests.filter(time => now - time < windowMs);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Demasiadas solicitudes',
        message: 'Intenta de nuevo más tarde'
      });
    }
    
    requests.push(now);
    rateLimitStore.set(key, requests);
    
    next();
  };
};

export default {
  asyncHandler,
  requestLogger,
  validateInput,
  requestTimeout,
  rateLimit
};
