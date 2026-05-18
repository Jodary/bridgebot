import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, botId } = await req.json();
    if (!sessionId || !botId) {
      return NextResponse.json({ error: "缺少 sessionId 或 botId" }, { status: 400 });
    }

    const supabase = createServiceClient();

   // 1. 读取会话消息（要先拿到消息才能判断）
        const { data: session } = await supabase
          .from("chat_sessions")
          .select("id, user_id")
          .eq("id", sessionId)
          .single();
        if (!session) {
          return NextResponse.json({ error: "会话不存在" }, { status: 404 });
        }

        const { data: messages } = await supabase
          .from("messages")
          .select("role, content")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });
        if (!messages || messages.length === 0) {
          return NextResponse.json({ error: "没有消息" }, { status: 400 });
        }

        // 2. 检查已分析条数，如果消息太少（少于3条）就跳过
        const { data: existing } = await supabase
          .from("conversation_analytics")
          .select("id, message_count")
          .eq("session_id", sessionId)
          .maybeSingle();

        if (existing && existing.message_count >= messages.length - 3) {
          return NextResponse.json({ ok: true, message: "变化太小，跳过" });
        }

    // 3. 用 GLM 分析
    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });

    const analysisPrompt = `分析以下用户说的内容，以 JSON 格式返回分析结果（不要包含其他文字）：
{
  "emotion": "用户的主导情绪，只能是以下之一：happy/sad/anxious/angry/neutral",
  "emotion_score": 情绪评分，-1到1之间，-1=非常消极，0=中性，1=非常积极,
  "keywords": ["提取3-5个话题关键词，每个词2-4个字，中文"],
  "summary": "一句话概括用户说了什么，不超过20个字"
}

用户说的内容：
${userMessages || "（用户没有说话）"}`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const resultText = completion.choices[0]?.message?.content || "{}";
    let analysis: {
      emotion: string;
      emotion_score: number;
      keywords: string[];
      summary: string;
    };
    try {
      analysis = JSON.parse(resultText);
    } catch {
      analysis = {
        emotion: "neutral",
        emotion_score: 0,
        keywords: [],
        summary: "（分析失败）",
      };
    }

    // 4. 写入或更新 conversation_analytics
    const now = new Date().toISOString();
    const analysisData = {
      bot_id: botId,
      session_id: sessionId,
      user_id: session.user_id,
      dominant_emotion: analysis.emotion || "neutral",
      emotion_score: analysis.emotion_score ?? 0,
      keywords: analysis.keywords || [],
      topic_summary: analysis.summary || "",
      message_count: messages.length,
      analyzed_at: now,
    };

    if (existing) {
      await supabase.from("conversation_analytics").update(analysisData).eq("id", existing.id);
    } else {
      await supabase.from("conversation_analytics").insert(analysisData);
    }
    // 5. 更新 bot_daily_stats（聚合）
    // 使用本地时区日期，避免 UTC 与本地时差导致错分日期
    const nowLocal = new Date();
    const today = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(2, "0")}`;

    const { data: dailyStats } = await supabase
      .from("bot_daily_stats")
      .select("*")
      .eq("bot_id", botId)
      .eq("date", today)
      .maybeSingle();

    const { data: todayAnalytics } = await supabase
      .from("conversation_analytics")
      .select("user_id, emotion_score, dominant_emotion, keywords, message_count, session_id")
      .eq("bot_id", botId)
      .gte("analyzed_at", `${today}T00:00:00Z`)
      .lte("analyzed_at", `${today}T23:59:59Z`);

    if (todayAnalytics) {
      const uniqueUsers = new Set(todayAnalytics.map((a) => a.user_id));
      const totalSessions = todayAnalytics.length;
      const totalMessages = todayAnalytics.reduce((sum, a) => sum + (a.message_count || 0), 0);
      const scores = todayAnalytics
        .map((a) => a.emotion_score)
        .filter((s): s is number => s !== null);
      const avgScore = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : null;

      const keywordCount = new Map<string, number>();
      todayAnalytics.forEach((a) => {
        (a.keywords || []).forEach((kw: string) => {
          keywordCount.set(kw, (keywordCount.get(kw) || 0) + 1);
        });
      });
      const topKeywords = Array.from(keywordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([keyword, count]) => ({ keyword, count }));

      const emotionDist: Record<string, number> = {};
      todayAnalytics.forEach((a) => {
        const e = a.dominant_emotion || "neutral";
        emotionDist[e] = (emotionDist[e] || 0) + 1;
      });

      if (dailyStats) {
        await supabase
          .from("bot_daily_stats")
          .update({
            unique_users: uniqueUsers.size,
            total_sessions: totalSessions,
            total_messages: totalMessages,
            avg_emotion_score: avgScore,
            top_keywords: JSON.stringify(topKeywords),
            emotion_distribution: JSON.stringify(emotionDist),
            updated_at: new Date().toISOString(),
          })
          .eq("id", dailyStats.id);
      } else {
        await supabase.from("bot_daily_stats").insert({
          bot_id: botId,
          date: today,
          unique_users: uniqueUsers.size,
          total_sessions: totalSessions,
          total_messages: totalMessages,
          avg_emotion_score: avgScore,
          top_keywords: JSON.stringify(topKeywords),
          emotion_distribution: JSON.stringify(emotionDist),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[ANALYZE ERROR]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}