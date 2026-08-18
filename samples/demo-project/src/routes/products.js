import { Router } from 'express';
import { ProductController } from '../controllers/productController.js';
import { validateToken } from '../middleware/auth.js';

export const productRouter = Router();
const controller = new ProductController();

productRouter.get('/', controller.list.bind(controller));
productRouter.get('/:id', controller.get.bind(controller));
productRouter.post('/', validateToken, controller.create.bind(controller));
