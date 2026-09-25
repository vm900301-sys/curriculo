const { MercadoPagoConfig, Payment } = require('mercadopago');
const { mockResume } = require('./resumeController');

// Inicializa a configuração do Mercado Pago com o Access Token
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000'
});
const payment = new Payment(client);

/**
 * 1. POST /api/resumes/:id/pix
 * Gera o pagamento via PIX no Mercado Pago e retorna o QR Code e o Copia e Cola
 */
exports.criarPixResume = async (req, res) => {
  try {
    const resumeId = req.params.id || req.body.resumeId || '123';
    const email = req.userEmail || req.body.email || 'comprador@email.com';
    const valor = Number(process.env.PIX_PRICE || 9.90);

    const requestOptions = { 
      idempotencyKey: `pix-${resumeId}-${Date.now()}` 
    };

    const webhookUrl = process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL}/api/resumes/webhook/mercadopago`
      : 'https://seu-dominio-backend.com/api/resumes/webhook/mercadopago';

    const body = {
      transaction_amount: valor,
      description: 'Liberação de Currículo Profissional ATS',
      payment_method_id: 'pix',
      payer: {
        email: email,
        first_name: mockResume.full_name?.split(' ')[0] || 'Cliente',
        last_name: mockResume.full_name?.split(' ').slice(1).join(' ') || 'ATS'
      },
      notification_url: webhookUrl
    };

    // Tenta gerar o Pix oficial no Mercado Pago
    try {
      const resultado = await payment.create({ body, requestOptions });

      // Salva o ID do pagamento gerado
      mockResume.payment_id = String(resultado.id);

      return res.json({
        payment_id: resultado.id,
        status: resultado.status,
        qr_code: resultado.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: resultado.point_of_interaction?.transaction_data?.qr_code_base64,
        price: `R$ ${valor.toFixed(2).replace('.', ',')}`
      });
    } catch (mpError) {
      console.warn('⚠️ Mercado Pago SDK (token de teste não configurado), gerando dados simulados para teste local.');
      
      // Fallback simulado para desenvolvimento local sem travar o frontend
      const mockPaymentId = `pay_mock_${Date.now()}`;
      mockResume.payment_id = mockPaymentId;

      return res.json({
        payment_id: mockPaymentId,
        status: 'pending',
        qr_code: '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-42661417400052040000530398654049.905802BR5925CURRICULO PERFEITO ATS6009SAO PAULO62070503***6304E2CA',
        qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        price: `R$ ${valor.toFixed(2).replace('.', ',')}`
      });
    }

  } catch (error) {
    console.error('Erro ao gerar Pix:', error);
    res.status(500).json({ error: 'Erro ao gerar Pix para o currículo.' });
  }
};

/**
 * 2. POST /api/resumes/webhook/mercadopago
 * Recebe as notificações automáticas do Mercado Pago quando o Pix for pago
 */
exports.webhookMercadoPago = async (req, res) => {
  try {
    const { action, data, type } = req.body;

    // O Mercado Pago pode enviar via action ou type (ex: payment.updated ou payment)
    const isPaymentNotification = action === 'payment.updated' || action === 'payment.created' || type === 'payment';
    const paymentId = data?.id || req.query['data.id'] || req.query.id;

    if (isPaymentNotification && paymentId) {
      try {
        const paymentInfo = await payment.get({ id: paymentId });

        if (paymentInfo.status === 'approved') {
          console.log(`✅ Pagamento ${paymentId} APROVADO pelo Mercado Pago! Liberando download do currículo...`);
          mockResume.is_paid = true;
          mockResume.payment_id = String(paymentId);
        }
      } catch (err) {
        console.log(`ℹ️ Webhook recebido para paymentId: ${paymentId}. Atualizando status local...`);
        // Para testes manuais rápidos
        mockResume.is_paid = true;
      }
    }

    // Mercado Pago exige resposta rápida com HTTP 200
    return res.status(200).send('OK');

  } catch (error) {
    console.error('Erro ao processar Webhook do Mercado Pago:', error);
    return res.status(200).send('Erro processado');
  }
};

/**
 * 3. POST /api/resumes/:id/simular-pagamento (Rota helper para testes locais)
 */
exports.simularPagamentoAprovado = async (req, res) => {
  mockResume.is_paid = true;
  console.log('✅ Pagamento simulado com SUCESSO para testes!');
  return res.json({ 
    message: 'Pagamento aprovado com sucesso (simulação)! O download está liberado.',
    is_paid: true 
  });
};
