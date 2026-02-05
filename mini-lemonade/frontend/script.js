// LANDING PAGE LOGIC
const landingPage = document.getElementById('landingPage');
const appContainer = document.getElementById('appContainer');
const startBtn = document.getElementById('startBtn');
const startBtn2 = document.getElementById('startBtn2');

function hideLanding() {
  landingPage.style.display = 'none';
  appContainer.style.display = 'block';
}

function showLanding() {
  landingPage.style.display = 'block';
  appContainer.style.display = 'none';
}

// Always show landing page unless user is authenticated via OAuth
// Only OAuth login should hide the landing page

if (startBtn) {
  startBtn.addEventListener('click', () => {
    hideLanding();
  });
}

if (startBtn2) {
  startBtn2.addEventListener('click', () => {
    hideLanding();
  });
}

const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');
const historyBtn = document.getElementById('historyBtn');
const templatesBtn = document.getElementById('templatesBtn');
const mapsBtn = document.getElementById('mapsBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const saveCodeBtn = document.getElementById('saveCodeBtn');
const promptInput = document.getElementById('prompt');
const systemTypeSelect = document.getElementById('systemType');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');
const codeViewer = document.getElementById('codeViewer');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const historyModal = document.getElementById('historyModal');
const templatesModal = document.getElementById('templatesModal');
const mapsModal = document.getElementById('mapsModal');

const API_URL = 'http://localhost:3000';
let currentFiles = {};
let userId = null;
let isCodeEditable = false;

// Get or create userId
function getUserId() {
  if (!userId) {
    userId = localStorage.getItem('dataSharkUserId');
    if (!userId) {
      userId = generateUUID();
      localStorage.setItem('dataSharkUserId', userId);
    }
  }
  return userId;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Dark mode
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  darkModeToggle.textContent = '☀️';
}

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  darkModeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Event listeners
generateBtn.addEventListener('click', handleGenerate);
clearBtn.addEventListener('click', handleClear);
copyBtn.addEventListener('click', handleCopy);
exportBtn.addEventListener('click', handleExport);
historyBtn.addEventListener('click', showHistory);
templatesBtn.addEventListener('click', showTemplates);
mapsBtn.addEventListener('click', showMapsGenerator);
saveCodeBtn.addEventListener('click', saveEditedCode);

// Autoguardado con debounce
promptInput.addEventListener('input', () => {
  window.optimizer.debounce('savePrompt', () => {
    localStorage.setItem('lastPrompt', promptInput.value);
  }, 1000);
});

// Restaurar último prompt
const lastPrompt = localStorage.getItem('lastPrompt');
if (lastPrompt && !promptInput.value) {
  promptInput.value = lastPrompt;
}

// Ctrl+Enter para generar
promptInput.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    handleGenerate();
  }
});

// Modal close handlers
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    historyModal.classList.add('hidden');
    templatesModal.classList.add('hidden');
    mapsModal.classList.add('hidden');
  });
});

