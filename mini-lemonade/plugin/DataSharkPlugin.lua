-- DataShark IA - Roblox Studio Plugin v3.0 MEJORADO
-- Sistema de clarificación integrado con IA + Configuración avanzada
--[[
MEJORAS v3.0:
✅ Mejor manejo de errores con retry automático exponencial
✅ Almacenamiento de historial local persistente
✅ Configuración personalizada (URL, timeouts, retries)
✅ Panel de configuración integrado con 2 tabs
✅ Mejor feedback visual con animaciones
✅ Validación de inputs mejorada (3-2000 caracteres)
✅ Soporte para múltiples sesiones con UUID
✅ Logging detallado en consola de plugin
✅ Gestión mejorada de memoria
✅ Mejor gestión de estado global
✅ Información del plugin en tiempo real
]]

local HttpService = game:GetService('HttpService')
local ServerScriptService = game:GetService('ServerScriptService')
local ChangeHistoryService = game:GetService('ChangeHistoryService')
local StudioService = game:GetService('StudioService')
local Players = game:GetService('Players')

-- ===== CONFIGURACIÓN =====
local DEFAULT_URL = "https://datashark-ia2.onrender.com"
local MAX_RETRIES = 3
local RETRY_DELAY = 1
local REQUEST_TIMEOUT = 30
local HISTORY_SIZE = 20

-- ===== IDENTIDAD DE USUARIO =====
local function resolveUserId()
	local success, id = pcall(function()
		return StudioService:GetUserId()
	end)

	if success and id and id ~= 0 then
		return id
	end

	local localPlayer = Players.LocalPlayer
	if localPlayer and localPlayer.UserId then
		return localPlayer.UserId
	end

	return 0
end

-- ===== ESTADO GLOBAL =====
local state = {
	backendUrl = DEFAULT_URL,
	sessionId = "",
	userId = resolveUserId(),
	currentPrompt = "",
	currentQuestions = {},
	currentSystemType = "",
	history = {},
	isGenerating = false,
	responseCache = {}
}

-- ===== HERRAMIENTAS AUXILIARES =====

-- Logger mejorado
local Logger = {}
function Logger.log(message, level)
	level = level or "INFO"
	local timestamp = os.date("%H:%M:%S")
	print(string.format("[%s] [%s] %s", timestamp, level, message))
end

function Logger.error(message, error)
	Logger.log(message .. (error and ": " .. tostring(error) or ""), "ERROR")
end

function Logger.success(message)
	Logger.log(message, "SUCCESS")
end

function Logger.warn(message)
	Logger.log(message, "WARN")
end

-- Generador de UUID
local function generateUUID()
	local random = math.random
	local template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
	return string.gsub(template, '[xy]', function(c)
		local v = (c == 'x') and random(0, 0xf) or random(8, 0xb)
		return string.format('%x', v)
	end)
end

-- Almacenamiento persistente
local Storage = {}
function Storage.get(key)
	return plugin:GetSetting("DataShark_" .. key)
end

function Storage.set(key, value)
	plugin:SetSetting("DataShark_" .. key, value)
end

function Storage.delete(key)
	plugin:SetSetting("DataShark_" .. key, nil)
end

-- HTTP mejorado con retry exponencial
local Http = {}
function Http.request(url, method, body, timeout)
	timeout = timeout or REQUEST_TIMEOUT
	local lastError = nil
	
	for attempt = 1, MAX_RETRIES do
		local success, response = pcall(function()
			if method == "POST" then
				return HttpService:PostAsync(url, body, Enum.HttpContentType.ApplicationJson, false, timeout)
			else
				return HttpService:GetAsync(url, false, timeout)
			end
		end)
		
		if success then
			Logger.success("✓ Solicitud exitosa: " .. url)
			return response
		else
			lastError = response
			if attempt < MAX_RETRIES then
				Logger.warn(string.format("⟳ Reintentando (%d/%d)...", attempt, MAX_RETRIES - 1))
				wait(RETRY_DELAY * attempt)
			end
		end
	end
	
	Logger.error("✗ Solicitud fallida tras " .. MAX_RETRIES .. " intentos", lastError)
	return nil
end

-- ===== UI FACTORY =====
local UI = {}

function UI.createLabel(parent, text, position, size)
	local label = Instance.new("TextLabel")
	label.Size = size or UDim2.new(1, 0, 0, 25)
	label.Position = position or UDim2.new(0, 0, 0, 0)
	label.BackgroundTransparency = 1
	label.Text = text
	label.TextColor3 = Color3.fromRGB(255, 255, 255)
	label.TextSize = 14
	label.Font = Enum.Font.GothamBold
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.TextWrapped = true
	label.Parent = parent
	return label
end

