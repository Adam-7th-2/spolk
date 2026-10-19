import {it,expect} from "vitest";
import {courses,filterCourses,schools} from "../src/lib/catalogue";
it("defines ten independently named schools",()=>expect(schools).toHaveLength(10));
it("filters by text, school, and level together",()=>expect(filterCourses(courses,"everyday","General English","A2")).toHaveLength(1));
it("returns no misleading results",()=>expect(filterCourses(courses,"xyz","","C2")).toEqual([]));
it("has unique course identifiers",()=>expect(new Set(courses.map(c=>c.id)).size).toBe(courses.length));
