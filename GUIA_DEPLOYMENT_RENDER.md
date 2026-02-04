# 🚀 Guía de Deploy en Render

## Paso 1: Preparar el Proyecto

✅ **Archivos creados:**
- `Procfile` - Instruye a Render cómo ejecutar la app
- `.env.example` - Plantilla de variables de entorno
- `.gitignore` - Archivos a ignorar en Git

## Paso 2: Subir a GitHub

```bash
# Inicializar git (si no está hecho)
git init
git add .
git commit -m "Initial commit - DataShark IA"

# Crear repo en GitHub y push
git remote add origin https://github.com/tu-usuario/datashark-ia.git
git branch -M main
git push -u origin main
```

## Paso 3: Conectar con Render

1. **Accede a** https://render.com
2. **Crea una cuenta** (con GitHub)
3. **Nuevo Servicio Web:**
   - Click: "New +" → "Web Service"
   - Conecta tu repo de GitHub
   - Selecciona rama: `main`

4. **Configuración:**
   - **Name:** `datashark-ia`
   - **Root Directory:** `mini-lemonade/backend` (¡IMPORTANTE!)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`

5. **Variables de Entorno:**
   - Click "Environment" y añade:
   ```
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://your-render-url.onrender.com
   JWT_SECRET=tu_jwt_secret_super_seguro_aqui
   SESSION_SECRET=tu_session_secret_aqui
   DATABASE_URL=/var/data/database.sqlite
   ```

6. **Persistent Disk (para Base de Datos):**
   - Click "Disks" → "Add Disk"
   - Mount Path: `/var/data`
   - Size: 1GB (mínimo)
   - ✅ Esto asegura que los datos persistan entre deploys

7. **Deploy:**
   - Click "Create Web Service"
   - Render empezará a hacer build (5-10 minutos)

## Paso 4: Verificar Deployment

Después del deploy:

```bash
# Verificar salud
curl https://your-service.onrender.com/api/health

# Ver detailed
curl https://your-service.onrender.com/api/health/detailed

# Monitor
https://your-service.onrender.com/monitor.html
```

## Paso 5: Configuración Adicional

### CORS en Producción
```javascript
// Actualizar src/index.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

### Base de Datos Persistente
El archivo `database.sqlite` se guardará en `/var/data/database.sqlite` gracias al Persistent Disk.

### Logs
Accede a los logs en el dashboard de Render:
- Click en el servicio
- Tab "Logs"

## Estructra de Carpetas (Importante)

```
datashark-ia/
├── mini-lemonade/
│   ├── backend/           ← ROOT DIRECTORY EN RENDER
│   │   ├── src/
│   │   ├── package.json
│   │   ├── Procfile       ← ¡AQUI!
│   │   └── .env.example
│   ├── frontend/
│   └── plugin/
├── .gitignore
└── README.md
```

## Actualizar Después de Cambios

1. **Haz cambios locales**
2. **Commit y push a GitHub:**
   ```bash
   git add .
   git commit -m "tu mensaje"
   git push origin main
   ```
3. **Render redeploy automáticamente**

## Solucionar Problemas

### "Build Failed"
- Revisa logs: Dashboard → Logs
- Asegúrate de que `Procfile` está correcto
- Verifica que `package.json` tiene todas las dependencias

### "Application Error"
- `curl https://your-service.onrender.com/api/health`
- Revisa logs en el dashboard
- Verifica variables de entorno

### "Base de datos vacía"
- Asegúrate de que el Persistent Disk está configurado
- Mount Path debe ser `/var/data`
- DATABASE_URL debe ser `/var/data/database.sqlite`

### "CORS Error"
- Verifica CORS_ORIGIN en variables de entorno
- Debe ser: `https://your-service.onrender.com`
- NO incluyas slash final

## URLs Importantes

- **API Base:** `https://your-service.onrender.com`
- **Login:** `https://your-service.onrender.com/login.html`
- **Chat:** `https://your-service.onrender.com/chat.html`
- **Monitor:** `https://your-service.onrender.com/monitor.html`
- **Health:** `https://your-service.onrender.com/api/health`

## Dominio Personalizado (Opcional)

1. En Render Dashboard
2. Servicio → Settings → Custom Domain
3. Añade tu dominio (ej: datashark.com)
4. Actualiza DNS records según instrucciones

## Costos

- **Free Tier:** 
  - 0.50 GB RAM
  - Auto-spins down después de 15 min inactivo
  - ❌ No es ideal para producción

- **Paid Tier:**
  - Desde $7/mes
  - RAM dedicada
  - Siempre activo
  - ✅ Recomendado para producción

## Variables de Entorno Seguras

**NUNCA** hagas commit de `.env`, usa `.env.example` como plantilla.

En Render, las variables se almacenan encriptadas en el dashboard.

## Autoescalado

Render no hace autoescalado automático. Si necesitas más poder:
- Aumenta la instancia en Settings
- O usa un plan superior

## Monitoreo

Usa el dashboard de Render para:
- Ver logs en tiempo real
- CPU y memory usage
- Restart de servicios
- Métricas de request

## Backup de Base de Datos

**Importante:** Render no hace backup automático.

**Opción 1:** Usar DB externa (PostgreSQL)
- Render ofrece bases de datos PostgreSQL
- Más seguro que SQLite

**Opción 2:** Backup manual
- Descargar base de datos periodicamente
- Guardar en lugar seguro

## Próximo Paso

1. ✅ Crea repo en GitHub
2. ✅ Conecta con Render
3. ✅ Configura variables de entorno
4. ✅ Habilita Persistent Disk
5. ✅ Deploya
6. ✅ Prueba endpoints

¡Tu DataShark IA estará en producción! 🚀
