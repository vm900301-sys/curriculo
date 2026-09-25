const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const resumeController = require('../controllers/resumeController');
const aiController = require('../controllers/aiController');
const paymentController = require('../controllers/paymentController');

// 1. Webhook do Mercado Pago (PÚBLICA - Chamada pelos servidores do Mercado Pago)
router.post('/webhook/mercadopago', paymentController.webhookMercadoPago);

// 2. Rotas do Currículo (Wizard)
router.get('/:id', authMiddleware, resumeController.getResume);
router.patch('/:id', authMiddleware, resumeController.updateResumeFields);
router.get('/:id/download', authMiddleware, resumeController.downloadPDF);

// 3. Experiências & Educação
router.post('/:id/experiences', authMiddleware, resumeController.addExperience);
router.delete('/:id/experiences/:experienceId', authMiddleware, resumeController.deleteExperience);
router.post('/:id/education', authMiddleware, resumeController.addEducation);

// 4. Inteligência Artificial (OpenAI)
router.post('/:id/generate-summary', authMiddleware, aiController.generateSummary);

// 5. Pagamentos PIX (Mercado Pago)
router.post('/:id/pix', authMiddleware, paymentController.criarPixResume);
router.post('/:id/simular-pagamento', paymentController.simularPagamentoAprovado);

module.exports = router;