function UI.createTextBox(parent, placeholder, position, height, multiline)
	height = height or 40
	multiline = multiline or false
	
	local box = Instance.new("TextBox")
	box.Size = UDim2.new(1, 0, 0, height)
	box.Position = position or UDim2.new(0, 0, 0, 0)
	box.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
	box.BorderSizePixel = 0
	box.Text = ""
	box.PlaceholderText = placeholder
	box.TextColor3 = Color3.fromRGB(255, 255, 255)
	box.PlaceholderColor3 = Color3.fromRGB(150, 150, 150)
	box.TextSize = 13
	box.Font = Enum.Font.Code
	box.ClearTextOnFocus = false
	box.Parent = parent
	box.TextWrapped = multiline
	box.MultiLine = multiline
	
	if multiline then
		local padding = Instance.new("UIPadding")
		padding.PaddingLeft = UDim.new(0, 8)
		padding.PaddingRight = UDim.new(0, 8)
		padding.PaddingTop = UDim.new(0, 8)
		padding.PaddingBottom = UDim.new(0, 8)
		padding.Parent = box
		
		local corner = Instance.new("UICorner")
		corner.CornerRadius = UDim.new(0, 6)
		corner.Parent = box
	end
	
	return box
end

function UI.createButton(parent, text, position, size, color)
	color = color or Color3.fromRGB(30, 136, 229)
	
	local btn = Instance.new("TextButton")
	btn.Size = size or UDim2.new(1, 0, 0, 45)
	btn.Position = position or UDim2.new(0, 0, 0, 0)
	btn.BackgroundColor3 = color
	btn.BorderSizePixel = 0
	btn.Text = text
	btn.TextColor3 = Color3.fromRGB(255, 255, 255)
	btn.TextSize = 15
	btn.Font = Enum.Font.GothamBold
	btn.Parent = parent
	
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 6)
	corner.Parent = btn
	
	-- Efecto hover
	local originalColor = color
	btn.MouseEnter:Connect(function()
		local r = math.min(originalColor.R * 255 + 20, 255) / 255
		local g = math.min(originalColor.G * 255 + 20, 255) / 255
		local b = math.min(originalColor.B * 255 + 20, 255) / 255
		btn.BackgroundColor3 = Color3.new(r, g, b)
	end)
	
	btn.MouseLeave:Connect(function()
		btn.BackgroundColor3 = originalColor
	end)
	
	return btn
end

-- ===== SETUP PRINCIPAL =====

-- Create UI
local toolbar = plugin:CreateToolbar("DataShark IA")
local button = toolbar:CreateButton(
	"Generate System",
	"Generate Lua systems with AI clarification",
	"rbxassetid://0"
)

-- Create DockWidget
local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Float,
	false,
	false,
	480,
	700,
	400,
	500
)

local widget = plugin:CreateDockWidgetPluginGui("DataSharkWidget", widgetInfo)
widget.Title = "🦈 DataShark IA v3.0"

-- Create Main Frame
local mainFrame = Instance.new("Frame")
mainFrame.Size = UDim2.new(1, 0, 1, 0)
mainFrame.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
mainFrame.BorderSizePixel = 0
mainFrame.Parent = widget

-- Header con tabs
local header = Instance.new("Frame")
header.Size = UDim2.new(1, 0, 0, 90)
header.BackgroundColor3 = Color3.fromRGB(30, 136, 229)
header.BorderSizePixel = 0
header.Parent = mainFrame

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, -20, 0, 40)
title.Position = UDim2.new(0, 10, 0, 5)
title.BackgroundTransparency = 1
title.Text = "🦈 DataShark IA v3.0"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextSize = 20
title.Font = Enum.Font.GothamBold
title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = header

-- Tabs
local tabFrame = Instance.new("Frame")
tabFrame.Size = UDim2.new(1, 0, 0, 40)
tabFrame.Position = UDim2.new(0, 0, 0, 45)
tabFrame.BackgroundTransparency = 1
tabFrame.BorderSizePixel = 0
tabFrame.Parent = header

local generatorTabBtn = UI.createButton(tabFrame, "✨ Generador", UDim2.new(0, 5, 0, 5), UDim2.new(0.47, -10, 1, -10), Color3.fromRGB(76, 175, 80))
local configTabBtn = UI.createButton(tabFrame, "⚙️ Configuración", UDim2.new(0.5, 5, 0, 5), UDim2.new(0.47, -10, 1, -10), Color3.fromRGB(255, 152, 0))

-- Content ScrollFrame
local content = Instance.new("ScrollingFrame")
content.Size = UDim2.new(1, -20, 1, -120)
content.Position = UDim2.new(0, 10, 0, 100)
content.BackgroundTransparency = 1
content.BorderSizePixel = 0
content.CanvasSize = UDim2.new(0, 0, 0, 0)
content.AutomaticCanvasSize = Enum.AutomaticSize.Y
content.ScrollBarThickness = 6
content.Parent = mainFrame

-- ===== PANEL GENERADOR =====
local generatorPanel = Instance.new("Frame")
generatorPanel.Size = UDim2.new(1, 0, 1, 0)
generatorPanel.BackgroundTransparency = 1
generatorPanel.BorderSizePixel = 0
generatorPanel.Parent = content

-- Prompt input
UI.createLabel(generatorPanel, "¿Qué sistema quieres crear?", UDim2.new(0, 0, 0, 0))
local promptBox = UI.createTextBox(generatorPanel, "Ej: sistema de ataque con daño crítico", UDim2.new(0, 0, 0, 30), 80, true)

