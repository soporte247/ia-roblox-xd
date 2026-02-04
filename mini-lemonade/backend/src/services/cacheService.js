/**
 * CacheService - Sistema de caché en memoria para respuestas de IA
 * Reduce llamadas repetidas a APIs y mejora performance
 */

import crypto from 'crypto';

class CacheService {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // Máximo de entradas en caché
    this.ttl = 1000 * 60 * 30; // 30 minutos de TTL
    this.hits = 0;
    this.misses = 0;
    
    // Limpiar caché expirado cada 10 minutos
    setInterval(() => this.cleanExpired(), 1000 * 60 * 10);
  }

  /**
   * Genera un hash único para la clave de caché
   */
  generateKey(type, prompt) {
    const data = `${type}:${prompt.toLowerCase().trim()}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Obtiene un valor del caché
   */
  get(type, prompt) {
    const key = this.generateKey(type, prompt);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Verificar si expiró
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    entry.lastAccessed = Date.now();
    
    console.log(`[Cache HIT] ${type} - Hit rate: ${this.getHitRate()}%`);
    return entry.value;
  }

  /**
   * Guarda un valor en el caché
   */
  set(type, prompt, value) {
    // Si el caché está lleno, eliminar la entrada más antigua
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const key = this.generateKey(type, prompt);
    const entry = {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttl,
      lastAccessed: Date.now(),
      type
    };

    this.cache.set(key, entry);
    console.log(`[Cache SET] ${type} - Size: ${this.cache.size}/${this.maxSize}`);
  }

  /**
   * Elimina la entrada más antigua (LRU - Least Recently Used)
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log('[Cache EVICT] Removed oldest entry');
    }
  }

  /**
   * Limpia entradas expiradas
   */
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache CLEAN] Removed ${cleaned} expired entries`);
    }
  }

  /**
   * Limpia todo el caché
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log(`[Cache CLEAR] Cleared ${size} entries`);
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
      totalRequests: total
    };
  }

  /**
   * Calcula el hit rate
   */
  getHitRate() {
    const total = this.hits + this.misses;
    if (total === 0) return 0;
    return ((this.hits / total) * 100).toFixed(2);
  }

  /**
   * Invalida entradas de un tipo específico
   */
  invalidateType(type) {
    let removed = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.type === type) {
        this.cache.delete(key);
        removed++;
      }
    }
    console.log(`[Cache INVALIDATE] Removed ${removed} entries of type ${type}`);
  }
}

// Singleton
const cacheService = new CacheService();

export default cacheService;
