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

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
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

    const index = users.findIndex(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
    if (index !== -1) {
      users[index].password = password;
      users[index].updatedAt = new Date().toISOString();
    } else {
      users.push({
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        password: password,
        role: 'customer',
        updatedAt: new Date().toISOString()
      });
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully in server database.'
    });
  } catch (err) {
    console.error('Error in update-user-password API:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
