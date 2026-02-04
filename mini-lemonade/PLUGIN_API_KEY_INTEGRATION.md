# 🔑 DataShark IA Plugin - Integración con API Keys

## 📌 Cambios necesarios en DataSharkPlugin.lua

El plugin actualmente usa User ID. Para usar API Keys después de la autenticación OAuth:

### OPCIÓN 1: Agregar campo de API Key al plugin (Recomendado)

En el archivo `DataSharkPlugin.lua`, después del campo de URL, agregar:

```lua
-- API Key Section
local apiKeyLabel = Instance.new("TextLabel")
apiKeyLabel.Size = UDim2.new(1, 0, 0, 25)
apiKeyLabel.Position = UDim2.new(0, 0, 0, 200)
apiKeyLabel.BackgroundTransparency = 1
apiKeyLabel.Text = "API Key (get from web app):"
apiKeyLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
apiKeyLabel.TextSize = 14
apiKeyLabel.Font = Enum.Font.Gotham
apiKeyLabel.TextXAlignment = Enum.TextXAlignment.Left
apiKeyLabel.Parent = content

local apiKeyBox = Instance.new("TextBox")
apiKeyBox.Size = UDim2.new(1, 0, 0, 35)
apiKeyBox.Position = UDim2.new(0, 0, 0, 230)
apiKeyBox.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
apiKeyBox.BorderSizePixel = 0
apiKeyBox.Text = ""
apiKeyBox.PlaceholderText = "dk_xxxxxxxxxxxxx (paste from dashboard)"
apiKeyBox.TextColor3 = Color3.fromRGB(255, 255, 255)
apiKeyBox.PlaceholderColor3 = Color3.fromRGB(150, 150, 150)
apiKeyBox.TextSize = 12
apiKeyBox.Font = Enum.Font.Code
apiKeyBox.ClearTextOnFocus = false
apiKeyBox.Parent = content

local apiKeyCorner = Instance.new("UICorner")
apiKeyCorner.CornerRadius = UDim.new(0, 6)
apiKeyCorner.Parent = apiKeyBox

local apiKeyPadding = Instance.new("UIPadding")
apiKeyPadding.PaddingLeft = UDim.new(0, 10)
apiKeyPadding.PaddingRight = UDim.new(0, 10)
apiKeyPadding.Parent = apiKeyBox
```

### OPCIÓN 2: Usar directamente en las peticiones (Más simple)

Si ya tienes el campo, modificar la función que envía requests:

```lua
-- Buscar la función que hace requests y modificar:
local function makeRequest(systemType, description)
    -- Obtener valores de los campos de entrada
    local backendUrl = urlBox.Text ~= "" and urlBox.Text or DEFAULT_URL
    local apiKey = apiKeyBox.Text
    
    -- Validar que tenemos API Key
    if apiKey == "" or string.len(apiKey) < 10 then
        updateStatus("Error: Please enter a valid API Key", Color3.fromRGB(244, 67, 54))
        return nil
    end
    
    -- Hacer la petición con API Key en header
    local url = backendUrl .. "/generate"
    local requestBody = {
        systemType = systemType,
        description = description or "Default"
    }
    
    local success, response = pcall(function()
        return HttpService:RequestAsync({
            Url = url,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json",
                ["X-API-Key"] = apiKey  -- AGREGAR ESTO
            },
            Body = HttpService:JSONEncode(requestBody),
            Timeout = CONNECTION_TIMEOUT
        })
    end)
    
    -- ... resto del código
end
```

---

## 🔄 Flujo completo con API Keys

### 1. Usuario hace login en web (http://localhost:3000)
```
Landing Page
   ↓
"Iniciar sesión con Roblox"
   ↓
Autentica con OAuth
   ↓
Ve dashboard
```

### 2. Genera API Key en web
```
Dashboard
   ↓
Sección "🔑 API Keys"
   ↓
"+ Generar nueva API Key"
   ↓
Copia: dk_xxxxxxxxxxxxx
```

