const nodemailer = require('nodemailer');

/**
 * Send an email using nodemailer.
 * Falls back to console log in dev mode when SMTP credentials are not set.
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[DEV MODE] Email to ${to} | Subject: ${subject}`);
    console.log(`[DEV MODE] Body: ${html.replace(/<[^>]+>/g, '')}`);
    return { success: true, mode: 'dev' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html
  });

  return { success: true, mode: 'smtp' };
}

module.exports = sendEmail;
