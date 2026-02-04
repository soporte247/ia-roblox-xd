-- DataShark IA - Roblox Studio Plugin
-- Enhanced UI version with visual interface

local HttpService = game:GetService('HttpService')
local ServerScriptService = game:GetService('ServerScriptService')
local ChangeHistoryService = game:GetService('ChangeHistoryService')

-- Configuration
local DEFAULT_URL = "http://localhost:3000"
local MAX_RETRIES = 3
local RETRY_DELAY = 1
local CONNECTION_TIMEOUT = 10

-- Create UI
local toolbar = plugin:CreateToolbar("DataShark IA")
local button = toolbar:CreateButton(
	"Import System",
	"Import generated Lua systems from DataShark IA",
	"rbxassetid://0" -- You can add an icon here
)

-- Create DockWidget
local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Float,
	false,   -- Initially enabled
	false,   -- Don't override previous enabled state
	400,     -- Default width
	500,     -- Default height
	300,     -- Min width
	400      -- Min height
)

local widget = plugin:CreateDockWidgetPluginGui("DataSharkWidget", widgetInfo)
widget.Title = "🦈 DataShark IA"

-- Create UI Elements
local mainFrame = Instance.new("Frame")
mainFrame.Size = UDim2.new(1, 0, 1, 0)
mainFrame.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
mainFrame.BorderSizePixel = 0
mainFrame.Parent = widget

-- Header
local header = Instance.new("Frame")
header.Size = UDim2.new(1, 0, 0, 60)
header.BackgroundColor3 = Color3.fromRGB(30, 136, 229) -- Blue shark theme
header.BorderSizePixel = 0
header.Parent = mainFrame

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, -20, 1, 0)
title.Position = UDim2.new(0, 10, 0, 0)
title.BackgroundTransparency = 1
title.Text = "🦈 DataShark IA"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextSize = 24
title.Font = Enum.Font.GothamBold
title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = header

-- Content Frame
local content = Instance.new("ScrollingFrame")
content.Size = UDim2.new(1, -20, 1, -80)
content.Position = UDim2.new(0, 10, 0, 70)
content.BackgroundTransparency = 1
content.BorderSizePixel = 0
content.CanvasSize = UDim2.new(0, 0, 0, 0)
content.AutomaticCanvasSize = Enum.AutomaticSize.Y
content.ScrollBarThickness = 6
content.Parent = mainFrame

-- User ID Section
local userIdLabel = Instance.new("TextLabel")
userIdLabel.Size = UDim2.new(1, 0, 0, 30)
userIdLabel.BackgroundTransparency = 1
userIdLabel.Text = "User ID:"
userIdLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
userIdLabel.TextSize = 16
userIdLabel.Font = Enum.Font.Gotham
userIdLabel.TextXAlignment = Enum.TextXAlignment.Left
userIdLabel.Parent = content

local userIdBox = Instance.new("TextBox")
userIdBox.Size = UDim2.new(1, 0, 0, 40)
userIdBox.Position = UDim2.new(0, 0, 0, 35)
userIdBox.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
userIdBox.BorderSizePixel = 0
userIdBox.Text = ""
userIdBox.PlaceholderText = "Paste your User ID here..."
userIdBox.TextColor3 = Color3.fromRGB(255, 255, 255)
userIdBox.PlaceholderColor3 = Color3.fromRGB(150, 150, 150)
userIdBox.TextSize = 14
userIdBox.Font = Enum.Font.Code
userIdBox.ClearTextOnFocus = false
userIdBox.Parent = content

-- Corner radius for text box
local userIdCorner = Instance.new("UICorner")
userIdCorner.CornerRadius = UDim.new(0, 6)
userIdCorner.Parent = userIdBox

-- Padding for text box
local userIdPadding = Instance.new("UIPadding")
userIdPadding.PaddingLeft = UDim.new(0, 10)
userIdPadding.PaddingRight = UDim.new(0, 10)
userIdPadding.Parent = userIdBox

-- Info Text
local infoText = Instance.new("TextLabel")
infoText.Size = UDim2.new(1, 0, 0, 40)
infoText.Position = UDim2.new(0, 0, 0, 85)
infoText.BackgroundTransparency = 1
infoText.Text = "Get your User ID from the web app\n(bottom right corner)"
infoText.TextColor3 = Color3.fromRGB(200, 200, 200)
infoText.TextSize = 12
infoText.Font = Enum.Font.Gotham
infoText.TextWrapped = true
infoText.TextXAlignment = Enum.TextXAlignment.Left
infoText.Parent = content

