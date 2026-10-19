import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {TravellerVideo} from "../src/components/traveller-video";
import {it,expect} from "vitest";
import book from "../src/content/traveller.json";
import {travellerVideos,travellerVideo,youtubeEmbed,youtubeWatch} from "../src/lib/traveller-videos";
import {youtubeClipEmbed} from "../src/lib/traveller-video-clips";
it("covers every study lesson with an official BBC English-language companion",()=>{
 const study=book.lessons.filter(l=>l.kind==="study");expect(travellerVideos.videos).toHaveLength(study.length);expect(new Set(travellerVideos.videos.map(v=>v.lessonId)).size).toBe(study.length);
 for(const l of study){const v=travellerVideo(l.id)!;expect(v).toBeDefined();expect(v.week).toBe(l.week);expect(v.language).toBe("en");expect(v.channelId).toBe("UCHaHD477h-FeBbVh9Sh7syA");expect(v.channel).toBe("BBC Learning English");expect(v.start).toBe(0);expect(v.end).toBe(v.seconds);expect(v.end).toBeGreaterThan(0);expect(v.goal.length).toBeGreaterThan(10);expect(v.practice.length).toBeGreaterThan(20);}
});
it("removes the Spanish series and its old page timings",()=>{expect(JSON.stringify(travellerVideos)).not.toMatch(/hWKEZzTjUO4|Tony Teacher|PL9YhLAy/);expect(travellerVideo("6fa57655-eafe-5185-90dc-1802044a57d2")?.videoId).toBe("I_tRSrPru94");expect(travellerVideo("6fa57655-eafe-5185-90dc-1802044a57d2")?.end).toBe(157);});
it("does not enable a playlist or invent a book walkthrough",()=>{const u=new URL(youtubeEmbed("I_tRSrPru94"));expect(u.searchParams.get("autoplay")).toBe("0");expect(u.searchParams.has("list")).toBe(false);expect(u.searchParams.get("cc_lang_pref")).toBe("en");expect(()=>youtubeEmbed("https://evil.test")).toThrow();expect(youtubeWatch()).toContain("I_tRSrPru94");expect(travellerVideo(book.lessons[0].id)).toBeUndefined();});
it("mounts the section player immediately and explains how it fits the original lesson",()=>{const html=renderToStaticMarkup(createElement(TravellerVideo,{lessonId:"6fa57655-eafe-5185-90dc-1802044a57d2"}));expect(html).not.toContain("Load English video");expect(html).toContain("video-clip-host");expect(html).toContain("Play section");expect(html).toContain("While you watch");expect(html).toContain("Try it yourself");expect(html).toContain("supplementary listening");});
it("validates bounded video playback parameters",()=>{const u=new URL(youtubeClipEmbed("I_tRSrPru94",20,80));expect(u.searchParams.get("start")).toBe("20");expect(u.searchParams.get("end")).toBe("80");expect(u.searchParams.has("list")).toBe(false);expect(()=>youtubeClipEmbed("I_tRSrPru94",80,20)).toThrow();});
