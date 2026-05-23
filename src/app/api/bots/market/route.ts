import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route-client";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  // 必须登录
  const routeClient = createRouteClient(req);
  const { data: authData } = await routeClient.auth.getUser();
  if (!authData?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("bots")
    .select("*")
    .eq("visibility", "public")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
