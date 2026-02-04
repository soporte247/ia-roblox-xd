# 🦈 DataShark IA Plugin - Guía de Instalación y Uso

## 📥 Instalación

### Opción 1: Instalación en Roblox Studio (Recomendado)

1. **Descarga el plugin**
   - Ubica el archivo `DataSharkPlugin.lua`
   - Carpeta: `mini-lemonade/plugin/`

2. **Copia el plugin**
   - Abre explorador de archivos
   - Ve a: `C:\Users\TU_USUARIO\AppData\Local\Roblox\Plugins`
   - Pega el archivo `DataSharkPlugin.lua`

3. **Reinicia Roblox Studio**
   - Cierra y abre Studio
   - El plugin debería aparecer en la toolbar

4. **Activa el plugin**
   - Studio → View → Plugins → Manage Plugins
   - Busca "DataShark IA"
   - Asegúrate que esté habilitado (✓)

### Opción 2: Instalación Manual

1. En Roblox Studio:
   - **Home** → **Settings** → **Studio Settings**
   - Ve a **Plugins**
   - Click en "Install Plugin"
   - Selecciona `DataSharkPlugin.lua`

---

## 🎮 Uso Básico

### Abrir el Plugin
1. En la toolbar superior, busca "DataShark IA"
2. Click en el botón 🦈
3. Se abrirá una ventana flotante

### Generar tu Primer Sistema

#### Paso 1: Describir tu idea
```
Escribe en el cuadro de texto:
"Sistema de ataque con daño crítico y cooldown"
```

#### Paso 2: Generar preguntas
```
Click: "🤖 Generar Preguntas"
Espera 5-10 segundos
La IA analizará tu idea
```

#### Paso 3: Responder preguntas
```
Lee las preguntas generadas
Completa al menos 2 respuestas
Sé específico y claro
```

#### Paso 4: Generar código
```
Click: "✨ Generar Código"
Espera 10-20 segundos
Los scripts se crearán automáticamente
```

#### Resultado
```
Los archivos aparecerán en:
ServerScriptService → DataShark_[tipo]_[timestamp]
  ├── AttackService
  ├── DamageService
  └── CooldownService
```

---

## ⚙️ Configuración

### Cambiar URL del Backend

#### Para desarrollo local:
1. Click en tab "⚙️ Configuración"
2. En "URL del Backend" escribe: `http://localhost:3000`
3. Click "💾 Guardar URL"

#### Para producción:
1. URL por defecto: `https://datashark-ia2.onrender.com`
2. Se guarda automáticamente

### Gestionar Historial
1. Tab "⚙️ Configuración"
2. Verás las últimas 20 generaciones
3. Cada entrada muestra:
   - Fecha y hora
   - Descripción del sistema
   - Tipo de sistema
   - Número de archivos generados

Para limpiar:
```
Click: "🗑️ Limpiar Historial"
```

---

## ⚠️ Solución de Problemas

### Error: "HTTP no habilitado"
```
Solución:
1. Game → Game Settings
2. Security → Marcar "Allow HTTP Requests"
3. Reinicia Studio
```

### Error: "Error de conexión"
```
Verificar:
1. Conexión a internet activa
2. URL del backend es correcta (Tab config)
3. Backend está online
4. Intenta cambiar a producción (https://datashark-ia2.onrender.com)
```

### Plugin no aparece en toolbar
```
Solución:
1. Abre Roblox Studio
2. Home → Settings → Studio Settings
3. Busca "DataShark" en la lista
4. Habilita (✓) y reinicia
```

### Los scripts no se crean
```
Verificar:
1. Tienes acceso a ServerScriptService
2. Hay espacio disponible en el árbol
3. Revisa la consola de Output para errores
4. Intenta con menos preguntas/respuestas
```

### Respuestas perdidas
```
Nota: Si refrescas la página, las respuestas se pierden.
Solución: Genera el código inmediatamente después de responder.
```

---

## 📊 Información del Plugin

### Versión
- **Actual:** v3.0
- **Tipo:** Roblox Studio Plugin
- **Lenguaje:** Lua
- **Tamaño:** ~20KB

### Características
- ✅ Generación de preguntas con IA
- ✅ Generación de código automática
- ✅ Historial persistente
- ✅ Configuración personalizada
- ✅ Retry automático (3 intentos)
- ✅ Timeout de 30 segundos
- ✅ Feedback visual en tiempo real