-- Backend URL Section
local urlLabel = Instance.new("TextLabel")
urlLabel.Size = UDim2.new(1, 0, 0, 25)
urlLabel.Position = UDim2.new(0, 0, 0, 130)
urlLabel.BackgroundTransparency = 1
urlLabel.Text = "Backend URL (optional):"
urlLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
urlLabel.TextSize = 14
urlLabel.Font = Enum.Font.Gotham
urlLabel.TextXAlignment = Enum.TextXAlignment.Left
urlLabel.Parent = content

local urlBox = Instance.new("TextBox")
urlBox.Size = UDim2.new(1, 0, 0, 35)
urlBox.Position = UDim2.new(0, 0, 0, 160)
urlBox.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
urlBox.BorderSizePixel = 0
urlBox.Text = ""
urlBox.PlaceholderText = "http://localhost:3000"
urlBox.TextColor3 = Color3.fromRGB(255, 255, 255)
urlBox.PlaceholderColor3 = Color3.fromRGB(150, 150, 150)
urlBox.TextSize = 12
urlBox.Font = Enum.Font.Code
urlBox.ClearTextOnFocus = false
urlBox.Parent = content

local urlCorner = Instance.new("UICorner")
urlCorner.CornerRadius = UDim.new(0, 6)
urlCorner.Parent = urlBox

local urlPadding = Instance.new("UIPadding")
urlPadding.PaddingLeft = UDim.new(0, 10)
urlPadding.PaddingRight = UDim.new(0, 10)
urlPadding.Parent = urlBox

-- Import Button
local importBtn = Instance.new("TextButton")
importBtn.Size = UDim2.new(1, 0, 0, 50)
importBtn.Position = UDim2.new(0, 0, 0, 210)
importBtn.BackgroundColor3 = Color3.fromRGB(30, 136, 229)
importBtn.BorderSizePixel = 0
importBtn.Text = "📥 Import System"
importBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
importBtn.TextSize = 18
importBtn.Font = Enum.Font.GothamBold
importBtn.AutoButtonColor = true
importBtn.Parent = content

local importBtnCorner = Instance.new("UICorner")
importBtnCorner.CornerRadius = UDim.new(0, 8)
importBtnCorner.Parent = importBtn

-- Progress Bar Container
local progressContainer = Instance.new("Frame")
progressContainer.Size = UDim2.new(1, 0, 0, 20)
progressContainer.Position = UDim2.new(0, 0, 0, 270)
progressContainer.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
progressContainer.BorderSizePixel = 0
progressContainer.Visible = false
progressContainer.Parent = content

local progressCorner = Instance.new("UICorner")
progressCorner.CornerRadius = UDim.new(0, 10)
progressCorner.Parent = progressContainer

local progressBar = Instance.new("Frame")
progressBar.Size = UDim2.new(0, 0, 1, 0)
progressBar.BackgroundColor3 = Color3.fromRGB(76, 175, 80)
progressBar.BorderSizePixel = 0
progressBar.Parent = progressContainer

local progressBarCorner = Instance.new("UICorner")
progressBarCorner.CornerRadius = UDim.new(0, 10)
progressBarCorner.Parent = progressBar

-- Status Section
local statusLabel = Instance.new("TextLabel")
statusLabel.Size = UDim2.new(1, 0, 0, 30)
statusLabel.Position = UDim2.new(0, 0, 0, 300)
statusLabel.BackgroundTransparency = 1
statusLabel.Text = "Status:"
statusLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
statusLabel.TextSize = 16
statusLabel.Font = Enum.Font.Gotham
statusLabel.TextXAlignment = Enum.TextXAlignment.Left
statusLabel.Parent = content

local statusBox = Instance.new("TextLabel")
statusBox.Size = UDim2.new(1, 0, 0, 100)
statusBox.Position = UDim2.new(0, 0, 0, 335)
statusBox.BackgroundColor3 = Color3.fromRGB(35, 35, 35)
statusBox.BorderSizePixel = 0
statusBox.Text = "Ready to import..."
statusBox.TextColor3 = Color3.fromRGB(255, 255, 255)
statusBox.TextSize = 14
statusBox.Font = Enum.Font.Code
statusBox.TextWrapped = true
statusBox.TextXAlignment = Enum.TextXAlignment.Left
statusBox.TextYAlignment = Enum.TextYAlignment.Top
statusBox.Parent = content

local statusBoxCorner = Instance.new("UICorner")
statusBoxCorner.CornerRadius = UDim.new(0, 6)
statusBoxCorner.Parent = statusBox

local statusBoxPadding = Instance.new("UIPadding")
statusBoxPadding.PaddingLeft = UDim.new(0, 10)
statusBoxPadding.PaddingRight = UDim.new(0, 10)
statusBoxPadding.PaddingTop = UDim.new(0, 10)
statusBoxPadding.PaddingBottom = UDim.new(0, 10)
statusBoxPadding.Parent = statusBox

