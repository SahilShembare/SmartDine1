import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'registered_users.json');
const TMP_DB_PATH = path.resolve(os.tmpdir(), 'smartdine_registered_users.json');

const INITIAL_USERS = [
  { email: 'admin@smartdine.com', name: 'Master Admin', phone: '9999999999', role: 'admin', password: 'admin123456' },
  { email: 'kitchen@smartdine.com', name: 'Kitchen Chef', phone: '8888888888', role: 'kitchen', password: 'kitchen123456' }
];

let memoryUsers = null;

function sanitizeUsers(list) {
  if (!Array.isArray(list)) return [...INITIAL_USERS];
  // Filter out any legacy hardcoded customer accounts so users can freely register their own real emails
  return list.filter(u => u && u.email && u.email.toLowerCase() !== 'customer@smartdine.com' && u.email.toLowerCase() !== 'shembaresahil12@gmail.com');
}

export function getRegisteredUsers() {
  if (memoryUsers && Array.isArray(memoryUsers) && memoryUsers.length > 0) {
    memoryUsers = sanitizeUsers(memoryUsers);
    return memoryUsers;
  }

  // 1. Try TMP_DB_PATH (writable in serverless)
  try {
    if (fs.existsSync(TMP_DB_PATH)) {
      const data = fs.readFileSync(TMP_DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryUsers = sanitizeUsers(parsed);
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
        memoryUsers = sanitizeUsers(parsed);
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
  // An email is registered if account has a confirmed password or privileged role
  return users.some(u => u.email && u.email.trim().toLowerCase() === clean && (u.password || u.role === 'admin' || u.role === 'kitchen'));
}

export function isPhoneRegistered(phone) {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 10) return false;
  const users = getRegisteredUsers();
  return users.some(u => u.phone && String(u.phone).replace(/\D/g, '') === clean && (u.password || u.role === 'admin' || u.role === 'kitchen'));
}

export function saveRegisteredUser({ name, email, phone, role = 'customer', password }) {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
  const users = [...getRegisteredUsers()];

  const existingIndex = users.findIndex(u => u.email?.trim().toLowerCase() === cleanEmail);
  if (existingIndex !== -1) {
    // If account already has password, don't overwrite
    if (users[existingIndex].password && !password) {
      return false;
    }
    // Update existing record
    users[existingIndex] = {
      ...users[existingIndex],
      name: name ? name.trim() : users[existingIndex].name,
      phone: cleanPhone || users[existingIndex].phone,
      role: role || users[existingIndex].role,
      password: password || users[existingIndex].password,
      updatedAt: new Date().toISOString()
    };
  } else {
    users.push({
      name: name ? name.trim() : 'Customer',
      email: cleanEmail,
      phone: cleanPhone,
      role,
      password: password || undefined,
      registeredAt: new Date().toISOString()
    });
  }

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
