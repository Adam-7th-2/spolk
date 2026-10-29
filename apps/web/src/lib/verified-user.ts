/** A verified auth user only. An outage must not fall back to the cookie session. */
export function userFromVerifiedAuth<T>(user: T | null, error: unknown): T | null {
 if (error || !user) return null;
 return user;
}
