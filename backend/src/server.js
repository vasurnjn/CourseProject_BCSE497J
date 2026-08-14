import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import { analyzeRoutes } from './routes/analyze.js';
import { projectRoutes } from './routes/projects.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  useTempFiles: true,
  tempFileDir: './tmp/',
  abortOnLimit: true,
  safeFileNames: /[^\w.]/g,  // allow dots to preserve extensions
  preserveExtension: true
}));

app.use('/api/analyze', analyzeRoutes);
app.use('/api/projects', projectRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
