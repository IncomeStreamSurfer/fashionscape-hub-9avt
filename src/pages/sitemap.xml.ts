import type { APIRoute } from "astro";
import { getSupabase } from "../lib/supabase";

export const GET: APIRoute = async () => {
  const supa = getSupabase();
  const { data: outfits } = await supa.from("outfits").select("id,created_at").order("created_at", { ascending: false }).limit(500);
  const { data: users } = await supa.from("profiles").select("username,updated_at").limit(500);
  const site = import.meta.env.PUBLIC_SITE_URL || "https://fashionscape-hub-9avt.vercel.app";

  const urls = [
    { loc: `${site}/`, priority: "1.0" },
    { loc: `${site}/outfits`, priority: "0.9" },
    { loc: `${site}/weekly`, priority: "0.9" },
    { loc: `${site}/achievements`, priority: "0.8" },
    { loc: `${site}/leaderboard`, priority: "0.8" },
    { loc: `${site}/about`, priority: "0.5" },
    ...(outfits ?? []).map((o: any) => ({ loc: `${site}/outfit/${o.id}`, priority: "0.7", lastmod: o.created_at })),
    ...(users ?? []).map((u: any) => ({ loc: `${site}/u/${u.username}`, priority: "0.5", lastmod: u.updated_at })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u: any) => `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join("\n")}\n</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
