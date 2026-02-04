-- DataShark IA - Roblox Studio Plugin v2.0
-- Sistema de clarificación integrado con IA

local HttpService = game:GetService('HttpService')
local ServerScriptService = game:GetService('ServerScriptService')
local ChangeHistoryService = game:GetService('ChangeHistoryService')

-- Configuration
local DEFAULT_URL = "https://datashark-ia2.onrender.com"
local MAX_RETRIES = 3
local RETRY_DELAY = 1

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
			prompt = prompt
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
			sessionId = sessionId
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

