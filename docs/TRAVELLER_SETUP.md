# Traveller Beginners course

## Install in your existing project

1. Open `supabase/TRAVELLER_SETUP.sql`. Copy it into a **new** Supabase SQL Editor query and run it. This adds book metadata, permissions and the transactional installer to the existing database. Do not rerun SETUP_ONCE.sql.
2. Sign in as your academy administrator and open `http://localhost:3000/admin/courses/traveller`.
3. Review the source notes and full module/lesson plan. Enter the existing student email (or leave it blank), and select a course start date.
4. Leave weekly release and sequential completion unchecked to inspect every lesson now. Enable them on FIRST installation for a paced program. These choices are not reapplied when enrolling another student. Pairwork/song/reference pages are available from the course start so activities in earlier units can use their original cross-references; their final review remains scheduled in week 18.
5. Click **Create all modules and lessons**. The operation is atomic. You become the assigned instructor. Repeating enrollment does not reset grades, content or progress.
6. The student opens My learning → Traveller Beginners → Open course. The instructor uses `/teacher` to read book-page homework and give feedback.

## What is included

- All 126 supplied PDF pages, kept in exact file order and covered once in the lesson map.
- 10 modules, 71 lessons, 18 suggested weeks, 50 Spolk practice quizzes, 166 objective questions, 62 original-page homework tasks.
- Unmodified copied source PDF, private page images, and 71 per-lesson PDFs whose pages render identically to the source.
- Module/week ordering, estimated study time, optional weekly releases, optional prerequisite progression, due dates based on study week.
- Original numbered exercises are completed against the displayed book page, submitted as written work and reviewed by a teacher. They have NOT all been retyped into individually auto-graded form controls. Added quizzes are separate Spolk practice, not the publisher answer key.
- Completion of book homework lessons requires a teacher grade of at least 70 as well as passing the supplementary quiz where present. This grade is teacher judgement; audio-dependent tasks remain pending until the teacher has authorized audio.

## Source limitations

The supplied scan has 126 pages. Its contents refer to printed Grammar Reference pages 125–129, Learning Tips/Irregular Verbs page 130 and Word List page 132, which are absent. The final two scans both contain printed British/American English page 131; both are preserved, even though their raster bytes differ. Source OCR is incomplete and unreliable. The screenshots and per-lesson PDFs are authoritative; a complete accessible transcript is not supplied.

Publisher audio and the teacher answer key were not provided. The application does not fabricate either. Other licensed materials can be attached later. The full course cannot claim completion of audio-dependent listening activities until suitable audio is available.

## Asset handling

Original files are in `apps/web/private/books/traveller/`, excluded from Git and public static serving. Do not move them to `public/`. Page requests and lesson PDFs require authentication and a visible, released lesson under database RLS. The admin preview requires administrator rights. Students cannot download the entire source PDF through these routes.

Before deploying, securely copy this private asset directory to a persistent server filesystem or implement a private storage adapter. The files are currently local and have not been uploaded to Supabase Storage or any public host. Standard server hosting is required by the filesystem adapter; a Worker deployment needs private object storage integration.

## Reproduce and verify

The local Python reader is installed in `.tools/pdf-libs`.

```powershell
python scripts/build_traveller.py --pdf 'C:\path\Traveller_Beginners_Student_39_s_book.pdf'
python scripts/verify_traveller_assets.py
npm test
npm run typecheck
npm run lint
npm run test:e2e
```

`docs/TRAVELLER_COVERAGE.md` lists every lesson's page range, week, and estimated duration. These are a proposed teaching schedule, not evidence of completed learning or a confirmed live class booking.
