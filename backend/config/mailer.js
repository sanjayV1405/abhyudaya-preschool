/**
 * Gmail REST API client for Abhyudaya Preschool
 * Uses Google OAuth2 over HTTPS (port 443) to avoid Render's outbound SMTP port blocking.
 *
 * Required environment variables:
 *   GMAIL_CLIENT_ID     — Google OAuth2 Client ID from Google Cloud Console
 *   GMAIL_CLIENT_SECRET — Google OAuth2 Client Secret
 *   GMAIL_REFRESH_TOKEN — Google OAuth2 Refresh Token (authorized for https://www.googleapis.com/auth/gmail.send)
 *   GMAIL_USER          — Authorized Gmail address (e.g. abhyudayapreschool@gmail.com)
 *
 * Optional environment variables:
 *   GMAIL_REDIRECT_URI  — OAuth2 Redirect URI (defaults to https://developers.google.com/oauthplayground)
 *   MAIL_FROM           — Custom From header (defaults to "Abhyudaya Preschool" <GMAIL_USER>)
 */

const { google } = require('googleapis')

let _gmailClient = null

function getGmailClient() {
  if (_gmailClient) return _gmailClient

  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn(
      '[Mailer] Gmail API OAuth2 credentials missing (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, or GMAIL_REFRESH_TOKEN). Email notifications are disabled.'
    )
    return null
  }

  const redirectUri =
    process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  _gmailClient = google.gmail({ version: 'v1', auth: oauth2Client })
  return _gmailClient
}

/**
 * Encode an email into RFC 2822 format and convert to base64url string for Gmail API.
 */
function createRawMessage({ from, to, subject, html, text }) {
  const toHeader = Array.isArray(to) ? to.join(', ') : to
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`
  const boundary = `__abhyudaya_boundary_${Date.now()}__`

  const messageLines = [
    `From: ${from}`,
    `To: ${toHeader}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    text || '',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html || '',
    '',
    `--${boundary}--`,
  ]

  const rawMime = messageLines.join('\r\n')

  return Buffer.from(rawMime, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Send an email notification via Google Gmail REST API (OAuth2 HTTPS).
 *
 * @param {object} options
 * @param {string|string[]} options.to      — Recipient address or array of addresses
 * @param {string}          options.subject — Email subject line
 * @param {string}          options.html    — HTML email body
 * @param {string}          [options.text]  — Plain-text fallback
 */
async function sendMail({ to, subject, html, text }) {
  try {
    const gmail = getGmailClient()
    if (!gmail) return

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

    const senderEmail = process.env.GMAIL_USER || 'abhyudayapreschool@gmail.com'
    const from = process.env.MAIL_FROM || `"Abhyudaya Preschool" <${senderEmail}>`

    const raw = createRawMessage({
      from,
      to: recipients,
      subject,
      html,
      text,
    })

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    })

    console.log(`[Mailer] Email sent successfully via Gmail API — ID: ${res.data?.id}`)
  } catch (err) {
    // Fail-safe: Email sending must never crash the server or disrupt enquiry submission
    console.error('[Mailer] Unexpected error sending email via Gmail API:', err.message || err)
  }
}

module.exports = { sendMail, createRawMessage }