// Close modals on outside click
[historyModal, templatesModal, mapsModal].forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
});

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${targetTab}-tab`).classList.add('active');
  });
});

// Check server status
checkServerStatus();

async function handleGenerate() {
  const prompt = promptInput.value.trim();
  const systemType = systemTypeSelect.value;

  if (!prompt) {
    window.optimizer.showNotification('⚠️ Por favor, escribe una descripción del sistema', 'warning');
    return;
  }

  // Validar prompt
  if (prompt.length < 3) {
    window.optimizer.showNotification('⚠️ Descripción muy corta (mínimo 3 caracteres)', 'warning');
    return;
  }

  if (prompt.length > 2000) {
    window.optimizer.showNotification('⚠️ Descripción muy larga (máximo 2000 caracteres)', 'warning');
    return;
  }

  showLoading(true);
  resultDiv.innerHTML = '';
  generateBtn.disabled = true;
  generateBtn.classList.add('btn-loading');

  const startTime = performance.now();

  try {
    // Verificar si existe en caché
    const cacheKey = `generate-${systemType}-${prompt}`;
    const cached = window.optimizer.cacheGet(cacheKey);
    
    if (cached) {
      console.log('✅ Usando respuesta cacheada');
      await new Promise(resolve => setTimeout(resolve, 300)); // Simular carga
      displaySuccess(cached);
      window.optimizer.showNotification('⚡ Cargado desde caché', 'success');
      copyBtn.classList.remove('hidden');
      exportBtn.classList.remove('hidden');
      showLoading(false);
      generateBtn.disabled = false;
      generateBtn.classList.remove('btn-loading');
      return;
    }

    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt, 
        systemType: systemType !== 'auto' ? systemType : undefined,
        userId: getUserId()
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const duration = Math.round(performance.now() - startTime);
    console.log(`⏱️ Generación completada en ${duration}ms`);

    if (data.success) {
      // Guardar en caché
      window.optimizer.cacheSet(cacheKey, data, 300000); // 5 minutos
      
      await fetchGeneratedFiles();
      displaySuccess(data);
      copyBtn.classList.remove('hidden');
      exportBtn.classList.remove('hidden');
      window.optimizer.showNotification('✅ Sistema generado exitosamente', 'success');
    } else {
      showResult(`❌ ${data.result.message}`, 'error');
      window.optimizer.showNotification('❌ Error al generar sistema', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showResult(
      `❌ Error de conexión: ${error.message}<br><br>Verifica que el backend esté ejecutándose en ${API_URL}`,
      'error'
    );
    window.optimizer.showNotification('❌ Error de conexión con el servidor', 'error');
  } finally {
    showLoading(false);
    generateBtn.disabled = false;
    generateBtn.classList.remove('btn-loading');
  }
}

function displaySuccess(data) {
  const { type, result } = data;
  let html = `<strong>✅ Éxito!</strong><br><br>`;
  html += `<strong>Tipo de sistema:</strong> ${type}<br>`;
  html += `<strong>Mensaje:</strong> ${result.message}<br><br>`;
  
  // Agregar botón para enviar al plugin
  html += `<button id="sendToPluginBtn" class="btn btn-primary" style="margin: 10px 0;">🦈 Enviar al Plugin (Inyección Automática)</button><br><br>`;

  if (result.files && result.files.length > 0) {
    html += `<strong>Archivos generados:</strong><br>`;
    html += `<pre>${result.files.join('\n')}</pre>`;
  }

  if (result.directory) {
    html += `<strong>Directorio:</strong><br>`;
    html += `<pre>${result.directory}</pre>`;
  }

  html += `<br><em>Los archivos están listos para ser descargados o consumidos por el plugin de Roblox.</em>`;

  showResult(html, 'success');
  
  // Configurar botón de envío al plugin
  const sendBtn = document.getElementById('sendToPluginBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      sendCodeToPlugin(data, type);
    });
  }
}

function showResult(message, type = 'info') {
  resultDiv.innerHTML = message;
  resultDiv.className = `result ${type}`;
}

function showLoading(show) {
  loadingDiv.classList.toggle('hidden', !show);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 4px;
    z-index: 10000;
    max-width: 300px;
    word-wrap: break-word;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-in-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function fetchGeneratedFiles() {
  try {
    const response = await fetch(`${API_URL}/fetch?userId=${getUserId()}`);
    const data = await response.json();
    
    if (data.files && Object.keys(data.files).length > 0) {
      currentFiles = data.files;
      displayCode(data.files);
    }
  } catch (error) {
    console.error('Error fetching files:', error);
  }
}

function displayCode(files) {
  let html = '';
  for (const [filename, content] of Object.entries(files)) {
    html += `
      <div class="code-file" data-filename="${filename}">
        <div class="code-file-header">
          📄 ${filename}
          <div class="code-file-actions">
            <button onclick="toggleEdit('${filename}')">✏️ Editar</button>
          </div>
        </div>
        <div class="code-content">
          <pre><code>${escapeHtml(content)}</code></pre>
        </div>
      </div>
    `;
  }
  codeViewer.innerHTML = html;
}

window.toggleEdit = function(filename) {
  const fileDiv = document.querySelector(`[data-filename="${filename}"]`);
  const contentDiv = fileDiv.querySelector('.code-content');
  const currentContent = currentFiles[filename];
  
  if (!isCodeEditable) {
    contentDiv.innerHTML = `<textarea class="code-editor">${escapeHtml(currentContent)}</textarea>`;
    isCodeEditable = true;
    saveCodeBtn.classList.remove('hidden');
  } else {
    const textarea = contentDiv.querySelector('textarea');
    currentFiles[filename] = textarea.value;
    contentDiv.innerHTML = `<pre><code>${escapeHtml(textarea.value)}</code></pre>`;
    isCodeEditable = false;
  }
};

async function saveEditedCode() {
  try {
    const response = await fetch(`${API_URL}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: getUserId(), files: currentFiles }),
    });

    if (response.ok) {
      showResult('✅ Código guardado correctamente', 'success');
      saveCodeBtn.classList.add('hidden');
      isCodeEditable = false;
      displayCode(currentFiles);
    }
  } catch (error) {
    showResult('❌ Error al guardar: ' + error.message, 'error');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function handleCopy() {
  const allCode = Object.entries(currentFiles)
    .map(([name, content]) => `-- ${name}\n${content}`)
    .join('\n\n---\n\n');
  
  const success = await window.optimizer.copyToClipboard(allCode);
  
  if (success) {
    window.optimizer.showNotification('✅ Código copiado al portapapeles', 'success');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅ Copiado!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 2000);
  } else {
    window.optimizer.showNotification('❌ Error al copiar código', 'error');
  }
}

