import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";

export function createRouteClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // Route Handlers 不需要写 cookie，session 已在浏览器侧管理
        },
      },
    }
  );
}