### Requisitos Mínimos
- Roblox Studio actualizado
- Conexión a internet
- HTTP habilitado en seguridad

---

## 🎯 Casos de Uso

### 1. Crear Sistema de Ataque
```
Entrada: "Sistema de ataque con crítico y knockback"

Preguntas típicas:
- ¿Qué tan frecuente debe ser el crítico?
- ¿Cuánto knockback aplicar?
- ¿Animación antes o después?

Resultado: Scripts listos para usar en tu juego
```

### 2. Crear Sistema de Defensa
```
Entrada: "Sistema de escudo con durabilidad"

Preguntas típicas:
- ¿Cuánta durabilidad máxima?
- ¿Regeneración automática?
- ¿Efectos visuales?

Resultado: Scripts de defensa funcionales
```

### 3. Crear Sistema de Cooldown
```
Entrada: "Sistema de cooldown entre ataques"

Preguntas típicas:
- ¿Duración del cooldown?
- ¿Mostrar tiempo restante?
- ¿Efecto visual?

Resultado: Sistema de cooldown integrado
```

---

## 💡 Tips Útiles

### Mejores Descripciones
```
❌ "Sistema de ataque"          (Muy vago)
✅ "Sistema de ataque rápido    (Específico)
   con crítico x2 y knockback"

❌ "Haz un cooldown"             (Poco detalle)
✅ "Cooldown de 5 segundos      (Claro y preciso)
   con indicador visual"
```

### Respuestas Efectivas
```
✅ Sé específico:
   - "5 segundos" en lugar de "rápido"
   - "20% de crítico" en lugar de "mucho"
   - "Física realista" en lugar de "normal"

✅ Completa al menos 2 respuestas:
   - Más respuestas = mejor resultado
   - Máximo 10 preguntas
   - Calidad > cantidad
```

### Verificar Resultados
```
1. Los scripts se crean en ServerScriptService
2. Abre un script para revisar el código
3. Si hay errores, verás en Output
4. Puedes editar y mejorar el código después
```

---

## 🔄 Flujo Completo

```
┌─────────────────────────────────────┐
│  1. Describe tu sistema             │
│     (3-2000 caracteres)             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  2. Genera preguntas con IA         │
│     (Aguarda 5-10 segundos)         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  3. Responde preguntas              │
│     (Mínimo 2, máximo 10)           │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  4. Genera código Lua               │
│     (Aguarda 10-20 segundos)        │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  5. Scripts en ServerScriptService   │
│     ✅ Listos para usar             │
└─────────────────────────────────────┘
```

---

## 📈 Métricas

### Velocidad
- Generar preguntas: ~7 segundos
- Generar código: ~15 segundos
- Total: ~22 segundos

### Confiabilidad
- Tasa de éxito: 95%+ (con retry)
- Timeout por solicitud: 30 segundos
- Reintentos automáticos: 3

### Persistencia
- Historial guardado: 20 últimas generaciones
- URL guardada: Automáticamente
- Session ID: Único por plugin

---

## 🆘 Support

### Ver Logs Detallados
1. **View** → **Output**
2. Abre Output Panel
3. Verás logs del plugin:
   ```
   [14:32:15] [SUCCESS] DataShark IA Plugin v3.0 cargado...
   [14:32:16] [INFO] Session ID: abc123xyz...
   [14:32:17] [INFO] Backend: https://datashark-ia2...
   ```

### Reportar Problemas
Si encuentras un error:
1. Nota la hora exacta
2. Copia el mensaje de error
3. Verifica el log en Output
4. Intenta reproducir el error

---

## 📚 Recursos Adicionales

- **Documentación de Mejoras:** `MEJORAS_PLUGIN_v3.md`
- **Backend API:** https://github.com/soporte247/ia-roblox-xd
- **Ejemplos de Sistemas:** Carpeta `generated/`

---

## ✅ Checklist de Instalación

- [ ] Archivo copiad a carpeta Plugins
- [ ] Studio reiniciado
- [ ] Plugin habilitado en Manage Plugins
- [ ] Botón 🦈 visible en toolbar
- [ ] HTTP habilitado en seguridad
- [ ] Internet conectado
- [ ] Primer sistema creado exitosamente

---

**Versión:** 3.0
**Fecha:** 2024
**Estado:** ✅ Producción
**Licencia:** MIT
