import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route-client";
import { createServiceClient } from "@/lib/supabase/service";

function getUser(req: NextRequest) {
  const routeClient = createRouteClient(req);
  return routeClient.auth.getUser().then((d) => d.data?.user ?? null);
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const botId = req.nextUrl.searchParams.get("botId");
  if (!botId) return NextResponse.json({ error: "缺少 botId" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("user_bot_relations")
    .select("memory_notes")
    .eq("user_id", user.id)
    .eq("bot_id", botId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ memoryNotes: data?.memory_notes ?? "" });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { botId, memoryNotes } = await req.json();
  if (!botId) return NextResponse.json({ error: "缺少 botId" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("user_bot_relations")
    .upsert({ user_id: user.id, bot_id: botId, memory_notes: memoryNotes ?? "" }, { onConflict: "user_id,bot_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { botId } = await req.json();
  if (!botId) return NextResponse.json({ error: "缺少 botId" }, { status: 400 });

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("user_bot_relations")
    .upsert({ user_id: user.id, bot_id: botId }, { onConflict: "user_id,bot_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
