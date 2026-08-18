export class CacheService {
  constructor() {
    this.store = new Map();
    this.ttl = 300000; // 5 minutes
  }
  
  get(key) { return this.store.get(key); }
  set(key, value) { this.store.set(key, value); }
  invalidate(key) { this.store.delete(key); }
  clear() { this.store.clear(); }
}
