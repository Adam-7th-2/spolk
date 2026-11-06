import { NextResponse } from "next/server";
import { publicOrigin } from "@/lib/request-origin";
import { database, isConfigured } from "@/lib/supabase";

// Handles Supabase email confirmation, Google sign-in, and password-reset links.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = publicOrigin(req);
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.slice(0, 240))}`, origin));
  const code = url.searchParams.get("code");
  if (!code || !isConfigured()) return NextResponse.redirect(new URL("/login?error=The%20verification%20link%20is%20invalid%20or%20expired.", origin));
  const db = await database();
  const { error: exchangeError } = await db.auth.exchangeCodeForSession(code);
  if (exchangeError) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(exchangeError.message.slice(0, 240))}`, origin));
  const next = url.searchParams.get("next");
  return NextResponse.redirect(new URL(next === "/update-password" ? next : "/dashboard", origin));
}
