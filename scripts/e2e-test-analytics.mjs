import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("缺少环境变量");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // 1. 获取 bot 111
  const { data: bot, error: botErr } = await supabase
    .from("bots")
    .select("id, name")
    .eq("slug", "111")
    .single();

  if (botErr || !bot) {
    console.error("找不到 bot:", botErr?.message);
    process.exit(1);
  }
  console.log(`Bot: ${bot.name} (${bot.id})\n`);

  // 2. 找一个聊天会话
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id, user_id")
    .eq("bot_id", bot.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!session) {
    console.error("没有聊天会话，无法测试");
    process.exit(1);
  }
  console.log(`使用会话: ${session.id}\n`);

  // 3. 记录当前 messages 数量和 analytics
  const { data: beforeMsgs } = await supabase
    .from("messages")
    .select("id")
    .eq("session_id", session.id);

  const { data: beforeAnalytics } = await supabase
    .from("conversation_analytics")
    .select("id, message_count, analyzed_at")
    .eq("session_id", session.id)
    .maybeSingle();

  console.log("=== 测试前 ===");
  console.log(`messages 表消息数: ${beforeMsgs?.length || 0}`);
  console.log(`analytics message_count: ${beforeAnalytics?.message_count || 0}`);
  console.log(`analytics analyzed_at: ${beforeAnalytics?.analyzed_at || "无"}\n`);

  // 4. 插入一条测试消息（模拟用户发送消息）
  console.log("插入一条测试消息...");
  const { error: insertErr } = await supabase.from("messages").insert({
    session_id: session.id,
    role: "user",
    content: "这是一条测试消息，用于验证仪表盘消息总数",
  });

  if (insertErr) {
    console.error("插入消息失败:", insertErr.message);
    process.exit(1);
  }

  // 5. 调用 analyze API
  console.log("调用 /api/analytics/analyze ...");
  const res = await fetch("http://localhost:3000/api/analytics/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: session.id, botId: bot.id }),
  });

  const analyzeResult = await res.json();
  console.log("analyze 响应:", analyzeResult, "\n");

  // 6. 再次检查 analytics
  const { data: afterMsgs } = await supabase
    .from("messages")
    .select("id")
    .eq("session_id", session.id);

  const { data: afterAnalytics } = await supabase
    .from("conversation_analytics")
    .select("id, message_count, analyzed_at")
    .eq("session_id", session.id)
    .maybeSingle();

  console.log("=== 测试后 ===");
  console.log(`messages 表消息数: ${afterMsgs?.length || 0}`);
  console.log(`analytics message_count: ${afterAnalytics?.message_count || 0}`);
  console.log(`analytics analyzed_at: ${afterAnalytics?.analyzed_at || "无"}\n`);

  // 7. 验证
  const msgIncreased = (afterMsgs?.length || 0) > (beforeMsgs?.length || 0);
  const analyticsUpdated = afterAnalytics && afterAnalytics.message_count === (afterMsgs?.length || 0);

  if (msgIncreased && analyticsUpdated) {
    console.log("✅ 测试通过：消息插入成功，analyze 接口正确更新了 message_count");
  } else if (!msgIncreased) {
    console.error("❌ 测试失败：消息没有插入成功");
  } else {
    console.error("❌ 测试失败：analyze 接口没有正确更新 message_count");
    console.error(`   期望 message_count = ${afterMsgs?.length}, 实际 = ${afterAnalytics?.message_count}`);
  }

  // 8. 检查 bot_daily_stats
  const today = new Date().toISOString().split("T")[0];
  const { data: daily } = await supabase
    .from("bot_daily_stats")
    .select("total_messages")
    .eq("bot_id", bot.id)
    .eq("date", today)
    .maybeSingle();

  console.log(`\n今日 bot_daily_stats total_messages: ${daily?.total_messages || 0}`);
}

main().catch(console.error);
