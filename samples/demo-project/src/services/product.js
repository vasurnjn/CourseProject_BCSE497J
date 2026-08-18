import { DatabaseService } from './database.js';
import { Logger } from '../utils/logger.js';

export class ProductService {
  constructor() {
    this.db = new DatabaseService();
    this.logger = new Logger();
  }
  
  async findAll() {
    this.logger.info('Fetching all products');
    return [];
  }
  
  async findById(id) {
    return { id, name: 'Product', price: 0 };
  }
  
  async create(data) {
    this.logger.info('Creating product', data);
    return { ...data, id: Date.now() };
  }
}
