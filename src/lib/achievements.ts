import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL as string;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

export async function checkAchievements(
  userId: string,
  accessToken: string
): Promise<{ id: string; name: string; icon: string; points: number }[]> {
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const publicClient = createClient(url, anon);

  const [{ data: catalog }, { data: unlocked }, { data: profile }] = await Promise.all([
    publicClient.from("achievements").select("*"),
    publicClient.from("user_achievements").select("achievement_id").eq("user_id", userId),
    publicClient.from("profiles").select("outfits_posted,discord_handle").eq("id", userId).maybeSingle(),
  ]);

  const unlockedSet = new Set((unlocked ?? []).map((u: any) => u.achievement_id));

  const { count: totalVotesReceived } = await publicClient
    .from("votes")
    .select("*,outfits!inner(user_id)", { count: "exact", head: true })
    .eq("outfits.user_id", userId);

  const { count: votesCast } = await publicClient
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: weeklyWins } = await publicClient
    .from("weekly_awards")
    .select("id")
    .eq("user_id", userId);

  const { data: catCounts } = await publicClient
    .from("outfits")
    .select("category")
    .eq("user_id", userId);
  const categoryCounts: Record<string, number> = {};
  for (const c of catCounts ?? []) categoryCounts[c.category] = (categoryCounts[c.category] ?? 0) + 1;

  const stats: Record<string, number> = {
    outfits_posted: profile?.outfits_posted ?? 0,
    total_votes_received: totalVotesReceived ?? 0,
    votes_cast: votesCast ?? 0,
    weekly_wins: weeklyWins?.length ?? 0,
    has_discord: profile?.discord_handle ? 1 : 0,
    tank_posts: categoryCounts.tank ?? 0,
    mage_posts: categoryCounts.mage ?? 0,
    melee_posts: categoryCounts.melee ?? 0,
    ranged_posts: categoryCounts.ranged ?? 0,
    skiller_posts: categoryCounts.skiller ?? 0,
    pet_posts: categoryCounts.pet ?? 0,
    achievements_unlocked: unlockedSet.size,
  };

  const newUnlocks: { id: string; name: string; icon: string; points: number }[] = [];

  for (const a of catalog ?? []) {
    if (unlockedSet.has(a.id)) continue;
    const currentValue = stats[a.requirement_type] ?? 0;
    if (currentValue >= a.requirement_value) {
      const { error } = await client.from("user_achievements").insert({ user_id: userId, achievement_id: a.id });
      if (!error) {
        newUnlocks.push({ id: a.id, name: a.name, icon: a.icon, points: a.points_reward });
        const { data: p } = await client.from("profiles").select("total_points").eq("id", userId).maybeSingle();
        if (p) {
          await client.from("profiles").update({ total_points: (p.total_points ?? 0) + a.points_reward }).eq("id", userId);
        }
        unlockedSet.add(a.id);
        stats.achievements_unlocked = unlockedSet.size;
      }
    }
  }
  return newUnlocks;
}
