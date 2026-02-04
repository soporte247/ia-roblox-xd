# 🦈 GUÍA COMPLETA: Subir Plugin DataShark IA a Roblox Toolbox

## ⚠️ REQUISITOS PREVIOS

Antes de empezar, asegúrate de que tengas:
- [ ] Cuenta de Roblox Studio (registrada y verificada por email)
- [ ] Roblox Studio instalado (versión actual)
- [ ] Archivo `DataSharkPlugin.lua` en tu carpeta
- [ ] Backend DataShark IA corriendo en http://localhost:3000

---

## 📝 PASO 1: PREPARAR EL CONTENIDO DEL PLUGIN

### 1.1 Copia el archivo
```bash
📁 c:\Users\pezoa\OneDrive\Documentos\ia-roblox-xd\mini-lemonade\plugin\DataSharkPlugin.lua
```

Este archivo contiene TODO lo necesario para el plugin.

### 1.2 Verifica que tenga:
- ✅ DockWidget con interfaz visual
- ✅ Botón de toolbar
- ✅ Validación UUID
- ✅ URL configurable
- ✅ Progress bar
- ✅ Tema azul tiburón

---

## 🎮 PASO 2: CREAR EL PLUGIN EN ROBLOX STUDIO

### 2.1 Abre Roblox Studio
- File → New → Baseplate (o Template vacío)

### 2.2 Crea la estructura en Explorer
```
ServerStorage
└── Folder "DataSharkIA"
    └── Script "DataSharkPlugin" (Tipo: Plugin)
```

**¿Cómo cambiar el tipo a Plugin?**
1. Selecciona el Script
2. Ve a Properties → RunContext
3. Cambia de "Server" a "Plugin"

### 2.3 Copia el código
1. Abre `DataSharkPlugin.lua` en tu editor de texto
2. Selecciona TODO el contenido (Ctrl+A)
3. Cópialo (Ctrl+C)
4. En Roblox Studio, click en el script "DataSharkPlugin"
5. En el Source Code editor, selecciona todo (Ctrl+A)
6. Pégalo (Ctrl+V)

### 2.4 Guarda el lugar
- File → Save (Ctrl+S)
- Dale un nombre: "DataShark IA Plugin"

---

## 🚀 PASO 3: GUARDAR COMO MODELO PARA PUBLICAR

### 3.1 Selecciona la carpeta
En el Explorer, **haz click derecho en la carpeta "DataSharkIA"**

### 3.2 Opción "Save to Roblox..."
Click derecho → "Save to Roblox..."

Debe abrirse una ventana de publicación.

### 3.3 Llena los detalles

**Name (Nombre):**
```
DataShark IA - System Importer
```

**Description (Descripción):**
```
AI-powered Lua system generator for Roblox Studio.

⚡ Features:
• Import AI-generated Lua systems directly to Roblox Studio
• Supports: Attack, Shop, UI, Inventory, Quest systems
• Real-time code generation powered by local AI (Ollama)
• Configurable backend URL for custom servers
• Beautiful dark theme with visual feedback
• Automatic validation and error handling

🔧 How to use:
1. Generate a system in the DataShark IA web app
2. Copy your User ID from the web app
3. Open this plugin in Roblox Studio
4. Paste your User ID and click "Import System"
5. Scripts are automatically created in ServerScriptService

💻 Backend: http://localhost:3000
🦈 Version: 1.1.0

Tags: #AI #CodeGeneration #GameDevelopment #RobloxStudio
```

**Category (Categoría):**
- Selecciona: **Dev Tools** o **Plugins**

**Tags (Etiquetas):**
```
AI, Code Generator, Roblox, Development, Plugin, Lua, Game Systems
```

---

## 📊 PASO 4: SELECCIONAR VISIBILIDAD

### 4.1 Permisos de Acceso

**Si quieres que sea público (recomendado):**
- ✅ Public (Todos pueden verlo y descargarlo)

**Si prefieres privado:**
- Unlisted (Solo personas con el link)
- Private (Solo tú)

### 4.2 Confirmar detalles
- Verifica que esté marcado como **"Plugin"**
- Asegúrate de que el nombre sea "DataShark IA - System Importer"
- Revisa la descripción una última vez

