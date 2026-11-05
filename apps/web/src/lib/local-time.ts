export function formatWhen(iso: string, timeZone = "UTC") {
 const date = new Date(iso);
 if (Number.isNaN(date.getTime())) return iso;
 return new Intl.DateTimeFormat("en-GB", {
  weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone, timeZoneName: "short",
 }).format(date);
}

/** Interpret a datetime-local value in the learner's zone and return a UTC ISO string. */
export function localInputToUtc(value: string, timeZone: string) {
 if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) return new Date(value).toISOString();
 const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
 if (!match) return value;
 const wanted = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
 let guess = wanted;
 for (let i = 0; i < 3; i++) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess));
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value);
  const shown = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"));
  guess += wanted - shown;
 }
 return new Date(guess).toISOString();
}
