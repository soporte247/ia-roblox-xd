/**
 * Classifies the type of system based on the prompt
 * @param {string} prompt - User's input prompt
 * @returns {string} - System type: 'attack', 'shop', 'ui', or 'unknown'
 */
export function classifyPrompt(prompt) {
  const p = prompt.toLowerCase();

  const attackKeywords = [
    'attack', 'ataque', 'combat', 'combate', 'damage', 'daño',
    'weapon', 'arma', 'hit', 'golpe', 'fight', 'pelea',
    'sword', 'espada', 'gun', 'pistola', 'slash', 'cooldown'
  ];

  const shopKeywords = [
    'shop', 'tienda', 'store', 'buy', 'comprar', 'sell', 'vender',
    'purchase', 'inventory', 'inventario', 'coin', 'moneda', 'price', 'precio'
  ];

  const uiKeywords = [
    'ui', 'interface', 'interfaz', 'menu', 'menú', 'gui',
    'button', 'botón', 'screen', 'pantalla', 'hud', 'display'
  ];

  const attackScore = attackKeywords.filter(kw => p.includes(kw)).length;
  const shopScore = shopKeywords.filter(kw => p.includes(kw)).length;
  const uiScore = uiKeywords.filter(kw => p.includes(kw)).length;

  const maxScore = Math.max(attackScore, shopScore, uiScore);

  if (maxScore === 0) return 'unknown';
  if (attackScore === maxScore) return 'attack';
  if (shopScore === maxScore) return 'shop';
  if (uiScore === maxScore) return 'ui';

  return 'unknown';
}
