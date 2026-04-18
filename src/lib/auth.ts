import type { APIContext } from "astro";
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL as string;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

export async function getUser(ctx: APIContext | { request: Request; cookies: any }) {
  const access = ctx.cookies.get("sb-access-token")?.value;
  const refresh = ctx.cookies.get("sb-refresh-token")?.value;
  if (!access) return { user: null, session: null };

  const client = createClient(url, anon);
  const { data, error } = await client.auth.getUser(access);
  if (error || !data.user) {
    if (refresh) {
      const r = await client.auth.refreshSession({ refresh_token: refresh });
      if (r.data.session) {
        (ctx.cookies as any).set("sb-access-token", r.data.session.access_token, {
          path: "/", httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7,
        });
        (ctx.cookies as any).set("sb-refresh-token", r.data.session.refresh_token, {
          path: "/", httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30,
        });
        return { user: r.data.session.user, session: r.data.session };
      }
    }
    return { user: null, session: null };
  }
  return { user: data.user, session: { access_token: access, refresh_token: refresh } };
}

export function setSessionCookies(ctx: { cookies: any }, accessToken: string, refreshToken: string) {
  ctx.cookies.set("sb-access-token", accessToken, {
    path: "/", httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7,
  });
  ctx.cookies.set("sb-refresh-token", refreshToken, {
    path: "/", httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookies(ctx: { cookies: any }) {
  ctx.cookies.delete("sb-access-token", { path: "/" });
  ctx.cookies.delete("sb-refresh-token", { path: "/" });
}

export function authedClient(accessToken: string) {
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