-- Refresh Button
local refreshBtn = Instance.new("TextButton")
refreshBtn.Size = UDim2.new(0.48, 0, 0, 40)
refreshBtn.Position = UDim2.new(0, 0, 0, 450)
refreshBtn.BackgroundColor3 = Color3.fromRGB(76, 175, 80)
refreshBtn.BorderSizePixel = 0
refreshBtn.Text = "🔄 Refresh"
refreshBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
refreshBtn.TextSize = 14
refreshBtn.Font = Enum.Font.GothamBold
refreshBtn.Parent = content

local refreshBtnCorner = Instance.new("UICorner")
refreshBtnCorner.CornerRadius = UDim.new(0, 6)
refreshBtnCorner.Parent = refreshBtn

-- Settings Button
local settingsBtn = Instance.new("TextButton")
settingsBtn.Size = UDim2.new(0.48, 0, 0, 40)
settingsBtn.Position = UDim2.new(0.52, 0, 0, 450)
settingsBtn.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
settingsBtn.BorderSizePixel = 0
settingsBtn.Text = "⚙️ Info"
settingsBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
settingsBtn.TextSize = 14
settingsBtn.Font = Enum.Font.Gotham
settingsBtn.Parent = content

local settingsBtnCorner = Instance.new("UICorner")
settingsBtnCorner.CornerRadius = UDim.new(0, 6)
settingsBtnCorner.Parent = settingsBtn

-- Plugin Data Store (save user ID and URL)
local function saveUserId(userId)
	plugin:SetSetting("DataSharkUserId", userId)
end

local function loadUserId()
	return plugin:GetSetting("DataSharkUserId") or ""
end

local function saveBackendUrl(url)
	plugin:SetSetting("DataSharkUrl", url)
end

local function loadBackendUrl()
	return plugin:GetSetting("DataSharkUrl") or DEFAULT_URL
end

local function getBackendUrl()
	local customUrl = urlBox.Text:gsub("%s+", "")
	return (customUrl ~= "" and customUrl) or loadBackendUrl()
end

-- Load saved settings
userIdBox.Text = loadUserId()
local savedUrl = loadBackendUrl()
if savedUrl ~= DEFAULT_URL then
	urlBox.Text = savedUrl
end

-- Functions
local function updateStatus(message, isError, showProgress)
	statusBox.Text = message
	statusBox.TextColor3 = isError and Color3.fromRGB(244, 67, 54) or Color3.fromRGB(76, 175, 80)
	
	if showProgress ~= nil then
		progressContainer.Visible = showProgress
		if showProgress then
			-- Animate progress bar
			progressBar:TweenSize(
				UDim2.new(1, 0, 1, 0),
				Enum.EasingDirection.Out,
				Enum.EasingStyle.Quad,
				1.5,
				true
			)
		else
			progressBar.Size = UDim2.new(0, 0, 1, 0)
		end
	end
end

