import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import generateRoute from './routes/generate.js';
import fetchRoute from './routes/fetch.js';
import historyRoute from './routes/history.js';
import exportRoute from './routes/export.js';
import templatesRoute from './routes/templates.js';
import saveRoute from './routes/save.js';
import authRouter from './routes/auth.js';
import secureAuthRouter from './routes/secure-auth.js';
import apiKeysRouter from './routes/apikeys.js';
import pluginRouter from './routes/plugin.js';
import { initDB } from './services/database.js';
import { requestLogger, requestTimeout, rateLimit } from './middleware/errorHandler.js';
import { monitor } from './services/healthMonitor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar base de datos
await initDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger); // Logging de requests
app.use(requestTimeout(30000)); // Timeout de 30 segundos
app.use(rateLimit(60000, 100)); // 100 requests por minuto
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Rutas de autenticación (sin protección)
app.use('/auth', authRouter);
app.use('/auth', secureAuthRouter);

// Rutas de API Keys (con protección JWT)
app.use('/api/keys', apiKeysRouter);

// Rutas del Plugin
app.use('/api/plugin', pluginRouter);

// Rutas existentes (pueden usar autenticación flexible)
app.use('/generate', generateRoute);
app.use('/fetch', fetchRoute);
app.use('/history', historyRoute);
app.use('/export', exportRoute);
app.use('/templates', templatesRoute);
app.use('/save', saveRoute);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DataShark IA running' });
});

// Health check detallado
app.get('/api/health/detailed', (req, res) => {
  res.json(monitor.getStatus());
});

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error capturado:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'production' ? 'Algo salió mal. Por favor intenta de nuevo.' : err.message
  });
});

// Rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Manejo de promesas rechazadas no atrapadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', {
    reason,
    promise,
    timestamp: new Date().toISOString()
  });
  monitor.addWarning(`Promesa rechazada: ${reason}`);
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  monitor.addError(error);
  // NO terminar el proceso, solo loguear
  console.warn('⚠️ Aplicación continúa ejecutándose a pesar del error');
});

app.listen(PORT, () => {
  console.log(`🦈 DataShark IA running on http://localhost:${PORT}`);
  console.log(`📱 Authentication: Roblox OAuth 2.0 enabled`);
});
