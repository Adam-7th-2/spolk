import {it,expect} from "vitest";
import {workspaceHome} from "../src/lib/workspaces";
it("routes administrators with student roles to academy administration",()=>expect(workspaceHome(["student","admin"])).toBe("/admin"));
it("routes super administrators to administration",()=>expect(workspaceHome(["super_admin"])).toBe("/admin"));
it("routes teachers and guardians to their workspaces",()=>{expect(workspaceHome(["student","teacher"])).toBe("/teacher");expect(workspaceHome(["guardian"])).toBe("/guardian");});
it("keeps students and unknown roles in the learning area",()=>{expect(workspaceHome(["student"])).toBe("/dashboard");expect(workspaceHome([])).toBe("/dashboard");expect(workspaceHome(["invented"])).toBe("/dashboard");});
