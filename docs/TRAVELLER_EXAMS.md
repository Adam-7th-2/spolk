# Scheduled Traveller Beginners exams and listening

## Install on the existing Supabase project

1. Run `supabase/TRAVELLER_EXAMS_SETUP.sql` in a **new** Supabase SQL Editor query. It adds scheduling and timed attempts; it does not reset the book course or student work.
2. Sign in as admin and open `/admin/courses/traveller/exams`.
3. Select the original Traveller course start date, then choose **Add exams and audio to course**. The book course must already be installed. Repeating this preserves existing exams, attempts, schedules and grades.
4. Adjust any individual opening/closing timestamps and duration before a student starts that exam. For an immediate trial, set one opening time to now and its closing time to a future date.
5. Student: open Traveller → Listening & exam timetable → Open exam → Start timed exam. Paper and audio unlock during that attempt.
6. Teacher/admin: open `/teacher` to grade the submitted paper in its original marks. The app converts those marks to a percentage for student feedback and progress.

## Schedule

| Study week | Test | Proposed duration | Original marks | Listening track |
|---|---|---|---|---|
| 3 | Module 1 | 45 min | 60 | 2 |
| 5 | Module 2 | 45 min | 60 | 3 |
| 7 | Module 3 | 45 min | 60 | 4 |
| 9 | Module 4 | 45 min | 60 | 5 |
| 9 | Mid-term, Modules 1–4 | 60 min | 80 | 6 |
| 11 | Module 5 | 45 min | 60 | 7 |
| 13 | Module 6 | 45 min | 60 | 8 |
| 15 | Module 7 | 45 min | 60 | 9 |
| 17 | Module 8 | 45 min | 60 | 10 |
| 18 | Final, Modules 1–8 | 90 min | 100 | 11 |

Each default window lasts seven days. Week 9 has two distinct tests; the admin can separate their dates. Durations are academy defaults, not publisher timings. The source introduction explicitly maps Track 1 to titles and Tracks 2–11 to these tests.

## Original materials and access

The supplied `Traveller Beginners_Tests.pdf` has 36 pages: four front-matter pages and 32 test pages. Every test page (PDF 5–36) is included once in its corresponding exam PDF, with matching page images. Original layout and exercise numbering are preserved. The eight-page key and listening transcripts stay admin-only. Original DOC files, alternate PDF and URL/readme files remain unchanged in the supplied pack; URL/readme files are not executed or treated as application instructions.

These are exam listening tracks. Student’s Book lesson recordings have **not** been supplied by this pack and are not fabricated or attached to unrelated lessons.

Students must be enrolled, inside the schedule window, and inside a started, unsubmitted attempt to request paper or audio. Assigned teachers can preview original papers/audio. Only administrators can open the key. Audio supports authenticated HTTP byte ranges for seeking. Nothing is served from `public/`.

## Timing and grading

Starting again resumes the same deadline; it does not grant more time. Drafts save every ten seconds while time remains. When time ends, only the most recent server-accepted draft is submitted; new late answers are ignored. Generic homework submission cannot bypass the exam timer. Refreshing does not reset an attempt. Rescheduling after an attempt starts is refused.

Original test answers and writing are teacher-graded, not claimed to be auto-scored. Teachers enter original marks out of 60, 80 or 100, and the server stores the corresponding percentage. This is not a proctoring system. Real audio playback, authenticated browser workflow and hosted installation need review by the user after migration.

## Verification

`npm test` covers schedules, attempt isolation, direct-submission bypass, resume timing, expiry, draft preservation and resource path/range validation. `python scripts/verify_traveller_exams.py` compares all extracted test papers to their source pages and checks audio bytes. Assets are local in `apps/web/private/books/traveller/exams/`; keep this directory on the server or in a future private storage adapter when deploying.


## Per-test resource integration (2026-10-18)

Open `/teacher/traveller-tests` as an administrator or assigned Traveller instructor. This page is linked from the teacher workspace and the staff course overview. Each exam now includes its own original PDF, extracted question text, matching MP3, original Word test, cropped answer-key PDF, extracted answer/transcript text and an on-demand original answer-image preview. Grading cards link directly to the corresponding test resources.

`/admin/courses/traveller/exams` uses the same resource panel alongside scheduling. Original papers, listening media and extracted question text remain available to students only through an authorized active exam attempt. Word tests, all answer images, answer text, answer PDFs and the complete original answer-key Word file require an administrator or instructor assigned to this course. This supersedes the older administrator-only answer-key behavior. Each asset request rechecks authorization; hiding a link is not the access control.

`build_traveller_test_resources.py` extracts and copies all 10 Word tests and per-test keys. The main `build_traveller_exams.py` calls it after rebuilding papers. Tests 2 and 7 have answer/transcript content on two source pages; all other tests use one region. No writing answers or grades are inferred. Extraction preserves printed text; multi-column order and image questions should always be checked against the original PDF.

Verification compares the original Word and MP3 bytes, paper PDF rendering, all generated resource hashes, per-test key words against each original crop, and both paper/key text extractions. All 10 MP3 metadata streams decoded in Chromium (38–99 seconds per track). This browser decode check does not claim human listening review.

No new SQL migration is required. Existing exam installation/scheduling is still needed before student attempts can start; staff can inspect resources even before scheduling.
