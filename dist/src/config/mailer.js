const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter && process.env.MAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || '587'),
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  return transporter;
}

async function sendMail(to, subject, html) {
  const t = getTransporter();
  if (!t) {
    console.log(`[Mail] Would send to ${to}: ${subject}`);
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || 'noreply@kazarma.local',
    to,
    subject,
    html,
  });
}

module.exports = { sendMail, getTransporter };
