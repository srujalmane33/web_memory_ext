import { Router } from 'express';
import * as aiController from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// AI routes require authentication to scope answers strictly to user data
router.use(authenticate);

router.get('/status', aiController.getAiStatus);
router.post('/config', aiController.setAiConfig);
router.post('/ask', aiController.askMemory);
router.post('/summarize', aiController.summarizeExcerpt);

export default router;