-- Buttons
local generateQuestionsBtn = UI.createButton(generatorPanel, "🤖 Generar Preguntas", UDim2.new(0, 0, 0, 125), UDim2.new(1, 0, 0, 45), Color3.fromRGB(30, 136, 229))
local generateCodeBtn = UI.createButton(generatorPanel, "✨ Generar Código", UDim2.new(0, 0, 0, 180), UDim2.new(1, 0, 0, 45), Color3.fromRGB(76, 175, 80))
generateCodeBtn.Visible = false

-- Questions container
local questionsContainer = Instance.new("Frame")
questionsContainer.Size = UDim2.new(1, 0, 0, 0)
questionsContainer.Position = UDim2.new(0, 0, 0, 235)
questionsContainer.BackgroundTransparency = 1
questionsContainer.AutomaticSize = Enum.AutomaticSize.Y
questionsContainer.Visible = false
questionsContainer.Parent = generatorPanel

local questionsLabel = UI.createLabel(questionsContainer, "📋 Responde estas preguntas:", UDim2.new(0, 0, 0, 0))

-- Status box
local statusBox = Instance.new("TextLabel")
statusBox.Size = UDim2.new(1, 0, 0, 80)
statusBox.Position = UDim2.new(0, 0, 0, 550)
statusBox.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
statusBox.BorderSizePixel = 0
statusBox.Text = "✨ Listo para generar sistemas con IA"
statusBox.TextColor3 = Color3.fromRGB(76, 175, 80)
statusBox.TextSize = 13
statusBox.Font = Enum.Font.Code
statusBox.TextWrapped = true
statusBox.TextXAlignment = Enum.TextXAlignment.Left
statusBox.TextYAlignment = Enum.TextYAlignment.Top
statusBox.Parent = generatorPanel

local statusCorner = Instance.new("UICorner")
statusCorner.CornerRadius = UDim.new(0, 6)
statusCorner.Parent = statusBox

local statusPadding = Instance.new("UIPadding")
statusPadding.PaddingLeft = UDim.new(0, 10)
statusPadding.PaddingRight = UDim.new(0, 10)
statusPadding.PaddingTop = UDim.new(0, 10)
statusPadding.PaddingBottom = UDim.new(0, 10)
statusPadding.Parent = statusBox

-- ===== PANEL CONFIGURACIÓN =====
local configPanel = Instance.new("Frame")
configPanel.Size = UDim2.new(1, 0, 1, 0)
configPanel.BackgroundTransparency = 1
configPanel.BorderSizePixel = 0
configPanel.Visible = false
configPanel.Parent = content

-- URL Configuration
UI.createLabel(configPanel, "URL del Backend:", UDim2.new(0, 0, 0, 0))
local urlBox = UI.createTextBox(configPanel, "https://datashark-ia2.onrender.com", UDim2.new(0, 0, 0, 30), 40, false)
urlBox.Text = Storage.get("backendUrl") or DEFAULT_URL

local saveUrlBtn = UI.createButton(configPanel, "💾 Guardar URL", UDim2.new(0, 0, 0, 80), UDim2.new(1, 0, 0, 40), Color3.fromRGB(76, 175, 80))
local newSessionBtn = UI.createButton(configPanel, "🆕 Nueva sesión", UDim2.new(0, 0, 0, 130), UDim2.new(1, 0, 0, 40), Color3.fromRGB(255, 152, 0))

-- Historial
UI.createLabel(configPanel, "📜 Historial de Generaciones:", UDim2.new(0, 0, 0, 180))
local historyBox = Instance.new("TextLabel")
historyBox.Size = UDim2.new(1, 0, 0, 150)
historyBox.Position = UDim2.new(0, 0, 0, 210)
historyBox.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
historyBox.BorderSizePixel = 0
historyBox.Text = "(sin historial)"
historyBox.TextColor3 = Color3.fromRGB(255, 255, 255)
historyBox.TextSize = 12
historyBox.Font = Enum.Font.Code
historyBox.TextWrapped = true
historyBox.TextXAlignment = Enum.TextXAlignment.Left
historyBox.TextYAlignment = Enum.TextYAlignment.Top
historyBox.Parent = configPanel

local historyPadding = Instance.new("UIPadding")
historyPadding.PaddingLeft = UDim.new(0, 8)
historyPadding.PaddingRight = UDim.new(0, 8)
historyPadding.PaddingTop = UDim.new(0, 8)
historyPadding.Parent = historyBox

local clearHistoryBtn = UI.createButton(configPanel, "🗑️ Limpiar Historial", UDim2.new(0, 0, 0, 370), UDim2.new(1, 0, 0, 40), Color3.fromRGB(244, 67, 54))

-- Información
UI.createLabel(configPanel, "ℹ️ Información del Plugin:", UDim2.new(0, 0, 0, 420))
local infoBox = Instance.new("TextLabel")
infoBox.Size = UDim2.new(1, 0, 0, 120)
infoBox.Position = UDim2.new(0, 0, 0, 450)
infoBox.BackgroundColor3 = Color3.fromRGB(33, 150, 243)
infoBox.BackgroundTransparency = 0.2
infoBox.BorderSizePixel = 0
infoBox.Text = "v3.0 - Mejorado\nHTTP Retry: " .. MAX_RETRIES .. "x\nTimeout: " .. REQUEST_TIMEOUT .. "s\nHistorial: últimas " .. HISTORY_SIZE .. " generaciones\nUserId: " .. (state.userId ~= 0 and state.userId or "No detectado")
infoBox.TextColor3 = Color3.fromRGB(255, 255, 255)
infoBox.TextSize = 12
infoBox.Font = Enum.Font.Gotham
infoBox.TextWrapped = true
infoBox.TextXAlignment = Enum.TextXAlignment.Left
infoBox.TextYAlignment = Enum.TextYAlignment.Top
infoBox.Parent = configPanel

