import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL as string;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

export function getSupabase(): SupabaseClient {
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseFromRequest(request: Request): SupabaseClient {
  const cookie = request.headers.get("cookie") || "";
  const access = extractCookie(cookie, "sb-access-token");
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: access ? { headers: { Authorization: `Bearer ${access}` } } : {},
  });
  return client;
}

export function extractCookie(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(/;\s*/).find((p) => p.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export const CATEGORIES = [
  { id: "tank", label: "Tank", color: "#4a7a8c", icon: "🛡️" },
  { id: "mage", label: "Mage", color: "#5f3a8a", icon: "🔮" },
  { id: "melee", label: "Melee", color: "#a83232", icon: "⚔️" },
  { id: "ranged", label: "Ranged", color: "#2f6b3a", icon: "🏹" },
  { id: "skiller", label: "Skiller", color: "#8a5a1a", icon: "⛏️" },
  { id: "pvp", label: "PvP", color: "#b83d5c", icon: "💀" },
  { id: "boss", label: "Boss Drip", color: "#c89f2c", icon: "👑" },
  { id: "pet", label: "Pet Flex", color: "#3c8a6c", icon: "🐉" },
  { id: "cosplay", label: "Cosplay", color: "#8a3c6c", icon: "🎭" },
  { id: "general", label: "General", color: "#6b6b6b", icon: "✨" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
