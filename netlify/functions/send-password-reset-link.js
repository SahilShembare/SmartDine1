import nodemailer from 'nodemailer';
import { getRegisteredUsers } from './users-db.js';

const SMTP_USER = process.env.SMTP_USER || 'smartdine82@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'qsefkvyvicukxuqi';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export async function processSendPasswordResetLink({ email, baseUrl = 'http://localhost:5173' }) {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      status: 400,
      data: { success: false, error: 'Please provide a valid email address.' }
    };
  }

  // Find registered user name if exists
  const users = getRegisteredUsers();
  const user = users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
  const userName = user ? user.name : 'Valued Customer';

  // Generate secure token with 15-minute expiry
  const payload = {
    email: cleanEmail,
    exp: Date.now() + 15 * 60 * 1000,
    iat: Date.now()
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const cleanBaseUrl = String(baseUrl).replace(/\/+$/, '');
  const resetUrl = `${cleanBaseUrl}/login?mode=reset&email=${encodeURIComponent(cleanEmail)}&token=${token}`;

  const subject = 'SmartDine - Password Reset Link';
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width: 520px; background-color: #1e293b; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 1px solid #334155;">
            <tr>
              <td style="background: linear-gradient(135deg, #ea580c 0%, #d97706 100%); padding: 32px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                  Smart<span style="color: #fed7aa;">Dine</span>
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">
                  Password Reset
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 25px; color: #f1f5f9;">
                <h2 style="color: #ffffff; margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">
                  Reset Your Password
                </h2>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hello <strong style="color: #ffffff;">${userName}</strong>,
                </p>
                <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                  We received a request to reset the password for your SmartDine account. Click the button below to choose a new password:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" target="_blank" style="background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); color: #ffffff; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 800; text-decoration: none; display: inline-block; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.4); letter-spacing: 0.3px;">
                    👉 Click Here to Reset Password
                  </a>
                </div>

                <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 20px 0 10px 0;">
                  If the button above does not open, copy and paste this link into your browser:
                </p>
                <p style="background-color: #0f172a; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 11px; word-break: break-all; color: #f97316; border: 1px solid #334155; margin: 0 0 24px 0;">
                  <a href="${resetUrl}" style="color: #f97316; text-decoration: none;">${resetUrl}</a>
                </p>

                <div style="background-color: #334155; border-left: 4px solid #f97316; padding: 12px 14px; border-radius: 6px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #e2e8f0; font-size: 12px;">
                    ⏱️ <strong>Security Notice:</strong> This password reset link is valid for <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this email.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #0f172a; padding: 16px; text-align: center; border-top: 1px solid #334155;">
                <p style="color: #64748b; font-size: 11px; margin: 0;">
                  &copy; ${new Date().getFullYear()} SmartDine - Smart Restaurant Ordering System.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from: `"SmartDine" <${SMTP_USER}>`,
    to: cleanEmail,
    subject,
    text: `Hello ${userName},\n\nWe received a request to reset your SmartDine password.\n\nPlease open this link to set your new password:\n${resetUrl}\n\nThis link is valid for 15 minutes.\nIf you did not request this, please ignore this email.`,
    html
  });

  return {
    status: 200,
    data: {
      success: true,
      message: `Password reset link has been dispatched to ${cleanEmail}! Please check your Inbox / Spam folder.`,
      resetUrl
    }
  };
}

// 1. Netlify Functions v1 / AWS Lambda
export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  let body = {};
  if (event.body) {
    try { body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body; } catch {}
  }
  const query = event.queryStringParameters || {};
  const email = body.email || query.email;
  const baseUrl = body.baseUrl || query.baseUrl;

  try {
    const result = await processSendPasswordResetLink({ email, baseUrl });
    return {
      statusCode: result.status,
      headers: CORS_HEADERS,
      body: JSON.stringify(result.data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: err.message || 'Failed to send password reset email.' })
    };
  }
};

// 2. Vercel Serverless / Express / Vite / Netlify v2
export default async function defaultHandler(req, resOrContext) {
  if (typeof Request !== 'undefined' && req instanceof Request) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    let body = {};
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const email = body.email || query.email;
    const baseUrl = body.baseUrl || query.baseUrl;

    try {
      const result = await processSendPasswordResetLink({ email, baseUrl });
      return new Response(JSON.stringify(result.data), {
        status: result.status,
        headers: CORS_HEADERS
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
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

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const query = req.query || {};
    const email = body.email || query.email;
    const baseUrl = body.baseUrl || query.baseUrl;

    const result = await processSendPasswordResetLink({ email, baseUrl });
    if (typeof res.status === 'function') {
      return res.status(result.status).json(result.data);
    } else {
      res.statusCode = result.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result.data));
    }
  } catch (err) {
    if (typeof res.status === 'function') {
      return res.status(500).json({ success: false, error: err.message });
    } else {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }
}
