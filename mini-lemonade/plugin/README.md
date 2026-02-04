# DataShark IA - Plugin de Roblox Studio

## 📦 Instalación del Plugin

### Método 1: Instalación Local (Recomendado para desarrollo)

1. Abre Roblox Studio
2. Ve a: `Vista` → `Carpeta de Plugins` (o presiona `Alt+P`)
3. Copia el archivo `DataSharkPlugin.lua` en esa carpeta
4. Reinicia Roblox Studio
5. El plugin aparecerá en tu toolbar

### Método 2: Publicar en Roblox (Para compartir con otros)

1. Abre Roblox Studio
2. Crea un nuevo archivo o abre uno existente
3. En el Explorer, crea esta estructura:

```
Workspace (o cualquier lugar)
└── DataSharkIA
    └── DataSharkPlugin (Script tipo "Plugin")
```

4. Copia el contenido de `DataSharkPlugin.lua` en el script
5. Selecciona la carpeta "MiniLemonadeAI"
6. Click derecho → `Guardar en Roblox` o `Publish to Roblox`
7. Configura:
   - **Name:** DataShark IA Plugin
   - **Description:** AI-powered Lua system generator for Roblox
   - **Type:** Plugin
   - **Category:** Development
8. Publica como público o no listado
9. Ahora aparecerá en el Toolbox de Roblox Studio

### Método 3: Distribución Manual

1. En Roblox Studio, selecciona la carpeta con el plugin
2. Click derecho → `Export Selection...`
3. Guarda como `DataSharkPlugin.rbxm`
4. Comparte el archivo .rbxm con otros usuarios
5. Ellos pueden:
   - Hacer doble clic en el archivo (se abre en Roblox Studio)
   - Arrastrarlo a la carpeta de Plugins

## 🎯 Uso del Plugin

1. Click en el botón "Import System" en el toolbar
2. Pega tu User ID (de la web app)
3. Click "📥 Import System"
4. Los scripts se importan automáticamente

## ⚙️ Requisitos

- Roblox Studio actualizado
- HTTP Requests habilitados en Game Settings
- Backend de DataShark IA ejecutándose en `http://localhost:3000`

## 🔧 Configuración

El plugin guarda tu User ID automáticamente. Si necesitas cambiar la URL del backend, edita la variable `BASE_URL` en el código del plugin.

## 📝 Notas

- El plugin crea carpetas con timestamp para evitar sobrescribir
- Soporta undo/redo con ChangeHistoryService
- Muestra mensajes de estado claros
- Guarda configuración entre sesiones

## 🐛 Solución de Problemas

**"Failed to connect"**
- Verifica que el backend esté ejecutándose
- Revisa que HTTP Requests esté habilitado

**"No files available"**
- Genera un sistema primero en la web app
- Verifica que tu User ID sea correcto

**El plugin no aparece**
- Reinicia Roblox Studio
- Verifica que el archivo esté en la carpeta de plugins correcta
- El archivo debe tener extensión `.lua` o ser un `.rbxm`

## 📄 Licencia

MIT License - Libre para uso personal y comercial
