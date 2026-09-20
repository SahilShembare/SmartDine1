import { saveRegisteredUser, isEmailRegistered } from './users-db.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export function processRecordRegisteredUser({ name, email, phone, role = 'customer' }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').trim();
  const cleanName = (name || 'Customer').trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { status: 400, data: { success: false, error: 'Valid email is required.' } };
  }

  if (isEmailRegistered(cleanEmail)) {
    return {
      status: 400,
      data: {
        success: false,
        error: `This Email "${cleanEmail}" is already registered. Repeat registration is not allowed.`
      }
    };
  }

  const saved = saveRegisteredUser({ name: cleanName, email: cleanEmail, phone: cleanPhone, role });
  if (!saved) {
    return { status: 400, data: { success: false, error: 'User already exists.' } };
  }

  return { status: 200, data: { success: true, message: 'User recorded successfully.' } };
}

// Netlify v1
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  let body = {};
  if (event.body) {
    try { body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch {}
  }
  const query = event.queryStringParameters || {};
  const res = processRecordRegisteredUser({
    name: body.name || query.name,
    email: body.email || query.email,
    phone: body.phone || query.phone,
    role: body.role || query.role
  });
  return { statusCode: res.status, headers: CORS_HEADERS, body: JSON.stringify(res.data) };
};

// Vercel / Express / Vite / Netlify v2
export default async function defaultHandler(req, resOrContext) {
  if (typeof Request !== 'undefined' && req instanceof Request) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    let body = {};
    try { body = await req.json(); } catch {}
    const res = processRecordRegisteredUser(body);
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

  const body = req.body || {};
  const result = processRecordRegisteredUser(body);

  if (typeof res.status === 'function') {
    return res.status(result.status).json(result.data);
  } else {
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.data));
  }
}
