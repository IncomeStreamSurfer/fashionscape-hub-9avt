import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL as string;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

export const GET: APIRoute = async (ctx) => {
  const secret = ctx.request.headers.get("x-cron-secret");
  if (secret !== "fashionscape-cron") return new Response("forbidden", { status: 403 });

  const client = createClient(url, anon);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const day = today.getUTCDay();
  const lastWeekSunday = new Date(today);
  lastWeekSunday.setUTCDate(today.getUTCDate() - day - 7);
  const lastWeekStr = lastWeekSunday.toISOString().slice(0, 10);

  const { data: outfits } = await client
    .from("outfits")
    .select("id,user_id,category,vote_count,title")
    .eq("week_of", lastWeekStr)
    .order("vote_count", { ascending: false });

  if (!outfits || outfits.length === 0) {
    return new Response(JSON.stringify({ week: lastWeekStr, created: 0, message: "No outfits" }), { headers: { "Content-Type": "application/json" } });
  }

  const bestByCategory: Record<string, any> = {};
  for (const o of outfits) {
    if (!bestByCategory[o.category] && (o.vote_count ?? 0) > 0) bestByCategory[o.category] = o;
  }

  let created = 0;
  for (const [cat, outfit] of Object.entries(bestByCategory)) {
    const awardName = `Weekly ${cat[0].toUpperCase() + cat.slice(1)} Champion`;
    const { error } = await client.from("weekly_awards").insert({
      week_of: lastWeekStr,
      category: cat,
      outfit_id: outfit.id,
      user_id: outfit.user_id,
      award_name: awardName,
      points_awarded: 100,
    });
    if (!error) created++;
  }

  return new Response(JSON.stringify({ week: lastWeekStr, created }), { headers: { "Content-Type": "application/json" } });
};
