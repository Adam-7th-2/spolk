"use client";

import dynamic from "next/dynamic";
import { useSpeakingSession, type SpeakingCourse } from "./use-speaking-session";

const Avatar = dynamic(() => import("./avatar"), { ssr: false, loading: () => <div className="static-avatar">✳</div> });

export function Speaking({ courses }: { courses: SpeakingCourse[] }) {
 const session = useSpeakingSession(courses);
 return <div className="speaking-grid">
  <div className="avatar-stage">
   {session.low ? <div className="static-avatar">✳</div> : <Avatar speaking={session.speaking} />}
   <div className="practice-session-note"><strong>Small steps. More confidence.</strong><p>Try one clear sentence at a time. Your microphone starts only when you allow it.</p></div>
   <span className="avatar-badge">AI COURSE COACH · SYNTHESIZED VOICE</span>
   <p aria-live="polite">{session.listening ? "Listening…" : session.busy ? "Finding your course evidence…" : session.speaking ? "Speaking…" : "Your space to practice"}</p>
   <button className="text-link" onClick={() => session.setLow(!session.low)}>{session.low ? "Enable animated coach" : "Use simple display"}</button>
  </div>
  <div className="form-card">
   <div className="eyebrow">PRACTICE STUDIO</div>
   <h2>Let’s talk in English.</h2>
   <p className="fine">Choose a lesson, then press Start practice. The coach listens, answers, and speaks back.</p>
   <div className="practice-prompts" aria-label="Practice starters">{["Help me introduce myself in this lesson.", "Ask me one short question about this lesson.", "Help me practise a real-life conversation from this lesson."].map((prompt, index) => <button key={prompt} type="button" disabled={session.busy || session.live} onClick={() => session.setText(prompt)}><strong>{["Introduce yourself", "Answer a question", "Try a role-play"][index]}</strong><span>{prompt}</span></button>)}</div>
   {session.generated !== null && <p className="practice-mode">{session.generated ? "AI-assisted response — check the course sources below" : "Guided course practice — use the extract and lesson resources below"}</p>}
   <p aria-live="polite">{session.reply}</p>
   {session.excerpts.map(excerpt => <blockquote key={excerpt.id}>{excerpt.content}<cite> — {excerpt.title}</cite></blockquote>)}
   {session.sources.length > 0 && <nav aria-label="Course evidence">{session.sources.map(source => <p key={source.id}><a href={source.url}>{source.title} → Open lesson resources</a></p>)}</nav>}
   <form onSubmit={event => { event.preventDefault(); void session.submitQuestion(session.text); }}>
    <label>Practice course<select value={session.courseId} onChange={event => { session.reset(); session.setCourseId(event.target.value); session.setLessonId(""); }} required>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
    <label>Lesson<select value={session.lessonId} onChange={event => { session.reset(); session.setLessonId(event.target.value); }}><option value="">All available lessons</option>{session.course?.lessons?.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label>
    <details className="practice-settings">
     <summary>Voice settings</summary>
     <label>English voice<select value={session.voiceURI} onChange={event => { session.stop(); session.setVoiceURI(event.target.value); }}><option value="">Recommended English voice</option>{session.voices.map(item => <option key={item.voiceURI} value={item.voiceURI}>{item.name} ({item.lang})</option>)}</select></label>
     <label>Voice speed<select value={session.speed} onChange={event => session.setSpeed(Number(event.target.value))}><option value="0.7">Slower</option><option value="0.9">Natural</option><option value="1.1">Faster</option></select></label>
     <label className="device-option"><input type="checkbox" checked={session.voice} onChange={event => { session.setVoice(event.target.checked); if (!event.target.checked) session.stop(); }} />Read replies aloud</label>
     <button className="text-link" type="button" onClick={() => session.speaking ? session.stop() : session.read(session.reply)}>{session.speaking ? "Stop voice" : "Listen to reply"}</button>
    </details>
    <label className="device-option"><input type="checkbox" checked={session.consent} onChange={event => { session.setConsent(event.target.checked); if (!event.target.checked && session.live) session.startPractice(); }} />Allow browser speech recognition (your browser vendor may process audio).</label>
    <button className="button" type="button" disabled={session.busy || session.saving} onClick={session.startPractice}>{session.live ? "Stop practice" : "Start practice"}</button>
    <label>Your turn<textarea value={session.text} onChange={event => session.setText(event.target.value)} placeholder="Help me practice this lesson" minLength={3} maxLength={1000} required={!session.live} /></label>
    <button className="button secondary" disabled={session.busy || session.saving || !courses.length || session.live || session.text.trim().length < 3}>{session.busy ? "One moment…" : "Send a typed turn"}</button>
   </form>
   <p className="fine">Voice quality depends on the English voices installed in your browser or operating system. Practice is saved when you leave this page. Finish confirms that save.</p>
   {session.turns.length > 0 && <button className="button secondary" disabled={session.saving || session.busy || session.savedTurns === session.turns.length} onClick={() => void session.finish()}>{session.saving ? "Saving practice…" : session.savedTurns === session.turns.length ? "Practice saved" : "Finish and save practice"}</button>}
   {session.status && <p className="status" role="status">{session.status}</p>}
   <details className="practice-transcript"><summary>Your conversation transcript · {Math.floor(session.turns.length / 2)} turns</summary>{session.turns.map((turn, index) => <p key={index}>{turn}</p>)}</details>
  </div>
 </div>;
}