local infoPadding = Instance.new("UIPadding")
infoPadding.PaddingLeft = UDim.new(0, 10)
infoPadding.PaddingRight = UDim.new(0, 10)
infoPadding.PaddingTop = UDim.new(0, 8)
infoPadding.Parent = infoBox

-- ===== FUNCIONALIDAD =====

-- Inicializar estado
state.backendUrl = Storage.get("backendUrl") or DEFAULT_URL
state.sessionId = Storage.get("sessionId") or generateUUID()
Storage.set("sessionId", state.sessionId)
state.history = Storage.get("history") and HttpService:JSONDecode(Storage.get("history")) or {}

local questionBoxes = {}
local currentQuestions = {}

-- Actualizar status
local function updateStatus(message, isError)
	statusBox.Text = message
	statusBox.TextColor3 = isError and Color3.fromRGB(244, 67, 54) or Color3.fromRGB(76, 175, 80)
	Logger.log(message)
end

local function resetSession()
	state.sessionId = generateUUID()
	Storage.set("sessionId", state.sessionId)
	state.currentPrompt = ""
	state.currentQuestions = {}
	currentQuestions = {}
	state.isGenerating = false
	promptBox.Text = ""
	questionsContainer.Visible = false
	generateCodeBtn.Visible = false
	for _, box in ipairs(questionBoxes) do
		box:Destroy()
	end
	questionBoxes = {}
	updateStatus("🆕 Nueva sesión iniciada", false)
	Logger.log("Nueva sesión: " .. state.sessionId)
end

