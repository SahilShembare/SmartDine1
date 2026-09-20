import { verifyUserCredentials } from './users-db.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export function processVerifyUserCredentials({ email, password }) {
  if (!email || !password) {
    return { status: 400, data: { error: 'Email and password are required.' } };
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = verifyUserCredentials(cleanEmail, password);

  if (user) {
    return {
      status: 200,
      data: {
        success: true,
        matched: true,
        user: {
          name: user.name || user.email.split('@')[0],
          email: user.email,
          role: user.role || 'customer'
        }
      }
    };
  } else {
    return {
      status: 200,
      data: {
        success: true,
        matched: false
      }
    };
  }
}

// Netlify v1
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  let body = {};
  if (event.body) {
    try { body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch {}
  }
  const res = processVerifyUserCredentials(body);
  return { statusCode: res.status, headers: CORS_HEADERS, body: JSON.stringify(res.data) };
};

// Vercel / Express / Vite / Netlify v2
export default async function defaultHandler(req, resOrContext) {
  if (typeof Request !== 'undefined' && req instanceof Request) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    let body = {};
    try { body = await req.json(); } catch {}
    const res = processVerifyUserCredentials(body);
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
  const result = processVerifyUserCredentials(body);

  if (typeof res.status === 'function') {
    return res.status(result.status).json(result.data);
  } else {
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.data));
  }
}
