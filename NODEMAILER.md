# Nodemailer configuration

Transactional email (order confirmations, status updates, enquiries) uses `nodemailer` with settings from environment variables.

## Required variables

- `SMTP_USER` — sender address Nodemailer uses in the `from` field (must match the account you authenticate with for most providers).

## Option A: Service shortcut

Set these when using a well-known provider (e.g. Gmail, Outlook) that Nodemailer recognises by `service` name:

| Variable | Example | Notes |
|----------|---------|--------|
| `SMTP_SERVICE` | `Gmail` | See Nodemailer “Well-Known Services”. |
| `SMTP_USER` | `you@example.com` | Login user. |
| `SMTP_PASS` | app password | Use an app-specific password, not your normal password, when the provider requires it. |

## Option B: Custom SMTP host

| Variable | Example | Notes |
|----------|---------|--------|
| `SMTP_HOST` | `smtp.example.com` | Your provider’s SMTP host. |
| `SMTP_PORT` | `587` or `465` | `465` typically uses TLS; `587` often uses STARTTLS. |
| `SMTP_USER` | `apikey` or mailbox user | Depends on provider. |
| `SMTP_PASS` | secret | API key or password. |

If `SMTP_PORT` is `465`, the transporter uses `secure: true`.

## Enquiry recipient

Set `ENQUIRY_RECEIVER_EMAIL` in `backend/.env` if your enquiry controller uses it (otherwise configure the “to” address in code to match your workflow).

## Behaviour when not configured

`sendMail` in `utils/mailer.js` throws if the transporter cannot be built or `SMTP_USER` is missing. Order and enquiry flows catch these errors and log them so the API can still return success for the main action.

## Local testing checklist

1. Copy `.env.example` to `.env` if you use one, and add the variables above (no real secrets in git).
2. Restart the Node server after changing `.env`.
3. Place a test order or submit a contact form and confirm the message arrives (check spam).
4. For Gmail, enable 2FA and create an **App password** for `SMTP_PASS`.

Do not commit real passwords or API keys; use placeholders in documentation only.