function handleClear() {
  promptInput.value = '';
  resultDiv.innerHTML = '';
  resultDiv.className = 'result';
  codeViewer.innerHTML = '<p class="empty-state">Genera un sistema para ver el código aquí</p>';
  copyBtn.classList.add('hidden');
  exportBtn.classList.add('hidden');
  currentFiles = {};
  window.optimizer.showNotification('🗑️ Formulario limpiado', 'info');
  currentFiles = {};
  copyBtn.classList.add('hidden');
  exportBtn.classList.add('hidden');
  saveCodeBtn.classList.add('hidden');
  isCodeEditable = false;
  promptInput.focus();
}

async function handleExport() {
  window.open(`${API_URL}/export?userId=${getUserId()}`, '_blank');
}

async function showHistory() {
  try {
    // Obtener historial sincronizado (que incluye plugin + web)
    const userId = getUserId();
    const response = await fetch(`${API_URL}/api/sync-history/${userId}?limit=30`);
    const data = await response.json();
    
    const historyList = document.getElementById('historyList');
    
    if (!data.success || !data.history || data.history.length === 0) {
      historyList.innerHTML = '<p class="empty-state">No hay historial aún</p>';
    } else {
      historyList.innerHTML = data.history.map((item, idx) => `
        <div class="history-item" onclick="loadFromHistory(${item.id})">
          <div class="history-item-header">
            <span class="history-item-title">${(item.systemType || 'unknown').toUpperCase()} System</span>
            <span class="history-item-date">${new Date(item.createdAt).toLocaleString()}</span>
            <span class="history-source" style="font-size: 0.8em; color: #888; margin-left: auto;">
              ${item.source === 'plugin' ? '🦈 Plugin' : '💻 Web'}
            </span>
          </div>
          <div class="history-item-prompt">${item.originalPrompt.substring(0, 100)}...</div>
          ${item.answers ? `<small>${item.answers.length} respuestas</small>` : ''}
        </div>
      `).join('');
    }
    
    historyModal.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading history:', error);
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<p class="empty-state">Error al cargar historial</p>';
  }
}

