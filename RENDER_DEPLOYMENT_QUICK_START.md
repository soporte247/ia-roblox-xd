# 🚀 DataShark IA - Guía Rápida Render Deployment

## Checklist Pre-Deployment

- ✅ `Procfile` creado
- ✅ `.env.example` configurado
- ✅ `.gitignore` listo
- ✅ `package.json` con todas las dependencias
- ✅ Sistema anti-caída implementado
- ✅ Monitor web activo

## 5 Pasos para Deploy

### 1️⃣ Crear Repositorio GitHub

```powershell
# En la carpeta raíz del proyecto
git init
git add .
git commit -m "DataShark IA - Ready for deployment"
git remote add origin https://github.com/tu-usuario/datashark-ia.git
git push -u origin main
```

### 2️⃣ Conectar con Render

1. Accede a https://render.com
2. Sign in con GitHub
3. Click: **New +** → **Web Service**
4. Selecciona tu repositorio `datashark-ia`
5. Autoriza acceso

### 3️⃣ Configurar Render

**Configuración básica:**
- **Name:** `datashark-ia`
- **Root Directory:** `mini-lemonade/backend` ⚠️ IMPORTANTE
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `node src/index.js`

**Variables de Entorno:**
```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://datashark-ia.onrender.com
JWT_SECRET=generar-una-clave-aleatoria-segura-aqui
SESSION_SECRET=generar-otra-clave-aleatoria-segura-aqui
DATABASE_URL=/var/data/database.sqlite
```

### 4️⃣ Configurar Base de Datos Persistente

1. En la configuración del servicio
2. Click: **Disks**
3. **Add Disk:**
   - Mount Path: `/var/data`
   - Size: 1GB

⚠️ **CRÍTICO:** Sin esto, la base de datos se borrará cada que redeploy.

### 5️⃣ Deploy

1. Verifica las variables de entorno
2. Click: **Create Web Service**
3. Espera 5-10 minutos
4. Render te dará una URL como: `https://datashark-ia.onrender.com`

## Verificar que Funciona

```bash
# Health check
curl https://datashark-ia.onrender.com/api/health

# Health detallado
curl https://datashark-ia.onrender.com/api/health/detailed

# Abrir en navegador
https://datashark-ia.onrender.com
```

## URLs Importantes

| Página | URL |
|--------|-----|
| Landing | `https://datashark-ia.onrender.com` |
| Login | `https://datashark-ia.onrender.com/login.html` |
| Chat | `https://datashark-ia.onrender.com/chat.html` |
| Monitor | `https://datashark-ia.onrender.com/monitor.html` |
| Health API | `https://datashark-ia.onrender.com/api/health` |

## Actualizar Después de Cambios

```bash
# Haz cambios locales
# Luego:
git add .
git commit -m "tu mensaje"
git push origin main
```

Render redeploy automáticamente en 1-2 minutos.

## Logs y Debugging

En el dashboard de Render:
1. Click en tu servicio
2. Tab **Logs**
3. Verás output en tiempo real

## Problemas Comunes

### "Build Failed"
- Revisa logs en el dashboard
- Verifica que `Procfile` esté en `mini-lemonade/backend/`
- Comprueba `package.json`

### "Application Error"
- Check `/api/health` endpoint
- Revisa logs en Render dashboard
- Verifica variables de entorno

### "Base de datos vacía"
- Asegúrate que Persistent Disk está activo
- Mount Path: `/var/data`
- DATABASE_URL: `/var/data/database.sqlite`

### "CORS Error"
- Actualiza CORS_ORIGIN en variables de entorno
- Debe ser: `https://datashark-ia.onrender.com`
- SIN trailing slash

## Generar Claves Seguras

```bash
# En PowerShell o Terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Usa el output para `JWT_SECRET` y `SESSION_SECRET`.

## Dominio Personalizado (Opcional)

Cuando quieras usar tu propio dominio:
1. En Render Dashboard → Custom Domain
2. Añade tu dominio (ej: datashark.com)
3. Sigue instrucciones de DNS

## Costos

- **Free Tier:** 
  - 0.50 GB RAM
  - Auto-pause después de 15 min
  - ❌ No ideal para producción

- **Starter Plan ($7/mes):**
  - 0.5 GB RAM
  - Siempre activo
  - ✅ Bueno para empezar

- **Standard Plan ($15+/mes):**
  - 2 GB RAM
  - Autoescala
  - ✅ Recomendado producción

## Monitoreo Continuo

Dashboard de Render muestra:
- Logs en tiempo real
- CPU y memory usage
- Deploy history
- Restart button

Además puedes acceder a tu app:
- Monitor web: `/monitor.html`
- Health API: `/api/health/detailed`

## Backup de Base de Datos

**Importante:** Render NO hace backup automático.

**Opción 1 - Bajar base de datos:**
```bash
# Via Render CLI (futuro)
# render env:pull
```

**Opción 2 - Usar PostgreSQL de Render:**
- Más seguro que SQLite
- Backups automáticos
- Costo: ~$13/mes

## Próximos Pasos

1. ✅ Push a GitHub
2. ✅ Crear servicio en Render
3. ✅ Configurar variables y discos
4. ✅ Deploy
5. ✅ Probar endpoints
6. ✅ Monitorear con `/monitor.html`
7. ✅ Compartir URL con usuarios

## Soporte

- Logs: Dashboard → Logs
- Status: https://status.render.com
- Docs: https://render.com/docs

---

**¡Tu DataShark IA estará en producción en minutos!** 🚀