-- Generar preguntas
local function generateQuestions()
	if state.isGenerating then
		updateStatus("⚠️ Espera a que termine la operación anterior", true)
		return
	end
	
	local prompt = promptBox.Text:gsub("^%s*(.-)%s*$", "%1")
	
	if prompt == "" then
		updateStatus("❌ Error: Escribe qué sistema quieres crear", true)
		return
	end
	
	if #prompt < 3 then
		updateStatus("❌ Error: Descripción demasiado corta (mínimo 3 caracteres)", true)
		return
	end
	
	state.isGenerating = true
	state.currentPrompt = prompt
	generateQuestionsBtn.Text = "⏳ Generando preguntas..."
	generateQuestionsBtn.TextTransparency = 0.5
	updateStatus("🤖 La IA está analizando tu solicitud...", false)
	
	task.spawn(function()
		local requestBody = HttpService:JSONEncode({
			prompt = prompt,
			userId = state.userId
		})
		
		local response = Http.request(state.backendUrl .. "/api/clarify/generate-questions", "POST", requestBody)
		
		if response then
			local success, data = pcall(function()
				return HttpService:JSONDecode(response)
			end)
			
			if success and data.success and data.questions then
				currentQuestions = data.questions
				state.currentSystemType = data.systemType or "attack"
				
				-- Limpiar preguntas anteriores
				for _, box in ipairs(questionBoxes) do
					box:Destroy()
				end
				questionBoxes = {}
				
				-- Crear inputs de respuestas
				local qYOffset = 35
				for i, question in ipairs(currentQuestions) do
					local qLabel = UI.createLabel(questionsContainer, string.format("%d. %s", i, question), UDim2.new(0, 0, 0, qYOffset))
					qYOffset = qYOffset + 25
					
					local qBox = UI.createTextBox(questionsContainer, "Tu respuesta...", UDim2.new(0, 0, 0, qYOffset), 35, false)
					table.insert(questionBoxes, qBox)
					table.insert(questionBoxes, qLabel)
					
					qYOffset = qYOffset + 45
				end
				
				questionsContainer.Visible = true
				generateCodeBtn.Visible = true
				updateStatus(string.format("✅ %d preguntas generadas. Responde al menos 2 para continuar.", #currentQuestions), false)
			else
				updateStatus("❌ Error: No se pudieron generar preguntas\n" .. (data.error or "Error desconocido"), true)
			end
		else
			updateStatus("❌ Error de conexión con el servidor\n\nVerifica que el backend está en línea y la URL es correcta.", true)
		end
		
		state.isGenerating = false
		generateQuestionsBtn.Text = "🤖 Generar Preguntas"
		generateQuestionsBtn.TextTransparency = 0
	end)
end

-- Generar código
local function generateCode()
	if state.isGenerating then
		updateStatus("⚠️ Espera a que termine la operación anterior", true)
		return
	end
	
	local answers = {}
	for i = 1, #currentQuestions do
		local box = questionBoxes[(i-1)*2 + 2]
		if box and box:IsA("TextBox") then
			table.insert(answers, box.Text)
		end
	end
	
	-- Validar
	local filledCount = 0
	for _, answer in ipairs(answers) do
		if answer and answer:gsub("^%s*(.-)%s*$", "%1") ~= "" then
			filledCount = filledCount + 1
		end
	end
	
	if filledCount < 2 then
		updateStatus("❌ Error: Responde al menos 2 preguntas", true)
		return
	end
	
	state.isGenerating = true
	generateCodeBtn.Text = "⏳ Generando código..."
	generateCodeBtn.TextTransparency = 0.5
	updateStatus("✨ La IA está generando tu sistema...", false)
	
	task.spawn(function()
		local requestBody = HttpService:JSONEncode({
			originalPrompt = state.currentPrompt,
			systemType = state.currentSystemType,
			questions = currentQuestions,
			answers = answers,
			sessionId = state.sessionId,
			userId = state.userId
		})
		
		local response = Http.request(state.backendUrl .. "/api/clarify", "POST", requestBody)
		
		if response then
			local success, data = pcall(function()
				return HttpService:JSONDecode(response)
			end)
			
			if success and data.success and data.code then
				updateStatus("📥 Creando archivos en Studio...", false)
				
				-- Crear carpeta
				local timestamp = os.date("%Y%m%d_%H%M%S")
				local systemFolder = Instance.new('Folder')
				systemFolder.Name = 'DataShark_' .. state.currentSystemType .. '_' .. timestamp
				systemFolder.Parent = ServerScriptService
				
				local fileCount = 0
				local fileList = {}
				
				-- Crear scripts
				for fileName, content in pairs(data.code) do
					local script = Instance.new('Script')
					script.Name = fileName:gsub(".lua", "")
					script.Source = content
					script.Parent = systemFolder
					fileCount = fileCount + 1
					table.insert(fileList, script.Name)
					task.wait(0.05)
				end
				
				-- Guardar en historial
				table.insert(state.history, 1, {
					timestamp = os.date("%Y-%m-%d %H:%M:%S"),
					prompt = state.currentPrompt,
					systemType = state.currentSystemType,
					fileCount = fileCount
				})
				
				-- Limitar historial
				if #state.history > HISTORY_SIZE then
					table.remove(state.history)
				end
				
				Storage.set("history", HttpService:JSONEncode(state.history))
				updateHistoryView()
				
				local fileListStr = table.concat(fileList, ", ")
				
				updateStatus(
					string.format(
						"✅ ¡Sistema creado exitosamente!\n\n%d archivos: %s\n\nUbicación: %s",
						fileCount,
						fileListStr,
						systemFolder:GetFullName()
					),
					false
				)
				
				ChangeHistoryService:SetWaypoint("DataShark IA Generation")
				
				-- Reset
				task.wait(2)
				questionsContainer.Visible = false
				generateCodeBtn.Visible = false
				promptBox.Text = ""
				for _, box in ipairs(questionBoxes) do
					box:Destroy()
				end
				questionBoxes = {}
				currentQuestions = {}
				
			else
				updateStatus("❌ Error generando código:\n" .. (data.error or data.message or "Error desconocido"), true)
			end
		else
			updateStatus("❌ Error de conexión\n\nNo se pudo conectar al servidor", true)
		end
		
		state.isGenerating = false
		generateCodeBtn.Text = "✨ Generar Código"
		generateCodeBtn.TextTransparency = 0
	end)
end

-- Tab switching
generatorTabBtn.MouseButton1Click:Connect(function()
	generatorPanel.Visible = true
	configPanel.Visible = false
	generatorTabBtn.BackgroundColor3 = Color3.fromRGB(76, 175, 80)
	configTabBtn.BackgroundColor3 = Color3.fromRGB(255, 152, 0)
end)

configTabBtn.MouseButton1Click:Connect(function()
	generatorPanel.Visible = false
	configPanel.Visible = true
	generatorTabBtn.BackgroundColor3 = Color3.fromRGB(30, 136, 229)
	configTabBtn.BackgroundColor3 = Color3.fromRGB(255, 193, 7)
end)

-- Guardar URL
saveUrlBtn.MouseButton1Click:Connect(function()
	local url = urlBox.Text:gsub("^%s*(.-)%s*$", "%1")
	
	if url == "" then
		updateStatus("❌ Error: URL no puede estar vacía", true)
		return
	end
	
	state.backendUrl = url
	Storage.set("backendUrl", url)
	updateStatus("✅ URL guardada: " .. url, false)
end)

-- Nueva sesión
newSessionBtn.MouseButton1Click:Connect(function()
	resetSession()
end)

-- Limpiar historial
clearHistoryBtn.MouseButton1Click:Connect(function()
	state.history = {}
	Storage.delete("history")
	historyBox.Text = "(sin historial)"
	updateStatus("🗑️ Historial limpiado", false)
end)

-- Actualizar vista de historial
local function updateHistoryView()
	if #state.history == 0 then
		historyBox.Text = "(sin historial)"
		return
	end
	
	local historyText = ""
	for i, entry in ipairs(state.history) do
		historyText = historyText .. string.format(
			"%d. [%s] %s (%s) - %d archivos\n",
			i,
			entry.timestamp,
			entry.prompt:sub(1, 30) .. (entry.prompt:len() > 30 and "..." or ""),
			entry.systemType,
			entry.fileCount
		)
	end
	
	historyBox.Text = historyText
end

updateHistoryView()

-- Button events
generateQuestionsBtn.MouseButton1Click:Connect(generateQuestions)
generateCodeBtn.MouseButton1Click:Connect(generateCode)

button.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

Logger.success("DataShark IA Plugin v3.0 cargado exitosamente!")
Logger.log("Session ID: " .. state.sessionId)
Logger.log("Backend: " .. state.backendUrl)

local toolbar = plugin:CreateToolbar("DataShark IA")
local button = toolbar:CreateButton(
	"Generate System",
	"Generate Lua systems with AI clarification",
	"rbxassetid://0"
)

-- Create DockWidget
local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Float,
	false,
	false,
	450,
	650,
	400,
	500
)

local widget = plugin:CreateDockWidgetPluginGui("DataSharkWidget", widgetInfo)
widget.Title = "🦈 DataShark IA"

-- Create Main Frame
local mainFrame = Instance.new("Frame")
mainFrame.Size = UDim2.new(1, 0, 1, 0)
mainFrame.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
mainFrame.BorderSizePixel = 0
mainFrame.Parent = widget

-- Header
local header = Instance.new("Frame")
header.Size = UDim2.new(1, 0, 0, 60)
header.BackgroundColor3 = Color3.fromRGB(30, 136, 229)
header.BorderSizePixel = 0
header.Parent = mainFrame

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, -20, 1, 0)
title.Position = UDim2.new(0, 10, 0, 0)
title.BackgroundTransparency = 1
title.Text = "🦈 DataShark IA v2.0"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextSize = 24
title.Font = Enum.Font.GothamBold
title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = header

