import {it,expect} from "vitest";
import {insideJoinWindow,LiveKitProvider} from "../src/lib/video";
it("opens a room fifteen minutes before class",()=>expect(insideJoinWindow("2026-10-18T10:00:00Z","2026-10-18T11:00:00Z",Date.parse("2026-10-18T09:45:00Z"))).toBe(true));
it("denies joining after class ends",()=>expect(insideJoinWindow("2026-10-18T10:00:00Z","2026-10-18T11:00:00Z",Date.parse("2026-10-18T11:00:00Z"))).toBe(false));
it("fails explicitly when video credentials are missing",async()=>{await expect(new LiveKitProvider().issueToken("opaque-user","opaque-session",false)).rejects.toThrow("not configured");});
