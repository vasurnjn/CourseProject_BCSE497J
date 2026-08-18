import { OrderService } from '../services/order.js';
import { PaymentService } from '../services/payment.js';
import { NotificationService } from '../services/notification.js';

export class OrderController {
  constructor() {
    this.orderService = new OrderService();
    this.paymentService = new PaymentService();
    this.notificationService = new NotificationService();
  }
  
  async create(req, res) {
    const order = await this.orderService.create(req.body, req.user);
    await this.paymentService.charge(order);
    await this.notificationService.send('order-created', req.user);
    res.status(201).json(order);
  }
  
  async get(req, res) {
    const order = await this.orderService.findById(req.params.id);
    res.json(order);
  }
}
