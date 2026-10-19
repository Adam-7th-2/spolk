import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {it,expect} from "vitest";
import {ExamResources} from "../src/components/exam-resources";
it("shows the matching listening track and paper without student answer links",()=>{const html=renderToStaticMarkup(createElement(ExamResources,{examId:"module-2"}));expect(html).toContain("03 Beg_test2_m2.mp3");expect(html).toContain("/module-2/audio");expect(html).toContain("/module-2/paper");expect(html).toContain("/module-2/paper-text");expect(html).not.toContain("/key");expect(html).not.toContain("/document");expect(html).not.toContain("<h3>Teacher answers");});
it("offers exact per-test documents and keys to staff without eagerly loading answer images",()=>{const html=renderToStaticMarkup(createElement(ExamResources,{examId:"module-7",staff:true}));expect(html).toContain("/module-7/document");expect(html).toContain("/module-7/key");expect(html).toContain("/module-7/key-text");expect(html).toContain("6, 7");expect(html).toContain("Show this test");expect(html).not.toContain("<img");});

import {ExamListening} from "../src/components/exam-listening";
import {ExamAnswerUpload} from "../src/components/exam-answer-upload";
import {ExamFeedback} from "../src/components/exam-feedback";
it("offers question-level players without transcript or answer text",()=>{const html=renderToStaticMarkup(createElement(ExamListening,{examId:"module-2"}));expect(html.match(/<audio/g)).toHaveLength(3);expect(html).toContain("/listen-1");expect(html).toContain("/listen-2");expect(html).toContain("/listen-3");expect(html).not.toContain("Linda");expect(html).not.toContain("key-text");});
it("asks for an uploaded answer file and a blank template without supplying correct answers",()=>{const html=renderToStaticMarkup(createElement(ExamAnswerUpload,{examId:"module-1",disabled:false,onImported:()=>{},onBusy:()=>{}}));expect(html).toContain('type="file"');expect(html).toContain("template=1");expect(html).not.toContain("Sawyer");expect(html).not.toContain("key-text");});
it("does not render feedback answers until the authorized report is requested",()=>{const html=renderToStaticMarkup(createElement(ExamFeedback,{examId:"module-1"}));expect(html).toContain("View submission and feedback");expect(html).not.toContain("Published reference");expect(html).not.toContain("Sawyer");});
