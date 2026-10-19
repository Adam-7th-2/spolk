# Spolk email branding

The signup form collects learner profile details and explicit email consent. Run `supabase/migrations/202610190005_signup_profiles.sql` after migration 002 to save signup metadata into hosted profiles. Existing accounts are unchanged. Roles are always assigned by the server, never taken from signup metadata.

Notification emails include the Spolk wordmark, academy colours, a workspace button, a plain-text alternative and email preferences. The approved logo image is still missing. Add it to `apps/web/public/brand/spolk-logo.png` and set `NOTIFICATION_LOGO_URL=https://spolk.onrender.com/brand/spolk-logo.png` once available. No placeholder image is sent.

## Sender: koslog.team@gmail.com

Use `NOTIFICATION_EMAIL_PROVIDER=gmail` and `NOTIFICATION_FROM_EMAIL=Spolk <koslog.team@gmail.com>`. No custom domain is required. Render Free blocks outbound SMTP ports, so the worker uses the Gmail HTTPS API. Nodemailer only builds MIME in memory; it never connects to an SMTP server.

To authorize the sender:
1. In Google Cloud Console, create/select a project and enable Gmail API.
2. Configure the OAuth consent screen and an OAuth client for your deployment. Request only `https://www.googleapis.com/auth/gmail.send`.
3. Authorize as `koslog.team@gmail.com` with offline access and securely obtain its refresh token. Follow Google's web-server OAuth instructions: https://developers.google.com/identity/protocols/oauth2/web-server#offline . Testing-mode token expiry and publishing requirements must be checked in the Google console before unattended use.
4. Store `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` in Render's secret environment settings. Never paste tokens into chat or commit them.
5. Set `EMAIL_DELIVERY_ENABLED=1` only when ready, and arrange for `node scripts/send-notification-emails.mjs --send` to run on a scheduler. No paid Render worker or cron is provisioned automatically. Until a scheduler and credentials are configured, automatic email delivery is inactive. The existing in-app notifications continue working.

The Gmail worker leases queued notifications using the existing database functions. Gmail does not provide the Resend idempotency guarantee: if a request succeeds but its response is lost, a retry can deliver a duplicate despite the stable Message-ID. Provider acceptance is not proof of inbox delivery. Test to an owned address before enabling a broad backlog; consent and queue timestamps should be reviewed before first activation.

## Signup verification and password resets

Supabase Auth sends these separately. Configure custom SMTP in Supabase using Gmail's `smtp.gmail.com`, port `465`, sender address `koslog.team@gmail.com`, sender name `Spolk`, username `koslog.team@gmail.com`, and a Google App Password. This SMTP connection originates from Supabase, not the free Render service. Google requires 2-Step Verification for App Passwords; availability depends on the account settings. Do not use your ordinary Gmail password.

Paste `supabase/email-templates/confirm-signup.html` and `supabase/email-templates/reset-password.html` into their matching Supabase Authentication Email Templates. Preserve `{{ .ConfirmationURL }}`. These currently use the same text wordmark as the website. The notification worker does not modify Supabase's sender or templates.

No Gmail OAuth credentials, approved logo image, or Supabase SMTP credentials have been supplied, and no real emails have been sent during implementation.