---

## ✅ PASO 5: PUBLICAR

### 5.1 Click en "Submit" o "Publish"

El plugin se está subiendo...

### 5.2 Espera a que se complete
- Puede tomar de 5-30 segundos
- Deberías ver un mensaje de confirmación
- Se abrirá la página de tu plugin

### 5.3 Anota el URL
Copia el URL del plugin para compartir:
```
https://www.roblox.com/library/[ID]/DataShark-IA
```

---

## 🔍 PASO 6: VERIFICAR LA PUBLICACIÓN

### 6.1 En el Toolbox de Roblox Studio
1. Abre Roblox Studio
2. Click en **View** → **Toolbox**
3. Busca "DataShark IA"
4. Debería aparecer tu plugin

### 6.2 Instalar y probar
1. Click en tu plugin
2. Aparecerá un botón en la toolbar
3. Click en él para abrir el widget
4. Prueba la funcionalidad completa

---

## 🎁 PASO 7: COMPARTIR

### 7.1 Copia el URL
```
https://www.roblox.com/library/[ID]/DataShark-IA-System-Importer
```

### 7.2 Comparte en:
- Twitter/X
- Discord
- Foros de Roblox
- Comunidades de desarrollo

### 7.3 Ejemplo de post:
```
🦈 Acabo de publicar DataShark IA en la Roblox Toolbox!

Es un plugin de Roblox Studio que te permite generar 
sistemas Lua automáticamente usando inteligencia artificial.

✨ Características:
• Generador de sistemas AI-powered
• Soporte para 5 tipos de sistemas
• Interface visual intuitiva
• Totalmente configurable

Descárgalo ahora desde la Toolbox:
https://www.roblox.com/library/[ID]/DataShark-IA

¡Feedback bienvenido! 🚀
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ "No puedo encontrar Save to Roblox..."
**Solución:**
- Asegúrate de tener la carpeta seleccionada (no el script)
- La carpeta debe estar en ServerStorage o ReplicatedStorage
- Intenta hacer click derecho directamente en el Folder

### ❌ "El plugin no aparece en el Toolbox"
**Solución:**
- Espera 5-10 minutos (Roblox necesita tiempo para indexar)
- Cierra y reabre Roblox Studio
- Busca por "DataShark" (sin "IA")
- Revisa que esté publicado como "Public"

### ❌ "Error al cargar el archivo"
**Solución:**
- Verifica que `DataSharkPlugin.lua` esté completo (no corrompido)
- Abre el archivo en un editor de texto y comprueba que sea código Lua válido
- Copia línea por línea si hay problemas

### ❌ "El plugin se instala pero no funciona"
**Solución:**
- Verifica que el backend esté corriendo: http://localhost:3000
- Comprueba que HTTP Requests esté habilitado en Game Settings
- Revisa la consola de Roblox para mensajes de error

---

## 📋 CHECKLIST FINAL

Antes de publicar, verifica:

- [ ] Roblox Studio tiene la carpeta "DataSharkIA" creada
- [ ] El script "DataSharkPlugin" tiene tipo "Plugin"
- [ ] Todo el código de `DataSharkPlugin.lua` está copiado
- [ ] El nombre es "DataShark IA - System Importer"
- [ ] La descripción es clara y completa
- [ ] Las categorías/tags están configuradas
- [ ] Está marcado como "Public" (si lo quieres compartir)
- [ ] El backend está corriendo en http://localhost:3000
- [ ] Has probado el plugin localmente

---

## 🎉 ¡LISTO!

Una vez publicado, tu plugin estará disponible en:
```
Roblox Studio → View → Toolbox → Búsqueda: "DataShark IA"
```

¡Felicidades por publicar tu primer plugin! 🦈🎊

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa el archivo `INSTRUCCIONES.lua` para instalación local
2. Verifica que `DataSharkPlugin.lua` sea válido (sin cambios)
3. Asegúrate de que el backend esté corriendo
4. Revisa los logs en la terminal del backend

---

**DataShark IA v1.1.0** 🦈  
Publicación: Febrero 4, 2026
