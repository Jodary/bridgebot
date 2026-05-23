import { notFound, redirect } from "next/navigation";
    import { createClient } from "@/lib/supabase/server";
    import { createServiceClient } from "@/lib/supabase/service";
    import { getBotAnalytics } from "@/lib/analytics";
    import { DashboardClient } from "./DashboardClient";

    export const dynamic = "force-dynamic";

    interface PageProps {
      params: Promise<{ slug: string }>;
    }

    export default async function DashboardPage({ params }: PageProps) {
      const rawSlug = (await params).slug;
      const slug = decodeURIComponent(rawSlug);

      // 查 Bot
      const serviceClient = createServiceClient();
      const { data: bots } = await serviceClient
        .from("bots")
        .select("*")
        .eq("slug", slug);

      if (!bots || bots.length === 0) {
        notFound();
      }

      const bot = bots[0];

      // 只有创建者能看仪表盘
      const serverClient = await createClient();
      const { data: authData } = await serverClient.auth.getUser();
      const user = authData?.user ?? null;

      if (!user || bot.creator_id !== user.id) {
        redirect("/auth/login");
      }

      // 服务端获取统计数据
      const stats = await getBotAnalytics(bot.id, bot.name, 30);

      return <DashboardClient botName={bot.name} botId={bot.id} initialStats={stats} />;
    }