-- Este archivo es solo informativo sobre los pasos de publicación

--[[
  PASOS PARA INSTALAR EL PLUGIN:
  
  OPCIÓN A - Instalación Local (Más Rápido):
  ==========================================
  1. Abre Roblox Studio
  2. Ve a: View → Plugins Folder (o presiona Alt+P)
  3. Copia DataSharkPlugin.lua en esa carpeta
  4. Reinicia Roblox Studio
  5. ¡El botón "Import System" aparecerá en tu toolbar!
  
  
  OPCIÓN B - Publicar en Roblox (Para compartir):
  ===============================================
  1. Abre Roblox Studio
  2. Crea un Folder llamado "DataSharkIA"
  3. Dentro, crea un Script
  4. En Properties del script, cambia RunContext a "Plugin"
  5. Copia el contenido de DataSharkPlugin.lua al script
  6. Selecciona el Folder "DataSharkIA"
  7. Click derecho → "Save to Roblox..."
  8. Configura:
     - Name: DataShark IA - System Importer
     - Type: Plugin
     - Category: Development
  9. Click Submit
  10. ¡Publicado! Ahora aparece en el Toolbox
  
  
  VERIFICAR QUE FUNCIONE:
  ======================
  1. El botón debe aparecer en el toolbar
  2. Click en el botón abre una ventana
  3. Pega tu User ID (de la web app)
  4. Click "Import System"
  5. Los scripts se importan a ServerScriptService
  
  
  REQUISITOS:
  ==========
  - HTTP Requests habilitado (Game Settings → Security)
  - Backend ejecutándose en http://localhost:3000
  - User ID válido de la web app
  
  
  ¿NECESITAS AYUDA?
  ================
  Lee los archivos:
  - README.md (instrucciones completas)
  - PUBLICACION_GUIA.md (guía paso a paso con imágenes)
]]

print("📖 Lee README.md para instrucciones de instalación")
