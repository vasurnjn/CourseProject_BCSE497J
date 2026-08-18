import { UserService } from '../services/user.js';
import { TokenService } from '../services/token.js';
import { Logger } from '../utils/logger.js';

export class AuthController {
  constructor() {
    this.userService = new UserService();
    this.tokenService = new TokenService();
    this.logger = new Logger();
  }
  
  async login(req, res) {
    const { email, password } = req.body;
    const user = await this.userService.authenticate(email, password);
    const token = this.tokenService.generate(user);
    this.logger.info('User logged in', { email });
    res.json({ token, user });
  }
  
  async register(req, res) {
    const user = await this.userService.create(req.body);
    const token = this.tokenService.generate(user);
    res.status(201).json({ token, user });
  }
  
  async profile(req, res) {
    const user = await this.userService.findById(req.user.id);
    res.json(user);
  }
}
