# Spolk progress — 2026-10-18

The full requested product is not complete. This ledger records actual evidence, not production readiness.

## Current local changes

- Connected student enrollment cards to private course lessons.
- Added upcoming classes, course tutor/speaking navigation, teacher feedback, and notifications to the student dashboard.
- Teacher workspace links to lesson content, shows assignment titles and prior grades, and supports grading submissions.
- Lesson view shows submitted homework and actual teacher feedback instead of offering duplicate submission.
- Prepared `supabase/DEMO_SETUP.sql` for a named existing student and the current admin as instructor. Installation on the hosted project is pending the user's SQL Editor execution.
- Added `docs/DEMO_TEST.md` with two-browser testing steps.

## Verification

- 53 unit/database tests passed after demo fixture and dashboard/teacher updates, including a PostgreSQL sample journey.
- Final type checking and lint passed, including the lesson homework/feedback view.
- Final run: 6 Chromium desktop/mobile public browser tests passed. Authenticated browser workflows have not been tested automatically against the hosted Supabase project.
- User reports registration and admin role setup working. This does not verify all other hosted workflows.

## Partial or pending requirements

- Full personalized curriculum, all release rules, scheduling and rich assessment types.
- Complete teacher/admin CRUD, student management, guardian consent and child safety operations.
- LiveKit real calls, shared whiteboard, moderation, attendance, complete recording lifecycle.
- Full document parsing, multilingual embeddings/vector retrieval, hosted model integration.
- Complete speaking modes, feedback, hardware/browser verification, full interface translations.
- Certificates, retention/deletion, backups, monitoring, launch policies and full operations documentation.
- Original logo asset, verified staff/portfolio content, production deployment.

## Traveller book course

- Supplied source: 126 scanned pages, eight main book units, intro and reference material. Every supplied page is mapped once to a lesson in source order.
- Built 10 modules, 71 lessons, 18-week suggested plan, 50 supplementary quizzes with 166 questions, and 62 teacher-reviewed original-page tasks.
- Original source bytes preserved. All 126 page-image hashes verified. All 71 per-lesson PDFs rendered identically to the corresponding original source pages in the verification script.
- Protected page/PDF routes, admin importer, student enrollment, weekly release/optional prerequisite gating, and teacher homework review implemented locally.
- Final checks passed: 62 unit/database tests, 8 browser tests, type checking, lint, and the production build.
- Hosted schema/course installation is pending the user's SQL Editor execution and admin import. Authenticated hosted browser review has not been performed by the agent.
- The supplied scan is missing reference pages listed in its contents; two final scans show the same printed page 131. Source audio, answer key and reliable accessible transcription are unavailable. No missing publisher material or listening results were invented.
- Private book files remain local and ignored by Git. Original numbered exercises are displayed unchanged and answered through page-indexed forms for teacher review, rather than claimed to be individually auto-graded.

## Admin-only Traveller file library

- Created eight private level folders and an administrator-only folder browser at `/admin/library/traveller`.
- Saved all 49 supplied resource entries: 48 URLs and one teacher-book entry without a URL. External files were not downloaded or verified.
- Added private local upload/download, allowed-file signature checks and a 100 MB upload limit. The original supplied Beginners PDF is available to admins without duplicating it.
- Missing B1+ teacher link and repeated C1 tests/teacher link are labelled. No additional course content was generated from those links.
- Checks passed: 67 unit/database tests, 10 public/privacy browser tests, type checking, lint and production build. Actual authenticated upload/download needs user verification in the admin browser.
- Storage is local filesystem storage and must be preserved during deployment/backups; it is not Supabase Storage.

## Traveller Beginners scheduled original exams and listening

