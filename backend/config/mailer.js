/**
 * Nodemailer transporter configuration for Abhyudaya Preschool
 * Uses Gmail SMTP with App Password (or any SMTP provider via env vars).
 *
 * Required environment variables:
 *   MAIL_USER   — Gmail address used as sender (e.g. daycare@abhyudaya-school.com)
 *   MAIL_PASS   — Gmail App Password (16-char, no spaces) for the above account
 *
 * Optional:
 *   MAIL_FROM   — Display name + address shown in "From:" header
 *                 Defaults to: "Abhyudaya Preschool <MAIL_USER>"
 */

const nodemailer = require('nodemailer')

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter

  const user = process.env.MAIL_USER
  const pass = process.env.MAIL_PASS

  if (!user || !pass) {
    console.warn(
      '[Mailer] MAIL_USER or MAIL_PASS not set — email notifications are disabled.'
    )
    return null
  }

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  return _transporter
}

/**
 * Send an email notification to multiple recipients.
 *
 * @param {object} options
 * @param {string|string[]} options.to   — Recipient address(es)
 * @param {string}          options.subject
 * @param {string}          options.html — HTML body
 * @param {string}          [options.text] — Plain-text fallback
 */
async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter()
  if (!transporter) return // silently skip if not configured

  const from =
    process.env.MAIL_FROM ||
    `"Abhyudaya Preschool" <${process.env.MAIL_USER}>`

  try {
    const info = await transporter.sendMail({ from, to, subject, html, text })
    console.log(`[Mailer] Email sent — MessageId: ${info.messageId}`)
  } catch (err) {
    // Log but never crash the server over a notification failure
    console.error('[Mailer] Failed to send email:', err.message)
  }
}

module.exports = { sendMail }
