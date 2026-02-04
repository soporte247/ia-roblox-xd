import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { saveToHistory } from '../routes/history.js';

// Configuration
const OLLAMA_TIMEOUT = 60000; // 60 seconds
const OLLAMA_MAX_RETRIES = 2;
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const ollamaModel = process.env.OLLAMA_MODEL;
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Logger utility
function logInfo(message, data = {}) {
  console.log(`[Generator] ${message}`, data);
}

function logError(message, error = {}) {
  console.error(`[Generator ERROR] ${message}`, error);
}

export async function generateSystem(type, prompt = '', userId = 'default') {
  logInfo('Starting generation', { type, userId, hasPrompt: !!prompt });
  
  const supportedTypes = ['attack', 'shop', 'ui', 'inventory', 'quest'];
  
  if (!supportedTypes.includes(type)) {
    logError('Unsupported system type', { type });
    return {
      success: false,
      message: `Sistema "${type}" no reconocido. Tipos disponibles: ${supportedTypes.join(', ')}`,
    };
  }

  // Validate userId
  if (!userId || userId === 'default') {
    logError('Invalid userId', { userId });
    return {
      success: false,
      message: 'UserId inválido. Proporciona un UUID válido.',
    };
  }

  // Create user-specific directory
  const systemName = type.charAt(0).toUpperCase() + type.slice(1) + 'System';
  const baseDir = path.resolve(`generated/${userId}/${systemName}`);
  
  try {
    fs.mkdirSync(baseDir, { recursive: true });
  } catch (error) {
    logError('Failed to create directory', { baseDir, error: error.message });
    return {
      success: false,
      message: 'Error al crear directorio de salida',
    };
  }

  let files;
  let generationMethod = 'template';

  try {
    if (openai) {
      logInfo('Using OpenAI for generation');
      files = await generateWithOpenAI(prompt, type);
      generationMethod = 'openai';
    } else if (ollamaModel) {
      logInfo('Using Ollama for generation');
      files = await generateWithOllama(prompt, type);
      generationMethod = 'ollama';
    } else {
      logInfo('Using default template');
      files = getDefaultTemplate(type);
    }
  } catch (error) {
    logError('Generation failed, falling back to template', { error: error.message });
    files = getDefaultTemplate(type);
    generationMethod = 'template-fallback';
  }

  // Validate files object
  if (!files || typeof files !== 'object' || Object.keys(files).length === 0) {
    logError('Invalid files object, using template', { files });
    files = getDefaultTemplate(type);
    generationMethod = 'template-fallback';
  }

  // Write files to disk
  let writtenFiles = 0;
  for (const [name, content] of Object.entries(files)) {
    try {
      if (typeof content !== 'string') {
        logError('Invalid file content type', { name, type: typeof content });
        continue;
      }
      const filePath = path.join(baseDir, name);
      fs.writeFileSync(filePath, content, 'utf8');
      writtenFiles++;
    } catch (error) {
      logError('Failed to write file', { name, error: error.message });
    }
  }

  if (writtenFiles === 0) {
    logError('No files were written');
    return {
      success: false,
      message: 'Error al escribir archivos generados',
    };
  }

  // Save to history
  try {
    await saveToHistory(userId, type, prompt, files);
  } catch (error) {
    logError('Failed to save to history', { error: error.message });
  }

  logInfo('Generation completed', { method: generationMethod, filesWritten: writtenFiles });

  return {
    success: true,
    message: `${systemName} generated successfully using ${generationMethod}`,
    files: Object.keys(files),
    directory: baseDir,
    method: generationMethod,
  };
}

function getDefaultTemplate(type) {
  switch (type) {
    case 'attack':
      return {
        'AttackService.lua': attackServiceLua(),
        'DamageService.lua': damageServiceLua(),
        'CooldownService.lua': cooldownServiceLua(),
        'AttackClient.lua': attackClientLua(),
      };
    case 'shop':
      return shopTemplate();
    case 'ui':
      return uiTemplate();
    case 'inventory':
      return inventoryTemplate();
    case 'quest':
      return questTemplate();
    default:
      return {};
  }
}

