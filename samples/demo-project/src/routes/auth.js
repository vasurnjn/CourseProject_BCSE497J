import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validateToken } from '../middleware/auth.js';

export const authRouter = Router();
const controller = new AuthController();

authRouter.post('/login', controller.login.bind(controller));
authRouter.post('/register', controller.register.bind(controller));
authRouter.get('/profile', validateToken, controller.profile.bind(controller));
