import {test,expect,type Page} from "@playwright/test";
import manifest from "../src/content/traveller.json" with {type:"json"};

async function login(page:Page,role:string,path:string){
 await page.goto("/login");
 await expect(page.getByText("Offline learning workspace")).toBeVisible();
 await page.getByLabel("Email address").fill(`${role}@spolk.local`);
 await page.getByLabel("Password",{exact:true}).fill("SpolkLocal2026!");
 await page.locator("form button").click();
 await page.waitForURL(`**/${path}`);
}

test("admin has the exact book course and source preview",async({page})=>{
 await login(page,"admin","admin");
 await page.goto("/admin/courses/traveller");
 await expect(page.getByRole("heading",{name:"Traveller Beginners",exact:true})).toBeVisible();
 await expect(page.getByRole("heading",{name:"Course installed"})).toBeVisible();
 await expect(page.getByText("71 lessons",{exact:true})).toBeVisible();
 await expect(page.getByText("126 original pages",{exact:true})).toBeVisible();
 await expect(page.getByLabel("Student email")).toHaveValue("student@spolk.local");
 expect((await page.request.get("/api/traveller/preview/1")).status()).toBe(200);
 const response=await page.request.get("/api/traveller-exam-assets/module-1/audio",{headers:{range:"bytes=0-127"}});
 expect(response.status()).toBe(206);
 expect(response.headers()["content-type"]).toBe("audio/mpeg");
});

test("student has local courses and pages without access to answer keys",async({page})=>{
 await login(page,"student","dashboard");
 await expect(page.getByRole("heading",{name:/^Traveller Beginners/})).toBeVisible();
 await expect(page.getByRole("heading",{name:"English for everyday life",exact:true})).toBeVisible();
 const lesson=manifest.lessons.find(item=>item.pages.includes(1))!;
 expect((await page.request.get(`/api/book-pages/${lesson.id}/1`)).status()).toBe(200);
 expect((await page.request.get("/api/traveller-exam-assets/module-1/key")).status()).toBe(403);
 await page.goto("/admin");
 await expect(page).toHaveURL(/\/dashboard$/);
});

test("teacher can open teaching workspace and the original test paper",async({page})=>{
 await login(page,"teacher","teacher");
 await expect(page.getByRole("heading",{name:"Help the next chapter happen."})).toBeVisible();
 expect((await page.request.get("/api/traveller-exam-assets/module-1/paper")).status()).toBe(200);
 await page.getByRole("button",{name:"Log out",exact:true}).click();
 await page.waitForURL("**/");
 expect((await page.request.get("/api/traveller-exam-assets/module-1/paper")).status()).toBe(401);
});
