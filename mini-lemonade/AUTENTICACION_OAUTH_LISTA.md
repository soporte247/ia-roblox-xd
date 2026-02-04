# 🦈 DataShark IA - Sistema Completo de Autenticación OAuth 2.0

## ✅ ¡IMPLEMENTACIÓN COMPLETADA!

Se ha implementado un **sistema profesional y seguro de autenticación Roblox OAuth 2.0** con:

- ✅ **Autenticación OAuth 2.0 oficial** de Roblox
- ✅ **JWT firmados** con expiración de 7 días  
- ✅ **Cookies httpOnly** (máxima seguridad)
- ✅ **API Keys** para acceso sin navegador
- ✅ **Dashboard completo** para gestión
- ✅ **Base de datos SQLite** con 3 tablas
- ✅ **Documentación exhaustiva** (6 guías)
- ✅ **Listo para producción**

---

## 🚀 COMENZAR AHORA (3 minutos)

### Paso 1: Credenciales Roblox
1. Ve a https://create.roblox.com/credentials
2. Crea aplicación OAuth 2.0
3. Redirect URI: `http://localhost:3000/auth/roblox/callback`
4. Copia **Client ID** y **Client Secret**

### Paso 2: Configurar
```bash
# Editar backend/.env
ROBLOX_CLIENT_ID=tu_id_aqui
ROBLOX_CLIENT_SECRET=tu_secret_aqui
ROBLOX_REDIRECT_URI=http://localhost:3000/auth/roblox/callback
JWT_SECRET=clave_aleatoria_segura
```

### Paso 3: Ejecutar
```bash
cd backend
npm install  # Si es la primera vez
npm start
```

### Paso 4: Abrir
```
http://localhost:3000
Clic en "🦈 Iniciar sesión con Roblox"
```

---

## 📚 DOCUMENTACIÓN (Elige una)

### 🔥 Para Empezar (5 min)
**Archivo:** `INICIO_RAPIDO_OAUTH.md`
- Resumen ejecutivo
- Instrucciones rápidas
- Checklist final

### ⚡ Para Configurar (15 min)
**Archivo:** `QUICK_START_OAUTH.md`
- Guía de configuración rápida
- Cheatsheet de comandos
- Troubleshooting común

### 📖 Para Aprender (30 min)
**Archivo:** `OAUTH_SETUP.md`
- Guía paso a paso completa
- Explicaciones detalladas
- Ejemplos de producción

### 🔬 Para Profundizar (1 hora)
**Archivo:** `IMPLEMENTACION_OAUTH_COMPLETA.md`
- Detalles técnicos
- Arquitectura de seguridad
- Checklist exhaustivo

### 🎮 Para Plugin Roblox
**Archivo:** `PLUGIN_API_KEY_INTEGRATION.md`
- Cómo actualizar plugin
- Ejemplos de código
- Testing

### 🏗️ Para Desarrolladores
**Archivo:** `README_OAUTH_IMPLEMENTACION.md`
- Resumen técnico
- Estructura de archivos
- Diagrama de flujos

---

## 🎯 Lo que está implementado

### Backend (Node.js + Express)
```
✅ OAuth 2.0 completo (Roblox)
✅ Validación CSRF
✅ JWT (7 días)
✅ Cookies httpOnly
✅ Base de datos SQLite
✅ API Keys
✅ Endpoints protegidos
```

### Frontend (HTML + CSS + JS)
```
✅ Landing page (Limonada oscuro)
✅ Botón "Iniciar sesión"
✅ Dashboard completo
✅ Generador de API Keys
✅ Historial
✅ Dark mode
```

### Seguridad
```
✅ CSRF Protection
✅ JWT Signing
✅ API Key Validation
✅ Token Expiration
✅ Database Schema
✅ Secure Cookies
```

---

## 📊 Estructura de Archivos

```
mini-lemonade/
├── backend/
│   ├── src/
│   │   ├── index.js                    (Servidor)
│   │   ├── routes/
│   │   │   ├── auth.js                 (OAuth)
│   │   │   ├── apikeys.js              (API Keys)
│   │   │   └── ...otros
│   │   ├── services/
│   │   │   ├── database.js             (SQLite)
│   │   │   └── ...otros
│   │   └── middleware/
│   │       └── auth.js                 (Auth middleware)
│   ├── package.json
│   ├── .env                            (SECRETO)
│   └── database.sqlite                 (Se crea automático)
│
├── frontend/
│   ├── index.html                      (Landing + login)
│   ├── dashboard.html                  (Dashboard)
│   ├── style.css                       (Estilos)
│   └── script.js                       (Lógica)
│
├── plugin/
│   └── DataSharkPlugin.lua             (Plugin Roblox)
│
└── Documentación/
    ├── INICIO_RAPIDO_OAUTH.md          ← EMPIEZA AQUÍ
    ├── QUICK_START_OAUTH.md            (5 min)
    ├── OAUTH_SETUP.md                  (30 min)
    ├── IMPLEMENTACION_OAUTH_COMPLETA.md (1 hora)
    ├── PLUGIN_API_KEY_INTEGRATION.md   (Plugin)
    └── README_OAUTH_IMPLEMENTACION.md  (Técnico)
```

