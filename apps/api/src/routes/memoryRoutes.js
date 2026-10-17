import { Router } from 'express';
import * as memoryController from '../controllers/memoryController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, createMemorySchema, updateMemorySchema } from '../middleware/validate.js';

const router = Router();

// All memory routes are strictly authenticated
router.use(authenticate);

router.post('/', validate(createMemorySchema), memoryController.createMemory);
router.get('/', memoryController.listMemories);
router.get('/search', memoryController.searchMemories);
router.get('/:id', memoryController.getMemoryById);
router.patch('/:id', validate(updateMemorySchema), memoryController.updateMemory);
router.delete('/:id', memoryController.deleteMemory);

export default router;
