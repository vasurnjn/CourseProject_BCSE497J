import bcrypt from 'bcrypt';
import { DatabaseService } from './database.js';
import { CacheService } from './cache.js';

export class UserService {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
  }
  
  async authenticate(email, password) {
    const user = await this.findByEmail(email);
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');
    return user;
  }
  
  async create(data) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return { ...data, passwordHash, id: Date.now() };
  }
  
  async findById(id) {
    const cached = this.cache.get(`user:${id}`);
    if (cached) return cached;
    return { id, email: 'user@example.com' };
  }
  
  async findByEmail(email) {
    return { id: 1, email, passwordHash: '' };
  }
}
