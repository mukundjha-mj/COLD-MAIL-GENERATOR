import express from 'express';
import { generateEmail, generateEmailFromData, testEndpoint } from '../controllers/email.controller';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.post('/generate', authMiddleware, generateEmail);
router.post('/generate-from-data', authMiddleware, generateEmailFromData);
router.get('/test', authMiddleware, testEndpoint);

export default router;