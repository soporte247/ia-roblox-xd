# ✅ Checklist de Pruebas - DataShark IA v1.1

## 🧪 Pruebas del Backend

### Servidor
- [ ] Backend inicia correctamente en http://localhost:3000
- [ ] Mensaje "🦈 DataShark IA running on http://localhost:3000" aparece en consola
- [ ] Sin errores en la salida

### Endpoint `/generate`
- [ ] Valida UUID inválido (debe retornar error 400)
- [ ] Valida prompt vacío (debe retornar error 400)
- [ ] Valida prompt muy largo (>1000 chars, debe retornar error 400)
- [ ] Genera sistema correctamente con prompt válido
- [ ] Respuesta incluye campo `duration`
- [ ] Respuesta incluye campo `method`
- [ ] Logging muestra `[Generator]` en consola

#### Prueba de ejemplo:
```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "prompt": "sistema de ataque básico",
    "systemType": "attack"
  }'
```

### Endpoint `/fetch`
- [ ] Valida UUID inválido (debe retornar error 400)
- [ ] Valida userId faltante (debe retornar error 400)
- [ ] Retorna archivos generados correctamente
- [ ] Respuesta incluye `fileCount`
- [ ] Respuesta incluye `systemName`
- [ ] Logging muestra `[Fetch]` en consola

#### Prueba de ejemplo:
```bash
curl "http://localhost:3000/fetch?userId=550e8400-e29b-41d4-a716-446655440000"
```

### Ollama
- [ ] Ollama está corriendo
- [ ] Modelo qwen2.5-coder:7b instalado
- [ ] Timeout funciona (después de 60s)
- [ ] Retry logic funciona (2 intentos)
- [ ] Fallback a template funciona si falla

---

## 🎮 Pruebas del Plugin de Roblox

### Instalación
- [ ] Archivo `DataSharkPlugin.lua` existe
- [ ] Plugin se copia a carpeta de plugins de Roblox
- [ ] Roblox Studio se reinicia
- [ ] Botón "DataShark IA" aparece en toolbar

