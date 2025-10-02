import { Router } from 'express';
import { WhatsAppController } from '../controllers/WhatsAppController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { whatsappValidation } from '../utils/validationSchemas';

const router = Router();
const whatsappController = new WhatsAppController();

// POST /api/v1/whatsapp/webhook - WhatsApp webhook endpoint
router.post('/webhook', whatsappController.handleWebhook);

// GET /api/v1/whatsapp/webhook - WhatsApp webhook verification
router.get('/webhook', whatsappController.verifyWebhook);

// POST /api/v1/whatsapp/send - Send WhatsApp message
router.post(
  '/send',
  authMiddleware,
  validateRequest(whatsappValidation.sendMessage),
  whatsappController.sendMessage
);

// GET /api/v1/whatsapp/messages - Get WhatsApp messages for a user
router.get('/messages', authMiddleware, whatsappController.getUserMessages);

// POST /api/v1/whatsapp/send-video - Send video via WhatsApp
router.post(
  '/send-video',
  authMiddleware,
  validateRequest(whatsappValidation.sendVideo),
  whatsappController.sendVideo
);

export default router;
