# ✅ DataShark IA - Autenticación OAuth 2.0 COMPLETADA

## 📌 Lo que se ha implementado

### 🔐 Autenticación Roblox OAuth 2.0
- ✅ Flujo completo OAuth 2.0 oficial de Roblox
- ✅ Validación de estado CSRF
- ✅ Intercambio de code por access_token seguro
- ✅ JWT firmados con expiración de 7 días
- ✅ Cookies httpOnly (no accesibles desde JavaScript)

### 👤 Gestión de Usuarios
- ✅ Tabla `users` con Roblox ID, username, display name, avatar
- ✅ Creación automática en primer login
- ✅ Actualización de perfil en logins posteriores

### 🔑 Sistema de API Keys
- ✅ Generación de API Keys seguras (formato `dk_...`)
- ✅ Almacenamiento sin exposición de claves completas
- ✅ Revocación de API Keys
- ✅ Validación en endpoints

### 🎯 Endpoints Implementados

#### Autenticación (sin protección)
```
GET  /auth/roblox              → Inicia flujo OAuth
GET  /auth/roblox/callback     → Callback de Roblox (automático)
GET  /auth/me                  → Info del usuario (requiere JWT)
GET  /auth/logout              → Cerrar sesión
```

#### API Keys (requiere JWT)
```
POST   /api/keys              → Generar nueva API Key
GET    /api/keys              → Listar API Keys del usuario
DELETE /api/keys/:keyId       → Revocar API Key
```

#### Generador (JWT o API Key)
```
POST /generate                → Generar código
GET  /fetch                   → Obtener código
GET  /history                 → Historial
POST /save                    → Guardar generación
POST /export                  → Exportar código
```

### 🎨 Frontend
- ✅ Landing page con botón "Iniciar sesión con Roblox"
- ✅ Dashboard completo con:
  - Panel de generación de código
  - Historial de generaciones
  - Gestión de API Keys
  - Información del usuario

---

## 🚀 CÓMO PROBAR (Instrucciones paso a paso)

### PASO 1: Obtener credenciales Roblox

1. Abre https://create.roblox.com/credentials
2. Haz clic en "Create API Credentials"
3. Selecciona "OAuth 2.0"
4. Rellena:
   - Name: "DataShark IA Dev"
   - Redirect URI: `http://localhost:3000/auth/roblox/callback`
5. Copia:
   - Client ID
   - Client Secret

### PASO 2: Actualizar .env

En `backend/.env`, reemplaza:

```env
ROBLOX_CLIENT_ID=tu_client_id_aqui
ROBLOX_CLIENT_SECRET=tu_client_secret_aqui
ROBLOX_REDIRECT_URI=http://localhost:3000/auth/roblox/callback
JWT_SECRET=clave_secreta_aleatoria
```

### PASO 3: Iniciar servidor

```bash
cd backend
npm install  # Si no está hecho
npm start
```

Deberías ver:
```
✅ SQLite database connected
✅ Database schema initialized
🦈 DataShark IA running on http://localhost:3000
📱 Authentication: Roblox OAuth 2.0 enabled
```

### PASO 4: Probar en navegador

1. Abre http://localhost:3000
2. Haz clic en **"🦈 Iniciar sesión con Roblox"**
3. Autoriza en Roblox
4. Serás redirigido a `/dashboard.html`
5. ¡Listo!

### PASO 5: Generar API Key

En el dashboard:
1. Haz clic en **"🔑 API Keys"**
2. Haz clic en **"+ Generar nueva API Key"**
3. Copia la key generada

### PASO 6: Usar API Key en pruebas

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tu_api_key_aqui" \
  -d '{
    "systemType": "Attack",
    "description": "Sistema de combate"
  }'
```

---

## 🧪 PRUEBAS DETALLADAS

### Test 1: Acceso sin autenticación (debe fallar)

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"systemType":"Attack"}'
```

**Resultado esperado:** 401 Unauthorized

### Test 2: Usando API Key válida

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dk_tu_key_aqui" \
  -d '{"systemType":"Attack","description":"Test"}'
```

**Resultado esperado:** 200 OK + código generado

### Test 3: Crear y listar API Keys

```bash
# Listar (requiere JWT en cookie)
curl http://localhost:3000/api/keys \
  -H "Cookie: jwt=tu_token"

# Resultado esperado:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "uuid",
#       "keyDisplay": "dk_xxxxx...xxxxx",
#       "active": true,
#       "createdAt": "2024-02-04T..."
#     }
#   ]
# }
```

### Test 4: Revocar API Key

```bash
curl -X DELETE http://localhost:3000/api/keys/uuid_de_la_key \
  -H "Cookie: jwt=tu_token"
```

**Resultado esperado:** 200 OK + mensaje de revocación

---

## 📊 ARQUITECTURA DE SEGURIDAD

### Flujo de Autenticación

```
1. Usuario hace clic en "Iniciar sesión con Roblox"
   ↓
2. GET /auth/roblox
   - Genera estado CSRF único
   - Almacena en memoria por 10 minutos
   - Redirige a Roblox OAuth
   ↓
3. Usuario autoriza en Roblox
   ↓
4. Roblox redirige a GET /auth/roblox/callback?code=...&state=...
   - Valida state (protección CSRF)
   - Verifica que no ha expirado (10 min)
   - Intercambia code por access_token (con secret)
   - Obtiene info del usuario
   - Crea/actualiza usuario en BD
   - Genera JWT firmado
   - Establece cookie httpOnly
   ↓
5. Redirige a /dashboard.html
   ↓
6. Dashboard obtiene info del usuario con GET /auth/me
   (JWT se envía automáticamente en cookie)
