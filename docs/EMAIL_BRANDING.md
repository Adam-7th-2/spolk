# Spolk email branding

Notification emails now include a responsive Spolk wordmark, academy colours, a workspace button, a plain-text alternative and a preferences link. The original image logo has not been supplied; the template uses the same text wordmark as the website. To include an image, add the approved PNG logo to `apps/web/public/brand/spolk-logo.png` and set `NOTIFICATION_LOGO_URL` to its full public HTTPS URL.

Live notification delivery still needs a verified sender/domain and provider credentials. Set `NOTIFICATION_FROM_EMAIL` to the approved `Spolk <address@your-domain>` sender and `RESEND_API_KEY` through Render environment settings. Follow `docs/STUDENT_WORKSPACE.md` for the worker and opt-in delivery configuration. Do not enable sending before the sender is verified. No sender address has been invented and no email was sent while preparing these changes.

Signup verification and password resets are sent separately by Supabase Auth. Configure the sender under Supabase Authentication SMTP settings, and apply branded templates under Authentication Email Templates. The notification worker does not change Supabase Auth emails.

For complete signup profiles, apply `supabase/migrations/202610190005_signup_profiles.sql` after migration 002. This stores allowlisted signup metadata in the learner profile before email verification. Roles continue to be assigned by the existing server trigger; signup metadata cannot select an admin or teacher role. Existing accounts are unchanged and can complete their profile in the workspace.

Ready-to-paste Supabase Auth templates are in `supabase/email-templates/confirm-signup.html` and `supabase/email-templates/reset-password.html`. Paste them into the corresponding Supabase email template editors. Preserve `{{ .ConfirmationURL }}`; Supabase supplies each secure action URL. These templates currently use the text wordmark; add the approved HTTPS logo image once available.
