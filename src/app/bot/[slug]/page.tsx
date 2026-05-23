import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ChatWrapper } from "./ChatWrapper";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BotPage({ params }: PageProps) {
  const rawSlug = (await params).slug;
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // 已解码则忽略
  }

  // 用 Service Role 查 bot（确保数据存在），再用认证客户端做权限判断
  const serviceClient = createServiceClient();
  const { data: bots, error } = await serviceClient
    .from("bots")
    .select("*")
    .eq("slug", slug);

  if (error || !bots || bots.length === 0) {
    notFound();
  }

  const bot = bots[0];

  // 公开发布 → 任何人可看
  if (bot.visibility === "public" && bot.published) {
    return (
      <div className="h-screen flex flex-col">
        <ChatWrapper bot={bot} />
      </div>
    );
  }

  // 非公开 bot → 必须登录
  const serverClient = await createClient();
  const { data: authData } = await serverClient.auth.getUser();
  const user = authData?.user ?? null;

  if (!user) {
    notFound();
  }

  // 创建者 → 可看自己的任何 bot
  if (bot.creator_id === user.id) {
    return (
      <div className="h-screen flex flex-col">
        <ChatWrapper bot={bot} />
      </div>
    );
  }

  // 定制 bot → 检查是否在权限表中
  if (bot.visibility === "specific_users" && bot.published && user.email) {
    const { data: perms } = await serviceClient
      .from("bot_permissions")
      .select("id")
      .eq("bot_id", bot.id)
      .eq("allowed_email", user.email)
      .limit(1);

    if (perms && perms.length > 0) {
      return (
        <div className="h-screen flex flex-col">
          <ChatWrapper bot={bot} />
        </div>
      );
    }
  }

  // 无权限
  notFound();
}
