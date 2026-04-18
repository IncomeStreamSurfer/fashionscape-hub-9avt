import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { setSessionCookies } from "../../lib/auth";

const url = import.meta.env.PUBLIC_SUPABASE_URL as string;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

export const POST: APIRoute = async (ctx) => {
  const form = await ctx.request.formData();
  const username = String(form.get("username") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const discord_handle = String(form.get("discord_handle") || "").trim();

  if (!username || !email || !password) {
    return ctx.redirect("/signup?error=Please%20fill%20all%20required%20fields");
  }
  if (!/^[a-zA-Z0-9_-]{3,24}$/.test(username)) {
    return ctx.redirect("/signup?error=Invalid%20username");
  }

  const client = createClient(url, anon);

  const { data: existing } = await client.from("profiles").select("id").eq("username", username).maybeSingle();
  if (existing) return ctx.redirect("/signup?error=Username%20already%20taken");

  const { data, error } = await client.auth.signUp({ email, password });
  if (error || !data.user) {
    return ctx.redirect("/signup?error=" + encodeURIComponent(error?.message || "Sign up failed"));
  }

  let accessToken = data.session?.access_token;
  let refreshToken = data.session?.refresh_token;
  if (!accessToken) {
    const login = await client.auth.signInWithPassword({ email, password });
    if (login.data.session) {
      accessToken = login.data.session.access_token;
      refreshToken = login.data.session.refresh_token;
    }
  }

  if (accessToken) {
    const authed = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    await authed.from("profiles").insert({
      id: data.user.id,
      username,
      discord_handle: discord_handle || null,
      total_points: discord_handle ? 15 : 0,
    });
    if (discord_handle) {
      try { await authed.from("user_achievements").insert({ user_id: data.user.id, achievement_id: "discord_degen" }); } catch (_) {}
    }
    setSessionCookies(ctx as any, accessToken, refreshToken!);
    return ctx.redirect("/me?welcome=1");
  }

  return ctx.redirect("/login?error=Account%20created%20-%20please%20log%20in");
};
