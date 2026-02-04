/**
 * Classifies the type of system based on the prompt
 * @param {string} prompt - User's input prompt
 * @returns {string} - System type: 'attack', 'shop', 'ui', 'inventory', or 'quest'
 */
export function classifyPrompt(prompt) {
  const p = prompt.toLowerCase();

  const attackKeywords = [
    'attack', 'ataque', 'combat', 'combate', 'damage', 'daño',
    'weapon', 'arma', 'hit', 'golpe', 'fight', 'pelea',
    'sword', 'espada', 'gun', 'pistola', 'slash', 'cooldown',
    'battle', 'batalla', 'damage system', 'sistema de daño'
  ];

  const shopKeywords = [
    'shop', 'tienda', 'store', 'buy', 'comprar', 'sell', 'vender',
    'purchase', 'coin', 'moneda', 'price', 'precio', 'merchant',
    'comerciante', 'cart', 'carrito', 'checkout'
  ];

  const uiKeywords = [
    'ui', 'interface', 'interfaz', 'menu', 'menú', 'gui',
    'button', 'botón', 'screen', 'pantalla', 'hud', 'display',
    'dashboard', 'window', 'ventana', 'panel'
  ];

  const inventoryKeywords = [
    'inventory', 'inventario', 'items', 'ítems', 'bag', 'mochila',
    'backpack', 'slot', 'ranura', 'storage', 'almacenamiento',
    'equipment', 'equipo', 'gear', 'loot'
  ];

  const questKeywords = [
    'quest', 'misión', 'mission', 'objective', 'objetivo', 'task',
    'tarea', 'npc', 'dialog', 'diálogo', 'reward', 'recompensa',
    'bounty', 'recompensa', 'tracker', 'journal', 'diario'
  ];

  const attackScore = attackKeywords.filter(kw => p.includes(kw)).length;
  const shopScore = shopKeywords.filter(kw => p.includes(kw)).length;
  const uiScore = uiKeywords.filter(kw => p.includes(kw)).length;
  const inventoryScore = inventoryKeywords.filter(kw => p.includes(kw)).length;
  const questScore = questKeywords.filter(kw => p.includes(kw)).length;

  const maxScore = Math.max(attackScore, shopScore, uiScore, inventoryScore, questScore);

  // If no keywords found, default to 'attack' instead of 'unknown'
  if (maxScore === 0) return 'attack';
  
  if (attackScore === maxScore) return 'attack';
  if (shopScore === maxScore) return 'shop';
  if (uiScore === maxScore) return 'ui';
  if (inventoryScore === maxScore) return 'inventory';
  if (questScore === maxScore) return 'quest';

  // Fallback to attack
  return 'attack';
}
