# 🔌 Validación de Conexión al Plugin

## Descripción General

Se ha implementado un sistema de validación de conexión al plugin de DataShark IA que asegura que los usuarios conecten su ID antes de generar código.

---

## Características Implementadas

### 1. Validación en Frontend (`script.js`)

#### Funciones Agregadas:

**`isPluginConnected(userId)`**
- Verifica si el plugin está conectado para un usuario específico
- Revisa localStorage primero: `pluginConnected-${userId}`
- Devuelve `true` si está conectado, `false` en caso contrario

```javascript
function isPluginConnected(userId) {
  const stored = localStorage.getItem(`pluginConnected-${userId}`);
  if (stored === 'true') {
    return true;
  }
  return pluginConnected[userId] === true;
}
```

**`setPluginConnected(userId, connected)`**
- Marca el plugin como conectado/desconectado
- Guarda el estado en localStorage para persistencia
- Sincroniza con variable global `pluginConnected`

```javascript
function setPluginConnected(userId, connected = true) {
  pluginConnected[userId] = connected;
  localStorage.setItem(`pluginConnected-${userId}`, connected ? 'true' : 'false');
}
```

**`showPluginConnectionModal(userId)`**
- Muestra un modal interactivo con instrucciones de conexión
- Displays:
  - ID del usuario (copiable)
  - Pasos para conectar el plugin
  - Información de seguimiento
  
Modal personalizado con:
- Seccion azul: Muestra ID y botón de copiar
- Seccion amarilla: Instrucciones paso a paso
- Seccion verde: Confirmación de conexión

**`confirmPluginConnection(userId)`**
- Confirma la conexión al plugin
- Cierra el modal
- Muestra notificaciones de éxito
- Permite continuar con la generación

#### Flujo en `handleGenerate()`:

```javascript
async function handleGenerate() {
  const prompt = promptInput.value.trim();
  const currentUserId = getUserId();

  if (!prompt) {
    // Validar prompt...
    return;
  }

  // ✅ VALIDACIÓN DE CONEXIÓN AL PLUGIN
  if (!isPluginConnected(currentUserId)) {
    showPluginConnectionModal(currentUserId);
    return;  // Detener generación hasta conectar
  }

  // Continuar con generación...
  // ...resto del código
}
```

### 2. Validación en Backend (`generate.js`)

#### Mensajes de Error Mejorados:

Se agregaron mensajes específicos cuando el userId no está presente o es inválido:

```javascript
if (!userId || typeof userId !== 'string') {
  return res.status(400).json({ 
    error: 'UserId is required and must be a string',
    field: 'userId',
    message: 'El plugin de Roblox Studio no está conectado. Por favor, conecta tu ID de usuario en el plugin para sincronizar código.'
  });
}

if (!uuidRegex.test(userId)) {
  return res.status(400).json({ 
    error: 'UserId must be a valid UUID',
    field: 'userId',
    message: 'El ID de usuario tiene un formato inválido. Por favor, verifica que hayas copiado correctamente el ID del navegador.'
  });
}
```

---

## Flujo Completo de Validación

### Escenario 1: Usuario No Conectado

```
┌─────────────────────────────────┐
│ Usuario escribe prompt y presiona│
│     "Generar Sistema"           │
└────────────┬────────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ isPluginConnected()? │
    │ → false              │
    └──────────┬───────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ showPluginConnectionModal│
    │  - Mostrar ID usuario   │
    │  - Botón copiar         │
    │  - Instrucciones        │
    └──────────┬──────────────┘
             │
             ▼
    Usuario confirma conexión
             │
             ▼
    setPluginConnected(true)
             │
             ▼
    Puede generar código
```

### Escenario 2: Usuario Ya Conectado

```
┌─────────────────────────────────┐
│ Usuario escribe prompt y presiona│
│     "Generar Sistema"           │
└────────────┬────────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ isPluginConnected()? │
    │ → true               │
    └──────────┬───────────┘
             │
             ▼
    Validar prompt en backend
             │
             ▼
    Generar código IA
             │
             ▼
    Retornar archivos generados
```

### Escenario 3: Error en Backend

```
Si el backend no recibe userId válido:

POST /generate
└─ Body: { prompt: "...", userId: undefined }
   │
   └─> Response 400:
       {
         error: "UserId is required",
         message: "El plugin de Roblox Studio no está conectado...",
         field: "userId"
       }
```

---

## Datos Guardados

### LocalStorage

```javascript
// Por cada usuario
localStorage.setItem(`pluginConnected-${userId}`, 'true'|'false')

// Ejemplo:
// pluginConnected-550e8400-e29b-41d4-a716-446655440000 → 'true'
```

### Variables Globales

```javascript
// En memoria durante la sesión
pluginConnected = {
  '550e8400-e29b-41d4-a716-446655440000': true,
  '660e8400-e29b-41d4-a716-446655440001': false
}
```

---

## Interface del Modal

### Visual

