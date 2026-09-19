/**
 * Centralized utility for Realistic, Sequential & Persistent 
 * Order Numbers and GST Tax Invoice Numbers
 */

const ORDER_COUNTER_KEY = 'smartdine_order_seq_counter';
const INVOICE_COUNTER_KEY = 'smartdine_invoice_seq_counter';
const INITIAL_ORDER_SEQ = 1001;
const INITIAL_INVOICE_SEQ = 1;

/**
 * Format any raw order ID or string into a clean, professional restaurant Order Number (e.g., ORD-1001).
 * Avoids duplicate prefixes like "#SD-ORD-1001" or broken slice artifacts like "D-1001".
 */
export function formatOrderNumber(rawId) {
  if (!rawId) return 'ORD-1001';
  const str = String(rawId).trim();

  // If already clean ORD-XXXX
  if (/^ORD-\d+$/i.test(str)) {
    return str.toUpperCase();
  }

  // If it has ORD- somewhere inside, extract it
  const match = str.match(/ORD-(\d+)/i);
  if (match) {
    return `ORD-${match[1]}`;
  }

  // If it's a numeric ID like 1001
  if (/^\d+$/.test(str)) {
    return `ORD-${str}`;
  }

  // If Firestore or random hash (e.g., p8Yd7KsLm), take last 4 chars uppercase
  const cleanHash = str.replace(/[^a-zA-Z0-9]/g, '');
  if (cleanHash.length >= 4) {
    return `ORD-${cleanHash.slice(-4).toUpperCase()}`;
  }

  return `ORD-${str.toUpperCase()}`;
}

/**
 * Format an invoice number into a professional GST Tax Invoice Number (e.g. INV-2026-0001).
 */
export function formatInvoiceNumber(invNo) {
  if (!invNo) return `INV-${new Date().getFullYear()}-0001`;
  const str = String(invNo).trim();
  if (/^INV-\d{4}-\d+$/i.test(str)) {
    return str.toUpperCase();
  }
  return str;
}

/**
 * Generate the next sequential Order Number (e.g., ORD-1001, ORD-1002, ORD-1003...)
 * Guaranteed to be sequential, non-random, and persistent.
 */
export function getNextOrderNumber(existingOrders = []) {
  try {
    let maxSeq = INITIAL_ORDER_SEQ - 1;

    // Scan existing orders to find the highest sequential order number
    if (Array.isArray(existingOrders) && existingOrders.length > 0) {
      existingOrders.forEach(o => {
        const idToCheck = o.orderNumber || o.id || '';
        const match = String(idToCheck).match(/ORD-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num < 90000 && num > maxSeq) {
            maxSeq = num;
          }
        }
      });
    }

    // Check localStorage counter
    const stored = localStorage.getItem(ORDER_COUNTER_KEY);
    const storedSeq = stored ? parseInt(stored, 10) : 0;
    if (!isNaN(storedSeq) && storedSeq > maxSeq) {
      maxSeq = storedSeq;
    }

    const nextSeq = maxSeq + 1;
    localStorage.setItem(ORDER_COUNTER_KEY, String(nextSeq));
    return `ORD-${nextSeq}`;
  } catch (err) {
    console.warn('Error computing next order number:', err);
    return `ORD-${INITIAL_ORDER_SEQ}`;
  }
}

/**
 * Generate the next sequential GST Tax Invoice Number (e.g., INV-2026-0001, INV-2026-0002...)
 * Guaranteed to be sequential, non-random, and persistent.
 */
export function getNextInvoiceNumber(existingOrders = []) {
  try {
    const year = new Date().getFullYear();
    let maxSeq = INITIAL_INVOICE_SEQ - 1;

    // Scan existing orders for highest invoice number in current year
    if (Array.isArray(existingOrders) && existingOrders.length > 0) {
      existingOrders.forEach(o => {
        if (o.invoiceNumber) {
          const match = String(o.invoiceNumber).match(new RegExp(`INV-${year}-(\\d+)`, 'i'));
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSeq) {
              maxSeq = num;
            }
          }
        }
      });
    }

    // Check localStorage counter
    const stored = localStorage.getItem(INVOICE_COUNTER_KEY);
    const storedSeq = stored ? parseInt(stored, 10) : 0;
    if (!isNaN(storedSeq) && storedSeq > maxSeq) {
      maxSeq = storedSeq;
    }

    const nextSeq = maxSeq + 1;
    localStorage.setItem(INVOICE_COUNTER_KEY, String(nextSeq));
    return `INV-${year}-${String(nextSeq).padStart(4, '0')}`;
  } catch (err) {
    console.warn('Error computing next invoice number:', err);
    return `INV-${new Date().getFullYear()}-0001`;
  }
}

/**
 * Get or assign a permanent, persistent Tax Invoice Number for an order or batch of table orders.
 * If an invoice number was already assigned, it reuses it (100% idempotent).
 */
export function getOrAssignInvoiceNumber(ordersOrOrder, allOrders = []) {
  const orders = Array.isArray(ordersOrOrder) ? ordersOrOrder : (ordersOrOrder ? [ordersOrOrder] : []);
  
  // 1. Check if any order already has an assigned invoiceNumber
  for (const o of orders) {
    if (o && o.invoiceNumber) {
      return formatInvoiceNumber(o.invoiceNumber);
    }
  }

  // 2. If none exists, generate next sequential invoice number
  return getNextInvoiceNumber(allOrders);
}
