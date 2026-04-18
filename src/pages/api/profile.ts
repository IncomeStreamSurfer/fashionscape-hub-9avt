import type { APIRoute } from "astro";
import { getUser, authedClient } from "../../lib/auth";
import { checkAchievements } from "../../lib/achievements";

export const POST: APIRoute = async (ctx) => {
  const { user, session } = await getUser(ctx as any);
  if (!user || !session?.access_token) return ctx.redirect("/login");

  const form = await ctx.request.formData();
  const rsn = String(form.get("rsn") || "").trim().slice(0, 12) || null;
  const discord_handle = String(form.get("discord_handle") || "").trim().slice(0, 60) || null;
  const bio = String(form.get("bio") || "").trim().slice(0, 200) || null;

  const client = authedClient(session.access_token);
  const { error } = await client.from("profiles").update({ rsn, discord_handle, bio, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) return ctx.redirect("/me/edit?error=" + encodeURIComponent(error.message));

  try { await checkAchievements(user.id, session.access_token); } catch (_) {}
  return ctx.redirect("/me/edit?success=1");
};
