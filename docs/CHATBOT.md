# Spolk chat assistant

Signed-in users have an Ask Spolk panel on every page. Its course selector contains active enrollments, assigned teaching courses, or courses visible to an administrator. Course requests use `/api/tutor`, retaining server-side enrollment, lesson-access and quota checks. Selecting a different scope clears the conversation. Messages remain in memory, with no browser-storage copy or cross-account persistence.

Website help covers navigation, enrollment, homework, messages, profile settings, notifications, streaks and speaking practice. These replies use authored guidance without an AI service. Unknown questions are not answered with invented website/account facts.

Open-ended English responses use the existing Ollama integration. Set `OLLAMA_BASE_URL` to an AI server reachable by Render, and `OLLAMA_MODEL` to a model installed there. A local `localhost:11434` address on a development PC is not reachable from Render. No AI service is provisioned or paid subscription created by this feature. If the AI connection is absent or fails, the widget explains the limitation and links to teacher support. Course guidance can still show available course extracts when model generation is unavailable.

The general chat endpoint accepts signed-in, same-origin requests only. Open-ended requests use the existing AI quota; website guidance does not consume it. General chat receives only the conversation supplied by the current browser, never private database records or course documents. Live general AI responses cannot be verified until a hosted AI connection is configured.
