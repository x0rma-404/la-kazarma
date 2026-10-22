'use strict';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || ''
  }
});

/**
 * Send a password-reset email.
 * Falls back to console logging if no mail credentials are configured.
 */
async function sendPasswordReset(email, token, req) {
  const base = `${req.protocol}://${req.get('host')}`;
  const link = `${base}/reset-password?token=${token}`;

  if (!process.env.MAIL_USER) {
    console.log(`[MAILER] Password reset link for ${email}: ${link}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'La Kazarma <noreply@kazarma.local>',
    to: email,
    subject: 'La Kazarma – Password Reset',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#141414;color:#e0e0e0;padding:32px;border-radius:8px;">
        <h2 style="color:#8a9c50;">La Kazarma de BHOS CE 25</h2>
        <p>You requested a password reset. Click the link below within <strong>1 hour</strong>:</p>
        <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#6b7c3e;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
        <p style="color:#9a9a9a;font-size:13px;">If you did not request this, ignore this email.</p>
      </div>
    `
  });
}

module.exports = { transporter, sendPasswordReset };
