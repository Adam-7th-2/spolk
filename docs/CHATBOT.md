# Gemini chat assistant

Signed-in users have an Ask Spolk panel on every page. Gemini answers general questions (including writing, coding, English and general knowledge). Choosing a course adds relevant, authorized course excerpts without restricting the answer to those excerpts. The assistant is instructed to distinguish course evidence from general knowledge and link only cited course sources. It has no live web-search tool.

## Activate Gemini

Create an API key in Google AI Studio (https://aistudio.google.com/apikey), then add these server-only Render environment variables:

- `GEMINI_API_KEY`: your private key. Never prefix this with NEXT_PUBLIC or paste it into chat.
- `GEMINI_MODEL`: `gemini-3.5-flash-lite`, or another model available to your Google project supporting generateContent.

Save and deploy. Model availability, quotas and billing depend on your Google project; free Render hosting does not include Gemini usage. Do not enable paid Google billing unless you intend to use it. No subscription is created by this implementation.

The server calls Google's REST generateContent endpoint over HTTPS. No browser receives the API key. Conversation history is bounded to ten messages per request. Chat content stays in browser memory, with no browser-storage copy. Course selection clears the conversation. The AI request sends the learner's question/history and up to three selected course extracts to Google; no grades, private teacher answers, exam keys, passwords or service credentials are included by the evidence collector.

Course requests verify enrollment/staff access before collecting material and again before returning the answer. Lessons use the existing RLS-scoped evidence collector; links are returned only for provided sources cited in the answer. Scanned pages without extracted text and recordings without transcripts are not automatically understood. Published lesson text, linked video guidance and indexed course notes are available; original book OCR remains lesson-scoped in the existing tutor.

The tutor and speaking practice also use Gemini when its key is configured. Their existing course-focused teaching prompts remain in place. The floating chatbot is the general-purpose mode. Without the key, authored website guidance remains available, and other requests show a setup message rather than claiming to produce AI answers. Tests use mocked Google responses; live generation needs a valid key.
