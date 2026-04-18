import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { setSessionCookies } from "../../lib/auth";

const url = import.meta.env.PUBLIC_SUPABASE_URL as string;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

export const POST: APIRoute = async (ctx) => {
  const form = await ctx.request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  if (!email || !password) return ctx.redirect("/login?error=Missing%20fields");

  const client = createClient(url, anon);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return ctx.redirect("/login?error=" + encodeURIComponent(error?.message || "Invalid credentials"));
  }
  setSessionCookies(ctx as any, data.session.access_token, data.session.refresh_token);
  return ctx.redirect("/me");
};