### 3. Usa API Key en plugin Roblox
```
Abre Roblox Studio
   ↓
Abre DataShark Plugin
   ↓
Pega API Key en campo
   ↓
Selecciona sistema (Attack, Shop, etc)
   ↓
Clic "📥 Import System"
   ↓
Código generado se importa
```

---

## ✅ Cambios ya implementados

### Backend
- ✅ Endpoint POST /generate con validación de API Key
- ✅ Tabla api_keys en BD
- ✅ Generación de API Keys (formato `dk_...`)
- ✅ Validación de API Key en middleware

### Frontend
- ✅ Dashboard con generador de API Keys
- ✅ Botón "🔑 API Keys"
- ✅ Interfaz para generar y revocar keys

### Plugin
- ⏳ Agregar campo de entrada para API Key (instrucciones arriba)
- ⏳ Modificar requests para incluir header `X-API-Key`

---

## 🧪 Prueba rápida sin modificar plugin

### 1. En web, generar API Key
```
http://localhost:3000/dashboard.html
   → API Keys
   → + Generar nueva
   → Copiar key
```

### 2. Desde terminal, probar API Key
```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dk_tu_key_aqui" \
  -d '{
    "systemType": "Attack",
    "description": "Test desde terminal"
  }'
```

### 3. Respuesta esperada
```json
{
  "success": true,
  "code": "local AttackService = {}\n...",
  "systemType": "Attack"
}
```

---

## 🔐 Alternativa: Guardar API Key localmente

Si quieres que el plugin recuerde la API Key:

```lua
-- Guardar API Key en plugin.Settings
local function saveApiKey(key)
    plugin:SetSetting("DataShark_API_Key", key)
end

local function loadApiKey()
    return plugin:GetSetting("DataShark_API_Key") or ""
end

-- Al cargar el plugin
apiKeyBox.Text = loadApiKey()

-- Cuando el usuario ingresa una key
apiKeyBox.FocusLost:Connect(function()
    saveApiKey(apiKeyBox.Text)
end)
```

---

## 📝 Resumen de cambios

```lua
-- ANTES (usaba User ID)
local userIdBox = Instance.new("TextBox")
-- ... configuración

-- DESPUÉS (usa API Key)
local apiKeyBox = Instance.new("TextBox")
-- ... configuración

-- ANTES (sin header X-API-Key)
local headers = { ["Content-Type"] = "application/json" }

-- DESPUÉS (con header X-API-Key)
local headers = {
    ["Content-Type"] = "application/json",
    ["X-API-Key"] = apiKey
}
```

---

## ✨ Beneficios de usar API Keys

1. **Mejor seguridad**: No expones User ID público
2. **Control granular**: Puedes revocar keys sin cambiar contraseña
3. **Auditoría**: Registro de qué key se usó en cada request
4. **Múltiples keys**: Un usuario puede tener varias keys activas
5. **Revocación rápida**: Si una key se compromete, solo revoca esa

---

## 🚀 Después de actualizar el plugin

1. Guarda los cambios en `DataSharkPlugin.lua`
2. Recarga el plugin en Roblox Studio
3. Prueba con una API Key válida
4. Verifica que el código se importa correctamente

---

## ⚙️ Configuración de producción

Para deployar en producción:

1. **Backend**
   ```env
   NODE_ENV=production
   ROBLOX_REDIRECT_URI=https://tudominio.com/auth/roblox/callback
   ```

2. **Plugin**
   ```lua
   local DEFAULT_URL = "https://tudominio.com"  -- HTTPS
   ```

3. **Web**
   - Actualizar dominio en favoritos
   - Usar HTTPS siempre

---

## 🐛 Debugging

Si la API Key no funciona:

1. Verifica que la key comienza con `dk_`
2. Confirma que está activa en dashboard
3. Revisa que el header es exactamente `X-API-Key`
4. No debe haber espacios en la key

```lua
-- Debug: Imprimir request
print("API Key:", apiKey)
print("URL:", url)
print("Headers:", HttpService:JSONEncode({
    ["Content-Type"] = "application/json",
    ["X-API-Key"] = apiKey
}))
```

---

¡Listo para actualizar el plugin! 🦈
