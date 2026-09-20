import nodemailer from 'nodemailer';
import { isEmailRegistered } from './users-db.js';

const SMTP_USER = process.env.SMTP_USER || 'smartdine82@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'qsefkvyvicukxuqi';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

export default async function handler(req, res) {
  // CORS Preflight
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const method = (req.method || 'POST').toUpperCase();
  if (method !== 'POST' && method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const email = (body.email || req.query?.email || '').trim();
    const name = (body.name || req.query?.name || 'Customer').trim();
    const purpose = (body.purpose || req.query?.purpose || 'registration').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // 🔒 STRICT RULE: Prevent duplicate registration for the same email
    if (purpose === 'registration' && isEmailRegistered(email)) {
      return res.status(400).json({
        success: false,
        error: `Yeh Email "${email}" pehle se registered hai (Already filled). Same email se repeat registration allow nahi hai. Kripya Login karein.`
      });
    }

    // Generate real 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const subject = purpose === 'registration' 
      ? 'SmartDine - Verify Your Email Address' 
      : 'SmartDine - Password Reset Verification Code';

    const headline = purpose === 'registration'
      ? 'Welcome to SmartDine!'
      : 'Password Reset Request';

    const actionText = purpose === 'registration'
      ? 'Use this 6-digit code to verify your email address and activate your account.'
      : 'Use this 6-digit code to reset your account password.';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                    Smart<span style="color: #d1fae5;">Dine</span>
                  </h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">
                    Verification Code
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 25px;">
                  <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 19px; font-weight: 700;">
                    ${headline}
                  </h2>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                    Hello <strong>${name}</strong>,
                  </p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                    ${actionText}
                  </p>
                  <div style="background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
                    <div style="font-size: 11px; color: #047857; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 6px;">
                      Your 6-Digit OTP Code
                    </div>
                    <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #059669; font-family: monospace;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; color: #065f46; margin-top: 6px;">
                      ⏱️ Valid for <strong>5 minutes</strong> only
                    </div>
                  </div>
                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 14px; border-radius: 6px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 12.5px;">
                      <strong>Security Note:</strong> Never share this code with anyone. SmartDine will never call or ask for your OTP.
                    </p>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    If you did not make this request, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #94a3b8; font-size: 11px; margin: 0;">
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

    const info = await transporter.sendMail({
      from: `"SmartDine" <${SMTP_USER}>`,
      to: email,
      subject,
      text: `Hello ${name},\n\nYour SmartDine verification OTP is: ${otp}\n\nThis code is valid for 5 minutes only.\nDo not share it with anyone.`,
      html
    });

    console.log(`[SmartDine Real OTP] Sent to ${email} (Response: ${info.response})`);

    return res.status(200).json({
      success: true,
      otp, // passed to client so registration verification succeeds against the real code sent
      message: `Real OTP has been sent to ${email}. Please check your Inbox / Spam folder.`
    });
  } catch (error) {
    console.error('[SmartDine Mail Error]', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send verification email'
    });
  }
}
