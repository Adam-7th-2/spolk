# First complete learning check

## Install the sample in Supabase

Run `supabase/CHECK_TEST_ACCOUNTS.sql` to inspect the accounts, then run `supabase/DEMO_SETUP.sql` as a new SQL Editor query. Do not rerun initial setup.

The sample uses the existing student `henok.tarikuu@astu.edu.et`. If that account does not exist, create it in Supabase Authentication first. The only existing administrator is assigned as the course instructor for this first test. Set `teacher_email` to an existing separate account if desired. No password is stored, no real student work is changed, and no completed submissions or grades are fabricated.

The script is safe to rerun: its sample resources have fixed identifiers, existing records are preserved, and duplicate enrollments are not added. It does not reset expired demo classes or attempts.

## Student browser

1. Sign in as the student at `/login` in a separate browser profile or private window.
2. Open My learning → English for everyday life → Open course.
3. Open Demo 1: Introduce yourself. Demo 2 must not yet be accessible.
4. Start the demo quiz. Choose “Hello, my name is Alex.” and type “meet”. Submit to receive 100%.
5. Submit a 4–6 sentence introduction in the demo homework form.
6. Save a private note.
7. Mark the lesson complete. Return to Course lessons. Demo 2 should now appear.
8. Open Course tutor and ask “How do I introduce myself with a friendly introduction?” A missing Ollama model should produce matching source excerpts, not a false claim that AI inference ran.

## Teacher/admin browser

1. Keep the administrator signed in in a different browser profile.
2. Open `/teacher`. Find the demo homework submission.
3. Enter 90 out of 100 and meaningful feedback, then Save feedback.
4. Refresh the student's dashboard and lesson. The score and feedback should appear.
5. `/admin` remains available to the administrator. The sample directly enrolls the student, so it does not fabricate a pending application.

## Live classroom and speaking

The sample class opens five minutes after installation and lasts one hour. It has a valid student invitation. Joining still requires configured LiveKit credentials; without them the app must report that video is unavailable. Recording is disabled for this demo. An invitation is not proof of attendance.

Speaking practice has a browser-rendered avatar and text fallback. Microphone and browser speech require explicit consent. Real model response, voice, camera, two-user video, recording files, and browser/device compatibility require separate verification. No precise pronunciation grade is inferred from text.

## Automated evidence

`npm test` includes a real embedded-PostgreSQL journey exercising repeatable demo setup, enrollment, hidden prerequisites, quiz grading, completion, unlocking, homework uniqueness, notes isolation, teacher grading, source access, outsider denial, and recording denial. This is database integration testing, not a claim that a complete hosted browser journey has run.

The embedded engine replaces the pgvector column with an array; vector search is not verified by this test.
