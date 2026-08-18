import { UserService } from './user.js';
import { Logger } from '../utils/logger.js';

// Creates circular: notification -> user -> cache -> (would cycle)
export class NotificationService {
  constructor() {
    this.userService = new UserService();
    this.logger = new Logger();
  }
  
  async send(event, data) {
    this.logger.info('Sending notification', { event });
    return { sent: true };
  }
}
