import {it,expect} from "vitest";
import {signupErrorMessage} from "../src/lib/auth-errors";
it("explains the default email service restriction",()=>expect(signupErrorMessage({code:"email_address_not_authorized"})).toContain("custom SMTP"));
it("distinguishes email quota from database failure",()=>{expect(signupErrorMessage({code:"over_email_send_rate_limit"})).toContain("limit");expect(signupErrorMessage({status:500})).toContain("trigger");});
it("keeps unknown provider details out of the response",()=>expect(signupErrorMessage({code:"secret-database-internals"})).not.toContain("secret-database-internals"));

import {signinErrorMessage} from "../src/lib/auth-errors";
it("distinguishes wrong credentials from unconfirmed email",()=>{expect(signinErrorMessage({code:"invalid_credentials"})).toContain("email or password is incorrect");expect(signinErrorMessage({code:"email_not_confirmed"})).toContain("Confirm your email");});
it("handles network failures without blaming credentials",()=>expect(signinErrorMessage({name:"AuthRetryableFetchError",status:0})).toContain("could not be reached"));
it("keeps unknown login internals private",()=>expect(signinErrorMessage({code:"secret-details",status:500})).not.toContain("secret-details"));
