# Student workspace upgrade

Apply `supabase/migrations/202610190002_student_workspace.sql` after the earlier migrations when using hosted Supabase. Local mode upgrades its existing database automatically on server restart. This upgrade preserves accounts, assignments, submissions, and grades.

Lessons open in module/lesson order after all earlier teaching lessons are completed. Existing lesson prerequisites, scheduled release dates, quiz passes, and required teacher approval still apply. Reference pages remain available; exams retain their schedules and do not block the next teaching lesson. Completed lessons can be reviewed. Teachers and admins can inspect their course material. Another course still requires enrollment. The syllabus exposes titles and availability, never the body or answer keys of locked lessons.

Assignments accept written responses and up to three files of 10 MB each (PDF, UTF-8 TXT, JPG, PNG, DOCX). Downloads require a session and access to the submission: its student, its assigned teacher, or an admin. Files are stored outside public assets in `apps/web/private/homework-uploads/`. Back up that directory with the database and use persistent storage on deployment. Scheduled exams keep their timed submission workflow.

Every lesson activity has an Ask your teacher form. The resulting thread is visible to its student, assigned course teachers and admins. Replies and questions generate workspace notifications and email outbox entries. Grades, new homework, course announcements, class schedule changes, enrollment approval and lesson completion also generate relevant updates. The header unread badge refreshes every 30 seconds and on browser focus. Inbox entries link to the related activity and can be marked as read.

Required profile fields are first name, last name, country, city, time zone, English level (including Not sure), learning goal, and language preferences. Existing users see a completion reminder; their coursework is preserved. Email preference affects new email outbox entries, while workspace notifications remain enabled.

## Email delivery

Offline mode never sends mail. Admins can preview generated messages at `/admin/email-outbox`. Queued is not a delivery confirmation.

For hosted delivery, configure these server environment variables and a verified sending address/domain with Resend:

```
EMAIL_DELIVERY_ENABLED=1
RESEND_API_KEY=...
NOTIFICATION_FROM_EMAIL=Spolk <learning@your-verified-domain.example>
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SITE_URL=https://your-site.example
```

Keep the service-role and provider keys server-only. Run `node scripts/send-notification-emails.mjs --send` from the repository root on a server scheduler, for example every minute. The worker leases up to 20 queued items, uses a stable provider idempotency key, retries failures after five minutes, and stops after five attempts. It marks accepted requests only after the provider confirms an ID; this does not prove inbox delivery. The app does not require mail delivery to save coursework or replies. See the [Resend send API](https://resend.com/docs/api-reference/emails/send-email) for provider configuration.

Verify the worker without sending email using `node --test scripts/email-delivery.test.mjs`. No provider was connected or real email sent during local implementation.


## Automatic daily check-ins

Apply `supabase/migrations/202610190004_daily_checkins.sql` after the preceding migrations using the Supabase SQL Editor. No new paid service or scheduled worker is required. The Render connector cannot apply this database update.

Opening the student dashboard sends an authenticated, same-origin POST to `/api/daily-checkin`. The server assigns the UTC date; users cannot backdate attendance. The database records one check-in per account/day and notifies each administrator once. Repeat visits and refreshes do not duplicate notifications. A visible dashboard checks again each minute and when the tab becomes visible, including across midnight UTC.

The dashboard displays the current visit streak, longest streak, seven-day attendance and a five-day goal over the last seven days. Check-ins represent visits, not completed lessons or grades. Admins see recent check-ins on `/admin`; notification email remains disabled unless the existing email worker is separately configured. Students cannot view other learners' check-ins or directly edit attendance. If the migration is not yet applied, the check-in card shows an unavailable state while the rest of the dashboard continues working.
