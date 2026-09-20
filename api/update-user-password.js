import { updateUserPassword } from './users-db.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export function processUpdateUserPassword({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { status: 400, data: { success: false, error: 'Valid email address is required.' } };
  }
  if (!password || password.length < 6) {
    return { status: 400, data: { success: false, error: 'Password must be at least 6 characters.' } };
  }

  const success = updateUserPassword(cleanEmail, password);
  return {
    status: 200,
    data: {
      success: true,
      message: 'Password updated successfully in server database.'
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
  const res = processUpdateUserPassword(body);
  return { statusCode: res.status, headers: CORS_HEADERS, body: JSON.stringify(res.data) };
};

// Vercel / Express / Vite / Netlify v2
export default async function defaultHandler(req, resOrContext) {
  if (typeof Request !== 'undefined' && req instanceof Request) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    let body = {};
    try { body = await req.json(); } catch {}
    const res = processUpdateUserPassword(body);
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
  const result = processUpdateUserPassword(body);

  if (typeof res.status === 'function') {
    return res.status(result.status).json(result.data);
  } else {
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.data));
  }
}
