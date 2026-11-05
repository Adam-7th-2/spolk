import { expect, it } from "vitest";
import { formatWhen, localInputToUtc } from "../src/lib/local-time";

it("shows a weekday and clock time in the saved zone", () => {
 const label = formatWhen("2026-10-20T06:00:00.000Z", "Africa/Addis_Ababa");
 expect(label).toContain("Tue");
 expect(label).toContain("09:00");
});

it("stores a local lesson time as UTC", () => {
 expect(localInputToUtc("2026-10-20T09:00", "Africa/Addis_Ababa")).toBe("2026-10-20T06:00:00.000Z");
 expect(localInputToUtc("2026-10-20T09:00:00Z", "Africa/Addis_Ababa")).toBe("2026-10-20T09:00:00.000Z");
});
