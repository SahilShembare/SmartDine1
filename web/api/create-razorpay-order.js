import { createRazorpayOrder } from './razorpayServer.js';

export default async function handler(req, res) {
  // Support CORS
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
    const { amount, currency = 'INR', receipt, notes } = body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required.' });
    }

    const orderData = await createRazorpayOrder({ amount, currency, receipt, notes });
    return res.status(200).json({
      success: true,
      ...orderData
    });
  } catch (err) {
    console.error('Error in /api/create-razorpay-order:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error while creating Razorpay order'
    });
  }
}
