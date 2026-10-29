"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Recognition = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: { results: { transcript: string }[][] }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; onstart: (() => void) | null; start: () => void; stop: () => void };
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
export type SpeakingCourse = { id: string; title: string; lessons?: { id: string; title: string }[] };
type Source = { id: string; title: string; url: string };

export function useSpeakingSession(courses: SpeakingCourse[]) {
 const router = useRouter();
 const [savedTurns, setSavedTurns] = useState(0);
 const [saving, setSaving] = useState(false);
 const [generated, setGenerated] = useState<boolean | null>(null);
 const [text, setText] = useState("");
 const [reply, setReply] = useState("Hello! I’m your AI course coach. Choose a course and lesson, then tell me what you would like to practise.");
 const [courseId, setCourseId] = useState(courses[0]?.id || "");
 const [lessonId, setLessonId] = useState("");
 const [excerpts, setExcerpts] = useState<{ id: string; content: string; title: string }[]>([]);
 const [sources, setSources] = useState<Source[]>([]);
 const [busy, setBusy] = useState(false);
 const [speaking, setSpeaking] = useState(false);
 const [listening, setListening] = useState(false);
 const [consent, setConsent] = useState(false);
 const [live, setLive] = useState(false);
 const [low, setLow] = useState(false);
 const [voice, setVoice] = useState(true);
 const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
 const [voiceURI, setVoiceURI] = useState("");
 const [speed, setSpeed] = useState(0.9);
 const [status, setStatus] = useState(() => typeof window !== "undefined" && !("SpeechRecognition" in window || "webkitSpeechRecognition" in window) ? "Live microphone practice requires Chrome or Edge. You can still type questions here." : "");
 const [turns, setTurns] = useState<string[]>([]);
 const liveRef = useRef(false);
 const recognition = useRef<Recognition | null>(null);
 const contextVersion = useRef(0);
 const turnsRef = useRef<string[]>([]);
 const savedRef = useRef(0);
 const saveQueued = useRef(false);
 const queueSaveRef = useRef<() => boolean>(() => false);
 const persistRef = useRef<() => Promise<void>>(async () => {});
 const course = courses.find(item => item.id === courseId);

 useEffect(() => { liveRef.current = live; }, [live]);
 useEffect(() => { turnsRef.current = turns; }, [turns]);
 useEffect(() => { savedRef.current = savedTurns; }, [savedTurns]);
 useEffect(() => {
  const leave = () => { if (!queueSaveRef.current()) void persistRef.current(); };
  window.addEventListener("pagehide", leave);
  return () => { window.removeEventListener("pagehide", leave); liveRef.current = false; contextVersion.current += 1; recognition.current?.stop(); window.speechSynthesis?.cancel(); if (!queueSaveRef.current()) void persistRef.current(); };
 }, []);
 useEffect(() => {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const load = () => setVoices(synth.getVoices().filter(item => /^en\b/i.test(item.lang)));
  load();
  synth.addEventListener("voiceschanged", load);
  return () => { recognition.current?.stop(); synth.cancel(); synth.removeEventListener("voiceschanged", load); };
 }, []);

 function stop() { window.speechSynthesis?.cancel(); setSpeaking(false); }
 function read(answer: string) {
  if (!window.speechSynthesis) { setStatus("Speech playback is unavailable in this browser."); return; }
  stop();
  const utterance = new SpeechSynthesisUtterance(answer.replace(/\[[^\]]+\]/g, ""));
  const preferred = voices.find(item => item.voiceURI === voiceURI) || voices.find(item => /natural|online|premium|google/i.test(item.name)) || voices[0];
  if (preferred) utterance.voice = preferred;
  utterance.lang = preferred?.lang || "en-US";
  utterance.rate = speed;
  utterance.onstart = () => setSpeaking(true);
  utterance.onend = () => { setSpeaking(false); if (liveRef.current && consent) setTimeout(() => { if (liveRef.current) void listen(); }, 250); };
  utterance.onerror = () => { setSpeaking(false); setStatus("Voice playback stopped. Choose another English voice or retry."); };
  window.speechSynthesis.speak(utterance);
 }
 function reset() {
  liveRef.current = false; setLive(false); setSavedTurns(0); savedRef.current = 0; saveQueued.current = false; setGenerated(null); contextVersion.current += 1; stop(); recognition.current?.stop(); setListening(false); setSources([]); setExcerpts([]); setTurns([]); turnsRef.current = []; setText(""); setReply("Tell me what you would like to practise from this course."); setStatus("");
 }
 async function submitQuestion(question: string) {
  if (busy || question.trim().length < 3) return;
  recognition.current?.stop(); setListening(false); stop(); setBusy(true); setStatus("");
  const version = contextVersion.current;
  try {
   const response = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, lessonId: lessonId || undefined, question, language: "en" }), signal: AbortSignal.timeout(45000) });
   const data = await response.json();
   if (version !== contextVersion.current) return;
   if (!response.ok) throw new Error(data.error);
   setGenerated(data.generated === true); setReply(data.answer); setExcerpts(data.excerpts || []); setSources(data.sources || []);
   setTurns(current => { const next = [...current, `You: ${question}`, `Coach: ${data.answer}`].slice(-20); turnsRef.current = next; return next; });
   setText("");
   if (voice) read(data.answer);
  } catch (error) {
   if (version === contextVersion.current) { setStatus(error instanceof Error ? error.message : "Practice service is unavailable."); setLive(false); }
  } finally { setBusy(false); }
 }
 async function listen(force = false) {
  const Speech = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
  if ((!consent && !force) || !Speech) { setStatus("Speech recognition is unavailable here. You can type your answer instead."); return; }
  if (!window.isSecureContext) { setStatus("Microphone access requires Chrome or Edge on http://localhost:3000 or HTTPS."); return; }
  if (!navigator.mediaDevices?.getUserMedia) { setStatus("This browser does not provide microphone permission. Use Chrome or Edge."); return; }
  setStatus("Requesting microphone…");
  try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach(track => track.stop()); }
  catch (error) {
   const name = error instanceof DOMException ? error.name : "";
   setStatus(name === "NotAllowedError" ? "Microphone access was blocked. Use the lock icon beside the address, allow Microphone, then reload the page." : "Microphone could not start. Check that a microphone is connected.");
   setListening(false); setLive(false); return;
  }
  stop(); recognition.current?.stop();
  const session = new Speech();
  session.lang = "en-US"; session.continuous = false; session.interimResults = false;
  session.onresult = event => { const transcript = event.results[0][0].transcript; setText(transcript); if (liveRef.current) void submitQuestion(transcript); };
  session.onerror = () => { setStatus("Speech recognition stopped. Check microphone permission and try again."); setListening(false); setLive(false); };
  session.onend = () => setListening(false);
  recognition.current = session;
  session.onstart = () => { setStatus("Listening… speak now."); setListening(true); };
  try { session.start(); setListening(true); } catch { setStatus("Microphone could not start. Check browser permission."); setLive(false); }
 }
 function startPractice() {
  if (live) { liveRef.current = false; setLive(false); stop(); recognition.current?.stop(); setListening(false); return; }
  if (!consent) { setStatus("Allow browser speech recognition below before starting practice."); return; }
  liveRef.current = true; setLive(true); void listen();
 }
 function transcriptBody() {
  const current = turnsRef.current;
  if (!current.length || savedRef.current === current.length) return null;
  return JSON.stringify({ transcript: current.join("\n").slice(0, 20000), mode: "course-practice" });
 }
 function queueSave() {
  const body = transcriptBody();
  if (!body || saveQueued.current) return true;
  if (typeof navigator.sendBeacon !== "function") return false;
  const sent = navigator.sendBeacon("/api/speaking", new Blob([body], { type: "text/plain" }));
  if (!sent) return false;
  saveQueued.current = true;
  savedRef.current = turnsRef.current.length;
  return true;
 }
 async function persist() {
  const body = transcriptBody();
  if (!body) { setSavedTurns(savedRef.current); return; }
  if (saveQueued.current) return;
  saveQueued.current = true;
  try {
   const response = await fetch("/api/speaking", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
   if (!response.ok) throw new Error("Practice could not be saved.");
   savedRef.current = turnsRef.current.length;
   setSavedTurns(savedRef.current);
  } catch (error) {
   saveQueued.current = false;
   throw error;
  }
 }
 async function finish() {
  if (saving || busy || !turns.length || savedTurns === turns.length) return;
  liveRef.current = false; setLive(false); setSaving(true); recognition.current?.stop(); stop(); setListening(false);
  try { await persist(); router.refresh(); setStatus(`Practice saved: ${Math.floor(turns.length / 2)} conversation turns. Ask your teacher for feedback.`); }
  catch { setStatus("Practice could not be saved. Your transcript is still visible below."); }
  finally { setSaving(false); }
 }
 queueSaveRef.current = queueSave;
 persistRef.current = persist;
 return { course, courseId, setCourseId, lessonId, setLessonId, text, setText, reply, excerpts, sources, busy, speaking, listening, consent, setConsent, live, low, setLow, voice, setVoice, voices, voiceURI, setVoiceURI, speed, setSpeed, status, turns, savedTurns, saving, generated, stop, read, reset, submitQuestion, startPractice, finish };
}
