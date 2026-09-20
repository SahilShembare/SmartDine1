import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'registered_users.json');
const TMP_DB_PATH = path.resolve(os.tmpdir(), 'smartdine_registered_users.json');

const INITIAL_USERS = [
  { email: 'shembaresahil12@gmail.com', name: 'Sahil Shembare', phone: '9876543210', role: 'customer' },
  { email: 'admin@smartdine.com', name: 'Master Admin', phone: '9999999999', role: 'admin' },
  { email: 'kitchen@smartdine.com', name: 'Kitchen Chef', phone: '8888888888', role: 'kitchen' },
  { email: 'customer@smartdine.com', name: 'VIP Customer', phone: '7777777777', role: 'customer' }
];

let memoryUsers = null;

export function getRegisteredUsers() {
  if (memoryUsers && Array.isArray(memoryUsers) && memoryUsers.length > 0) {
    return memoryUsers;
  }

  // 1. Try TMP_DB_PATH (writable in serverless)
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const data = fs.readFileSync(TMP_DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryUsers = parsed;
        return memoryUsers;
      }
    }
  } catch {}

  // 2. Try DB_PATH in project
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryUsers = parsed;
        return memoryUsers;
      }
    }
  } catch (err) {
    console.warn('Note reading DB_PATH:', err.message);
  }

  // 3. Fallback to INITIAL_USERS
  memoryUsers = [...INITIAL_USERS];
  return memoryUsers;
}

function persistUsers(users) {
  memoryUsers = users;
  let written = false;

  // Try DB_PATH
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
    written = true;
  } catch {}

  // Try TMP_DB_PATH (AWS Lambda / Netlify / Vercel read-only bypass)
  try {
    fs.writeFileSync(TMP_DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
    written = true;
  } catch {}

  return written;
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
  const users = [...getRegisteredUsers()];

  const existing = users.find(u => u.email?.trim().toLowerCase() === cleanEmail);
  if (existing) {
    return false; // Already registered
  }

  users.push({
    name: name ? name.trim() : 'Customer',
    email: cleanEmail,
    phone: cleanPhone,
    role,
    registeredAt: new Date().toISOString()
  });

  persistUsers(users);
  return true;
}

export function updateUserPassword(email, newPassword) {
  if (!email || !newPassword) return false;
  const cleanEmail = email.trim().toLowerCase();
  const users = [...getRegisteredUsers()];
  const index = users.findIndex(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
  
  if (index !== -1) {
    users[index].password = newPassword;
    users[index].updatedAt = new Date().toISOString();
  } else {
    users.push({
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      password: newPassword,
      role: 'customer',
      updatedAt: new Date().toISOString()
    });
  }

  persistUsers(users);
  return true;
}

export function verifyUserCredentials(email, password) {
  if (!email || !password) return null;
  const cleanEmail = email.trim().toLowerCase();
  const users = getRegisteredUsers();
  const user = users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
  if (user && user.password && user.password === password) {
    return user;
  }
  return null;
}
