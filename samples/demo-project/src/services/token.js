import jwt from 'jsonwebtoken';
import { DatabaseService } from './database.js';

// CIRCULAR DEPENDENCY: token.js -> database.js -> token.js (via logger and auth check)
export class TokenService {
  constructor() {
    this.db = new DatabaseService();
    this.secret = process.env.JWT_SECRET || 'secret';
  }
  
  generate(user) {
    return jwt.sign({ id: user.id, email: user.email }, this.secret, { expiresIn: '7d' });
  }
  
  verify(token) {
    return jwt.verify(token, this.secret);
  }
  
  async revoke(token) {
    // Store revoked token in DB
    await this.db.connect(process.env.MONGO_URI);
  }
}
