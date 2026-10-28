# Offline academy

The [student workspace upgrade](STUDENT_WORKSPACE.md) adds progress-based lesson locks, private assignment uploads, teacher conversations, notifications, profile settings and an admin email preview. Local upgrades apply on restart. Email previews work without an external provider; real delivery requires hosted mail configuration.

Read & learn uses one original page card at a time, with only that page's mapped listening tracks and lesson practice prompts. Practice quizzes save each checked answer before showing detailed feedback; checked answers remain fixed when resuming or submitting. The countdown, attempt limits, and final score are enforced by the database. This feedback is for supplementary lesson assessments; original scheduled exams retain their separate workflow.

Existing local databases automatically apply `supabase/migrations/202610190001_assessment_cards.sql` at startup. Before using the updated quiz with hosted Supabase, apply that migration in the Supabase SQL Editor or through the migration workflow. Local database upgrades do not update hosted Supabase. If the quiz reports that this migration is missing, it must be applied by a Supabase project administrator; changing a teacher, learner, or academy-admin role will not resolve it.

Run `npm run dev:local` from the repository root with Node 22 or newer. The site opens at http://127.0.0.1:3001/login. This separate port keeps the usual hosted development server available at port 3000. Set `PORT` if you need another local port.

| Account | Email | Password |
| --- | --- | --- |
| Student | student@spolk.local | SpolkLocal2026! |
| Teacher | teacher@spolk.local | SpolkLocal2026! |
| Administrator | admin@spolk.local | SpolkLocal2026! |

The first launch prepares an embedded PostgreSQL database, the existing migrations, an Everyday English sample course with homework and a quiz, and the complete Traveller Beginners course and scheduled exams. Initialization can take a few seconds. The student starts enrolled in both courses; the teacher can review homework. All demo data is separate from hosted Supabase.

Passwords are hashed with scrypt. Random session tokens are stored as hashes in the local database and issued in HTTP-only cookies. The application runs database queries under the existing PostgreSQL row-level security policies. New registrations receive only the student role. Local accounts are disabled in production, and the local launcher binds to the loopback interface.

Work persists in `.tools/local-academy`. Stop the local server before backing up that folder. Do not run two offline servers against the same directory. No cloud accounts, passwords, API keys or database records are changed.

Email delivery and recovery are unavailable offline. AI inference needs a running local Ollama installation. YouTube videos, remote photos and live-class providers still require their usual external services. Original textbook PDFs and audio remain private local assets.

To return to hosted Supabase, stop the local server and run `npm run dev`. Existing `apps/web/.env.local` settings are preserved. Local users and work are not automatically uploaded or merged into Supabase. The embedded database uses an array for the unused vector column; all other course schema, access policies, quizzes and workflow functions use the existing migrations.
