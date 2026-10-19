# Website verification — 19 October 2026

The core learning workflows pass local checks. This is not a claim that every external integration is configured or that every hosted account has been manually tested.

## Dashboard and grades

Students have `/dashboard/grades`, linked from their dashboard. It lists their own homework/exam submissions, teacher scores and feedback, pending grading, and completed quiz attempts. Summary averages include teacher-marked submissions only, with equal weighting; pending submissions are not treated as zero and repeated quizzes do not inflate the average. It is not a final weighted course grade. No answer keys are queried or displayed by the gradebook. Admins can open Grade submissions to use the existing teacher grading workspace.

The dashboard now shows active courses, completed lessons, pending grading, and the marked-work average. The lesson progress bar uses actual completed/total course lessons rather than a fixed percentage per completed lesson.

## Verification completed

- 167 tests across 31 test files pass, including database permissions, grades privacy, assessment progression, exam timing, uploads, private keys, messages, notifications, Gemini request handling, and origin validation.
- Lint and the optimized production build pass. The build retains two existing dynamic audio-file tracing warnings; these are deployment-size warnings, not build failures.
- All 18 local Playwright checks pass on desktop and mobile. These use a separate database and port, preserving the usual local academy store.
- Cross-account browser checks cover signup, enrollment, profile editing, lesson access/progression, original pages/audio, quizzes, homework upload/download, teacher grading, private conversations, notifications and another student's denied file access. Gradebook and daily check-in have additional desktop/mobile smoke checks.
- Before deployment, 20 of 22 public Render checks passed. Two upload-auth checks exposed a real public-versus-internal origin mismatch. The shared origin helper now uses the configured public site URL, and affected mutation routes use it consistently. Cross-site requests remain rejected. Post-deployment results are recorded below.
- Hosted zero-row schema checks confirm daily check-ins, learner profile fields, and grade fields exist. Exam schedules deny anonymous reads as intended; the live exam-installation state for a particular signed-in account was not inspected.

## External features still requiring setup or manual verification

- Gemini: the supplied credentials were rejected by Google with project access denied. No live Gemini generation has been confirmed. Configure an accepted server-only `GEMINI_API_KEY`.
- Email: sender configuration is prepared for `koslog.team@gmail.com`, but OAuth credentials/scheduling and Supabase SMTP setup have not been completed. No email delivery was verified. See `docs/EMAIL_BRANDING.md`.
- Browser microphone recognition and actual YouTube playback depend on the user's browser/network. Local checks mock external media; they do not certify playback from every location.
- Live classrooms require the configured external live-class provider; real participants and call quality were not tested.
- Real hosted sign-in, student uploads and grading require a dedicated authorized production test account. The cross-account mutations above were exercised locally, not against live student records.

No database migration is needed for the dashboard, gradebook, or origin fixes. Existing production accounts and grades are preserved.

## Post-deployment verification

Deployment `ffdcb33` is live on Render. All 22 public Playwright checks pass on desktop/mobile, including the two upload-auth checks that failed before the origin fix. These checks cover public navigation, signup form rendering, mocked login errors/retry, responsive layout, sign-in redirects and protected course/admin/test assets.

Additional live checks pass:
- Health endpoint: HTTP 200.
- `/dashboard/grades`: signed-out browser redirects to `/login` (Next may stream the redirect in an initial HTTP 200 response).
- About, Contact and Privacy pages: HTTP 200.
- Correct public-origin upload/check-in requests reach authentication and return HTTP 401 when signed out.
- A cross-site upload request returns HTTP 403.

The hosted application is not certified as fully integrated: Gemini access and email setup remain unresolved as described above. Production accounts were not created or modified by these checks.
