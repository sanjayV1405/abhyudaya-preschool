/**
 * Resend Email API client for Abhyudaya Preschool
 * Uses HTTPS REST API (port 443) to avoid Render's outbound SMTP port blocking.
 *
 * Required environment variables:
 *   RESEND_API_KEY — API key from https://resend.com/api-keys
 *
 * Optional environment variables:
 *   MAIL_FROM      — Verified sender email address
 *                    Defaults to: "Abhyudaya Preschool <onboarding@resend.dev>"
 */

const { Resend } = require('resend')

let _resendClient = null

function getResendClient() {
  if (_resendClient) return _resendClient

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn(
      '[Mailer] RESEND_API_KEY not set — email notifications are disabled.'
    )
    return null
  }

  _resendClient = new Resend(apiKey)
  return _resendClient
}

/**
 * Send an email notification via Resend HTTPS API.
 *
 * @param {object} options
 * @param {string|string[]} options.to      — Recipient address or array of addresses
 * @param {string}          options.subject — Email subject line
 * @param {string}          options.html    — HTML email body
 * @param {string}          [options.text]  — Plain-text fallback
 */
async function sendMail({ to, subject, html, text }) {
  try {
    const resend = getResendClient()
    if (!resend) return

    // Ensure `to` is a flat array of non-empty email strings
    const recipients = Array.isArray(to)
      ? to.map((e) => (typeof e === 'string' ? e.trim() : '')).filter(Boolean)
      : typeof to === 'string'
        ? to.split(',').map((e) => e.trim()).filter(Boolean)
        : []

    if (recipients.length === 0) {
      console.warn('[Mailer] No valid recipient addresses provided, skipping send.')
      return
    }

    const from =
      process.env.MAIL_FROM ||
      'Abhyudaya Preschool <onboarding@resend.dev>'

    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      subject,
      html,
      text,
    })

    if (error) {
      console.error('[Mailer] Resend API error:', error.message || error)
      return
    }

    console.log(`[Mailer] Email sent successfully via Resend — ID: ${data?.id}`)
  } catch (err) {
    // Fail-safe: Email sending must never crash the server or disrupt enquiry submission
    console.error('[Mailer] Unexpected error sending email via Resend:', err.message)
  }
}

module.exports = { sendMail }
