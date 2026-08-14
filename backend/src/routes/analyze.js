import { Router } from 'express';
import { analyzeController } from '../controllers/analyzeController.js';

export const analyzeRoutes = Router();

analyzeRoutes.post('/github', analyzeController.analyzeGithub);
analyzeRoutes.post('/upload', analyzeController.analyzeUpload);
analyzeRoutes.get('/status/:jobId', analyzeController.getStatus);
