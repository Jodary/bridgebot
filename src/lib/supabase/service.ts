import { createClient } from "@supabase/supabase-js";

// Service role client — 仅用于 API Routes 的可信后端操作
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}