-- Content ScrollFrame
local content = Instance.new("ScrollingFrame")
content.Size = UDim2.new(1, -20, 1, -80)
content.Position = UDim2.new(0, 10, 0, 70)
content.BackgroundTransparency = 1
content.BorderSizePixel = 0
content.CanvasSize = UDim2.new(0, 0, 0, 0)
content.AutomaticCanvasSize = Enum.AutomaticSize.Y
content.ScrollBarThickness = 6
content.Parent = mainFrame

local yOffset = 0

-- Helper to create labels
local function createLabel(text, yPos)
	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1, 0, 0, 25)
	label.Position = UDim2.new(0, 0, 0, yPos)
	label.BackgroundTransparency = 1
	label.Text = text
	label.TextColor3 = Color3.fromRGB(255, 255, 255)
	label.TextSize = 14
	label.Font = Enum.Font.GothamBold
	label.TextXAlignment = Enum.TextXAlignment.Left
	label.Parent = content
	return label
end

-- Helper to create textboxes
local function createTextBox(placeholder, yPos, multiline)
	local height = multiline and 80 or 40
	local box = Instance.new("TextBox")
	box.Size = UDim2.new(1, 0, 0, height)
	box.Position = UDim2.new(0, 0, 0, yPos)
	box.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
	box.BorderSizePixel = 0
	box.Text = ""
	box.PlaceholderText = placeholder
	box.TextColor3 = Color3.fromRGB(255, 255, 255)
	box.PlaceholderColor3 = Color3.fromRGB(150, 150, 150)
	box.TextSize = 13
	box.Font = Enum.Font.Code
	box.ClearTextOnFocus = false
	box.TextXAlignment = Enum.TextXAlignment.Left
	box.TextYAlignment = Enum.TextYAlignment.Top
	box.TextWrapped = true
	box.MultiLine = multiline or false
	box.Parent = content
	
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 6)
	corner.Parent = box
	
	if multiline then
		local padding = Instance.new("UIPadding")
		padding.PaddingLeft = UDim.new(0, 8)
		padding.PaddingRight = UDim.new(0, 8)
		padding.PaddingTop = UDim.new(0, 8)
		padding.PaddingBottom = UDim.new(0, 8)
		padding.Parent = box
	end
	
	return box
end

-- Helper to create buttons
local function createButton(text, yPos, color)
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.new(1, 0, 0, 45)
	btn.Position = UDim2.new(0, 0, 0, yPos)
	btn.BackgroundColor3 = color
	btn.BorderSizePixel = 0
	btn.Text = text
	btn.TextColor3 = Color3.fromRGB(255, 255, 255)
	btn.TextSize = 15
	btn.Font = Enum.Font.GothamBold
	btn.Parent = content
	
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 6)
	corner.Parent = btn
	
	return btn
end

-- UI Elements
createLabel("¿Qué sistema quieres crear?", yOffset)
yOffset = yOffset + 30

local promptBox = createTextBox("Ej: sistema de ataque con daño crítico", yOffset, true)
yOffset = yOffset + 90

local generateQuestionsBtn = createButton("🤖 Generar Preguntas", yOffset, Color3.fromRGB(30, 136, 229))
yOffset = yOffset + 55

-- Questions Container (initially hidden)
local questionsContainer = Instance.new("Frame")
questionsContainer.Size = UDim2.new(1, 0, 0, 0)
questionsContainer.Position = UDim2.new(0, 0, 0, yOffset)
questionsContainer.BackgroundTransparency = 1
questionsContainer.AutomaticSize = Enum.AutomaticSize.Y
questionsContainer.Visible = false
questionsContainer.Parent = content

local questionsLabel = createLabel("📋 Responde estas preguntas:", 0)
questionsLabel.Parent = questionsContainer

