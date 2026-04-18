import type { APIRoute } from "astro";
import { getUser, authedClient } from "../../../lib/auth";
import { checkAchievements } from "../../../lib/achievements";

export const POST: APIRoute = async (ctx) => {
  const { user, session } = await getUser(ctx as any);
  if (!user || !session?.access_token) return ctx.redirect("/login");

  const id = ctx.params.id;
  if (!id) return ctx.redirect("/outfits");

  const client = authedClient(session.access_token);

  const { data: outfit } = await client.from("outfits").select("user_id").eq("id", id).maybeSingle();
  if (!outfit) return ctx.redirect("/outfits");
  if (outfit.user_id === user.id) return ctx.redirect(`/outfit/${id}?error=Cannot%20vote%20own`);

  const { data: existing } = await client.from("votes").select("id").eq("outfit_id", id).eq("user_id", user.id).maybeSingle();
  if (existing) {
    await client.from("votes").delete().eq("id", existing.id);
  } else {
    await client.from("votes").insert({ outfit_id: id, user_id: user.id });
    try { await checkAchievements(user.id, session.access_token); } catch (_) {}
  }
  return ctx.redirect(`/outfit/${id}`);
};
