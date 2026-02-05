import express from 'express';
import cors from 'cors';
import compression from 'compression';
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
import logsRouter from './routes/logs.js';
import clarifyRouter from './routes/clarify.js';
import syncHistoryRouter from './routes/sync-history.js';
import mapsRouter from './routes/maps.js';
import pluginInjectionRouter from './routes/plugin-injection.js';
import realtimeLogsRouter from './routes/realtime-logs.js';
import { initDB } from './services/database.js';
import { requestLogger, requestTimeout, rateLimit } from './middleware/errorHandler.js';
import { monitor } from './services/healthMonitor.js';
import cacheService from './services/cacheService.js';
import metricsService from './services/metricsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar base de datos
await initDB();

// Middleware
app.use(compression()); // Comprimir todas las respuestas
app.use(express.json({ limit: '10mb' })); // Limitar tamaño de JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(requestLogger); // Logging de requests

// Middleware de métricas
app.use((req, res, next) => {
  const startTime = Date.now();
  metricsService.trackRequest(req.path, req.method);

  // Capturar cuando la respuesta termina
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    metricsService.trackResponseTime(responseTime);
    
    if (res.statusCode >= 200 && res.statusCode < 400) {
      metricsService.trackSuccess();
    }
  });

  next();
});

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

// Rutas de Inyección de Código en Plugin
app.use('/api/plugin/inject', pluginInjectionRouter);

// Rutas de Logs (debugging y monitoreo)
app.use('/api/logs', logsRouter);

// Rutas de Logs en Tiempo Real (Server-Sent Events)
app.use('/api/realtime-logs', realtimeLogsRouter);

// Rutas de Clarificación (preguntas y respuestas)
app.use('/api/clarify', clarifyRouter);

// Rutas de Sincronización de Historial
app.use('/api/sync-history', syncHistoryRouter);

// Rutas de Mapas
app.use('/api/maps', mapsRouter);

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

// Estadísticas de caché
app.get('/api/health/cache', (req, res) => {
  res.json({
    success: true,
    cache: cacheService.getStats(),
    timestamp: new Date().toISOString()
  });
});

// Limpiar caché (solo para admin/desarrollo)
app.post('/api/health/cache/clear', (req, res) => {
  const { type } = req.body;
  
  if (type) {
    cacheService.invalidateType(type);
    res.json({ success: true, message: `Caché del tipo ${type} limpiado` });
  } else {
    cacheService.clear();
    res.json({ success: true, message: 'Caché completamente limpiado' });
  }
});

// Métricas del sistema
app.get('/api/health/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: metricsService.getMetrics(),
    timestamp: new Date().toISOString()
  });
});

// Resetear métricas (solo para admin/desarrollo)
app.post('/api/health/metrics/reset', (req, res) => {
  metricsService.reset();
  res.json({ success: true, message: 'Métricas reseteadas' });
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
  
  // Registrar error en métricas
  metricsService.trackError(err, req.path, {
    method: req.method,
    statusCode: err.statusCode || 500
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
