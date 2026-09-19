import { isEmailRegistered, isPhoneRegistered, getRegisteredUsers } from './users-db.js';

export default async function handler(req, res) {
  try {
    const email = req.query?.email || req.body?.email || '';
    const phone = req.query?.phone || req.body?.phone || '';
    const name  = req.query?.name  || req.body?.name  || '';

    if (email && isEmailRegistered(email)) {
      return res.status(200).json({
        isDuplicate: true,
        field: 'email',
        message: `Yeh Email "${email}" pehle se registered hai (Already filled). Same email se repeat registration allow nahi hai. Kripya Login karein.`
      });
    }

    if (phone && isPhoneRegistered(phone)) {
      return res.status(200).json({
        isDuplicate: true,
        field: 'phone',
        message: `Yeh Mobile Number "${phone}" pehle se registered hai. Kripya Login karein.`
      });
    }

    return res.status(200).json({ isDuplicate: false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
