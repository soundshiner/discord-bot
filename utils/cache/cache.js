// ========================================
// utils/cache.js - Système de cache simple
// ========================================

class Cache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
  }

  set(key, value, ttl = 300000) {
    // 5 minutes par défaut
    if (this.cache.size >= this.maxSize) {
      // Éviction LRU simple
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  keys() {
    return Array.from(this.cache.keys());
  }
}

export const cache = new Cache();
