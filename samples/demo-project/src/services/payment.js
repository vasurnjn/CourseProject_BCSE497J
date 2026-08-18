import Stripe from 'stripe';
import { NotificationService } from './notification.js';
import { Logger } from '../utils/logger.js';

export class PaymentService {
  constructor() {
    this.stripe = Stripe(process.env.STRIPE_KEY || 'test');
    this.notifications = new NotificationService();
    this.logger = new Logger();
  }
  
  async charge(order) {
    this.logger.info('Charging for order', { orderId: order.id });
    // stripe charge logic
    await this.notifications.send('payment-processed', { orderId: order.id });
    return { success: true };
  }
}