- Inspected the supplied test pack and confirmed the booklet's explicit audio track list. Track 1 is titles; tracks 2?11 match the eight module tests, mid-term and final. These are exam recordings, not Student's Book lesson audio.
- Preserved and verified all 32 original test pages in 10 separate papers, their images and 10 bit-identical MP3 copies. The eight-page key/transcripts remain administrator-only. Original source DOC/PDF/readme/URL files were not modified or executed.
- Added proposed weekly exam scheduling, adjustable windows/durations, server-enforced single attempts, resumable deadlines, timed draft saves, late-draft finalization and rejection of generic-homework timer bypass.
- Added teacher grading in original marks (60 module, 80 mid-term, 100 final), converted server-side to percentage. No fabricated or automatic subjective grades.
- Default schedule: modules in weeks 3/5/7/9/11/13/15/17; mid-term week 9; final week 18.
- Verified: 75 unit/database tests, 12 browser checks, lint, type checking, production build and original asset verification all pass.
- Hosted activation requires `supabase/TRAVELLER_EXAMS_SETUP.sql` and the admin Add exams action. Real signed-in audio playback and the hosted student/teacher exam journey remain for user verification after activation.

## Traveller playlist videos

- Retrieved the public playlist metadata and matched 40 explicit module/lesson labels (1A?8E) to their existing book lesson IDs and weeks. This is title-based matching, not a claim that every video was watched.
- Added individual click-to-load embeds, a course playlist overview and administrator mapping preview. No videos were downloaded or re-hosted, and no SQL migration is needed.
- No iframe or thumbnail requests are emitted before the learner chooses to load the player. YouTube fallback links are available. Watching does not automatically mark a lesson complete.
- Checks passed: 80 unit/database/render tests, 14 browser checks, type checking, lint and production build. Actual third-party playback, captions and embedding permission require user review.


### Video 1A guided study
Added approximate section navigation and original formative practice after inspecting sampled YouTube preview frames and original pages 8?9. Caption retrieval returned empty content; spoken explanations remain unverified. Other videos remain title-matched. No database changes.


Bounded player update: switched page clips to the official YouTube IFrame API with explicit localhost/site origin, standard youtube.com embed, 200ms boundary checks, seek-back protection, clip-relative timer, play/pause/replay controls, reported API errors and retry. Native YouTube timeline still represents the source video; boundaries are UI playback controls, not content access restrictions. Typecheck, lint and 7 video tests passed. An isolated Playwright mock-API browser check passed seek guard, end pause, replay, error display and retry. An actual localhost-origin browser check loaded hWKEZzTjUO4 at 2:20?5:50 and observed playback advance to section 0:01 / 3:30. This example range is a technical check, not a new curriculum timing. The screenshot?s original error cause was not established; no promise of universal browser/network playback.


User identified VS Code built-in preview as the failing browser for YouTube error 5. Added specific HTML5 playback guidance and a same-lesson browser link to player errors. Exact page-8 clip 0:00?12:50 played to 0:01 in a localhost Chromium check; H.264 and VP9 support reported probably. This supports using a full browser, but does not establish the precise decoder failure in the user?s preview.


Section-finish popup: bounded playback now handles both timer boundary and YouTube ended events, destroys/removes the iframe at completion, and shows a native modal with replay, stay and (when available) next PDF page. Replay creates a fresh player; page changes remain explicit and do not mark coursework complete. Typecheck, lint and 7 video tests passed; isolated browser mock verified iframe removal, popup, replay remount, early native ended signal and next-page callback, plus existing guard/error/retry paths.


### English video replacement and integrated course workspace (2026-10-18)

Removed the Spanish Tony Teacher playlist, old page timing map and 1A-specific guide from active source. Curated 25 official BBC Learning English sources for all 42 study lessons (40 main sections plus two introductory study lessons). Each mapping includes a goal, listening focus, practice prompt, source URL, duration and language-review evidence. Short supporting videos are labelled as topic companions; no new page-level timestamps are invented. Nine official English worksheets were retrieved and checked. Full audiovisual review of all clips remains unperformed; admin review explains this limit. The new introduction source played successfully on localhost in Chromium (0:01 / 2:37).

Added a course workspace with grouped module sidebar, locked syllabus entries, actual completed progress, resume learning, quizzes/assignments indicators, and scheduled exams in module order plus a deadline overview. Lesson flow now separates Watch, Read & learn, Practice quiz, Assignment / exam feedback, Notes and Finish. Exam lessons use their original timed exam activity. Switching activities unmounts video but preserves local form and quiz state. Video-end popup can continue into Read & learn. Original book source, database curriculum, quizzes, exam media, grades, release prerequisites and completion enforcement are unchanged. No SQL migration required.