window.loadFromHistory = function(id) {
  const userId = getUserId();
  fetch(`${API_URL}/api/sync-history/${userId}`)
    .then(r => r.json())
    .then(data => {
      const item = data.history.find(h => h.id === id);
      if (item) {
        currentFiles = item.files;
        displayCode(item.files);
        promptInput.value = item.prompt;
        systemTypeSelect.value = item.type;
        copyBtn.classList.remove('hidden');
        exportBtn.classList.remove('hidden');
        historyModal.classList.add('hidden');
        
        // Switch to code tab
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        document.querySelector('[data-tab="code"]').classList.add('active');
        document.getElementById('code-tab').classList.add('active');
      }
    });
};

async function showTemplates() {
  try {
    const response = await fetch(`${API_URL}/templates`);
    const data = await response.json();
    
    const templatesList = document.getElementById('templatesList');
    
    templatesList.innerHTML = data.templates.map(template => `
      <div class="template-item" onclick="loadTemplate('${template.id}')">
        <div class="template-item-header">
          <span class="template-item-title">${template.name}</span>
        </div>
        <div class="template-item-description">${template.description}</div>
      </div>
    `).join('');
    
    templatesModal.classList.remove('hidden');
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

window.loadTemplate = async function(templateId) {
  const response = await fetch(`${API_URL}/templates`);
  const data = await response.json();
  const template = data.templates.find(t => t.id === templateId);
  
  if (template) {
    promptInput.value = template.prompt;
    systemTypeSelect.value = template.type;
    templatesModal.classList.add('hidden');
    promptInput.focus();
  }
};

async function checkServerStatus() {
  try {
    const response = await fetch(API_URL);
    if (response.ok) {
      document.getElementById('serverStatus').textContent = '🟢 Conectado';
    }
  } catch (error) {
    document.getElementById('serverStatus').textContent = '🔴 Desconectado';
  }
}

// Display userId for plugin
function displayUserId() {
  const userIdDisplay = document.createElement('div');
  userIdDisplay.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 0.85em; max-width: 300px;';
  userIdDisplay.innerHTML = `
    <strong>🔑 Tu User ID:</strong><br>
    <code style="background: #f5f5f5; padding: 5px; border-radius: 3px; display: block; margin: 8px 0; word-break: break-all;">${getUserId()}</code>
    <button id="copyUserId" style="padding: 6px 12px; background: #FFD700; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">📋 Copiar</button>
    <p style="margin: 8px 0 0 0; font-size: 0.9em; color: #666;">Usa este ID en el plugin de Roblox Studio</p>
  `;
  document.body.appendChild(userIdDisplay);
  
  document.getElementById('copyUserId').addEventListener('click', () => {
    navigator.clipboard.writeText(getUserId());
    document.getElementById('copyUserId').textContent = '✅ Copiado!';
    setTimeout(() => {
      document.getElementById('copyUserId').textContent = '📋 Copiar';
    }, 2000);
  });
}

setTimeout(displayUserId, 1000);

// ============================================
// MAPS GENERATOR FUNCTIONS
// ============================================

async function showMapsGenerator() {
  mapsModal.classList.remove('hidden');
  setupMapsEventListeners();
}

function setupMapsEventListeners() {
  const generateMapBtn = document.getElementById('generateMapBtn');
  const presetBtns = document.querySelectorAll('.preset-btn');

  generateMapBtn.addEventListener('click', generateCustomMap);

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      generatePresetMap(type);
    });
  });
}