local function fetchAndCreateScripts()
	local userId = userIdBox.Text:gsub("%s+", "")
	
	if userId == "" then
		updateStatus("❌ Error: Please enter your User ID", true, false)
		return
	end
	
	-- Validate User ID format (UUID)
	if not userId:match("^[a-fA-F0-9%-]+$") or #userId ~= 36 then
		updateStatus("❌ Error: Invalid User ID format\nMust be a valid UUID (36 characters)", true, false)
		return
	end
	
	-- Save User ID and URL
	saveUserId(userId)
	if urlBox.Text ~= "" then
		saveBackendUrl(urlBox.Text)
	end
	
	updateStatus("⏳ Connecting to DataShark IA...", false, true)
	
	local backendUrl = getBackendUrl()
	local url = backendUrl .. "/fetch?userId=" .. HttpService:UrlEncode(userId)
	
	local startTime = tick()
	
	for attempt = 1, MAX_RETRIES do
		if attempt > 1 then
			updateStatus(string.format("🔄 Retry attempt %d/%d...", attempt, MAX_RETRIES), false, true)
		end
		
		local success, response = pcall(function()
			return HttpService:GetAsync(url, false)
		end)
		
		if success then
			local parseSuccess, data = pcall(function()
				return HttpService:JSONDecode(response)
			end)
			
			if not parseSuccess then
				updateStatus("❌ Error: Invalid response from server\nMake sure backend is running", true, false)
				return false
			end
			
			if data.files and next(data.files) ~= nil then
				updateStatus("📥 Importing files...", false, true)
				
				-- Create a folder to organize the scripts
				local timestamp = os.date("%Y%m%d_%H%M%S")
				local systemFolder = Instance.new('Folder')
				systemFolder.Name = 'DataSharkSystem_' .. timestamp
				systemFolder.Parent = ServerScriptService
				
				local fileCount = 0
				local fileList = {}
				
				for fileName, content in pairs(data.files) do
					local script = Instance.new('Script')
					script.Name = fileName:gsub(".lua", "")
					script.Source = content
					script.Parent = systemFolder
					fileCount = fileCount + 1
					table.insert(fileList, script.Name)
					task.wait(0.05)
				end
				
				local elapsed = math.floor((tick() - startTime) * 10) / 10
				local fileListStr = table.concat(fileList, ", ")
				
				updateStatus(
					string.format(
						"✅ Success! (%ss)\n\n%d files imported:\n%s\n\nLocation: %s",
						elapsed,
						fileCount,
						fileListStr,
						systemFolder:GetFullName()
					),
					false,
					false
				)
				
				-- Record action for undo
				ChangeHistoryService:SetWaypoint("DataShark IA Import")
				
				-- Flash success animation
				importBtn.BackgroundColor3 = Color3.fromRGB(76, 175, 80)
				task.wait(0.3)
				importBtn.BackgroundColor3 = Color3.fromRGB(30, 136, 229)
				
				return true
			else
				updateStatus("⚠️ No files available yet\n\nGenerate a system first in the web app:\n" .. backendUrl, true, false)
				return false
			end
		else
			local errorMsg = tostring(response)
			if errorMsg:find("Http requests are not enabled") then
				updateStatus("❌ Error: HTTP requests not enabled\n\nEnable in: Game Settings → Security → Allow HTTP Requests", true, false)
				return false
			elseif errorMsg:find("Timeout") or errorMsg:find("ConnectFail") then
				if attempt < MAX_RETRIES then
					task.wait(RETRY_DELAY)
				end
			else
				updateStatus(string.format("❌ Connection failed (attempt %d/%d)\n\n%s", attempt, MAX_RETRIES, errorMsg), true, false)
				if attempt < MAX_RETRIES then
					task.wait(RETRY_DELAY)
				else
					return false
				end
			end
		end
	end
	
	updateStatus(
		string.format(
			"❌ Failed after %d attempts\n\nMake sure:\n1. Backend is running on %s\n2. HTTP requests are enabled\n3. No firewall blocking",
			MAX_RETRIES,
			backendUrl
		),
		true,
		false
	)
	return false
end

-- Button Events
button.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

importBtn.MouseButton1Click:Connect(function()
	if importBtn.Text:find("⏳") then
		return -- Already importing
	end
	
	importBtn.Text = "⏳ Importing..."
	importBtn.BackgroundColor3 = Color3.fromRGB(25, 118, 210)
	
	task.spawn(function()
		local success = fetchAndCreateScripts()
		task.wait(0.5)
		importBtn.Text = "📥 Import System"
		importBtn.BackgroundColor3 = Color3.fromRGB(30, 136, 229)
	end)
end)

refreshBtn.MouseButton1Click:Connect(function()
	if refreshBtn.Text:find("⏳") then
		return
	end
	
	refreshBtn.Text = "⏳ Checking..."
	refreshBtn.BackgroundColor3 = Color3.fromRGB(67, 160, 71)
	
	task.spawn(function()
		updateStatus("🔄 Checking for new files...", false, true)
		local success = fetchAndCreateScripts()
		task.wait(0.3)
		refreshBtn.Text = "🔄 Refresh"
		refreshBtn.BackgroundColor3 = Color3.fromRGB(76, 175, 80)
	end)
end)

settingsBtn.MouseButton1Click:Connect(function()
	local currentUrl = getBackendUrl()
	local httpEnabled = pcall(function()
		return HttpService:GetAsync("https://www.google.com", false)
	end)
	
	local httpStatus = httpEnabled and "✅ Enabled" or "❌ Disabled"
	
	updateStatus(
		string.format(
			"🛠️ DataShark IA Info\n\nBackend URL:\n%s\n\nHTTP Requests: %s\n\nVersion: 1.0.0\nPlugin: DataShark IA",
			currentUrl,
			httpStatus
		),
		false,
		false
	)
end)

-- Auto-save User ID and URL when changed
userIdBox.FocusLost:Connect(function()
	if userIdBox.Text ~= "" then
		saveUserId(userIdBox.Text)
	end
end)

urlBox.FocusLost:Connect(function()
	if urlBox.Text ~= "" then
		saveBackendUrl(urlBox.Text)
	else
		saveBackendUrl(DEFAULT_URL)
	end
end)

print("🦈 DataShark IA Plugin v1.1.0 loaded successfully!")
print("Click the toolbar button to open the import window")
print("Backend URL: " .. getBackendUrl())

