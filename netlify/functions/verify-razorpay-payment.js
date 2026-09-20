import { verifyRazorpaySignature } from './razorpayServer.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export function processVerifyRazorpayPayment(body) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderAmount, orderId } = body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return {
      status: 400,
      data: {
        success: false,
        error: 'Missing required Razorpay payment verification fields.'
      }
    };
  }

  const verification = verifyRazorpaySignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  });

  if (!verification.isValid) {
    console.warn('❌ Payment Signature Verification FAILED for order:', razorpay_order_id);
    return {
      status: 400,
      data: {
        success: false,
        verified: false,
        error: 'Invalid payment signature. Payment verification failed on server.'
      }
    };
  }

  return {
    status: 200,
    data: {
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      smartdineOrderId: orderId || null,
      amount: orderAmount || null,
      verifiedAt: new Date().toISOString()
    }
  };
}

// Netlify v1
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  let body = {};
  if (event.body) {
    try { body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch {}
  }
  const res = processVerifyRazorpayPayment(body);
  return { statusCode: res.status, headers: CORS_HEADERS, body: JSON.stringify(res.data) };
};

// Vercel / Express / Vite / Netlify v2
export default async function defaultHandler(req, resOrContext) {
  if (typeof Request !== 'undefined' && req instanceof Request) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    let body = {};
    try { body = await req.json(); } catch {}
    const res = processVerifyRazorpayPayment(body);
    return new Response(JSON.stringify(res.data), { status: res.status, headers: CORS_HEADERS });
  }

  const res = resOrContext;
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(204).end();
    res.statusCode = 204;
    return res.end();
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const result = processVerifyRazorpayPayment(body);
    if (typeof res.status === 'function') {
      return res.status(result.status).json(result.data);
    } else {
      res.statusCode = result.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result.data));
    }
  } catch (err) {
    if (typeof res.status === 'function') {
      return res.status(500).json({ success: false, error: err.message });
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }
}
