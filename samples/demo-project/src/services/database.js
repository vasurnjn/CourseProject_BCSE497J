import mongoose from 'mongoose';
import { Logger } from '../utils/logger.js';

export class DatabaseService {
  constructor() {
    this.logger = new Logger();
    this.connection = null;
  }
  
  async connect(uri) {
    this.connection = await mongoose.connect(uri);
    this.logger.info('Database connected');
    return this.connection;
  }
  
  async disconnect() {
    await mongoose.disconnect();
    this.logger.info('Database disconnected');
  }
}