```
╔════════════════════════════════════╗
║  🔌 Conectar al Plugin             ║
║                            [×]    ║
╠════════════════════════════════════╣
║ Para generar código y sincronizarlo║
║ con Roblox Studio, conecta tu ID   ║
║                                    ║
║ ┌──────────────────────────────┐   ║
║ │ Tu ID de Usuario:            │   ║
║ ├──────────────────────────────┤   ║
║ │ 550e8400-e29b-41d4-a716...   │   ║
║ ├──────────────────────────────┤   ║
║ │ [📋 Copiar ID]               │   ║
║ └──────────────────────────────┘   ║
║                                    ║
║ 🟨 Pasos para conectar:            ║
║  1. Abre Roblox Studio            ║
║  2. Ve a Plugins → DataShark IA   ║
║  3. Pega tu ID en el campo        ║
║  4. Haz clic en "Conectar"        ║
║                                    ║
║ 🟩 ¿Ya conectaste el plugin?      ║
║  Si ya ingresaste tu ID, haz clic ║
║  en "Confirmar Conexión" abajo     ║
╠════════════════════════════════════╣
║ [Conectar Luego] [✅ Confirmar]    ║
╚════════════════════════════════════╝
```

---

## Integración con Plugin Lua

El plugin DataShark debe:

1. **Solicitar el ID del usuario** cuando se abre por primera vez
2. **Guardar el ID** en el state del plugin
3. **Sincronizar con el backend** cuando se conecte
4. **Mantener la conexión activa** con polling periódico

### Ejemplo de código esperado en plugin:

```lua
-- El usuario ingresa su ID en el UI del plugin
-- El plugin lo valida y lo guarda
if isValidUUID(userInputId) then
  state.userId = userInputId
  -- Confirmación al backend
  PluginConnection.confirmConnection(userInputId)
  Logger.log("✅ Conectado como: " .. userInputId)
end
```

---

## Estados Posibles

| Estado | Almacenado | Comportamiento |
|--------|-----------|---|
| **Conectado** | `'true'` | Permite generar código sin modal |
| **Desconectado** | `'false'` o no existe | Muestra modal de conexión |
| **Esperando Confirmación** | Variable temp | Espera a que usuario confirme |

---

## Mensajes de Usuario

### Inglés (Backend)
```
"El plugin de Roblox Studio no está conectado. Por favor, conecta tu ID de usuario en el plugin para sincronizar código."
"El ID de usuario tiene un formato inválido. Por favor, verifica que hayas copiado correctamente el ID del navegador."
```

### Visual (Toast)
- ✅ "ID copiado"
- ✅ "Plugin conectado correctamente"
- ✅ "Ya puedes generar y sincronizar código"
- ⚠️ Mostrado como modal interactivo

---

## Cambios Realizados

### Frontend (`mini-lemonade/frontend/script.js`)
- ✅ Agregada variable global `pluginConnected = {}`
- ✅ Función `isPluginConnected(userId)`
- ✅ Función `setPluginConnected(userId, connected)`
- ✅ Función `showPluginConnectionModal(userId)`
- ✅ Función `confirmPluginConnection(userId)`
- ✅ Validación en `handleGenerate()` antes de procesar

### Backend (`mini-lemonade/backend/src/routes/generate.js`)
- ✅ Mensajes de error mejorados
- ✅ Información clara sobre cómo conectar
- ✅ Import de `dbGet` para futuras validaciones

---

## Testing Manual

### Caso 1: Primera vez, sin conexión
```
1. Abre http://localhost:3000
2. Escribe algo en el prompt
3. Haz clic en "Generar Sistema"
4. ✅ Debe mostrar el modal de conexión
5. ✅ El ID debe ser copiable
```

### Caso 2: Confirmar conexión
```
1. En el modal, haz clic en "Confirmar Conexión"
2. ✅ Modal se cierra
3. ✅ Notificación de éxito
4. ✅ Toast de confirmación
```

### Caso 3: Segunda vez, sin refrescar página
```
1. Intenta generar código nuevamente
2. ✅ NO debe mostrar modal (está en memoria)
3. ✅ Debe proceder con generación
```

### Caso 4: Refrescar página
```
1. F5 o refrescar navegador
2. Intenta generar código
3. ✅ Debe cargar del localStorage
4. ✅ NO debe mostrar modal (estado persistido)
```

### Caso 5: LocalStorage vacío
```
1. Abre DevTools > Application > Storage
2. Borra todo localStorage
3. Actualiza la página
4. Intenta generar
5. ✅ Debe mostrar modal nuevamente
```

---

## Futuras Mejoras

1. **Verificación en Tiempo Real**
   - Verificar conexión directa con plugin antes de generar
   - Ping periódico para validar que el plugin sigue conectado

2. **Estados más Granulares**
   - Conectado ✅
   - En Línea 🟢
   - Desconectado ⚪
   - Error ❌

3. **Base de Datos**
   - Guardar historial de conexiones
   - Registrar timestamp de última conexión
   - Detectar usuarios inactivos

4. **Sincronización Bidireccional**
   - Plugin confirma recepción de código
   - Notificación de éxito/error en tiempo real
   - Cola de espera si plugin está offline

---

## Commit

```
commit 99eb646
Feature: Agregar validación de conexión al plugin con modal interactivo

- Frontend: Funciones de validación y modal de conexión
- Backend: Mensajes mejorados en /generate
- LocalStorage: Persistencia de estado de conexión
- UX: Modal interactivo con instrucciones claras
```

---

**Status:** ✅ IMPLEMENTADO Y FUNCIONAL
