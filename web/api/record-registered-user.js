import { saveRegisteredUser, isEmailRegistered } from './users-db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, phone, role = 'customer' } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required.' });
    }

    if (isEmailRegistered(email)) {
      return res.status(400).json({
        success: false,
        error: `Yeh Email "${email}" pehle se registered hai (Already filled). Repeat registration not allowed.`
      });
    }

    const saved = saveRegisteredUser({ name, email, phone, role });
    if (!saved) {
      return res.status(400).json({ success: false, error: 'User already exists.' });
    }

    return res.status(200).json({ success: true, message: 'User recorded successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
