import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

function getDirname() {
  try {
    if (typeof __dirname !== 'undefined' && __dirname) return __dirname;
  } catch {}
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {}
  return process.cwd();
}

const currentDir = getDirname();
const DB_PATH = path.resolve(currentDir, 'waiter_calls.json');
const TMP_DB_PATH = path.resolve(os.tmpdir(), 'smartdine_waiter_calls.json');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

let memoryCalls = [];

function loadStoredCalls() {
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const data = fs.readFileSync(TMP_DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        memoryCalls = parsed;
        return memoryCalls;
      }
    }
  } catch {}

  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        memoryCalls = parsed;
        return memoryCalls;
      }
    }
  } catch {}

  return memoryCalls;
}

function persistCalls(list) {
  memoryCalls = Array.isArray(list) ? list : [];
  try {
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(memoryCalls, null, 2), 'utf-8');
  } catch {}
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(memoryCalls, null, 2), 'utf-8');
  } catch {}
}

export function processWaiterCalls(method, body = {}) {
  const currentCalls = loadStoredCalls();

  if (method === 'GET') {
    return {
      status: 200,
      data: { success: true, calls: currentCalls }
    };
  }

  const { action, call, callId, id, resolvedAt } = body;
  const targetId = callId || id;

  if (action === 'create' && call) {
    const targetTable = String(call.tableNumber || '').padStart(2, '0');
    // Remove previous pending call for same table if any
    const updated = [
      call,
      ...currentCalls.filter(c => !(String(c.tableNumber).padStart(2, '0') === targetTable && c.status === 'pending'))
    ];
    persistCalls(updated);
    return {
      status: 200,
      data: { success: true, call, calls: updated }
    };
  }

  if (action === 'resolve' && targetId) {
    const at = resolvedAt || new Date().toISOString();
    const updated = currentCalls.map(c => 
      c.id === targetId 
        ? { ...c, status: 'attended', attendedAt: at, resolvedAt: at, updatedAt: at }
        : c
    );
    persistCalls(updated);
    return {
      status: 200,
      data: { success: true, callId: targetId, calls: updated }
    };
  }

  if (action === 'cancel' && targetId) {
    const updated = currentCalls.map(c => 
      c.id === targetId 
        ? { ...c, status: 'cancelled', updatedAt: new Date().toISOString() }
        : c
    );
    persistCalls(updated);
    return {
      status: 200,
      data: { success: true, callId: targetId, calls: updated }
    };
  }

  return {
    status: 200,
    data: currentCalls
  };
}

// Netlify v1
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  let body = {};
  if (event.body) {
    try { body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch {}
  }
  const res = processWaiterCalls(event.httpMethod, body);
  return { statusCode: res.status, headers: CORS_HEADERS, body: JSON.stringify(res.data) };
};

// Vercel / Vite middleware
export default async function defaultHandler(req, resOrContext) {
  if (typeof Request !== 'undefined' && req instanceof Request) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
    let body = {};
    if (req.method === 'POST') {
      try { body = await req.json(); } catch {}
    }
    const res = processWaiterCalls(req.method, body);
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
  const result = processWaiterCalls(req.method, body);

  if (typeof res.status === 'function') {
    return res.status(result.status).json(result.data);
  } else {
    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.data));
  }
}
