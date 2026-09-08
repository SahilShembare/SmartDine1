import crypto from 'node:crypto';

/**
 * Helper to get Razorpay environment credentials
 */
export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  return {
    keyId: keyId.trim(),
    keySecret: keySecret.trim(),
    webhookSecret: webhookSecret.trim(),
    isConfigured: Boolean(keyId.trim() && keySecret.trim() && !keyId.includes('your_key_here'))
  };
}

/**
 * 1. Create Razorpay Order via official REST API
 * POST https://api.razorpay.com/v1/orders
 */
export async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const { keyId, keySecret, isConfigured } = getRazorpayCredentials();

  if (!isConfigured) {
    throw new Error('Razorpay API keys are not configured on the server. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }

  // Amount in paise (1 INR = 100 paise)
  const amountInPaise = Math.round(Number(amount) * 100);
  if (!amountInPaise || amountInPaise <= 0) {
    throw new Error(`Invalid order amount: ${amount}`);
  }

  const cleanReceipt = String(receipt || `rcpt_${Date.now()}`).slice(0, 40);

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const payload = {
    amount: amountInPaise,
    currency: currency.toUpperCase(),
    receipt: cleanReceipt,
    notes: {
      platform: 'SmartDine QR Ordering',
      ...notes
    }
  };

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authHeader}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data.error?.description || data.error?.message || 'Failed to create order on Razorpay';
    throw new Error(`Razorpay Error (${response.status}): ${errMsg}`);
  }

  return {
    orderId: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt,
    keyId: keyId
  };
}

/**
 * 2. Verify Razorpay Payment Signature
 * Official formula: HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret)
 */
export function verifyRazorpaySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature, secret }) {
  const creds = getRazorpayCredentials();
  const effectiveSecret = secret || creds.keySecret;

  if (!effectiveSecret) {
    throw new Error('Razorpay API Secret is not configured. Cannot verify payment signature.');
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return {
      isValid: false,
      reason: 'Missing order_id, payment_id, or signature in verification payload'
    };
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', effectiveSecret)
    .update(body)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
  const receivedBuf = Buffer.from(razorpay_signature, 'utf-8');

  if (expectedBuf.length !== receivedBuf.length) {
    return {
      isValid: false,
      reason: 'Signature mismatch'
    };
  }

  const isValid = crypto.timingSafeEqual(expectedBuf, receivedBuf);

  return {
    isValid,
    expectedSignature,
    receivedSignature: razorpay_signature
  };
}

/**
 * 3. Verify Razorpay Webhook Signature
 * Official formula: HMAC_SHA256(raw_body, webhook_secret)
 */
export function verifyRazorpayWebhook({ rawBody, signature, secret }) {
  const creds = getRazorpayCredentials();
  const effectiveSecret = secret || creds.webhookSecret;

  if (!effectiveSecret) {
    throw new Error('Razorpay Webhook Secret is not configured.');
  }

  if (!rawBody || !signature) {
    return { isValid: false, reason: 'Missing rawBody or signature' };
  }

  const expectedSignature = crypto
    .createHmac('sha256', effectiveSecret)
    .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
    .digest('hex');

  const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
  const receivedBuf = Buffer.from(signature, 'utf-8');

  if (expectedBuf.length !== receivedBuf.length) {
    return { isValid: false, reason: 'Webhook signature length mismatch' };
  }

  const isValid = crypto.timingSafeEqual(expectedBuf, receivedBuf);

  return {
    isValid,
    expectedSignature,
    receivedSignature: signature
  };
}

/**
 * 4. Refund Payment via official REST API
 * POST https://api.razorpay.com/v1/payments/{payment_id}/refund
 */
export async function refundRazorpayPayment({ paymentId, amount = null, notes = {} }) {
  const { keyId, keySecret, isConfigured } = getRazorpayCredentials();

  if (!isConfigured) {
    throw new Error('Razorpay API credentials are not configured.');
  }

  if (!paymentId) {
    throw new Error('Payment ID is required for refund.');
  }

  const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const payload = {
    notes: {
      reason: 'Customer refund / cancellation',
      ...notes
    }
  };

  // Optional partial refund amount in paise
  if (amount !== null && amount !== undefined) {
    payload.amount = Math.round(Number(amount) * 100);
  }

  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authHeader}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data.error?.description || data.error?.message || 'Failed to initiate refund';
    throw new Error(`Razorpay Refund Error (${response.status}): ${errMsg}`);
  }

  return {
    refundId: data.id,
    paymentId: data.payment_id,
    amount: data.amount / 100,
    currency: data.currency,
    status: data.status,
    createdAt: data.created_at
  };
}