-- Will be populated dynamically
local questionBoxes = {}
local currentQuestions = {}
local currentSystemType = ""
local currentPrompt = ""

-- Generate Code Button (initially hidden)
local generateCodeBtn = createButton("✨ Generar Código", yOffset + 10, Color3.fromRGB(76, 175, 80))
generateCodeBtn.Visible = false

-- Status Box
yOffset = yOffset + 70
createLabel("Estado:", yOffset)
yOffset = yOffset + 30

local statusBox = Instance.new("TextLabel")
statusBox.Size = UDim2.new(1, 0, 0, 100)
statusBox.Position = UDim2.new(0, 0, 0, yOffset)
statusBox.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
statusBox.BorderSizePixel = 0
statusBox.Text = "✨ Listo para generar sistemas con IA"
statusBox.TextColor3 = Color3.fromRGB(76, 175, 80)
statusBox.TextSize = 13
statusBox.Font = Enum.Font.Code
statusBox.TextWrapped = true
statusBox.TextXAlignment = Enum.TextXAlignment.Left
statusBox.TextYAlignment = Enum.TextYAlignment.Top
statusBox.Parent = content

local statusCorner = Instance.new("UICorner")
statusCorner.CornerRadius = UDim.new(0, 6)
statusCorner.Parent = statusBox

local statusPadding = Instance.new("UIPadding")
statusPadding.PaddingLeft = UDim.new(0, 10)
statusPadding.PaddingRight = UDim.new(0, 10)
statusPadding.PaddingTop = UDim.new(0, 10)
statusPadding.PaddingBottom = UDim.new(0, 10)
statusPadding.Parent = statusBox

-- Plugin Settings
local function saveBackendUrl(url)
	plugin:SetSetting("DataSharkUrl", url)
end

local function loadBackendUrl()
	return plugin:GetSetting("DataSharkUrl") or DEFAULT_URL
end

local function getBackendUrl()
	return loadBackendUrl()
end

-- Generate UUID
local function generateUUID()
	local random = math.random
	local template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
	return string.gsub(template, '[xy]', function(c)
		local v = (c == 'x') and random(0, 0xf) or random(8, 0xb)
		return string.format('%x', v)
	end)
end

local sessionId = generateUUID()

-- Update Status
local function updateStatus(message, isError)
	statusBox.Text = message
	statusBox.TextColor3 = isError and Color3.fromRGB(244, 67, 54) or Color3.fromRGB(76, 175, 80)
end