---

## 🔄 Flujo de Autenticación

```
Usuario en landing
       ↓
Clic: "Iniciar sesión con Roblox"
       ↓
GET /auth/roblox (genera state)
       ↓
Redirige a Roblox OAuth
       ↓
Usuario autoriza
       ↓
Roblox redirige con code
       ↓
GET /auth/roblox/callback
  ├ Valida state
  ├ Intercambia code por access_token
  ├ Obtiene info del usuario
  ├ Crea/actualiza en BD
  ├ Genera JWT
  └ Establece cookie httpOnly
       ↓
Redirige a /dashboard.html
       ↓
Dashboard obtiene info del usuario
       ↓
¡Listo! Usuario autenticado
```

---

## 🔐 Endpoints Disponibles

### Autenticación (sin protección)
```
GET  /auth/roblox              # Inicia OAuth
GET  /auth/roblox/callback     # Callback (automático)
GET  /auth/me                  # Info usuario
GET  /auth/logout              # Cerrar sesión
```

### API Keys (requiere JWT)
```
POST   /api/keys              # Crear key
GET    /api/keys              # Listar keys
DELETE /api/keys/:id          # Revocar key
```

### Generador (JWT o API Key)
```
POST /generate                # Generar código
GET  /fetch                   # Obtener código
GET  /history                 # Historial
POST /save                    # Guardar
POST /export                  # Exportar
```

---

## 🧪 Prueba Rápida

### 1. Verifica que el servidor corre
```bash
curl http://localhost:3000/api/health
# Respuesta: {"status":"ok","message":"DataShark IA running"}
```

### 2. Sin autenticación falla
```bash
curl -X POST http://localhost:3000/generate \
  -d '{"systemType":"Attack"}'
# Respuesta: 401 Unauthorized
```

### 3. Con API Key funciona
```bash
# Primero, generar API Key en dashboard
curl -X POST http://localhost:3000/generate \
  -H "X-API-Key: dk_tu_key_aqui" \
  -d '{"systemType":"Attack"}'
# Respuesta: 200 OK + Código generado
```

---

## ⚙️ Variables de Entorno

```env
# backend/.env (REQUERIDO)
ROBLOX_CLIENT_ID=xxx
ROBLOX_CLIENT_SECRET=xxx
ROBLOX_REDIRECT_URI=http://localhost:3000/auth/roblox/callback
JWT_SECRET=clave_aleatoria

# Opcional
DATABASE_URL=./database.sqlite
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

---

## ✅ Checklist Pre-Lanzamiento

- [ ] Credenciales Roblox obtenidas
- [ ] `.env` configurado
- [ ] `npm install` ejecutado
- [ ] `npm start` sin errores
- [ ] http://localhost:3000 carga
- [ ] Botón de login visible
- [ ] OAuth fluye correctamente
- [ ] Dashboard accesible
- [ ] API Keys se crean
- [ ] Endpoints funcionan

---

## 🚀 Próximos Pasos

1. **Ahora:** Seguir `INICIO_RAPIDO_OAUTH.md`
2. **Luego:** Obtener credenciales Roblox
3. **Entonces:** Ejecutar servidor
4. **Finalmente:** Probar en navegador

---

## 📞 Ayuda

### Errores Comunes

| Error | Solución |
|---|---|
| "Invalid Client ID" | Verifica en Roblox Creator Hub |
| "CORS Error" | Asegúrate que backend corre en 3000 |
| "JWT failed" | Cookie expirada, vuelve a loguearte |
| "Database locked" | Reinicia el servidor |

### Documentación

- 📖 `OAUTH_SETUP.md` - Guía completa
- ⚡ `QUICK_START_OAUTH.md` - Rápido
- 🎯 `INICIO_RAPIDO_OAUTH.md` - Ejecutivo
- 🔬 `IMPLEMENTACION_OAUTH_COMPLETA.md` - Técnico
- 🎮 `PLUGIN_API_KEY_INTEGRATION.md` - Plugin

---

## 🎉 ¡Listo para empezar!

```bash
# 1. Abre terminal
cd backend

# 2. Instala (primera vez)
npm install

# 3. Ejecuta
npm start

# 4. Abre navegador
http://localhost:3000

# 5. Clic en "🦈 Iniciar sesión con Roblox"
```

---

**Autenticación OAuth 2.0 de Roblox - Implementada y Lista** ✨

Para começar: lee `INICIO_RAPIDO_OAUTH.md`