Validation: 83 unit/database/render tests passed; 14 existing desktop/mobile browser tests passed; typecheck, lint and production build passed. Additional isolated browser fixture checks at 1440px and 390px verified sidebar, original page navigation, stopping hidden video, retaining a typed assignment draft, keyboard tab navigation and no horizontal overflow. Fixture tests mock framework links/images and the YouTube API; they do not represent a signed-in hosted Supabase grading journey. Screenshots inspected at .tools/lms-1440.png and .tools/lms-390.png.


### Per-test audio, Word papers and extracted answer resources

Added `/teacher/traveller-tests`, linked from teacher workspace, staff course overview and grading cards. Shared resource panels are embedded into timed exam lessons and admin scheduling. Each of the 10 exams has its matching original MP3, original PDF and question text; course staff also get the original Word test and separately extracted original answer PDF, answer text/listening transcript and answer images. Two source regions are preserved for tests 2 and 7. Keys/documents are reauthorized on each request for admins or instructors assigned to Traveller; active student attempts can never access them. Existing exam timing, teacher grading, course records and student work are unchanged. No new SQL.

Validation: original 32 exam pages preserved; 10 MP3s and 10 Word documents match source bytes; 12 key regions and all text extractions match the supplied PDF. All 10 MP3 metadata streams decoded in a Chromium fixture check. Typecheck, lint and production build passed; 87 tests and 16 browser checks passed. Authenticated hosted teacher/student downloads were not exercised with real accounts in this turn.


### Private uploaded-answer review and question audio (2026-10-18)

Added student answer-file upload, local bounded extraction, private owner/attempt-scoped file storage and final-submission-only reference review. Ten private indexes contain 421 question addresses; exact exam/question retrieval drives deterministic closed-answer checks. Reports distinguish correct, incorrect, missing and teacher-review cases and never claim a final weighted score. Key retrieval is denied during active attempts. Blank/unmapped/review-required responses do not disclose expected answers. Optional Ollama-generated explanations are implemented behind EXAM_AI_EXPLANATIONS but no model service was configured or tested; reference-based explanations work without it. Handwriting/scanned/legacy Word uploads require teacher review rather than guessed OCR.

Installed local speech tooling and transcribed all ten original test MP3s with tiny.en. Matched timestamped speech to the original questions/transcripts and extracted 33 physical question clips. Multi-question conversations retain overlapping context. Students now see question-specific players, protected by the existing active-attempt media rules. Teacher resources retain originals and keys. No new SQL.

Validation: production build and lint passed; 105 tests passed. Existing 16 browser checks passed; new desktop/mobile answer-route auth checks passed after correcting their test Origin to the app's canonical localhost origin. Isolated desktop/mobile answer-flow fixtures passed start/upload/submit/then-feedback and no-overflow checks. All 421 private reference addresses passed published-answer roundtrip and incorrect/missing checks. All 33 clips decoded in Chromium. Independent extraction checks verified source hashes, question coverage, durations, text-PDF/DOCX parsing and page/text limits. No real hosted student attempt was created; model-generated prose and handwriting OCR remain unconfigured. See docs/TRAVELLER_ANSWER_REVIEW.md.


## 2026-10-18 ? OCR and sign-in diagnosis

Indexed all 126 student-book pages offline with the installed Windows English OCR engine; private page index contains 159,250 characters. Retrieval still filters by RLS-readable course, lesson and page rows. No test keys/transcripts were indexed. OCR is machine transcription and needs original-page verification.

Login now distinguishes incorrect credentials, unconfirmed email, throttling and connection failure, logging only provider code/status/name. Existing passwords no longer incorrectly require the new-account 12-character minimum; new registrations retain it. Email whitespace is trimmed; passwords are preserved exactly. Added auth-action/error tests. 121 tests, production build and lint passed. Actual student authentication remains unverified pending connectivity diagnosis/user retry.

Follow-up diagnosis: the configured Supabase hostname resolves to IPv4 addresses, but outbound HTTPS from the current runtime fails (curl HTTP 000 / connection refused by runtime). The actual local login smoke test returns AuthRetryableFetchError, status 0, after approximately 10 seconds. User reports the same new message. This is not evidence of a bad password. A live successful login has not been verified. External connectivity checks requested with escalation remain subject to automatic approval review; no Supabase account settings or passwords were changed.
