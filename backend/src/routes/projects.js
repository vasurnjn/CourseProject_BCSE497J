import { Router } from 'express';
import { projectController } from '../controllers/projectController.js';

export const projectRoutes = Router();

projectRoutes.get('/', projectController.listProjects);
projectRoutes.get('/:id', projectController.getProject);
projectRoutes.get('/:id/graph', projectController.getGraph);
projectRoutes.get('/:id/statistics', projectController.getStatistics);
projectRoutes.get('/:id/cycles', projectController.getCycles);
projectRoutes.get('/:id/unused-dependencies', projectController.getUnusedDependencies);
projectRoutes.get('/:id/node/:nodeId', projectController.getNode);
projectRoutes.get('/:id/impact/:nodeId', projectController.getImpact);
