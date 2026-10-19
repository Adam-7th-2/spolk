# Speaking coach: current integration

The speaking-practice page now selects an enrolled course and an RLS-readable lesson. Tutor evidence includes released lesson bodies, published AI notes, and the existing related-video learning goals/practice prompts. Video metadata is labelled guidance; it is not presented as a transcript.

Original student-book page OCR is supported through private/books/traveller/page-text.json. Only page rows returned by book_lesson_pages under the learner session can be retrieved. The index checks the supplied student-book fingerprint; it never reads teacher key files, test answer indexes, or exam listening transcripts.

## Student-book OCR completed

On 2026-10-18, Windows' installed English OCR recognizer indexed all 126 supplied pages (159,250 characters; all pages nonempty). The private index is `apps/web/private/books/traveller/page-text.json`. The source fingerprint was checked before indexing. Only authorized lesson/page rows are retrieved by the tutor.

Rebuild offline on Windows from the repository root:

```powershell
& ([scriptblock]::Create((Get-Content scripts/index_traveller_pages.ps1 -Raw)))
```

Keep the index private with the original book assets. OCR is not a reviewed transcription: verify quotations against linked protected page images. This does not transcribe course audio or video. Original test listening tracks stay within timed exam access; the coach does not receive their answer-bearing transcripts.

The optional RapidOCR package installation could not proceed because automatic approval review timed out; Windows OCR provided the working alternative without a download.

## Voice and presenter

Live voice mode is available in Speaking practice. After speech-recognition consent, it loops through microphone input, the course-only tutor endpoint, and browser speech synthesis. The selected course and lesson are sent on every turn; the RAG collector rechecks enrollment and source visibility before returning an answer. This is turn-based browser voice, not a full-duplex hosted realtime model.

English voice selection uses installed browser/OS speech voices, preferring natural/premium voices when available. Replies can be replayed or stopped. Long source excerpts are shown separately rather than appended to spoken replies. Microphone transcription is optional and requires consent. Browser voice/microphone hardware has not been tested on the user's device.

The existing synthetic animated coach remains. A photorealistic presenter with synchronized speech is NOT implemented. The user has no talking-avatar service account yet. A provider account, credentials and an approved presenter are needed to implement that feature; do not describe the current cartoon as the requested realistic presenter.

The local Ollama provider is still optional. When unavailable, the tutor presents authorized extracts and a practice invitation; it does not fabricate a generated explanation. There is no hosted model configured by this change.

## Verification

121 unit tests passed, including selected-course/lesson isolation, conversational context fallback, OCR page filtering and private answer exclusion. Production build and lint passed. A separate browser harness at desktop/mobile sizes checks request lesson context, simulated voice playback/stop, course-change cleanup, source links and layout. It mocks speech and avatar rendering; it does not verify real speech quality, talking-head animation or a real student login.