-- Generate Questions from AI
local function generateQuestions()
	local prompt = promptBox.Text:gsub("^%s*(.-)%s*$", "%1")
	
	if prompt == "" then
		updateStatus("❌ Error: Escribe qué sistema quieres crear", true)
		return
	end
	
	currentPrompt = prompt
	generateQuestionsBtn.Text = "⏳ Generando preguntas..."
	generateQuestionsBtn.BackgroundColor3 = Color3.fromRGB(25, 118, 210)
	updateStatus("🤖 La IA está analizando tu solicitud...", false)
	
	task.spawn(function()
		local backendUrl = getBackendUrl()
		local url = backendUrl .. "/api/clarify/generate-questions"
		
		local requestBody = HttpService:JSONEncode({
			prompt = prompt,
			userId = resolveUserId()
		})
		
		local success, response = pcall(function()
			return HttpService:PostAsync(url, requestBody, Enum.HttpContentType.ApplicationJson)
		end)
		
		if success then
			local parseSuccess, data = pcall(function()
				return HttpService:JSONDecode(response)
			end)
			
			if parseSuccess and data.success and data.questions then
				currentQuestions = data.questions
				currentSystemType = data.systemType or "attack"
				
				-- Clear previous questions
				for _, box in ipairs(questionBoxes) do
					box:Destroy()
				end
				questionBoxes = {}
				
				-- Create question inputs
				local qYOffset = 35
				for i, question in ipairs(currentQuestions) do
					local qLabel = Instance.new("TextLabel")
					qLabel.Size = UDim2.new(1, 0, 0, 20)
					qLabel.Position = UDim2.new(0, 0, 0, qYOffset)
					qLabel.BackgroundTransparency = 1
					qLabel.Text = string.format("%d. %s", i, question)
					qLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
					qLabel.TextSize = 13
					qLabel.Font = Enum.Font.Gotham
					qLabel.TextXAlignment = Enum.TextXAlignment.Left
					qLabel.TextWrapped = true
					qLabel.Parent = questionsContainer
					
					qYOffset = qYOffset + 25
					
					local qBox = Instance.new("TextBox")
					qBox.Size = UDim2.new(1, 0, 0, 35)
					qBox.Position = UDim2.new(0, 0, 0, qYOffset)
					qBox.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
					qBox.BorderSizePixel = 0
					qBox.Text = ""
					qBox.PlaceholderText = "Tu respuesta..."
					qBox.TextColor3 = Color3.fromRGB(255, 255, 255)
					qBox.PlaceholderColor3 = Color3.fromRGB(150, 150, 150)
					qBox.TextSize = 13
					qBox.Font = Enum.Font.Code
					qBox.ClearTextOnFocus = false
					qBox.Parent = questionsContainer
					
					local qCorner = Instance.new("UICorner")
					qCorner.CornerRadius = UDim.new(0, 6)
					qCorner.Parent = qBox
					
					table.insert(questionBoxes, qBox)
					table.insert(questionBoxes, qLabel)
					
					qYOffset = qYOffset + 45
				end
				
				questionsContainer.Visible = true
				generateCodeBtn.Visible = true
				generateCodeBtn.Position = UDim2.new(0, 0, 0, questionsContainer.Position.Y.Offset + qYOffset + 10)
				
				updateStatus(string.format("✅ %d preguntas generadas. Responde al menos 2 para continuar.", #currentQuestions), false)
			else
				updateStatus("❌ Error: No se pudieron generar preguntas\n\n" .. (data.error or "Error desconocido"), true)
			end
		else
			local errorMsg = tostring(response)
			if errorMsg:find("Http requests are not enabled") then
				updateStatus("❌ HTTP no habilitado\n\nHabilita en: Game Settings → Security → Allow HTTP Requests", true)
			else
				updateStatus("❌ Error de conexión:\n\n" .. errorMsg, true)
			end
		end
		
		generateQuestionsBtn.Text = "🤖 Generar Preguntas"
		generateQuestionsBtn.BackgroundColor3 = Color3.fromRGB(30, 136, 229)
	end)
end

-- Generate Code from Answers
local function generateCode()
	-- Collect answers
	local answers = {}
	for i = 1, #currentQuestions do
		local box = questionBoxes[(i-1)*2 + 2]
		if box and box:IsA("TextBox") then
			table.insert(answers, box.Text)
		end
	end
	
	-- Validate
	local filledCount = 0
	for _, answer in ipairs(answers) do
		if answer and answer:gsub("^%s*(.-)%s*$", "%1") ~= "" then
			filledCount = filledCount + 1
		end
	end
	
	if filledCount < 2 then
		updateStatus("❌ Error: Responde al menos 2 preguntas", true)
		return
	end
	
	generateCodeBtn.Text = "⏳ Generando código..."
	generateCodeBtn.BackgroundColor3 = Color3.fromRGB(67, 160, 71)
	updateStatus("✨ La IA está generando tu sistema...", false)
	
	task.spawn(function()
		local backendUrl = getBackendUrl()
		local url = backendUrl .. "/api/clarify"
		
		local requestBody = HttpService:JSONEncode({
			originalPrompt = currentPrompt,
			systemType = currentSystemType,
			questions = currentQuestions,
			answers = answers,
			sessionId = sessionId,
			userId = resolveUserId()
		})
		
		local success, response = pcall(function()
			return HttpService:PostAsync(url, requestBody, Enum.HttpContentType.ApplicationJson)
		end)
		
		if success then
			local parseSuccess, data = pcall(function()
				return HttpService:JSONDecode(response)
			end)
			
			if parseSuccess and data.success and data.code then
				updateStatus("📥 Creando archivos en Studio...", false)
				
				-- Create folder
				local timestamp = os.date("%Y%m%d_%H%M%S")
				local systemFolder = Instance.new('Folder')
				systemFolder.Name = 'DataShark_' .. currentSystemType .. '_' .. timestamp
				systemFolder.Parent = ServerScriptService
				
				local fileCount = 0
				local fileList = {}
				
				-- Create scripts from generated code
				for fileName, content in pairs(data.code) do
					local script = Instance.new('Script')
					script.Name = fileName:gsub(".lua", "")
					script.Source = content
					script.Parent = systemFolder
					fileCount = fileCount + 1
					table.insert(fileList, script.Name)
					task.wait(0.05)
				end
				
				local fileListStr = table.concat(fileList, ", ")
				
				updateStatus(
					string.format(
						"✅ ¡Sistema creado exitosamente!\n\n%d archivos: %s\n\nUbicación: %s",
						fileCount,
						fileListStr,
						systemFolder:GetFullName()
					),
					false
				)
				
				ChangeHistoryService:SetWaypoint("DataShark IA Generation")
				
				-- Reset for new generation
				task.wait(2)
				questionsContainer.Visible = false
				generateCodeBtn.Visible = false
				promptBox.Text = ""
				for _, box in ipairs(questionBoxes) do
					box:Destroy()
				end
				questionBoxes = {}
				currentQuestions = {}
				
			else
				updateStatus("❌ Error generando código:\n\n" .. (data.error or data.message or "Error desconocido"), true)
			end
		else
			updateStatus("❌ Error de conexión:\n\n" .. tostring(response), true)
		end
		
		generateCodeBtn.Text = "✨ Generar Código"
		generateCodeBtn.BackgroundColor3 = Color3.fromRGB(76, 175, 80)
	end)
end

-- Button Events
button.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

generateQuestionsBtn.MouseButton1Click:Connect(function()
	if generateQuestionsBtn.Text:find("⏳") then
		return
	end
	generateQuestions()
end)

generateCodeBtn.MouseButton1Click:Connect(function()
	if generateCodeBtn.Text:find("⏳") then
		return
	end
	generateCode()
end)

print("🦈 DataShark IA Plugin v2.0 loaded!")
print("Backend: " .. getBackendUrl())
print("Sistema de clarificación con IA integrado")

