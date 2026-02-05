// Real-time log streaming using Server-Sent Events
const express = require('express');
const router = express.Router();

// In-memory log storage (últimos 100 logs)
const logBuffer = [];
const MAX_LOGS = 100;

// SSE clients conectados
const clients = new Set();

// Función para agregar log al buffer y notificar clientes
function addLog(message, type = 'info', source = 'system') {
    const logEntry = {
        timestamp: new Date().toISOString(),
        message,
        type, // info, warn, error, success
        source, // system, plugin, ai, user
        id: Date.now()
    };

    // Agregar al buffer
    logBuffer.push(logEntry);
    if (logBuffer.length > MAX_LOGS) {
        logBuffer.shift(); // Remover el más antiguo
    }

    // Notificar a todos los clientes conectados
    broadcastLog(logEntry);

    return logEntry;
}

// Broadcast log a todos los clientes SSE
function broadcastLog(logEntry) {
    const data = JSON.stringify(logEntry);
    clients.forEach(client => {
        try {
            client.write(`data: ${data}\n\n`);
        } catch (error) {
            console.error('Error sending to client:', error);
            clients.delete(client);
        }
    });
}

// GET /api/realtime-logs/stream - SSE endpoint para logs en tiempo real
router.get('/stream', (req, res) => {
    // Configurar SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Agregar cliente a la lista
    clients.add(res);

    // Enviar logs existentes al conectarse
    const initialData = JSON.stringify({
        type: 'initial',
        logs: logBuffer.slice(-20) // Últimos 20 logs
    });
    res.write(`data: ${initialData}\n\n`);

    console.log(`[REALTIME] Cliente conectado. Total: ${clients.size}`);

    // Cleanup cuando el cliente se desconecta
    req.on('close', () => {
        clients.delete(res);
        console.log(`[REALTIME] Cliente desconectado. Total: ${clients.size}`);
    });
});

// POST /api/realtime-logs/add - Agregar un log desde el plugin o frontend
router.post('/add', (req, res) => {
    const { message, type, source } = req.body;

    if (!message) {
        return res.status(400).json({
            success: false,
            message: 'Message is required'
        });
    }

    const logEntry = addLog(
        message,
        type || 'info',
        source || 'api'
    );

    res.json({
        success: true,
        log: logEntry
    });
});

// GET /api/realtime-logs/recent - Obtener logs recientes
router.get('/recent', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const recentLogs = logBuffer.slice(-limit);

    res.json({
        success: true,
        logs: recentLogs,
        total: recentLogs.length
    });
});

// GET /api/realtime-logs/stats - Estadísticas del sistema de logs
router.get('/stats', (req, res) => {
    const stats = {
        totalLogs: logBuffer.length,
        connectedClients: clients.size,
        logsByType: {
            info: logBuffer.filter(l => l.type === 'info').length,
            warn: logBuffer.filter(l => l.type === 'warn').length,
            error: logBuffer.filter(l => l.type === 'error').length,
            success: logBuffer.filter(l => l.type === 'success').length
        },
        logsBySource: {
            system: logBuffer.filter(l => l.source === 'system').length,
            plugin: logBuffer.filter(l => l.source === 'plugin').length,
            ai: logBuffer.filter(l => l.source === 'ai').length,
            user: logBuffer.filter(l => l.source === 'user').length
        }
    };

    res.json({
        success: true,
        stats
    });
});

// DELETE /api/realtime-logs/clear - Limpiar todos los logs (admin)
router.delete('/clear', (req, res) => {
    const clearedCount = logBuffer.length;
    logBuffer.length = 0; // Vaciar array

    // Notificar a clientes que se limpiaron los logs
    broadcastLog({
        timestamp: new Date().toISOString(),
        message: 'Logs cleared',
        type: 'system',
        source: 'admin',
        id: Date.now(),
        special: 'clear'
    });

    res.json({
        success: true,
        message: `Cleared ${clearedCount} logs`
    });
});

// Logs iniciales del sistema
addLog('DataShark Real-time Log System Started', 'success', 'system');
addLog('Backend server is running', 'info', 'system');

// Exportar addLog para usar en otros módulos
module.exports = router;
module.exports.addLog = addLog;
module.exports.logBuffer = logBuffer;
