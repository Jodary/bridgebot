import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("缺少环境变量 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkTables() {
  console.log("=== 检查 analytics 相关表是否存在 ===\n");

  // 检查 conversation_analytics
  const { error: caErr } = await supabase
    .from("conversation_analytics")
    .select("*")
    .limit(1);

  if (caErr) {
    console.error("❌ conversation_analytics 表不存在或无法访问:", caErr.message);
  } else {
    console.log("✅ conversation_analytics 表存在");
  }

  // 检查 bot_daily_stats
  const { error: bdsErr } = await supabase
    .from("bot_daily_stats")
    .select("*")
    .limit(1);

  if (bdsErr) {
    console.error("❌ bot_daily_stats 表不存在或无法访问:", bdsErr.message);
  } else {
    console.log("✅ bot_daily_stats 表存在");
  }
}

async function getBotBySlug(slug) {
  const { data, error } = await supabase
    .from("bots")
    .select("id, name, slug, creator_id")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("获取 Bot 失败:", error.message);
    return null;
  }
  return data;
}

async function getAnalyticsForBot(botId) {
  console.log(`\n=== Bot ${botId} 的分析数据 ===`);

  const { data: analytics, error } = await supabase
    .from("conversation_analytics")
    .select("*")
    .eq("bot_id", botId);

  if (error) {
    console.error("查询 analytics 失败:", error.message);
    return;
  }

  console.log(`conversation_analytics 记录数: ${analytics?.length || 0}`);
  if (analytics && analytics.length > 0) {
    analytics.forEach((a, i) => {
      console.log(`  [${i + 1}] session=${a.session_id}, messages=${a.message_count}, analyzed_at=${a.analyzed_at}`);
    });
    const totalMessages = analytics.reduce((sum, a) => sum + (a.message_count || 0), 0);
    console.log(`  消息总数(聚合): ${totalMessages}`);
  }

  const today = new Date().toISOString().split("T")[0];
  const { data: daily } = await supabase
    .from("bot_daily_stats")
    .select("*")
    .eq("bot_id", botId)
    .eq("date", today)
    .maybeSingle();

  if (daily) {
    console.log(`bot_daily_stats 今日记录: sessions=${daily.total_sessions}, messages=${daily.total_messages}, users=${daily.unique_users}`);
  } else {
    console.log("bot_daily_stats 今日记录: 无");
  }
}

async function main() {
  await checkTables();

  const bot = await getBotBySlug("111");
  if (!bot) {
    console.error("\n找不到 slug=111 的 Bot");
    process.exit(1);
  }

  console.log(`\n找到 Bot: ${bot.name} (id=${bot.id}, creator=${bot.creator_id})`);
  await getAnalyticsForBot(bot.id);
}

main().catch(console.error);
