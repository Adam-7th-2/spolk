# Beginners original test pack: extraction and delivery

The source folder is `apps/web/private/library/traveller/beginners/Traveller_Beginner_test_www.frenglish.ru`. All 28 supplied files are inventoried with byte counts and SHA-256 hashes. Ten tests follow the existing course schedule: Modules 1–4, mid-term, Modules 5–8, final. Existing module IDs, lessons, assignments, exam timing and grades are preserved.

## Student flow

1. Enroll in Traveller Beginners and open the course learning path.
2. Open the scheduled exam and start the timed attempt during its available window.
3. Read the original test pages and listen to the matching recording or question clips.
4. Use the new searchable page-by-page paper text when useful. It contains 6,619 original PDF words across the 32 test pages, with original source-page numbers and word coordinates retained in the private JSON.
5. Upload answer files, check the imported answer text, and confirm final submission before the deadline. The existing autosave, deadlines and teacher grading flow remains in place.

Only an active authorized attempt can fetch student extraction JSON. Finishing the exam does not expose teacher keys. Text does not reproduce pictures, column layout or table relationships; the original paper remains authoritative. Extracted words are not newly generated questions or automatic answer forms.

## Admin and assigned teacher flow

Open `/admin/courses/traveller/exams` for the extraction report and source inventory. Review the ten test-to-week/page/audio mappings and use the existing organize/reschedule actions when needed. Staff resource panels now include original Word text, full teacher-key Word text, original documents, per-test keys, transcripts, and searchable paper text. Existing grade review continues to require teacher judgement for open responses.

The report links to full text from all three source PDFs, including introductory and answer-booklet pages, and all eleven Word documents. These full-document extracts are staff-only because they can contain teacher answers or other material beyond the active test. The student viewer receives only the mapped test paper pages; keys are never bundled into its JSON or imported into client code.

The 11 MP3s are retained as supplied. Track 1 is introductory; tracks 2–11 are already mapped to the ten exams. This change does not claim new audio transcription. Existing listening transcripts remain private staff reference material.

## Reproduce and verify

On Windows with Microsoft Word installed, run `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/extract_traveller_word.ps1`. It opens originals read-only in a hidden Word instance, disables macros and automatic link updates, extracts document text, and closes Word. The execution-policy override applies only to that process. Original documents are unchanged.

With the existing PyMuPDF dependency available, run `python scripts/build_exam_extractions.py` then `python scripts/verify_exam_extractions.py`. The verifier compares every extracted student word and page text against the exact source PDF and verifies every source-file hash. Word's extracted main-document text can flatten tables and does not guarantee extraction of every embedded object or text box. The original Word and PDF downloads remain available for full fidelity.

Generated data remains under `apps/web/private/books/traveller/exams`, included in the private repository/Docker image and served only through the existing protected exam asset route. No additional SQL migration, paid service, or public asset upload is required.
