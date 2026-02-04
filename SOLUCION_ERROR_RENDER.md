# ⚠️ Solución a Error SQLITE_CANTOPEN en Render

## Problema Detectado

```
❌ Error opening database: [Error: SQLITE_CANTOPEN: unable to open database file]
errno: 14,
code: 'SQLITE_CANTOPEN'
```

## Causa del Error

**Root Directory** en Render NO está configurado correctamente.

Render está ejecutando desde: `/opt/render/project/src/`
Debería ejecutar desde: `/opt/render/project/src/mini-lemonade/backend/`

## ✅ Solución: Configurar Root Directory

### Paso 1: Ve a tu servicio en Render
https://dashboard.render.com/web/srv-d61g5li4d50c73a3b6g0

### Paso 2: Settings → Build & Deploy

1. **Root Directory:** `mini-lemonade/backend` ⚠️ **CRÍTICO**
2. **Build Command:** `npm install`
3. **Start Command:** `node src/index.js`

### Paso 3: Environment Variables

Añade estas variables en la sección **Environment**:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=/tmp/database.sqlite
CORS_ORIGIN=https://datashark-ia2.onrender.com
```

**⚠️ IMPORTANTE:** 
- `DATABASE_URL=/tmp/database.sqlite` - `/tmp` SIEMPRE tiene permisos de escritura
- Si quieres datos persistentes, necesitas **Persistent Disk**

### Paso 4: (Opcional) Persistent Disk para Base de Datos

Si quieres que los datos NO se pierdan entre deploys:

1. Ve a **Disks** (en el menú lateral)
2. Click **Add Disk**
3. Configuración:
   - **Name:** `datashark-db`
   - **Mount Path:** `/var/data`
   - **Size:** 1 GB
4. Click **Save**

5. Actualiza variable de entorno:
   ```
   DATABASE_URL=/var/data/database.sqlite
   ```

### Paso 5: Hacer Manual Deploy

1. Click **Manual Deploy** → **Deploy latest commit**
2. Espera 2-3 minutos
3. Verifica logs

## ✅ Verificar que Funciona

```bash
# Health check
curl https://datashark-ia2.onrender.com/api/health

# Deberías ver:
{"status":"ok","message":"DataShark IA running"}
```

## 🔍 Revisar Logs

En los logs deberías ver:

```
✅ Directorio creado: /tmp (o /var/data)
📁 Ruta de base de datos: /tmp/database.sqlite
✅ SQLite database connected
✅ Database schema initialized
🦈 DataShark IA running on http://0.0.0.0:10000
```

## 📝 Resumen de Cambios

**Antes:**
- Root Directory: ❌ (vacío o incorrecto)
- DATABASE_URL: ❌ (sin configurar)

**Después:**
- Root Directory: ✅ `mini-lemonade/backend`
- DATABASE_URL: ✅ `/tmp/database.sqlite` (o `/var/data/database.sqlite`)

## 🚨 Si Sigue Fallando

### Opción 1: Verificar package.json
Asegúrate que `mini-lemonade/backend/package.json` existe y tiene:
```json
{
  "name": "datashark-ia",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  }
}
```

### Opción 2: Verificar Procfile
Asegúrate que `mini-lemonade/backend/Procfile` tiene:
```
web: node src/index.js
```

### Opción 3: Cambiar a PostgreSQL (Recomendado)

SQLite no es ideal para producción. Considera usar PostgreSQL de Render:

1. Dashboard → **New +** → **PostgreSQL**
2. Crea la base de datos
3. Copia **Internal Database URL**
4. Añade `pg` a package.json:
   ```bash
   npm install pg
   ```
5. Actualiza código para usar PostgreSQL en vez de SQLite

## 📊 Estructura Correcta

```
ia-roblox-xd/                    ← Repo GitHub
├── mini-lemonade/
│   ├── backend/                 ← ROOT DIRECTORY
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   ├── package.json
│   │   └── Procfile
│   ├── frontend/
│   └── plugin/
├── .gitignore
└── README.md
```

## ✅ Checklist Final

- [ ] Root Directory: `mini-lemonade/backend`
- [ ] Environment: `DATABASE_URL=/tmp/database.sqlite`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node src/index.js`
- [ ] Manual Deploy ejecutado
- [ ] Health check funciona
- [ ] `/login.html` carga correctamente

## 🎯 Próximo Paso

Después de configurar correctamente:

1. ✅ Manual Deploy
2. ✅ Espera que termine (3-5 min)
3. ✅ Abre: https://datashark-ia2.onrender.com
4. ✅ Prueba login/register
5. ✅ Prueba chat con IA

---

**¡Esto debería resolver el error!** 🚀

Si necesitas ayuda: [Render Support](https://render.com/docs)
