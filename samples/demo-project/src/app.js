import express from 'express';
import { authRouter } from './routes/auth.js';
import { productRouter } from './routes/products.js';
import { orderRouter } from './routes/orders.js';
import { DatabaseService } from './services/database.js';
import { Logger } from './utils/logger.js';

const app = express();
const db = new DatabaseService();
const logger = new Logger();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/products', productRouter);
app.use('/orders', orderRouter);

export default app;