async function generateWithOpenAI(prompt, type = 'attack') {
  const systemMessage = `You are an expert Roblox Lua engineer specializing in scalable game systems.

Generate a complete, production-ready ${type} system based on the user's requirements.

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown, no explanations, no code blocks
2. Use Roblox best practices (RemoteEvents, proper service architecture)
3. Include detailed comments explaining key functionality
4. Make code modular and maintainable
5. Add sanity checks and error handling
6. Follow Roblox naming conventions

Required JSON format:
{
  "files": {
    "ServiceName.lua": "-- Server-side code here",
    "ClientScript.lua": "-- Client-side code here"
  }
}

All values must be complete, working Lua code as strings. Generate at least 3-4 files.`;

  const userMessage = `Create a ${type} system with these requirements: ${prompt}`;

  try {
    logInfo('Calling OpenAI API');
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = response.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Remove markdown code blocks if present
    let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON if there's extra text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleaned);
    
    if (!parsed.files || typeof parsed.files !== 'object') {
      throw new Error('Invalid JSON structure from OpenAI');
    }
    
    logInfo('OpenAI generation successful', { fileCount: Object.keys(parsed.files).length });
    return parsed.files;
    
  } catch (error) {
    logError('OpenAI generation failed', { error: error.message });
    return getDefaultTemplate(type);
  }
}

