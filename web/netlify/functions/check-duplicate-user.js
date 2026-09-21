import { isEmailRegistered, isPhoneRegistered } from './users-db.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export async function processCheckDuplicateUser({ email, phone, name }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').trim();

  let isEmailReg = isEmailRegistered;
  let isPhoneReg = isPhoneRegistered;
  try {
    const dbMod = await import(`./users-db.js?t=${Date.now()}`);
    if (typeof dbMod.isEmailRegistered === 'function') isEmailReg = dbMod.isEmailRegistered;
    if (typeof dbMod.isPhoneRegistered === 'function') isPhoneReg = dbMod.isPhoneRegistered;
  } catch {}

  if (cleanEmail && isEmailReg(cleanEmail)) {
    return {
      status: 200,
      data: {
        isDuplicate: true,
        field: 'email',
        message: `This Email "${cleanEmail}" is already registered. Please log in to continue.`
      }
    };
  }

  if (cleanPhone && isPhoneReg(cleanPhone)) {
    return {
      status: 200,
      data: {
        isDuplicate: true,
        field: 'phone',
        message: `This Mobile Number "${cleanPhone}" is already registered. Please log in to continue.`
      }
    };
  }

  return { status: 200, data: { isDuplicate: false } };
}

// Netlify v1
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  let body = {};
  if (event.body) {
    try { body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch {}
  }
  const query = event.queryStringParameters || {};
  const res = await processCheckDuplicateUser({
    email: query.email || body.email,
    phone: query.phone || body.phone,
    name: query.name || body.name
  });
  return { statusCode: res.status, headers: CORS_HEADERS, body: JSON.stringify(res.data) };
};

// Vercel / Express / Vite / Netlify v2
export default async function defaultHandler(req, resOrContext) {
  if (typeof Request !== 'undefined' && req instanceof Request) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    let body = {};
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const res = await processCheckDuplicateUser({
      email: query.email || body.email,
      phone: query.phone || body.phone,
      name: query.name || body.name
    });
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

  const query = req.query || {};
  const body = req.body || {};
  const result = await processCheckDuplicateUser({
    email: query.email || body.email,
    phone: query.phone || body.phone,
    name: query.name || body.name
  });

  if (typeof res.status === 'function') {
    return res.status(result.status).json(result.data);
  } else {
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.data));
  }
}
