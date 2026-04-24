const fs = require('fs');
const path = require('path');

// Mock mailer: logs to console and appends to logs/emails.log
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'emails.log');

function ensureLog() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

async function sendMail({ to, subject, body }) {
  ensureLog();
  const stamp = new Date().toISOString();
  const entry = `\n===== EMAIL @ ${stamp} =====\nTO:      ${to}\nSUBJECT: ${subject}\n---\n${body}\n===========================\n`;
  console.log(entry);
  fs.appendFileSync(LOG_FILE, entry);
  return { success: true, mocked: true };
}

function formatDate(d) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function bookingConfirmationEmail({ guestEmail, guestName, hostName, propertyTitle, bookingId, checkIn, checkOut, totalPrice }) {
  const body =
`Hi ${guestName},

Your booking is confirmed! Here are your details:

Booking ID:    ${bookingId}
Property:      ${propertyTitle}
Host:          ${hostName}
Check-in:      ${formatDate(checkIn)}
Check-out:     ${formatDate(checkOut)}
Total Paid:    $${Number(totalPrice).toFixed(2)}
Status:        Confirmed

Thanks for booking with StayHub!
- The StayHub Team`;
  return sendMail({ to: guestEmail, subject: `Booking Confirmed - ${propertyTitle}`, body });
}

function passwordResetEmail({ email, name, resetLink, token }) {
  const body =
`Hi ${name || ''},

We received a request to reset your password.

Reset link: ${resetLink}
Token:      ${token}

If you did not request this, you can safely ignore this message. The link expires in 1 hour.

- The StayHub Team`;
  return sendMail({ to: email, subject: 'StayHub Password Reset', body });
}

function twoFactorEmail({ email, name, code }) {
  const body =
`Hi ${name || ''},

Your StayHub verification code is:

    ${code}

This code expires in 10 minutes.

- The StayHub Team`;
  return sendMail({ to: email, subject: 'Your StayHub verification code', body });
}

module.exports = { sendMail, bookingConfirmationEmail, passwordResetEmail, twoFactorEmail };
