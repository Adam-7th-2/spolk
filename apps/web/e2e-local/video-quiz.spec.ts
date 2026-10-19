import {test,expect,type Page} from "@playwright/test";
import {videoPractice} from "../src/content/video-practice";

const id="31y2Bq1RYQA",questions=videoPractice[id];
async function openQuiz(page:Page){
 // Keep external video availability separate from the practice-card interaction test.
 await page.route("https://www.youtube.com/iframe_api",route=>route.abort());
 await page.goto("/login");
 await page.getByLabel("Email address").fill("teacher@spolk.local");
 await page.getByLabel("Password",{exact:true}).fill("SpolkLocal2026!");
 await page.locator("form button").click();await page.waitForURL("**/teacher");
 await page.goto("/learn/2f73b18e-07d3-556a-80c2-a5d899c66e09");
 await expect(page.getByRole("button",{name:"Start quiz",exact:true})).toBeVisible();
}
test("five cards show hints, explain mistakes, celebrate correct answers and show results",async({page},info)=>{
 await openQuiz(page);
 await expect(page.getByRole("timer")).toHaveCount(0);
 await page.clock.install();
 await page.getByRole("button",{name:"Start quiz",exact:true}).click();
 await expect(page.getByRole("timer")).toHaveText("4:00");
 await page.clock.fastForward(1000);await expect(page.getByRole("timer")).toHaveText("3:59");
 await page.getByRole("button",{name:"Show hint",exact:true}).click();
 await expect(page.getByText(questions[0].hint,{exact:false})).toBeVisible();
 await page.getByRole("radio",{name:questions[0].distractors[0],exact:true}).check();
 await page.getByRole("button",{name:"Check answer",exact:true}).click();
 await expect(page.getByRole("status")).toContainText(questions[0].explanation);
 await expect(page.getByRole("status")).toContainText("A useful mistake");
 await page.locator(".video-quiz-card").screenshot({path:info.outputPath("question-feedback.png")});
 for(let index=1;index<5;index++){
  await page.getByRole("button",{name:"Next question",exact:true}).click();
  await expect(page.locator(".video-quiz-card h4")).toHaveText(questions[index].prompt);
  await page.getByRole("radio",{name:questions[index].correct,exact:true}).check();
  await page.getByRole("button",{name:"Check answer",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("One more small win");
  await expect(page.getByRole("status")).toContainText(questions[index].explanation);
 }
 await page.getByRole("button",{name:"See my result",exact:true}).click();
 await expect(page.getByText("80% correct",{exact:true})).toBeVisible();
 await expect(page.getByText("1 missed",{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.locator(".video-quiz-result").screenshot({path:info.outputPath("quiz-result.png")});
 await page.getByRole("button",{name:"Try again",exact:true}).click();
 await expect(page.getByRole("timer")).toHaveText("4:00");
 await expect(page.locator(".video-quiz-card h4")).toHaveText(questions[0].prompt);
 await expect(page.getByRole("button",{name:"Check answer",exact:true})).toBeDisabled();
});

test("expiry stops the countdown, marks unanswered questions missed and permits a fresh attempt",async({page})=>{
 await openQuiz(page);await page.clock.install();
 await page.getByRole("button",{name:"Start quiz",exact:true}).click();
 await page.clock.fastForward(241000);
 await expect(page.getByRole("timer")).toHaveText("0:00");
 await expect(page.getByText(/Time's up/)).toBeVisible();
 await expect(page.getByText("5 missed",{exact:true})).toBeVisible();
 await expect(page.getByText("0% correct",{exact:true})).toBeVisible();
 await expect(page.getByRole("radio")).toHaveCount(0);
 await page.getByRole("button",{name:"Try again",exact:true}).click();
 await expect(page.getByRole("timer")).toHaveText("4:00");
});
