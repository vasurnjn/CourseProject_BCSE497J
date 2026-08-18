import { ProductService } from '../services/product.js';
import { CacheService } from '../services/cache.js';

export class ProductController {
  constructor() {
    this.productService = new ProductService();
    this.cache = new CacheService();
  }
  
  async list(req, res) {
    const cached = this.cache.get('products');
    if (cached) return res.json(cached);
    const products = await this.productService.findAll();
    this.cache.set('products', products);
    res.json(products);
  }
  
  async get(req, res) {
    const product = await this.productService.findById(req.params.id);
    res.json(product);
  }
  
  async create(req, res) {
    const product = await this.productService.create(req.body);
    this.cache.invalidate('products');
    res.status(201).json(product);
  }
}
