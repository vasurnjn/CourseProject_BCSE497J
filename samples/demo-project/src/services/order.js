import { DatabaseService } from './database.js';
import { UserService } from './user.js';
import { ProductService } from './product.js';

export class OrderService {
  constructor() {
    this.db = new DatabaseService();
    this.userService = new UserService();
    this.productService = new ProductService();
  }
  
  async create(data, user) {
    const product = await this.productService.findById(data.productId);
    return { ...data, user, product, id: Date.now(), status: 'pending' };
  }
  
  async findById(id) {
    return { id, status: 'pending' };
  }
}