async function generateCustomMap() {
  const description = document.getElementById('mapDescription').value;
  const width = parseInt(document.getElementById('mapWidth').value) || 20;
  const height = parseInt(document.getElementById('mapHeight').value) || 15;

  if (!description.trim()) {
    showToast('Por favor describe el mapa que deseas', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/maps/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        width,
        height,
        format: 'all',
      }),
    });

    const data = await response.json();

    if (data.success) {
      displayMapResult(data);
    } else {
      showToast('Error generando mapa: ' + data.error, 'error');
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

async function generatePresetMap(type) {
  try {
    const width = parseInt(document.getElementById('mapWidth').value) || 20;
    const height = parseInt(document.getElementById('mapHeight').value) || 15;

    const response = await fetch(`${API_URL}/api/maps/generate/${type}?width=${width}&height=${height}`);
    const data = await response.json();

    if (data.success) {
      displayMapResult(data);
    } else {
      showToast('Error generando mapa', 'error');
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

function displayMapResult(data) {
  const outputDiv = document.getElementById('mapOutput');
  const vizDiv = document.getElementById('mapVisualization');

  let html = `
    <div class="map-result">
      <h3>🗺️ Mapa Generado</h3>
      <div class="map-ascii">
        <pre>${data.map.ascii || data.map}</pre>
      </div>
  `;

  if (data.map.legend) {
    html += `
      <div class="map-legend">
        <h4>Leyenda:</h4>
        <pre>${data.map.legend}</pre>
      </div>
    `;
  }

  html += `
    <div class="map-controls">
      <button class="btn btn-primary copy-map-btn">📋 Copiar Mapa ASCII</button>
      <button class="btn btn-secondary download-lua-btn">💾 Descargar Código Lua</button>
    </div>
  `;

  if (data.svg) {
    html += `
      <h3>Visualización SVG</h3>
      <div class="svg-container">${data.svg}</div>
    `;
  }

  html += '</div>';

  outputDiv.innerHTML = html;
  vizDiv.classList.add('hidden');

  // Setup button listeners
  document.querySelector('.copy-map-btn').addEventListener('click', () => {
    const mapASCII = data.map.ascii || data.map;
    navigator.clipboard.writeText(mapASCII);
    showToast('✅ Mapa copiado al portapapeles', 'success');
  });

  document.querySelector('.download-lua-btn').addEventListener('click', () => {
    if (data.lua) {
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data.lua));
      element.setAttribute('download', `map_${Date.now()}.lua`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('✅ Código Lua descargado', 'success');
    }
  });
}

// ============================================
// CODE INJECTION FUNCTIONS
// ============================================

async function sendCodeToPlugin(data, systemType) {
  const userId = getUserId();
  
  if (!userId) {
    showToast('❌ Usuario no identificado', 'error');
    return;
  }

  try {
    // Obtener el código generado (está en los archivos)
    let code = '';
    
    // Buscar código en el resultado
    if (data.result && data.result.code) {
      code = data.result.code;
    } else if (data.files && typeof data.files === 'object') {
      // Si hay múltiples archivos, concatenarlos
      for (const [filename, content] of Object.entries(data.files)) {
        if (typeof content === 'string') {
          code += `-- File: ${filename}\n${content}\n\n`;
        }
      }
    }

    if (!code || code.length === 0) {
      showToast('❌ No hay código para inyectar', 'error');
      return;
    }

    showToast('⏳ Enviando código al plugin...', 'info');

    const response = await fetch(`${API_URL}/api/plugin/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sessionId: generateUUID(),
        code,
        systemType,
        description: promptInput.value || 'Sistema generado con DataShark IA'
      }),
    });

    const result = await response.json();

    if (result.success) {
      showToast(`✅ Código enviado al plugin para inyección en Roblox Studio`, 'success');
      showToast(`📍 El código se inyectará en: ${result.injection.target}`, 'success');
    } else {
      showToast(`❌ Error: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error enviando al plugin:', error);
    showToast(`❌ Error de conexión: ${error.message}`, 'error');
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Welcome message
console.log('🦈 DataShark IA Frontend loaded');
console.log(`Connecting to API at ${API_URL}`);
console.log(`Your User ID: ${getUserId()}`);
console.log('✅ Code Injection System READY');
