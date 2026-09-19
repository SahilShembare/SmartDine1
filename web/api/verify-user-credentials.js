import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'registered_users.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const { email, password } = body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let users = [];
    try {
      if (fs.existsSync(DB_PATH)) {
        users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      }
    } catch (e) {
      console.warn('Error reading registered_users.json:', e);
    }

    const user = users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
    if (user && user.password && user.password === password) {
      return res.status(200).json({
        success: true,
        matched: true,
        user: {
          name: user.name || user.email.split('@')[0],
          email: user.email,
          role: user.role || 'customer'
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        matched: false
      });
    }
  } catch (err) {
    console.error('Error in verify-user-credentials API:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
