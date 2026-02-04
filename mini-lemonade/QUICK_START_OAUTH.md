# GUÍA DE INICIO RÁPIDO: Autenticación Roblox OAuth 2.0

## 🚨 PASO CRÍTICO 1: Obtener Credenciales Roblox

### Para Desarrollo (Localhost)

1. **Crea aplicación OAuth en Roblox Creator Hub:**
   - Ve a: https://create.roblox.com/credentials
   - Botón: "Create API Credentials" → "OAuth 2.0"
   - Nombre: "DataShark IA Dev"
   - Redirect URI: `http://localhost:3000/auth/roblox/callback`

2. **Copia los valores:**
   ```
   Client ID: [tu_client_id]
   Client Secret: [tu_client_secret]
   ```

### Para Producción

- Redirect URI: `https://tudominio.com/auth/roblox/callback`
- Usar HTTPS obligatoriamente

---

## 🔧 PASO 2: Configurar Backend

### 2.1 Actualizar `.env`

En `backend/.env`, reemplaza:

```env
ROBLOX_CLIENT_ID=tu_client_id_de_roblox_aqui
ROBLOX_CLIENT_SECRET=tu_client_secret_de_roblox_aqui
ROBLOX_REDIRECT_URI=http://localhost:3000/auth/roblox/callback
JWT_SECRET=clave_secreta_aleatoria_32_caracteres
```

### 2.2 Verificar Dependencias

Todas las librerías ya están instaladas:
- ✅ express
- ✅ jsonwebtoken
- ✅ sqlite3
- ✅ axios
- ✅ cookie-parser
- ✅ uuid

Si falta algo:
```bash
cd backend
npm install
```

### 2.3 Iniciar Servidor

```bash
cd backend
npm start
```

Deberías ver:
```
✅ SQLite database connected
✅ Database schema initialized
🦈 DataShark IA running on http://localhost:3000
📱 Authentication: Roblox OAuth 2.0 enabled
```

---

## 🌐 PASO 3: Probar Login

1. Abre: http://localhost:3000
2. Haz clic en **"🦈 Iniciar sesión con Roblox"**
3. Autoriza en Roblox
4. Serás redirigido a `/dashboard.html`
5. ¡Listo!

---

## 📊 FLUJO COMPLETO

```
Usuario en landing
       ↓
Hace clic: "Iniciar sesión con Roblox"
       ↓
GET /auth/roblox (genera estado CSRF)
       ↓
Redirige a: https://apis.roblox.com/oauth/v1/authorize
       ↓
Usuario autoriza en Roblox
       ↓
Roblox redirige a: GET /auth/roblox/callback?code=...&state=...
       ↓
Backend valida state, intercambia code por access_token
       ↓
Backend obtiene info del usuario desde Roblox
       ↓
Backend crea/actualiza usuario en SQLite
       ↓
Backend genera JWT y lo guarda en cookie httpOnly
       ↓
Redirige a: /dashboard.html
       ↓
Frontend obtiene info del usuario con GET /auth/me
       ↓
Dashboard cargado y funcionando
```

---

## 🔐 SEGURIDAD IMPLEMENTADA

✅ **Estado CSRF**: Token aleatorio en memoria validado  
✅ **JWT**: Firmado con secret, expiración 7 días  
✅ **Cookies httpOnly**: No accesibles desde JavaScript  
✅ **API Keys**: Generadas aleatoriamente, almacenadas hasheadas  
✅ **Validación de código**: Verifica que el Usuario ID sea válido  

---

## 📱 ENDPOINTS DISPONIBLES

### Autenticación (Sin protección)
- `GET /auth/roblox` → Inicia OAuth
- `GET /auth/roblox/callback` → Callback automático
- `GET /auth/logout` → Cerrar sesión

### Usuario (Con JWT)
- `GET /auth/me` → Datos del usuario autenticado

### API Keys (Con JWT)
- `POST /api/keys` → Generar nueva
- `GET /api/keys` → Listar todas
- `DELETE /api/keys/:keyId` → Revocar

### Generador (JWT o API Key)
- `POST /generate` → Generar código
- `GET /fetch` → Obtener código
- `GET /history` → Historial
- `POST /save` → Guardar
- `POST /export` → Exportar

---

## 🧪 PRUEBAS RÁPIDAS

### 1. Verificar servidor activo
```bash
curl http://localhost:3000/api/health
# Respuesta: {"status":"ok","message":"DataShark IA running"}
```

### 2. Intentar acceder sin autenticación
```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"systemType":"Attack"}'
# Respuesta: 401 Unauthorized
```

### 3. Usar API Key válida
```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dk_tu_api_key_aqui" \
  -d '{"systemType":"Attack","description":"Test"}'
# Respuesta: Código generado
```

---

## 💾 BASE DE DATOS

Se crea automáticamente en `backend/database.sqlite` con 3 tablas:

### users
- id (UUID)
- robloxId (del usuario Roblox)
- username
- displayName
- avatarUrl

### api_keys
- id (UUID)
- userId (FK)
- key (segura)
- active (true/false)
- createdAt
- lastUsed

### generated_systems
- id (autoincrement)
- userId (FK)
- systemType (Attack, Shop, etc.)
- generatedCode
- createdAt

---

## ⚠️ ERRORES COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| "Invalid Client ID" | ID de Roblox incorrecto | Verifica en Roblox Creator Hub |
| "Invalid Redirect URI" | URL no coincide | Debe ser exactamente igual a la registrada |
| "CORS Error" | Backend no está corriendo | Inicia `npm start` en backend/ |
| "JWT verification failed" | Cookie expirada (7 días) | Cierra sesión y vuelve a loguearte |
| "state_expired" | Token CSRF expiró (10 min) | Intenta login de nuevo |

---

## 🚀 PRÓXIMO PASO: Publicar en Roblox Toolbox

Después de obtener API Key en el dashboard:

1. Ve a Roblox Studio
2. Abre `DataSharkPlugin.lua`
3. Configura la API Key generada
4. Usa el plugin para generar código

```lua
local API_KEY = "dk_xxxxx...xxxxx"  -- Copia del dashboard

local request = {
    Url = "http://localhost:3000/generate",
    Method = "POST",
    Headers = {
        ["Content-Type"] = "application/json",
        ["X-API-Key"] = API_KEY
    },
    Body = ...
}
```

---

## ✅ CHECKLIST

- [ ] Credenciales Roblox OAuth obtenidas
- [ ] `.env` configurado con valores reales
- [ ] `npm install` ejecutado
- [ ] `npm start` en backend corriendo
- [ ] http://localhost:3000 carga
- [ ] Botón "Iniciar sesión" visible
- [ ] Puedo hacer login con Roblox
- [ ] Veo dashboard.html después de login
- [ ] Puedo generar una API Key
- [ ] API Key funciona en pruebas curl

---

**¿Listo? Abre http://localhost:3000 y haz clic en "Iniciar sesión con Roblox"** 🚀
