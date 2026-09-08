import { refundRazorpayPayment } from './razorpayServer.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};
    const paymentId = body.paymentId || body.payment_id;
    const { amount, notes } = body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Valid paymentId is required for refund.' });
    }

    const refundResult = await refundRazorpayPayment({ paymentId, amount, notes });

    return res.status(200).json({
      success: true,
      ...refundResult
    });
  } catch (err) {
    console.error('Error in /api/refund-payment:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to process refund'
    });
  }
}
