import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'registered_users.json');

const INITIAL_USERS = [
  { email: 'shembaresahil12@gmail.com', name: 'Sahil Shembare', phone: '9876543210', role: 'customer' },
  { email: 'admin@smartdine.com', name: 'Master Admin', phone: '9999999999', role: 'admin' },
  { email: 'kitchen@smartdine.com', name: 'Kitchen Chef', phone: '8888888888', role: 'kitchen' },
  { email: 'customer@smartdine.com', name: 'VIP Customer', phone: '7777777777', role: 'customer' }
];

export function getRegisteredUsers() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_USERS, null, 2), 'utf-8');
      return INITIAL_USERS;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading registered users DB:', err);
    return INITIAL_USERS;
  }
}

export function isEmailRegistered(email) {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const users = getRegisteredUsers();
  return users.some(u => u.email && u.email.trim().toLowerCase() === clean);
}

export function isPhoneRegistered(phone) {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 10) return false;
  const users = getRegisteredUsers();
  return users.some(u => u.phone && String(u.phone).replace(/\D/g, '') === clean);
}

export function saveRegisteredUser({ name, email, phone, role = 'customer' }) {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
  const users = getRegisteredUsers();

  const existing = users.find(u => u.email?.trim().toLowerCase() === cleanEmail);
  if (existing) {
    return false; // Already registered - do not repeat!
  }

  users.push({
    name: name ? name.trim() : 'Customer',
    email: cleanEmail,
    phone: cleanPhone,
    role,
    registeredAt: new Date().toISOString()
  });

  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving user to DB:', err);
    return false;
  }
}
