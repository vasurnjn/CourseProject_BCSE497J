import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { validateToken } from '../middleware/auth.js';
import { PaymentService } from '../services/payment.js';

export const orderRouter = Router();
const controller = new OrderController();

orderRouter.post('/', validateToken, controller.create.bind(controller));
orderRouter.get('/:id', validateToken, controller.get.bind(controller));