```

### Autenticación en Endpoints

Cada endpoint protegido valida:
1. Cookie JWT O header X-API-Key
2. Firma válida del JWT
3. No ha expirado (7 días)
4. API Key existe y está activa

---

## 🔐 DETALLES DE SEGURIDAD

### 1. CSRF Protection
- Estado único por cada solicitud
- Almacenado con expiración de 10 minutos
- Validación obligatoria en callback

### 2. JWT
```javascript
{
  userId: "uuid-del-usuario",
  robloxId: 12345,
  username: "@usuario",
  iat: 1707046800,
  exp: 1707651600  // 7 días después
}
```
- Firmado con JWT_SECRET
- httpOnly: no accesible desde JS
- secure: true en producción (HTTPS)
- sameSite: strict (protección CSRF)

### 3. API Keys
- Formato: `dk_` + 64 caracteres aleatorios
- Almacenadas en BD (no hasheadas por simplicitidad)
- Activas/inactivas
- Registro de último uso

### 4. Base de Datos
```
users
├── id (UUID)
├── robloxId (único)
├── username
├── displayName
├── avatarUrl
├── createdAt
└── updatedAt

api_keys
├── id (UUID)
├── userId (FK → users)
├── key (única)
├── active (bool)
├── createdAt
└── lastUsed

generated_systems
├── id (autoincrement)
├── userId (FK → users)
├── systemType
├── generatedCode
├── metadata
└── createdAt
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Invalid Client ID"
- Verifica que copiaste correctamente el Client ID de Roblox
- No incluya espacios en blanco

### Error: "Invalid Redirect URI"
- Debe ser exactamente: `http://localhost:3000/auth/roblox/callback`
- Diferencia mayús/minús importa

### Error: "CORS Error"
- Verifica que el backend está corriendo
- Port 3000 debe estar libre

### Error: "Database locked"
- Elimina `database.sqlite` si existe
- Reinicia el servidor
- Se recreará automáticamente

### Error: "JWT verification failed"
- JWT expira en 7 días
- Cierra sesión y vuelve a loguearte
- O borra cookies del navegador

### Error en Plugin Roblox
- Asegúrate que la API Key esté correcta
- Header debe ser `X-API-Key`
- Base URL: `http://localhost:3000` (sin slash final)

---

## 📋 ARCHIVO .ENV (Referencia completa)

```env
# === Roblox OAuth 2.0 ===
ROBLOX_CLIENT_ID=your_client_id
ROBLOX_CLIENT_SECRET=your_client_secret
ROBLOX_REDIRECT_URI=http://localhost:3000/auth/roblox/callback

# === JWT ===
JWT_SECRET=your_secret_key_32_chars_minimum

# === Database ===
DATABASE_URL=./database.sqlite

# === Server ===
PORT=3000
NODE_ENV=development

# === Ollama ===
OLLAMA_MODEL=qwen2.5-coder:7b
OLLAMA_BASE_URL=http://localhost:11434

# === CORS (opcional) ===
CORS_ORIGIN=http://localhost:3000

# === OpenAI Fallback (opcional) ===
OPENAI_API_KEY=sk_test_...
```

---

## ✅ CHECKLIST FINAL

### Configuración
- [ ] Credenciales Roblox OAuth obtenidas
- [ ] `.env` actualizado con valores reales
- [ ] `npm install` ejecutado
- [ ] Ollama corriendo en localhost:11434

### Servidor
- [ ] `npm start` ejecutándose sin errores
- [ ] Base de datos creada (database.sqlite)
- [ ] Mensajes de inicio correctos

### Frontend
- [ ] http://localhost:3000 carga
- [ ] Botón "Iniciar sesión con Roblox" visible
- [ ] Landing page con tema oscuro Limonada

### Autenticación
- [ ] Puedo hacer clic en botón de login
- [ ] Roblox OAuth redirige correctamente
- [ ] Después de autorizar, veo /dashboard.html
- [ ] Dashboard carga datos del usuario

### API Keys
- [ ] Puedo generar API Keys
- [ ] API Key se copia correctamente
- [ ] Puedo revocar API Keys
- [ ] Historial de creación visible

### Endpoints
- [ ] GET /auth/me funciona
- [ ] POST /api/keys funciona
- [ ] GET /api/keys funciona
- [ ] DELETE /api/keys/:id funciona
- [ ] POST /generate funciona con API Key

---

## 🎯 PRÓXIMOS PASOS (Producción)

Antes de deployar:

1. **HTTPS obligatorio**
   - Activar SSL/TLS
   - Actualizar `ROBLOX_REDIRECT_URI`

2. **Variables de entorno seguras**
   - Usar vault o .env encriptado
   - Nunca commitir secrets

3. **Rate limiting**
   - Instalar `express-rate-limit`
   - Limitar 100 reqs/15min

4. **Base de datos productiva**
   - Migrar de SQLite a PostgreSQL
   - Backups automáticos

5. **Monitoreo**
   - PM2 para mantener proceso activo
   - Logs centralizados
   - Alertas en errores

6. **Documentación API**
   - Swagger/OpenAPI
   - ejemplos cURL

---

## 💡 CARACTERÍSTICAS ADICIONALES

Puedes agregar fácilmente:

### 1. Social Login
```javascript
// Agregar GitHub, Discord, Google OAuth
```

### 2. Webhooks
```javascript
// Notificar cuando se genera código
POST /webhooks/generation
```

### 3. Marketplace
```javascript
// Compartir templates personalizados
GET /templates/public
```

### 4. Equipos
```javascript
// Múltiples usuarios en un proyecto
POST /teams
```

### 5. Analíticas
```javascript
// Dashboard de uso
GET /analytics
```

---

**¡Autenticación OAuth 2.0 de Roblox implementada correctamente!** 🚀

Para preguntas: revisar `OAUTH_SETUP.md` o `QUICK_START_OAUTH.md`
