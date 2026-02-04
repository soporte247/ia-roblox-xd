# 🛡️ Sistema Anti-Caída DataShark IA

## Características de Protección

### 1. **Manejo Global de Errores**
- Middleware de error handler en Express
- Captura de promesas rechazadas no manejadas
- Captura de excepciones no capturadas
- Logging completo de errores con timestamps

### 2. **Protección de Rutas**
- Validación de entrada en todas las rutas
- Try-catch en operaciones críticas
- Rate limiting (100 requests por minuto)
- Timeout de 30 segundos en todas las requests

### 3. **Monitoreo de Base de Datos**
- Reconexión automática a SQLite si se pierde la conexión
- Timeout de 30 segundos para transacciones largas
- Manejo de errores de base de datos

### 4. **Health Monitor**
Sistema de monitoreo que registra:
- Errores recientes (últimos 50)
- Advertencias recientes (últimas 50)
- Tiempo de actividad del servidor
- Información del sistema

**Endpoints:**
- `GET /api/health` - Verificación rápida de salud
- `GET /api/health/detailed` - Dashboard con información completa

### 5. **Dashboard de Monitoreo**
Accede a: `http://localhost:3000/monitor.html`

Muestra:
- Estado general del servidor
- Tiempo de actividad
- Errores recientes
- Advertencias recientes
- Estadísticas de estabilidad
- Auto-refresh cada 10 segundos

### 6. **Process Manager (PM2)**
Para producción, usa PM2:

```bash
npm install -g pm2

# Iniciar con PM2
npm run pm2:start

# Ver logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart

# Detener
npm run pm2:stop
```

**Características de PM2:**
- Reinicio automático si falla la aplicación
- Límite de memoria (500MB)
- Logs separados de error y salida
- Configuración en `ecosystem.config.js`

### 7. **Logging Completo**
Todos los errores se loguean con:
- Timestamp
- Stack trace
- Path y método HTTP
- Mensaje de error

## Cómo Funciona

```
Request → Logger → Validación → Handler → Error Handler
                                    ↓
                          (Si hay error)
                                    ↓
                          Capturado por middleware
                                    ↓
                          Monitor registra error
                                    ↓
                          Responde al cliente
                                    ↓
                          Continúa ejecutándose
```

## Endpoints de Salud

### GET /api/health
**Respuesta:**
```json
{
  "status": "ok",
  "message": "DataShark IA running"
}
```

### GET /api/health/detailed
**Respuesta:**
```json
{
  "status": "healthy",
  "uptime": {
    "ms": 3600000,
    "seconds": 3600,
    "minutes": 60,
    "hours": 1,
    "formatted": "1h 0m 0s"
  },
  "errors": {
    "total": 0,
    "recent": []
  },
  "warnings": {
    "total": 0,
    "recent": []
  },
  "timestamp": "2024-02-04T12:00:00.000Z"
}
```

## Variables de Entorno

```env
NODE_ENV=production  # development o production
PORT=3000
DATABASE_URL=./database.sqlite
```

## Mantenimiento

### Monitorear en Tiempo Real
```bash
npm run pm2:logs
```

### Reiniciar Servidor
```bash
npm run pm2:restart
```

### Limpiar Logs
```bash
pm2 flush
```

## Seguridad

- ✅ No expone detalles de error en producción
- ✅ Rate limiting para prevenir abuse
- ✅ Validación de entrada en todas las rutas
- ✅ Timeouts para prevenir requests colgadas
- ✅ Protección contra promesas rechazadas

## Ejemplos de Uso

### Verificar salud desde la terminal
```powershell
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/detailed
```

### Monitorear errores
1. Abre `http://localhost:3000/monitor.html`
2. Observa los errores y advertencias en tiempo real
3. El panel se auto-actualiza cada 10 segundos

## Troubleshooting

### "Puerto 3000 ya en uso"
```powershell
Get-Process -Name node | Stop-Process -Force
```

### "Base de datos bloqueada"
El servidor intentará reconectar automáticamente después de 5 segundos

### "Demasiadas requests"
- Espera 1 minuto (rate limit: 100 por minuto)
- O reinicia el servidor

## Futuras Mejoras

- [ ] Alertas por email si hay muchos errores
- [ ] Exportar logs a archivo
- [ ] Dashboard web mejorado
- [ ] Métricas de rendimiento
- [ ] Backup automático de base de datos
