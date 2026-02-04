import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { saveToHistory } from '../routes/history.js';
import ResponseValidator from './validator.js';
import { ErrorLogger, RetryManager } from './errorLogger.js';

// Configuration
const OLLAMA_TIMEOUT = 60000; // 60 seconds
const OLLAMA_MAX_RETRIES = 3;
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const ollamaModel = process.env.OLLAMA_MODEL;
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// DeepSeek Configuration
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
const deepseekBaseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// Logger utility
function logInfo(message, data = {}) {
  console.log(`[Generator] ${message}`, data);
}

function logError(message, error = {}) {
  console.error(`[Generator ERROR] ${message}`, error);
}

export async function generateSystem(type, prompt = '', userId = 'default') {
  const startTime = Date.now();
  logInfo('Starting generation', { type, userId, hasPrompt: !!prompt });
  
  const supportedTypes = ['attack', 'shop', 'ui', 'inventory', 'quest'];
  
  if (!supportedTypes.includes(type)) {
    ErrorLogger.logError('Unsupported system type', 
      new Error(`Type not in ${supportedTypes.join(',')}`), 
      { type, userId }
    );
    return {
      success: false,
      message: `Sistema "${type}" no reconocido. Tipos disponibles: ${supportedTypes.join(', ')}`,
      code: 'INVALID_TYPE'
    };
  }

  // Validate userId
  if (!userId || userId === 'default') {
    ErrorLogger.logError('Invalid userId', new Error('Invalid userId'), { userId });
    return {
      success: false,
      message: 'UserId inválido. Proporciona un UUID válido.',
      code: 'INVALID_USERID'
    };
  }

  // Sanitize and validate prompt
  try {
    prompt = ResponseValidator.sanitizePrompt(prompt);
  } catch (error) {
    const errorDetails = ResponseValidator.getDetailedErrorMessage(error);
    ErrorLogger.logError('Prompt validation failed', error, { userId, type });
    return {
      success: false,
      message: errorDetails.userMessage,
      suggestion: errorDetails.suggestedFix,
      code: 'INVALID_PROMPT'
    };
  }

  // Create user-specific directory
  const systemName = type.charAt(0).toUpperCase() + type.slice(1) + 'System';
  const baseDir = path.resolve(`generated/${userId}/${systemName}`);
  
  try {
    fs.mkdirSync(baseDir, { recursive: true });
  } catch (error) {
    ErrorLogger.logError('Failed to create directory', error, { baseDir, userId, type });
    return {
      success: false,
      message: 'Error al crear directorio de salida',
      code: 'DIR_CREATE_ERROR'
    };
  }

  let files;
  let generationMethod = 'template';
  let lastError = null;

  // Try to generate with AI (Priority: DeepSeek -> OpenAI -> Ollama -> Template)
  if (deepseekApiKey || process.env.OPENAI_API_KEY || process.env.OLLAMA_MODEL) {
    try {
      if (deepseekApiKey) {
        logInfo('Using DeepSeek for generation');
        files = await RetryManager.executeWithRetry(
          () => generateWithDeepSeek(prompt, type),
          2, // max 2 retries for DeepSeek
          1000
        );
        generationMethod = 'deepseek';
      } else if (process.env.OPENAI_API_KEY) {
        logInfo('Using OpenAI for generation');
        files = await RetryManager.executeWithRetry(
          () => generateWithOpenAI(prompt, type),
          2, // max 2 retries for OpenAI
          1000
        );
        generationMethod = 'openai';
      } else if (process.env.OLLAMA_MODEL) {
        logInfo('Using Ollama for generation');
        files = await RetryManager.executeWithRetry(
          () => generateWithOllama(prompt, type),
          OLLAMA_MAX_RETRIES,
          1000
        );
        generationMethod = 'ollama';
      }
    } catch (error) {
      lastError = error;
      ErrorLogger.logError('AI generation failed, falling back to template', error, { 
        userId, type, method: generationMethod 
      });
      files = getDefaultTemplate(type);
      generationMethod = 'template-fallback';
    }
  } else {
    logInfo('Using default template (no AI configured)');
    files = getDefaultTemplate(type);
  }

  // Validate files object
  if (!files || typeof files !== 'object' || Object.keys(files).length === 0) {
    ErrorLogger.logError('Invalid files object, using template', 
      new Error('No valid files returned'), 
      { userId, type }
    );
    files = getDefaultTemplate(type);
    generationMethod = 'template-fallback';
  }

  // Validate each file
  const defaultTemplate = getDefaultTemplate(type);
  let validFiles = {};
  
  for (const [name, content] of Object.entries(files)) {
    try {
      if (typeof content !== 'string') {
        logError('Invalid file content type', { name, type: typeof content });
        continue;
      }
      // Only validate Lua syntax if NOT from default template
      // Default templates are pre-validated and known to be correct
      if (files !== defaultTemplate) {
        ResponseValidator.validateLuaCode(content, name);
      }
      validFiles[name] = content;
    } catch (error) {
      ErrorLogger.logError(`Lua validation failed for ${name}`, error, { userId, type });
      logError(`File validation failed: ${error.message}`, { name });
      // Continue with other files
    }
  }

  // If no valid files were found, use template
  if (Object.keys(validFiles).length === 0) {
    logError('No valid files after validation, using template');
    validFiles = defaultTemplate;
    generationMethod = 'template-fallback';
  }

  // Write files to disk
  let writtenFiles = 0;
  const writtenFileNames = [];
  
  for (const [name, content] of Object.entries(validFiles)) {
    try {
      const filePath = path.join(baseDir, name);
      fs.writeFileSync(filePath, content, 'utf8');
      writtenFiles++;
      writtenFileNames.push(name);
    } catch (error) {
      ErrorLogger.logError('Failed to write file', error, { name, filePath: baseDir, userId, type });
      logError('Failed to write file', { name, error: error.message });
    }
  }

  if (writtenFiles === 0) {
    ErrorLogger.logError('No files were written', new Error('Write failure'), { userId, type });
    return {
      success: false,
      message: 'Error al escribir archivos generados',
      code: 'WRITE_ERROR'
    };
  }

  // Save to history
  try {
    await saveToHistory(userId, type, prompt, validFiles);
  } catch (error) {
    ErrorLogger.logError('Failed to save to history', error, { userId, type });
    // Don't fail generation if history save fails
  }

  const duration = Date.now() - startTime;
  ErrorLogger.logRequest('generateSystem', userId, type, duration, true, { 
    method: generationMethod,
    filesWritten: writtenFiles
  });

  logInfo('Generation completed', { 
    method: generationMethod, 
    filesWritten: writtenFiles,
    duration: `${duration}ms`
  });

  return {
    success: true,
    message: `${systemName} generated successfully using ${generationMethod}`,
    files: writtenFileNames,
    directory: baseDir,
    method: generationMethod,
    duration: `${duration}ms`
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

async function generateWithDeepSeek(prompt, type = 'attack') {
  const systemMessage = `You are an expert Roblox Lua engineer specializing in scalable game systems.

Generate a complete, production-ready ${type} system based on the user's requirements.

CRITICAL RULES:
1. Return ONLY valid JSON wrapped in {}
2. Start with { and end with } - NO markdown blocks, NO explanations before/after
3. Use Roblox best practices (RemoteEvents, proper service architecture)
4. Include detailed comments explaining key functionality
5. Make code modular and maintainable
6. Add sanity checks and error handling
7. Follow Roblox naming conventions
8. Ensure balanced parentheses, brackets, and braces
9. Include server AND client code when needed

Required JSON format:
{
  "files": {
    "ServiceName.lua": "-- Complete server-side code here",
    "ClientScript.lua": "-- Complete client-side code here"
  }
}

VALIDATION REQUIREMENTS:
- All Lua code must have balanced braces, brackets, parentheses
- Every function must have a matching 'end'
- All strings must be properly quoted
- Code must be syntactically valid Lua
- Generate minimum 3-4 files for a complete system`;

  const userMessage = `Create a ${type} system with these specific requirements: ${prompt}\n\nReturn ONLY JSON, starting with { and ending with }. No markdown, no explanations.`;

  try {
    logInfo('Calling DeepSeek API');
    
    const response = await fetch(`${deepseekBaseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: deepseekModel,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('Empty response from DeepSeek');
    }

    // Validate and parse response
    const files = ResponseValidator.validateJsonResponse(content, type);
    
    logInfo('DeepSeek generation successful', { fileCount: Object.keys(files).length });
    return files;
    
  } catch (error) {
    logError('DeepSeek generation failed', { error: error.message });
    throw error; // Let retry logic handle this
  }
}

async function generateWithOpenAI(prompt, type = 'attack') {
  const systemMessage = `You are an expert Roblox Lua engineer specializing in scalable game systems.

Generate a complete, production-ready ${type} system based on the user's requirements.

CRITICAL RULES:
1. Return ONLY valid JSON wrapped in {}
2. Start with { and end with } - NO markdown blocks, NO explanations before/after
3. Use Roblox best practices (RemoteEvents, proper service architecture)
4. Include detailed comments explaining key functionality
5. Make code modular and maintainable
6. Add sanity checks and error handling
7. Follow Roblox naming conventions
8. Ensure balanced parentheses, brackets, and braces
9. Include server AND client code when needed

Required JSON format:
{
  "files": {
    "ServiceName.lua": "-- Complete server-side code here",
    "ClientScript.lua": "-- Complete client-side code here"
  }
}

VALIDATION REQUIREMENTS:
- All Lua code must have balanced braces, brackets, parentheses
- Every function must have a matching 'end'
- All strings must be properly quoted
- Code must be syntactically valid Lua
- Generate minimum 3-4 files for a complete system`;

  const userMessage = `Create a ${type} system with these specific requirements: ${prompt}\n\nReturn ONLY JSON, starting with { and ending with }. No markdown, no explanations.`;

  try {
    logInfo('Calling OpenAI API');
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1, // Lower temperature for more consistent format
      max_tokens: 4000,
      top_p: 0.95,
    });

    const content = response.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Validate and parse response
    const files = ResponseValidator.validateJsonResponse(content, type);
    
    logInfo('OpenAI generation successful', { fileCount: Object.keys(files).length });
    return files;
    
  } catch (error) {
    logError('OpenAI generation failed', { error: error.message });
    throw error; // Let retry logic handle this
  }
}

async function generateWithOllama(prompt, type = 'attack') {
  const systemMessage = `You are an expert Roblox Lua engineer. Generate ONLY valid JSON, nothing else.

CRITICAL: Return ONLY JSON starting with { and ending with }. No markdown, no explanations.

${type} system requirements:
- Return valid JSON format exactly as specified
- Use Roblox best practices
- Include detailed comments
- Make code modular
- Ensure all code is syntactically valid Lua
- Balance all brackets and braces
- Every function must have an end
- Generate 3-4 files minimum

JSON Format:
{
  "files": {
    "ServiceName.lua": "-- Server code",
    "ClientScript.lua": "-- Client code"
  }
}`;

  const payload = {
    model: process.env.OLLAMA_MODEL,
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `${type} system: ${prompt}\n\nReturn ONLY JSON, nothing else.` },
    ],
    stream: false,
    options: {
      temperature: 0.1,
      num_predict: 3000,
      top_p: 0.95,
    },
  };

  for (let attempt = 1; attempt <= OLLAMA_MAX_RETRIES; attempt++) {
    try {
      logInfo(`Ollama attempt ${attempt}/${OLLAMA_MAX_RETRIES}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT);

      const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/chat`, {
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

      // Validate and parse response
      const files = ResponseValidator.validateJsonResponse(content, type);
      
      logInfo('Ollama generation successful', { fileCount: Object.keys(files).length });
      return files;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        logError(`Ollama timeout on attempt ${attempt}`, { timeout: OLLAMA_TIMEOUT });
      } else {
        logError(`Ollama attempt ${attempt} failed`, { error: error.message });
      }
      
      // If not last attempt, wait before retrying
      if (attempt < OLLAMA_MAX_RETRIES) {
        const delay = 1000 * attempt;
        logInfo(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Last attempt failed
        throw error;
      }
    }
  }

  throw new Error('All Ollama attempts failed');
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
