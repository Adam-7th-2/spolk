import {expect,it} from "vitest";
import {practiceEvidence} from "../src/lib/practice-evidence";
import type {Evidence} from "../src/lib/rag";
const evidence:Evidence[]=[{id:"intro",documentId:"a",title:"Introductions",courseId:"course",lessonId:"open",content:"Say your name. Introduce yourself with a greeting."},{id:"other",documentId:"b",title:"Other course",courseId:"private",lessonId:"other",content:"Private course material"}];
it("grounds greetings in authorized course content",()=>expect(practiceEvidence("hello","course",evidence).map(e=>e.id)).toEqual(["intro"]));
it("grounds generic lesson practice without requiring keyword overlap",()=>expect(practiceEvidence("help me practice this lesson","course",evidence,"open")[0].id).toBe("intro"));
it("never substitutes another course for missing context",()=>expect(practiceEvidence("hello","missing",evidence)).toEqual([]));
it("never falls back to another lesson when a selected lesson is unavailable",()=>expect(practiceEvidence("hello","course",evidence,"locked")).toEqual([]));
it("does not fabricate evidence for unrelated factual questions",()=>expect(practiceEvidence("quantum physics","course",evidence)).toEqual([]));
