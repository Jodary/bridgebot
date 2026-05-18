import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route-client";
import { createServiceClient } from "@/lib/supabase/service";
import { getBotAnalytics } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  // 必须登录
  const routeClient = createRouteClient(req);
  const { data: authData } = await routeClient.auth.getUser();
  const user = authData?.user;
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const botId = req.nextUrl.searchParams.get("botId");
  if (!botId) {
    return NextResponse.json({ error: "缺少 botId" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 验证 bot 所有权
  const { data: bot } = await supabase
    .from("bots")
    .select("id, creator_id, name")
    .eq("id", botId)
    .single();

  if (!bot || bot.creator_id !== user.id) {
    return NextResponse.json({ error: "无权查看" }, { status: 403 });
  }

  const days = parseInt(req.nextUrl.searchParams.get("days") || "7");

  const stats = await getBotAnalytics(botId, bot.name, days);
  return NextResponse.json(stats);
}
