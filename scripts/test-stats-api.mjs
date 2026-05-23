// 模拟已登录用户调用 stats API
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("缺少环境变量");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // 获取 bot 111 的创建者
  const { data: bot } = await supabase
    .from("bots")
    .select("id, creator_id")
    .eq("slug", "111")
    .single();

  if (!bot) {
    console.error("找不到 bot");
    process.exit(1);
  }

  console.log(`Bot creator_id: ${bot.creator_id}`);

  // 获取该用户的 session
  const { data: sessions } = await supabase.auth.admin.listUserSessions(bot.creator_id);
  console.log("用户 sessions:", JSON.stringify(sessions, null, 2));
}

main().catch(console.error);
