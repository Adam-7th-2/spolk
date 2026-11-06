import {test,expect} from "@playwright/test";

test("email login reports rejected credentials and allows retry with Enter",async({page})=>{
 let attempts=0;
 await page.route("**/auth/v1/token?grant_type=password",async route=>{
  attempts++;
  const credentials=route.request().postDataJSON();
  expect(credentials.email).toBe("login-check@example.invalid");
  await route.fulfill({status:400,contentType:"application/json",headers:{"x-supabase-api-version":"2024-01-01","access-control-expose-headers":"x-supabase-api-version"},body:JSON.stringify({code:attempts===1?"invalid_credentials":"email_not_confirmed",message:"Authentication rejected"})});
 });
 await page.goto("/login");
 await page.getByLabel("Email address").fill("login-check@example.invalid");
 await page.getByLabel("Password",{exact:true}).fill("Invalid-test-only-6842");
 const submit=page.locator("form button[type=submit], form button:not([type])");
 await submit.click();
 await expect(page.getByRole("status")).toContainText("email or password is incorrect");
 await expect(submit).toBeEnabled();
 await page.getByLabel("Password",{exact:true}).press("Enter");
 await expect(page.getByRole("status")).toContainText("Confirm your email");
 expect(attempts).toBe(2);
});

test("account creation keeps the restored email and password fields",async({page})=>{
 await page.goto("/login");
 await page.getByRole("tab",{name:"Create account"}).click();
 await expect(page.getByLabel("Email address")).toBeVisible();
 await expect(page.getByLabel("Password (at least 12 characters)",{exact:true})).toBeVisible();
 await expect(page.getByLabel("First name",{exact:true})).toBeVisible();
 await expect(page.getByLabel("Learning goal",{exact:true})).toBeVisible();
 await expect(page.getByRole("button",{name:"Continue with Google"})).toBeVisible();
});
