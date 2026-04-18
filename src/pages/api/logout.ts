import type { APIRoute } from "astro";
import { clearSessionCookies } from "../../lib/auth";

export const POST: APIRoute = async (ctx) => {
  clearSessionCookies(ctx as any);
  return ctx.redirect("/");
};
export const GET = POST;