async function generateWithOllama(prompt, type = 'attack') {
  const systemMessage = `You are an expert Roblox Lua engineer specializing in scalable game systems.

Generate a complete, production-ready ${type} system based on the user's requirements.

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown, no explanations
2. Use Roblox best practices (RemoteEvents, proper service architecture)
3. Include comments explaining key functionality
4. Make code modular and maintainable
5. Add sanity checks and error handling

Required JSON format:
{
  "files": {
    "ServiceName.lua": "-- Server-side code here",
    "ClientScript.lua": "-- Client-side code here"
  }
}

All values must be complete, working Lua code as strings.`;

  const payload = {
    model: ollamaModel,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `Create a ${type} system: ${prompt}` },
    ],
    stream: false,
    options: {
      temperature: 0.2,
      num_predict: 2000,
    },
  };

  for (let attempt = 1; attempt <= OLLAMA_MAX_RETRIES; attempt++) {
    try {
      logInfo(`Ollama attempt ${attempt}/${OLLAMA_MAX_RETRIES}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT);

      const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data?.message?.content?.trim();
      
      if (!content) {
        throw new Error('Empty Ollama response');
      }

      // Remove markdown code blocks if present
      let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to find JSON object if response has extra text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleaned);
      
      if (!parsed.files || typeof parsed.files !== 'object') {
        throw new Error('Invalid JSON structure: missing or invalid files object');
      }
      
      if (Object.keys(parsed.files).length === 0) {
        throw new Error('Empty files object in response');
      }
      
      logInfo('Ollama generation successful', { fileCount: Object.keys(parsed.files).length });
      return parsed.files;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        logError(`Ollama timeout on attempt ${attempt}`, { timeout: OLLAMA_TIMEOUT });
      } else {
        logError(`Ollama attempt ${attempt} failed`, { error: error.message });
      }
      
      // If not last attempt, wait before retrying
      if (attempt < OLLAMA_MAX_RETRIES) {
        const delay = 1000 * attempt; // Exponential backoff
        logInfo(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  logError('All Ollama attempts failed, using template');
  return getDefaultTemplate(type);
}

function attackServiceLua() {
  return `-- Server-side attack logic
local AttackService = {}

function AttackService.PerformAttack(player, target, damage)
  if not target or not target:FindFirstChild('Humanoid') then return end
  target.Humanoid:TakeDamage(damage)
  print("Attack dealt " .. damage .. " damage to " .. target.Name)
end

return AttackService
`;
}

function damageServiceLua() {
  return `-- Handles damage logic
local DamageService = {}

function DamageService.Apply(humanoid, amount)
  if humanoid.Health <= 0 then return end
  humanoid:TakeDamage(amount)
end

function DamageService.Heal(humanoid, amount)
  humanoid.Health = math.min(humanoid.Health + amount, humanoid.MaxHealth)
end

return DamageService
`;
}

function cooldownServiceLua() {
  return `-- Cooldown management
local CooldownService = {}
local cooldowns = {}

function CooldownService.CanUse(playerId, key, cooldownTime)
  local now = os.clock()
  local cooldownKey = playerId .. "_" .. key
  
  if cooldowns[cooldownKey] and now - cooldowns[cooldownKey] < cooldownTime then
    return false
  end
  
  cooldowns[cooldownKey] = now
  return true
end

function CooldownService.GetRemainingTime(playerId, key, cooldownTime)
  local now = os.clock()
  local cooldownKey = playerId .. "_" .. key
  
  if not cooldowns[cooldownKey] then return 0 end
  
  local remaining = cooldownTime - (now - cooldowns[cooldownKey])
  return math.max(0, remaining)
end

return CooldownService
`;
}

function attackClientLua() {
  return `-- Client-side input handler
local UserInputService = game:GetService('UserInputService')
local ReplicatedStorage = game:GetService('ReplicatedStorage')

-- Assuming a RemoteEvent is available
local AttackEvent = ReplicatedStorage:WaitForChild('AttackEvent')

UserInputService.InputBegan:Connect(function(input, gameProcessed)
  if gameProcessed then return end
  
  if input.UserInputType == Enum.UserInputType.MouseButton1 then
    print('Attack triggered from client')
    AttackEvent:FireServer()
  end
end)
`;
}

// Shop System Template
function shopTemplate() {
  return {
    'ShopService.lua': `-- Server-side shop logic
local ShopService = {}
local Players = game:GetService('Players')

local shopItems = {
  {id = 1, name = "Sword", price = 100},
  {id = 2, name = "Shield", price = 150},
  {id = 3, name = "Potion", price = 50}
}

function ShopService.GetItems()
  return shopItems
end

function ShopService.Purchase(player, itemId)
  local leaderstats = player:FindFirstChild('leaderstats')
  if not leaderstats then return false end
  
  local coins = leaderstats:FindFirstChild('Coins')
  if not coins then return false end
  
  for _, item in ipairs(shopItems) do
    if item.id == itemId then
      if coins.Value >= item.price then
        coins.Value = coins.Value - item.price
        return true, item.name
      end
      return false, "Not enough coins"
    end
  end
  return false, "Item not found"
end

return ShopService
`,
    'ShopClient.lua': `-- Client-side shop UI
local Players = game:GetService('Players')
local ReplicatedStorage = game:GetService('ReplicatedStorage')

local player = Players.LocalPlayer
local ShopRemote = ReplicatedStorage:WaitForChild('ShopRemote')

-- Request items from server
ShopRemote:InvokeServer("GetItems")
`
  };
}

// UI System Template
function uiTemplate() {
  return {
    'UIManager.lua': `-- UI Manager
local UIManager = {}
local Players = game:GetService('Players')

function UIManager.CreateUI(player)
  local screenGui = Instance.new('ScreenGui')
  screenGui.Name = 'MainUI'
  screenGui.Parent = player:WaitForChild('PlayerGui')
  
  local frame = Instance.new('Frame')
  frame.Size = UDim2.new(0, 200, 0, 100)
  frame.Position = UDim2.new(0.5, -100, 0.5, -50)
  frame.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
  frame.Parent = screenGui
  
  return screenGui
end

return UIManager
`
  };
}

// Inventory System Template
function inventoryTemplate() {
  return {
    'InventoryService.lua': `-- Server-side inventory
local InventoryService = {}
local inventories = {}

function InventoryService.CreateInventory(player)
  inventories[player.UserId] = {
    slots = {},
    maxSlots = 20
  }
end

function InventoryService.AddItem(player, item)
  local inventory = inventories[player.UserId]
  if not inventory then return false end
  
  if #inventory.slots < inventory.maxSlots then
    table.insert(inventory.slots, item)
    return true
  end
  return false
end

return InventoryService
`
  };
}

// Quest System Template
function questTemplate() {
  return {
    'QuestService.lua': `-- Server-side quest system
local QuestService = {}
local activeQuests = {}

local quests = {
  {id = 1, name = "Collect 10 Coins", objective = "coins", target = 10, reward = 100}
}

function QuestService.StartQuest(player, questId)
  activeQuests[player.UserId] = activeQuests[player.UserId] or {}
  table.insert(activeQuests[player.UserId], questId)
  return true
end

return QuestService
`
  };
}
