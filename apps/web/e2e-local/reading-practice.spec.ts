import {test,expect,type Page} from "@playwright/test";
import {randomUUID} from "node:crypto";
const password="SpolkLocal2026!";
async function login(page:Page,email="student@spolk.local"){
 await page.goto("/login");await page.getByLabel("Email address").fill(email);await page.getByLabel("Password",{exact:true}).fill(password);await page.locator("form button").click();await page.waitForURL(/\/(dashboard|admin|teacher)$/);
}
test("reading cards show the original page and only that page's audio markers",async({page},info)=>{
 await login(page,"teacher@spolk.local");await page.route("https://www.youtube.com/iframe_api",route=>route.abort());
 await page.goto("/learn/ce5a087c-79c3-5f30-a968-592d46c77bab");
 await page.getByRole("tab",{name:/Read & learn/}).click();
 const reading=page.locator(".reading-card");
 await expect(reading.getByText("Original book · PDF page 6",{exact:true})).toBeVisible();
 const audio=reading.getByRole("region",{name:"Audio for this page"});
 await expect(audio.getByText("Audio card 1 of 2",{exact:true})).toBeVisible();
 const first=await audio.locator("audio").getAttribute("src");
 const response=await page.request.get(first!);expect(response.status()).toBe(200);expect(response.headers()["content-type"]).toBe("audio/mpeg");
 await audio.getByRole("button",{name:"Next audio",exact:true}).click();
 await expect(audio.getByText("PDF page 6 · Listening marker 2",{exact:true})).toBeVisible();
 expect(await audio.locator("audio").getAttribute("src")).not.toBe(first);
 await audio.screenshot({path:info.outputPath("audio-card.png")});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("practice cards save checked answers, resume progress and explain the final grade",async({page,browser},info)=>{
 const email=`practice-${randomUUID()}@example.invalid`;
 await page.goto("/login");await page.getByRole("tab",{name:"Create account"}).click();
 await page.getByLabel("Email address").fill(email);await page.getByLabel("Password (at least 12 characters)",{exact:true}).fill(password);await page.getByRole("button",{name:/Create your account/}).click();await expect(page.getByRole("status")).toContainText("Your local account is ready");
 const admin=await browser.newContext({baseURL:"http://127.0.0.1:3001"});
 try{
  const staff=await admin.newPage();await login(staff,"admin@spolk.local");await staff.goto("/admin/courses/traveller");
  await staff.getByLabel("Student email").fill(email);await staff.getByRole("button",{name:"Enroll student in Traveller",exact:true}).click();
  await expect(staff.locator(".status").filter({hasText:/enrolled|ready|installed/i}).first()).toBeVisible();
 }finally{await admin.close();}
 await page.getByRole("tab",{name:"Log in",exact:true}).click();await page.getByLabel("Email address").fill(email);await page.getByLabel("Password",{exact:true}).fill(password);await page.locator("form button").click();await page.waitForURL("**/dashboard");
 await page.route("https://www.youtube.com/iframe_api",route=>route.abort());await page.goto("/learn/c2c67850-7d04-5fad-8ff7-f6fede1c4765");await page.getByRole("tab",{name:/Finish lesson/}).click();await page.getByRole("button",{name:"Mark lesson complete",exact:true}).click();await expect(page.getByText("Your completion is saved.",{exact:true})).toBeVisible();await page.goto("/learn/8e963e27-4b9a-5fb0-a6b2-7332e2cec1bc");
 await page.getByRole("tab",{name:/Practice quiz/}).click();
 const quiz=page.locator(".assessment-quiz");
 await quiz.getByRole("button",{name:"Start practice quiz",exact:true}).click();
 await expect(quiz.getByRole("timer")).toBeVisible();
 await quiz.getByRole("button",{name:"Show hint",exact:true}).click();await expect(quiz.locator(".video-quiz-hint")).toContainText("speaker");
 await quiz.getByRole("radio",{name:"A computer.",exact:true}).check();await quiz.getByRole("button",{name:"Check answer",exact:true}).click();
 await expect(quiz.getByRole("status")).toContainText("Choose language for the situation");await expect(quiz.getByRole("status")).toContainText("Another example");await expect(quiz.getByRole("status")).toContainText("Watch out for this");await expect(quiz.getByRole("radio").first()).toBeDisabled();
 await quiz.locator(".video-quiz-feedback").screenshot({path:info.outputPath("detailed-feedback.png")});
 await page.reload();await page.getByRole("tab",{name:/Practice quiz/}).click();await quiz.getByRole("button",{name:"Start practice quiz",exact:true}).click();
 await expect(quiz.getByText("Question 2 of 3",{exact:true})).toBeVisible();
 await quiz.getByRole("radio",{name:"name",exact:true}).check();await quiz.getByRole("button",{name:"Check answer",exact:true}).click();await expect(quiz.getByRole("status")).toContainText("A small win");
 await quiz.getByRole("button",{name:"Next question",exact:true}).click();await quiz.getByRole("radio",{name:"How do you spell your name?",exact:true}).check();await quiz.getByRole("button",{name:"Check answer",exact:true}).click();await quiz.getByRole("button",{name:"Finish and save result",exact:true}).click();
 await expect(quiz.getByText("Saved assessment score",{exact:true})).toBeVisible();await expect(quiz.locator(".video-quiz-result-score")).toContainText("66.67");await expect(quiz.getByText("1 missed",{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
