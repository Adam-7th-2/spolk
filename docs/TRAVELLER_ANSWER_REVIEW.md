# Private answer-file review and listening-question clips

Implemented 2026-10-18. No new SQL migration is required; existing Traveller exams must already be installed and scheduled.

## Student flow

1. Start the timed test during its scheduled window.
2. Download the blank numbered answer template or prepare an answer file using the original section/group/question addresses, for example `grammar.a.1: response`.
3. Upload an answer sheet (maximum 6 MB). TXT, JSON, text PDF and DOCX are extracted locally; PDFs are limited to 20 pages and extracted text to 12,000 characters. Images, scanned PDFs and legacy DOC files are retained for teacher review rather than receiving an invented transcription.
4. The accepted extracted text is saved through the existing deadline-enforced draft RPC. Uploading does not finalize the test. Review the imported text, then confirm final submission.
5. Students request submission feedback: only their own uploaded files and teacher grade/feedback are returned. Published test answers are never returned to students, including after submission. Assigned staff can request the private comparison review, which reads the server-stored submission and reports correct, incorrect, missing and review-required counts. These counts are not the publisher's weighted marks.

The original timed autosave/expiry behavior is retained. Uploads are checked before extraction and the database checks the deadline again before accepting the extracted draft. Students cannot inspect another account's submission or uploads. The reference key never appears in an active-attempt response or blank template.

## Private retrieval and explanations

`build_exam_answer_index.py` builds 421 exact section/question addresses across ten private indexes beneath `apps/web/private/books/traveller/exams`. These are not published into the student tutor's knowledge table and are never imported into client bundles. Each reference retains its original key text, source hash and question source identifier.

Retrieval is constrained to the selected exam and question IDs. Closed responses use deterministic matching with case/punctuation normalization, true/false normalization, basic contraction normalization and explicit published accepted values. Open writing, uncertain variants, multi-blank mismatches and unreadable/misnumbered work are flagged for teacher review; they are not converted into fabricated automatic marks. The existing teacher grading form remains responsible for the final weighted grade.

Optional retrieval-augmented natural-language explanations use Ollama structured JSON responses. Set `EXAM_AI_EXPLANATIONS=1`, `OLLAMA_BASE_URL` and `OLLAMA_MODEL` only when a model service is running. Generated output can replace explanations only for a matching question/source identifier; it cannot alter statuses, counts or grades. Provider errors fall back to reference-based explanations. No Ollama model service was configured or exercised in this change; the local Whisper speech model below is separate from an explanation model.

## Listening alignment

Local `tiny.en` speech transcription was generated for all ten original recordings. The timestamped speech was compared with the printed questions and publisher transcripts. `build_exam_audio_clips.py` extracts 33 real MP3 segments with sentence-boundary margins and overlapping context where several questions use one conversation. The public listening manifest includes only question IDs, source page, timings and file hashes, never expected answers or transcripts.

Student attempts show the matching question players instead of a single generic full recording. Clip asset requests use the same active-attempt/enrollment checks as original media; staff can inspect them in the private resource library. The original tracks remain unchanged. Alignment is transcription-assisted and checked against printed content, not a claimed human audit of every spoken word. The model misrecognises some words; printed keys remain authoritative.

Rebuild/review commands from repository root:

- `python scripts/build_traveller_test_resources.py` — original per-test documents, key extracts and private grading indexes.
- `python scripts/transcribe_exam_audio.py` — local model download and timestamped transcription; existing source hashes are checked before reusing cached evidence.
- `python scripts/build_exam_audio_clips.py` — reviewed question timings and MP3 extraction. Changed audio requires transcription and renewed boundary review.
- `python scripts/verify_exam_answer_workflow.py` — index/clip coverage, clip durations, source hashes and bounded extraction checks.

Speech tools were installed locally under `.tools/audio-libs` (`faster-whisper`, `imageio-ffmpeg` and dependencies); PyMuPDF is under `.tools/pdf-libs`. File extraction uses `PYTHON_BIN` (default `python`) and `scripts/extract_student_answers.py`. The application server must have these local extraction dependencies available. Dynamic subprocess tracing is deliberately disabled so Next does not package the entire tools/model cache into its server bundle.

## Storage and deployment

Original uploads are stored privately beneath `apps/web/private/answer-uploads/<account>/<exam>/`. Ownership and attempt start time are checked on downloads; untrusted original filenames are not used as filesystem paths. These files are ignored by version control. Running this feature on another host requires a persistent private volume or equivalent object-storage adapter; it is currently a local filesystem implementation. Existing public/anon Supabase keys are sufficient because database operations use the signed-in user's policies and RPCs; no service-role key is needed.

## Verification

105 unit/database/API/render tests passed, including deadline rejection, cross-account rejection, no early key retrieval, key-free blank templates, upload byte limits and using only the stored final submission for review. Existing desktop/mobile browser coverage passed (16 existing checks plus two new auth checks). An isolated desktop/mobile fixture verified start, three question players, answer upload, final submission and only-then feedback without overflow. Browser fixtures mock authenticated responses; no real signed-in hosted student submission was created.

All ten private indexes passed published-answer round trips and wrong/missing counting checks. All 33 clip streams decoded in Chromium, and clip durations/source mapping were independently checked. TXT, text PDF, scanned PDF and split-run DOCX extraction, page/text limits and manual handwriting fallback were exercised. Production build and lint passed. Live model-generated explanation quality and handwriting OCR remain unverified/unconfigured.
