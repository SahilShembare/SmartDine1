import { verifyRazorpayWebhook } from './razorpayServer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing x-razorpay-signature header.' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const isValid = verifyRazorpayWebhook({ rawBody, signature });

    if (!isValid) {
      console.warn('❌ Webhook signature verification failed.');
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log(`✅ Verified Razorpay Webhook Event: ${event.event} [${event.payload?.payment?.entity?.id || 'N/A'}]`);

    // Handle payment.captured / order.paid events
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      // Webhook acknowledges processing idempotently
      return res.status(200).json({
        status: 'ok',
        event: event.event,
        paymentId: paymentEntity?.id,
        orderId: paymentEntity?.order_id
      });
    }

    return res.status(200).json({ status: 'ok', received: true });
  } catch (err) {
    console.error('Error handling Razorpay webhook:', err);
    return res.status(500).json({ error: err.message || 'Webhook processing error' });
  }
}
