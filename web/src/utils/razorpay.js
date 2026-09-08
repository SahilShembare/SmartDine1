/**
 * Real Production-Ready Razorpay Payment Gateway Utility for SmartDine
 * Uses Official Razorpay Checkout SDK & Server-Side HMAC-SHA256 Verification
 */

// 1. Dynamically Load Official Razorpay Checkout SDK script
export const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load official Razorpay Checkout SDK from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * 2. Create Razorpay Order on the Backend Server
 * POST /api/create-razorpay-order
 */
export async function createBackendRazorpayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const response = await fetch('/api/create-razorpay-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency, receipt, notes })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data.error || 'Failed to create Razorpay Order on server.';
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * 3. Verify Payment Signature on Backend Server
 * POST /api/verify-razorpay-payment
 */
export async function verifyBackendPayment({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  orderAmount,
  orderId
}) {
  const response = await fetch('/api/verify-razorpay-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderAmount,
      orderId
    })
  });

  const data = await response.json();

  if (!response.ok || !data.verified) {
    const errorMsg = data.error || 'Payment signature verification failed on server.';
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * 4. Launch Official Razorpay Checkout Modal
 * 
 * @param {Object} params
 * @param {number} params.amount - Total order amount in INR (e.g. 450)
 * @param {string} params.name - Restaurant name
 * @param {string} params.description - Order description
 * @param {string} params.orderRef - SmartDine internal Order reference
 * @param {Object} params.customer - { name, contact, email }
 * @param {Function} params.onSuccess - Called strictly after server-side signature verification
 * @param {Function} params.onFailure - Called on payment failure
 * @param {Function} params.onDismiss - Called when modal is dismissed
 */
export async function openRazorpayPayment({
  amount,
  name = 'SmartDine Restaurant',
  description = 'Dine-In QR Table Order',
  orderRef = `ORD-${Date.now()}`,
  existingOrderId = null,
  onOrderCreated,
  customer = {},
  onSuccess,
  onFailure,
  onDismiss
}) {
  try {
    // Step 1: Ensure Razorpay SDK is loaded
    const sdkLoaded = await loadRazorpaySDK();
    if (!sdkLoaded || !window.Razorpay) {
      throw new Error('Unable to load official Razorpay Checkout SDK. Please check your internet connection.');
    }

    // Step 2: Create authentic Razorpay order on backend server (or reuse existing for idempotency)
    let backendOrder;
    if (existingOrderId) {
      backendOrder = {
        orderId: existingOrderId,
        amount: Math.round(Number(amount) * 100),
        currency: 'INR',
        keyId: import.meta.env.VITE_RAZORPAY_KEY_ID
      };
    } else {
      backendOrder = await createBackendRazorpayOrder({
        amount: Number(amount),
        currency: 'INR',
        receipt: orderRef,
        notes: {
          table_number: customer.tableNumber || 'N/A',
          customer_name: customer.name || 'Guest'
        }
      });
      if (onOrderCreated && backendOrder?.orderId) {
        onOrderCreated(backendOrder.orderId);
      }
    }

    const keyId = backendOrder.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      throw new Error('Razorpay Key ID is not configured. Please set RAZORPAY_KEY_ID in .env');
    }

    // Step 3: Configure Official Razorpay Checkout Options
    const options = {
      key: keyId,
      amount: backendOrder.amount, // in paise
      currency: backendOrder.currency || 'INR',
      name: name,
      description: description,
      order_id: backendOrder.orderId,
      image: '/logo.png',
      prefill: {
        name: customer.name || '',
        contact: customer.contact || customer.phone || '',
        email: customer.email || ''
      },
      notes: {
        smartdine_order_ref: orderRef
      },
      theme: {
        color: '#EA580C' // SmartDine luxury orange-amber brand color
      },
      modal: {
        ondismiss: function () {
          if (onDismiss) {
            onDismiss('Payment cancelled: Checkout window closed.');
          } else if (onFailure) {
            onFailure('Payment was cancelled: Checkout window closed.');
          }
        }
      },
      handler: async function (response) {
        // Step 4: Server-Side HMAC-SHA256 Signature Verification
        try {
          const verification = await verifyBackendPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderAmount: Number(amount),
            orderId: orderRef
          });

          // Step 5: Notify client strictly after server confirmation
          if (onSuccess) {
            onSuccess({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              verifiedAt: verification.verifiedAt,
              paymentMethod: 'Razorpay Online Gateway',
              paymentGateway: 'Razorpay'
            });
          }
        } catch (verifyErr) {
          console.error('Server verification error:', verifyErr);
          if (onFailure) {
            onFailure(verifyErr.message || 'Payment signature verification failed on server.');
          }
        }
      }
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', function (resp) {
      const errorMsg = resp.error?.description || resp.error?.reason || 'Payment failed on Razorpay.';
      console.warn('Razorpay payment failed:', resp.error);
      if (onFailure) {
        onFailure(errorMsg);
      }
    });

    rzp.open();
  } catch (err) {
    console.error('Failed to initiate Razorpay checkout:', err);
    if (onFailure) {
      onFailure(err.message || 'Failed to initiate Razorpay payment.');
    }
  }
}
