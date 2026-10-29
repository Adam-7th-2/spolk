import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { currentUser, database } from "@/lib/supabase";

export const runtime = "nodejs";
let pages: Record<string, string> | null = null;

export async function GET(_: Request, { params }: { params: Promise<{ lessonId: string; page: string }> }) {
 if (!await currentUser()) return NextResponse.json({ error: "Sign in to view course pages." }, { status: 401 });
 const parsed = z.object({ lessonId: z.uuid(), page: z.coerce.number().int().min(1).max(126) }).safeParse(await params);
 if (!parsed.success) return NextResponse.json({ error: "Invalid page." }, { status: 400 });
 const db = await database();
 const { data, error } = await db.from("book_lesson_pages").select("book_id").eq("lesson_id", parsed.data.lessonId).eq("pdf_page", parsed.data.page).maybeSingle();
 if (error || !data || data.book_id !== "traveller-beginners") return NextResponse.json({ error: "This page is not available to your account." }, { status: 403 });
 try {
  if (!pages) pages = JSON.parse(await readFile(resolve(process.cwd(), "private/books/traveller/page-text.json"), "utf8")).pages;
  return NextResponse.json({ text: pages?.[String(parsed.data.page)] || "" }, { headers: { "Cache-Control": "private, no-store" } });
 } catch {
  return NextResponse.json({ error: "Reading aid is unavailable on this server." }, { status: 503 });
 }
}
