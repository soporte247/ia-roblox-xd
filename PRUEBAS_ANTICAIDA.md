# 🧪 Pruebas del Sistema Anti-Caída

## Cómo Probar que Todo Funciona

### 1. **Verificar Health Check Básico**
```powershell
# Terminal PowerShell
curl http://localhost:3000/api/health

# Resultado esperado:
# {"status":"ok","message":"DataShark IA running"}
```

### 2. **Ver Dashboard Detallado**
```powershell
curl http://localhost:3000/api/health/detailed | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### 3. **Abrir Monitor Web**
```
http://localhost:3000/monitor.html
```
Deberías ver:
- Estado: "healthy"
- Tiempo de actividad
- 0 errores (si es nuevo)
- Auto-refresh cada 10 segundos

### 4. **Probar Rate Limiting**
```powershell
# Hacer 150 requests en corto tiempo
for ($i = 1; $i -le 150; $i++) {
    curl -s http://localhost:3000/api/health | Out-Null
    Write-Host "Request $i"
}

# Después del request 100 (en 1 minuto):
# Status 429: "Demasiadas solicitudes"
```

### 5. **Probar Timeout**
```powershell
# Una request que tarda más de 30 segundos debería ser cancelada
# El servidor responde con 408 (Request Timeout)
```

## Errores que el Sistema CAPTURA

### ✅ Estos Errores NO Crean la Aplicación

1. **Error en Ruta de API**
   ```javascript
   // Antes: 💥 Crash
   // Ahora: ✅ Capturado, responde con 500
   router.get('/broken', (req, res) => {
     throw new Error('Algo salió mal');
   });
   ```

2. **Promesa Rechazada**
   ```javascript
   // Antes: 💥 Crash
   // Ahora: ✅ Capturado y logueado
   Promise.reject('Error no manejado');
   ```

3. **Error de Base de Datos**
   ```javascript
   // Antes: 💥 Crash
   // Ahora: ✅ Reconexión automática
   db.run('SYNTAX ERROR');
   ```

4. **Request Colgada**
   ```javascript
   // Antes: 💥 Request infinita
   // Ahora: ✅ Timeout después de 30s (408)
   setTimeout(() => {
     // Nunca termina
   }, Infinity);
   ```

5. **Demasiadas Requests**
   ```javascript
   // Antes: 💥 Servidor lento
   // Ahora: ✅ Rate limit (100/min)
   for (let i = 0; i < 200; i++) {
     fetch('/api/something');
   }
   ```

## Monitoreo en Vivo

### Ver Logs de Errores
```bash
npm run pm2:logs  # Si usas PM2
```

### Ver en Monitor Web
1. Abre http://localhost:3000/monitor.html
2. Haz una request con error
3. El error aparecerá en "Errores Recientes"
4. Se actualiza automáticamente cada 10 segundos

### Logs en Consola
Busca líneas como:
```
❌ Error capturado:
❌ Promesa rechazada no manejada:
❌ Excepción no capturada:
⚠️ Advertencia:
```

## Verificar Estabilidad

### Check de Memoria
```powershell
# Ver uso de memoria
Get-Process -Name node | Select-Object Name, WorkingSet
```
Con PM2 tienes límite de 500MB.

### Check de Uptime
```powershell
# En el monitor: muestra tiempo de actividad
# Objetivo: >24 horas sin crashes
```

### Check de Errores
```powershell
# En el monitor: total de errores
# Ideal: 0 o muy pocos (solo errores de validación)
```

## Señales de que Todo Funciona Bien

✅ El servidor responde a todas las requests
✅ Errores van al dashboard en tiempo real  
✅ Rate limiting activo (429 después de 100/min)
✅ Timeouts funcionan (408 después de 30s)
✅ Monitor web se actualiza cada 10s
✅ No hay crashes en la consola
✅ Base de datos siempre conectada

## Señales de Problemas

❌ Crashes en la consola
❌ "Cannot read property" errors sin catch
❌ Base de datos desconectada
❌ Memory leak (memoria siempre subiendo)
❌ Requests infinitas

---

**Si algo no funciona, revisa los logs en:**
```
http://localhost:3000/monitor.html
```
