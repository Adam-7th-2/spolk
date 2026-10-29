import {test,expect} from "@playwright/test";
test("discover a course and begin an application",async({page})=>{await page.goto("/");await expect(page.getByRole("heading",{name:/Your world/})).toBeVisible();await page.getByRole("link",{name:"Find your starting point"}).click();await page.getByRole("searchbox").count();await page.getByLabel("Search courses").fill("everyday");await expect(page.getByRole("heading",{name:"English for everyday life"})).toBeVisible();await expect(page.getByText("Not open yet").first()).toBeVisible();await page.getByLabel("Search courses").fill("traveller");await page.getByRole("link",{name:/Traveller Beginners/}).click();await page.getByRole("link",{name:"Apply for this course"}).click();await expect(page.getByLabel("Your program")).toHaveValue("traveller-beginners");await expect(page.getByRole("button",{name:"Send my application"})).toBeDisabled();});
test("private learning requires real authentication",async({page})=>{await page.goto("/dashboard");await expect(page).toHaveURL(/login/);await expect(page.getByRole("heading",{name:"Hello again."})).toBeVisible();});
test("mobile navigation works and public pages fit phone, tablet and desktop widths",async({page})=>{
 for(const width of [320,375,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  for(const path of ["/","/courses","/about","/apply","/contact","/privacy","/login"]){
   await page.goto(path);
   const pageWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
   expect(pageWidth,`${path} overflows at ${width}px`).toBeLessThanOrEqual(width);
  }
 }
 await page.setViewportSize({width:375,height:812});
 await page.goto("/");
 await page.getByRole("button",{name:"Open navigation menu"}).click();
 const menu=page.getByRole("navigation",{name:"Mobile navigation"});
 await expect(menu).toBeVisible();
 await menu.getByRole("link",{name:"Our programs"}).click();
 await expect(page).toHaveURL(/\/courses$/);
 await page.goto("/");
 await page.locator("summary").filter({hasText:"Where should I start?"}).click();
 await expect(page.getByText(/Placement and enrollment are confirmed/)).toBeVisible();
});

test("book assets and course administration require authentication",async({page,request})=>{
 await page.goto("/admin/courses/traveller");await expect(page).toHaveURL(/login/);
 const lesson="d1000000-0000-4000-8000-000000000002";
 for(const url of [`/api/book-pages/${lesson}/8`,`/api/book-pages/${lesson}/8/text`,`/api/book-lessons/${lesson}`,"/api/traveller/preview/1"]){expect((await request.get(url)).status()).toBe(401);}
 expect((await request.get("/private/books/traveller/source.pdf")).status()).toBe(404);
});

test("Traveller folders and stored files stay private",async({page,request})=>{
 await page.goto("/admin/library/traveller");await expect(page).toHaveURL(/login/);
 await page.goto("/admin/library/traveller/c1");await expect(page).toHaveURL(/login/);
 expect((await request.get("/api/admin/traveller-library/beginners/source")).status()).toBe(401);
 expect((await request.get("/private/library/traveller/beginners/README.md")).status()).toBe(404);
});

test("scheduled exam papers, audio and keys require sign-in",async({page,request})=>{
 await page.goto("/admin/courses/traveller/exams");await expect(page).toHaveURL(/login/);
 for(const asset of ["paper","audio","key","page-1","document","paper-text","key-text","key-document","key-page-1","listen-1"]){expect((await request.get(`/api/traveller-exam-assets/module-1/${asset}`)).status()).toBe(401);}
});

test("Traveller video administration requires authentication",async({page})=>{await page.goto("/admin/courses/traveller/videos");await expect(page).toHaveURL(/login/);});


test("teacher test resources require authentication",async({page})=>{await page.goto("/teacher/traveller-tests");await expect(page).toHaveURL(/login/);});


test("student answer uploads and grading reports require authentication",async({request,baseURL})=>{
 const base="/api/traveller-exams/module-1/answers";
 for(const suffix of ["","?template=1","?download=10000000-0000-4000-8000-000000000001"]){expect((await request.get(base+suffix)).status()).toBe(401);}
 const response=await request.post(base,{headers:{origin:new URL(baseURL||"http://localhost:3000").origin},multipart:{file:{name:"answers.txt",mimeType:"text/plain",buffer:Buffer.from("grammar.a.1: My answer")}}});expect(response.status()).toBe(401);
 expect((await request.get("/private/answer-uploads/example.txt")).status()).toBe(404);
});