### UI del Widget
- [ ] Widget se abre al hacer clic en el botón
- [ ] Header azul (#1E88E5) con emoji 🦈
- [ ] Campo "User ID" visible y funcional
- [ ] Campo "Backend URL" visible con placeholder
- [ ] Botón "📥 Import System" en azul
- [ ] Botón "🔄 Refresh" en verde
- [ ] Botón "⚙️ Info" en gris
- [ ] Área de status en negro

### Validación de Entrada
- [ ] User ID vacío muestra error
- [ ] User ID con formato incorrecto muestra error
- [ ] User ID válido (UUID) es aceptado
- [ ] URL se guarda automáticamente al perder focus

### Funcionalidad de Import
- [ ] Progress bar aparece al importar
- [ ] Progress bar se anima de 0% a 100%
- [ ] Mensaje de status cambia durante importación
- [ ] Archivos se importan correctamente
- [ ] Folder `DataSharkSystem_YYYYMMDD_HHMMSS` se crea
- [ ] Scripts se crean dentro del folder
- [ ] Lista de archivos se muestra en status
- [ ] Tiempo de importación se muestra
- [ ] Botón se vuelve verde brevemente al completar

### Manejo de Errores
- [ ] HTTP Requests deshabilitado detectado
- [ ] Error de conexión muestra mensaje claro
- [ ] Timeout muestra mensaje apropiado
- [ ] Retry automático funciona
- [ ] Mensaje final después de 3 intentos fallidos

### Botón Refresh
- [ ] Botón cambia a "⏳ Checking..." al hacer clic
- [ ] Verifica si hay nuevos archivos
- [ ] Retorna a "🔄 Refresh" después de completar
- [ ] No permite múltiples clics simultáneos

### Botón Info
- [ ] Muestra URL actual del backend
- [ ] Muestra estado de HTTP Requests
- [ ] Muestra versión del plugin (1.0.0)
- [ ] Se puede cerrar y reabrir

### Persistencia
- [ ] User ID se guarda al cambiar de campo
- [ ] User ID se carga al abrir Roblox Studio
- [ ] Backend URL se guarda y carga correctamente
- [ ] Settings persisten entre sesiones

---

## 🌐 Pruebas del Frontend

### Página Principal
- [ ] http://localhost:3000 carga correctamente
- [ ] Título "🦈 DataShark IA" visible
- [ ] User ID se genera automáticamente
- [ ] User ID se muestra en esquina inferior derecha
- [ ] Modo oscuro funciona

### Generación de Sistemas
- [ ] Selector de tipo de sistema funciona
- [ ] TextArea de prompt acepta entrada
- [ ] Botón "Generate" funciona
- [ ] Status se actualiza durante generación
- [ ] Archivos generados se muestran en tab "Result"

### Tabs
- [ ] Tab "Result" muestra archivos generados
- [ ] Tab "Code" permite editar código
- [ ] Tab "Info" muestra información del sistema
- [ ] Tabs cambian correctamente

### Funciones Adicionales
- [ ] Botón "History" muestra generaciones previas
- [ ] Botón "Templates" muestra plantillas
- [ ] Botón "Export ZIP" descarga archivos
- [ ] Modo oscuro persiste entre recargas

---

## 🔍 Pruebas de Integración

### Flujo Completo: Web → Backend → Plugin
1. [ ] Abrir http://localhost:3000
2. [ ] Copiar User ID de la esquina
3. [ ] Escribir prompt: "sistema de ataque con cooldown"
4. [ ] Seleccionar tipo "Attack"
5. [ ] Click en "Generate"
6. [ ] Verificar que se generan archivos
7. [ ] Abrir Roblox Studio
8. [ ] Abrir plugin DataShark IA
9. [ ] Pegar User ID
10. [ ] Click en "Import System"
11. [ ] Verificar que aparece folder con scripts
12. [ ] Verificar contenido de scripts

### Casos Edge
- [ ] Usuario sin archivos generados
- [ ] Usuario con múltiples sistemas
- [ ] Backend apagado (error de conexión)
- [ ] Ollama apagado (fallback a template)
- [ ] Prompt muy largo (validación)
- [ ] UUID inválido (validación)
- [ ] HTTP Requests deshabilitado

---

## 📊 Resultados Esperados

### Performance
- ⏱️ **Generación con Ollama:** 5-30 segundos
- ⏱️ **Generación con Template:** <1 segundo
- ⏱️ **Import a Roblox:** 1-3 segundos
- ⏱️ **API Response:** <100ms (sin generación)

### Archivos Generados
- 📁 **AttackSystem:** 4 archivos (.lua)
- 📁 **ShopSystem:** 3-4 archivos
- 📁 **UISystem:** 3-4 archivos
- 📁 **InventorySystem:** 3-4 archivos
- 📁 **QuestSystem:** 3-4 archivos

### Logging
```
🦈 DataShark IA running on http://localhost:3000
[Generate] Request from user 550e8400... - Type: attack
[Generator] Starting generation { type: 'attack', userId: '550e8400...', hasPrompt: true }
[Generator] Using Ollama for generation
[Generator] Ollama attempt 1/2
[Generator] Ollama generation successful { fileCount: 4 }
[Generator] Generation completed { method: 'ollama', filesWritten: 4 }
[Generate] Completed in 12345ms - Success: true
```

---

## ✅ Estado General

- [ ] **Backend**: Sin errores
- [ ] **Frontend**: Sin errores en consola del navegador
- [ ] **Plugin**: Sin errores en Output de Roblox
- [ ] **Ollama**: Responde correctamente
- [ ] **Archivos**: Se crean en estructura correcta
- [ ] **Logs**: Informativos y claros

---

**Nota**: Marca cada ítem al completarlo. Cualquier fallo debe ser documentado y corregido.

**DataShark IA v1.1.0** 🦈
