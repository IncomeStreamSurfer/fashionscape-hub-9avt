import type { APIRoute } from "astro";
import { getUser, authedClient } from "../../lib/auth";
import { checkAchievements } from "../../lib/achievements";

export const POST: APIRoute = async (ctx) => {
  const { user, session } = await getUser(ctx as any);
  if (!user || !session?.access_token) return ctx.redirect("/login");

  const form = await ctx.request.formData();
  const title = String(form.get("title") || "").trim();
  const category = String(form.get("category") || "general").trim();
  const description = String(form.get("description") || "").trim();
  const itemsRaw = String(form.get("items") || "").trim();
  const discordUrl = String(form.get("discord_url") || "").trim();
  const imageFile = form.get("image") as File | null;

  if (!title || !imageFile || imageFile.size === 0) {
    return ctx.redirect("/upload?error=Missing%20title%20or%20image");
  }
  if (imageFile.size > 5 * 1024 * 1024) {
    return ctx.redirect("/upload?error=Image%20too%20large%20(max%205MB)");
  }

  const valid = ["tank","mage","melee","ranged","skiller","pvp","boss","pet","cosplay","general"];
  const cat = valid.includes(category) ? category : "general";

  const client = authedClient(session.access_token);
  const ext = imageFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await imageFile.arrayBuffer();
  const { error: upErr } = await client.storage.from("outfits").upload(fileName, arrayBuffer, {
    contentType: imageFile.type || "image/png",
    upsert: false,
  });
  if (upErr) return ctx.redirect("/upload?error=" + encodeURIComponent("Upload failed: " + upErr.message));

  const { data: publicUrl } = client.storage.from("outfits").getPublicUrl(fileName);

  const items = itemsRaw ? itemsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const { data: outfit, error: insErr } = await client
    .from("outfits")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      image_url: publicUrl.publicUrl,
      category: cat,
      items,
      discord_url: discordUrl || null,
    })
    .select()
    .single();

  if (insErr || !outfit) return ctx.redirect("/upload?error=" + encodeURIComponent("Save failed: " + (insErr?.message ?? "")));

  try { await checkAchievements(user.id, session.access_token); } catch (_) {}

  return ctx.redirect(`/outfit/${outfit.id}?posted=1`);
};
