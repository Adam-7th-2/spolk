type Failure = { code?: string; status?: number; name?:string };
export function signinErrorMessage(error:Failure):string{
 if(error.name==="AuthRetryableFetchError"||error.status===0)return "The sign-in service could not be reached. Please try again shortly.";
 const messages:Record<string,string>={
  invalid_credentials:"The email or password is incorrect. Check the email spelling, or use Forgot your password to reset it.",
  email_not_confirmed:"Confirm your email using the verification link before signing in. Check your inbox and spam folder.",
  user_banned:"This account cannot sign in. Contact your academy administrator.",
  over_request_rate_limit:"Too many sign-in attempts. Wait a few minutes, then try again.",
  captcha_failed:"Sign-in requires a CAPTCHA that this form has not completed. Contact your administrator.",
  email_provider_disabled:"Email sign-in is disabled for this project. Contact your administrator.",
  request_timeout:"The sign-in service took too long to respond. Please try again."
 };
 if(error.code&&messages[error.code])return messages[error.code];
 if(error.status===429)return "Too many sign-in attempts. Wait a few minutes, then try again.";
 if(error.status&&error.status>=500)return "The sign-in service is temporarily unavailable. Please try again shortly.";
 return "Sign-in could not be completed. Try again, or reset your password.";
}
export function signupErrorMessage(error: Failure): string {
  const messages: Record<string, string> = {
    email_address_not_authorized: "Supabase cannot send verification emails to this address with its default email service. For testing, use the email on your Supabase account. Other addresses require custom SMTP configuration.",
    email_address_invalid: "Use a valid personal email address. Example and test email domains may be rejected.",
    over_email_send_rate_limit: "Supabase's verification email limit has been reached. Wait before trying again, or configure your own email service.",
    over_request_rate_limit: "Too many signup attempts. Wait a few minutes before trying again.",
    signup_disabled: "New account registration is disabled in Supabase authentication settings.",
    email_provider_disabled: "Email registration is disabled in Supabase authentication settings.",
    weak_password: "This password does not meet the project's security requirements. Choose a stronger password.",
    captcha_failed: "Supabase requires a CAPTCHA that this signup form has not completed. Check the project's CAPTCHA configuration.",
    unexpected_failure: "Supabase could not finish creating the account. Check Authentication logs for a database trigger or email delivery error.",
    user_already_exists: "Please try logging in or resetting your password instead.",
    email_exists: "Please try logging in or resetting your password instead."
  };
  if (error.code && messages[error.code]) return messages[error.code];
  if (error.status && error.status >= 500) return "Supabase could not create the account. Check Authentication logs for a database trigger or email delivery error.";
  return "Registration could not be completed. Check the Supabase Authentication logs for the cause.";
}
