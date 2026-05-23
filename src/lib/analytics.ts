import { createServiceClient } from "@/lib/supabase/service";

export interface AnalyticsStats {
  botName: string;
  overview: {
    totalUsers: number;
    totalSessions: number;
    totalMessages: number;
    avgEmotionScore: number;
  };
  dailyStats: Array<{
    date: string;
    uniqueUsers: number;
    totalSessions: number;
    totalMessages: number;
    avgEmotionScore: number | null;
    topKeywords: Array<{ keyword: string; count: number }>;
    emotionDistribution: Record<string, number>;
  }>;
  recentSessions: Array<{
    id: string;
    userId: string;
    emotion: string;
    emotionScore: number;
    keywords: string[];
    summary: string;
    messageCount: number;
    analyzedAt: string;
  }>;
}

export async function getBotAnalytics(botId: string, botName: string, days = 7): Promise<AnalyticsStats> {
  const supabase = createServiceClient();

  // 1. 总概览
  const { data: allAnalytics } = await supabase
    .from("conversation_analytics")
    .select("user_id, emotion_score, dominant_emotion, keywords, message_count")
    .eq("bot_id", botId);

  const totalUsers = allAnalytics ? new Set(allAnalytics.map((a) => a.user_id)).size : 0;
  const totalSessions = allAnalytics?.length || 0;
  const totalMessages = allAnalytics?.reduce((sum, a) => sum + (a.message_count || 0), 0) || 0;
  const scores = allAnalytics?.map((a) => a.emotion_score).filter((s): s is number => s !== null) || [];
  const avgEmotion = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
    : 0;

  // 2. 每日聚合数据（过去 N 天）
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split("T")[0];

  const { data: dailyStats } = await supabase
    .from("bot_daily_stats")
    .select("*")
    .eq("bot_id", botId)
    .gte("date", startStr)
    .order("date", { ascending: true });

  // 3. 最近会话
  const { data: recentSessions } = await supabase
    .from("conversation_analytics")
    .select(`
      id, dominant_emotion, emotion_score, keywords, topic_summary, message_count, analyzed_at,
      user_id
    `)
    .eq("bot_id", botId)
    .order("analyzed_at", { ascending: false })
    .limit(20);

  return {
    botName,
    overview: {
      totalUsers,
      totalSessions,
      totalMessages,
      avgEmotionScore: avgEmotion,
    },
    dailyStats: (dailyStats || []).map((d) => ({
      date: d.date,
      uniqueUsers: d.unique_users,
      totalSessions: d.total_sessions,
      totalMessages: d.total_messages,
      avgEmotionScore: d.avg_emotion_score,
      topKeywords: typeof d.top_keywords === "string" ? JSON.parse(d.top_keywords) : d.top_keywords,
      emotionDistribution: typeof d.emotion_distribution === "string" ? JSON.parse(d.emotion_distribution) : d.emotion_distribution,
    })),
    recentSessions: (recentSessions || []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      emotion: s.dominant_emotion,
      emotionScore: s.emotion_score,
      keywords: s.keywords,
      summary: s.topic_summary,
      messageCount: s.message_count,
      analyzedAt: s.analyzed_at,
    })),
  };
}
