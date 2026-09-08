import { verifyRazorpaySignature } from './razorpayServer.js';

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderAmount, orderId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required Razorpay payment verification fields.'
      });
    }

    const verification = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verification.isValid) {
      console.warn('❌ Payment Signature Verification FAILED for order:', razorpay_order_id);
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid payment signature. Payment verification failed on server.'
      });
    }

    // Verified successfully
    return res.status(200).json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      smartdineOrderId: orderId || null,
      amount: orderAmount || null,
      verifiedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error in /api/verify-razorpay-payment:', err);
    return res.status(500).json({
      success: false,
      verified: false,
      error: err.message || 'Internal Server Error while verifying payment signature'
    });
  }
}
