# 🔐 DataShark IA - Guía de Configuración Roblox OAuth 2.0

## 📋 Requisitos Previos

- Cuenta Roblox Developer
- Acceso a [Roblox Creator Hub](https://create.roblox.com)
- Node.js 16+ instalado
- Ollama corriendo localmente (http://localhost:11434)

---

## 🚀 PASO 1: Registrar Aplicación en Roblox

### 1.1 Acceder a Roblox Creator Hub
1. Ve a https://create.roblox.com
2. Inicia sesión con tu cuenta Roblox Developer

### 1.2 Crear Aplicación OAuth
1. Ve a **Credentials** (Credenciales)
2. Haz clic en **Create API Credentials** (Crear credenciales API)
3. Selecciona **OAuth 2.0**
4. Completa los datos:
   - **Application Name**: "DataShark IA"
   - **Description**: "AI-powered Roblox code generator"
   - **Authorized Redirect URIs**:
     - `http://localhost:3000/auth/roblox/callback` (desarrollo)
     - `https://tudominio.com/auth/roblox/callback` (producción)

### 1.3 Copiar Credenciales
Recibirás:
- `Client ID`
- `Client Secret`

⚠️ **IMPORTANTE**: Guarda el Client Secret en un lugar seguro. No lo compartas.

---

## 🔧 PASO 2: Configurar Archivo .env

En la carpeta `backend/`, edita el archivo `.env`:

```env
# Roblox OAuth 2.0
ROBLOX_CLIENT_ID=tu_client_id_aqui
ROBLOX_CLIENT_SECRET=tu_client_secret_aqui
ROBLOX_REDIRECT_URI=http://localhost:3000/auth/roblox/callback

# JWT
JWT_SECRET=genera_una_clave_segura_aleatoria_aqui

# Database
DATABASE_URL=./database.sqlite

# Server
PORT=3000
NODE_ENV=development

# Ollama
OLLAMA_MODEL=qwen2.5-coder:7b
OLLAMA_BASE_URL=http://localhost:11434
```

### Generar JWT_SECRET Seguro
```powershell
# Windows PowerShell
[System.Convert]::ToBase64String((Get-Random -Input (1..32) | % {[byte]$_}))
```

O simplemente:
```bash
# Linux/Mac
openssl rand -hex 32
```

---

## 📦 PASO 3: Instalar Dependencias

```bash
cd backend
npm install
```

---

## ▶️ PASO 4: Iniciar Servidor

### Terminal 1 - Ollama (si no está corriendo)
```bash
ollama serve
```

### Terminal 2 - DataShark Backend
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

## 🌐 PASO 5: Probar Autenticación

### Flujo de Login

1. Abre http://localhost:3000 en tu navegador
2. Haz clic en botón **"🦈 Iniciar sesión con Roblox"**
3. Serás redirigido a Roblox para autorizar la aplicación
4. Después de autorizar, serás redirigido al dashboard
5. ¡Listo! Ahora puedes generar código

### Endpoints Disponibles

#### Autenticación
- `GET /auth/roblox` - Inicia flujo OAuth
- `GET /auth/roblox/callback` - Callback de Roblox (manejo automático)
- `GET /auth/me` - Obtener información del usuario (requiere JWT)
- `GET /auth/logout` - Cerrar sesión

#### API Keys
- `POST /api/keys` - Generar nueva API Key
- `GET /api/keys` - Listar API Keys del usuario
- `DELETE /api/keys/:keyId` - Revocar API Key

#### Generador (requieren autenticación JWT o API Key)
- `POST /generate` - Generar código
- `GET /fetch` - Obtener código guardado
- `GET /history` - Ver historial
- `POST /save` - Guardar generación
- `POST /export` - Exportar código

---

## 🔌 PASO 6: Configurar Plugin Roblox

En el plugin DataSharkPlugin.lua (archivo existente), agregar:

### Generar API Key Después del Login

```lua
-- Después de que el usuario se autentique
-- En el dashboard, hacer clic en "🔑 API Keys" > "+ Generar nueva API Key"
```

### Usar API Key en el Plugin

En `DataSharkPlugin.lua`, actualizar para incluir header:

```lua
local request = {
    Url = serverUrl .. "/generate",
    Method = "POST",
    Headers = {
        ["Content-Type"] = "application/json",
        ["X-API-Key"] = apiKey  -- Agregar esto
    },
    Body = httpService:JSONEncode(requestBody)
}

local success, response = pcall(httpService.RequestAsync, httpService, request)
```

---

## 🛡️ Seguridad en Producción

Antes de deployar a producción:

### 1. Variables de Entorno
```env
NODE_ENV=production
ROBLOX_REDIRECT_URI=https://tudominio.com/auth/roblox/callback
JWT_SECRET=usa_una_clave_muy_segura_de_32_caracteres
```

### 2. HTTPS
- Activar SSL/TLS
- Actualizar `ROBLOX_REDIRECT_URI` a `https://`

### 3. CORS
```javascript
// En index.js
app.use(cors({
  origin: ['https://tudominio.com', 'https://www.tudominio.com'],
  credentials: true
}));
```

### 4. Cookies Seguras
En `auth.js`, las cookies ya tienen:
- `httpOnly: true` - No accesible desde JavaScript
- `secure: true` - Solo en HTTPS (se activa cuando NODE_ENV=production)
- `sameSite: 'strict'` - Protección CSRF

### 5. Rate Limiting
```javascript
// Instalar: npm install express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);
```

### 6. Base de Datos
Para producción, migrar de SQLite a:
- PostgreSQL
- MySQL
- MongoDB

Actualizar `DATABASE_URL` en `.env`

---

## 🧪 Pruebas

### Verificar Endpoints

```bash
# Verificar servidor activo
curl http://localhost:3000/api/health

# Probar generación sin auth (debería fallar)
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"systemType":"Attack"}'

# Respuesta esperada: 401 Unauthorized
```

### Prueba de Login Manual
1. Abre http://localhost:3000
2. Haz clic en "Iniciar sesión con Roblox"
3. Autoriza la aplicación
4. Deberías ser redirigido a /dashboard.html
5. Intenta generar código
6. Ve a "API Keys" y crea una nueva key

---

## 🐛 Solución de Problemas

### Error: "Invalid Client ID"
- Verifica que el `ROBLOX_CLIENT_ID` en `.env` sea correcto
- Asegúrate de haber copiado el valor completo

### Error: "Invalid Redirect URI"
- Verifica que `ROBLOX_REDIRECT_URI` en `.env` coincida exactamente con la registrada en Roblox
- Incluye http:// o https://

### Error: "CORS Error"
- Verifica que el backend está corriendo
- Comprueba que `NODE_ENV` es correcto

### Error: "Database not initialized"
- Elimina `database.sqlite` si existe
- Reinicia el servidor
- La BD se recreará automáticamente

### Error: "JWT verification failed"
- Las cookies pueden haber expirado (7 días)
- Cierra sesión y vuelve a loguearte
- O borra las cookies del navegador

---

## 📊 Estructura de Base de Datos

### Tabla: users
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    robloxId INTEGER UNIQUE,
    username TEXT,
    displayName TEXT,
    avatarUrl TEXT,
    createdAt DATETIME,
    updatedAt DATETIME
);
```

### Tabla: api_keys
```sql
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    userId TEXT,
    key TEXT UNIQUE,
    active BOOLEAN,
    createdAt DATETIME,
    lastUsed DATETIME,
    FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Tabla: generated_systems
```sql
CREATE TABLE generated_systems (
    id INTEGER PRIMARY KEY,
    userId TEXT,
    systemType TEXT,
    generatedCode TEXT,
    metadata TEXT,
    createdAt DATETIME,
    FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## 📚 API Documentation

### POST /generate
**Autenticación**: JWT o API Key

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=token_aqui" \
  -d '{
    "systemType": "Attack",
    "description": "Sistema de combate con cooldown"
  }'
```

### POST /api/keys
**Autenticación**: JWT

```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Cookie: jwt=token_aqui"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-aqui",
    "key": "dk_xxxxx...xxxxx",
    "createdAt": "2024-02-04T10:30:00Z"
  }
}
```

---

## 🚀 Despliegue a Producción

### Opción 1: Railway.app
```bash
railway init
railway up
```

### Opción 2: Render.com
1. Conectar repositorio GitHub
2. Configurar variables de entorno en dashboard
3. Deploy automático

### Opción 3: VPS (Linode, DigitalOcean)
```bash
# SSH a servidor
ssh user@your_server_ip

# Clonar proyecto
git clone your_repo
cd your_repo

# Instalar dependencias
npm install

# Configurar .env con valores de producción
nano .env

# Instalar PM2 para mantener servidor activo
npm install -g pm2
pm2 start backend/src/index.js
pm2 save
pm2 startup
```

---

## ✅ Checklist Final

- [ ] Roblox OAuth credenciales registradas
- [ ] `.env` configurado con valores reales
- [ ] Base de datos SQLite creada
- [ ] Servidor backend corriendo
- [ ] Landing page cargando en http://localhost:3000
- [ ] Botón "Iniciar sesión con Roblox" funciona
- [ ] Puedes generar código después de login
- [ ] API Keys se crean y validan correctamente
- [ ] Plugin Roblox actualizado para usar API Keys

---

## 💡 Próximos Pasos

1. **Webhook para eventos**: Agregar notificaciones cuando se genera código
2. **Marketplace de templates**: Permitir compartir templates personalizados
3. **Análisis y métricas**: Dashboard para ver uso de API
4. **Control de equipos**: Permitir múltiples usuarios en un proyecto
5. **Publicación automática**: Publicar directamente a Roblox Toolbox

---

**¡Listo para empezar!** 🚀

Para preguntas o problemas, abre un issue en GitHub o contacta a support@datashark.ai
