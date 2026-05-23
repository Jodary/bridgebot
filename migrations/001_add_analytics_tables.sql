-- =============================================
-- 修复仪表盘消息总数为 0 的问题
-- 执行方式：在 Supabase SQL Editor 中完整执行此文件
-- =============================================

-- 1. 会话分析表（仪表盘数据来源）
CREATE TABLE IF NOT EXISTS public.conversation_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dominant_emotion text DEFAULT 'neutral',
  emotion_score numeric(3,2) DEFAULT 0,
  keywords jsonb DEFAULT '[]',
  topic_summary text DEFAULT '',
  message_count integer DEFAULT 0,
  analyzed_at timestamptz DEFAULT now(),
  UNIQUE(session_id)
);

-- 2. Bot 每日统计表（仪表盘折线图数据来源）
CREATE TABLE IF NOT EXISTS public.bot_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  date date NOT NULL,
  unique_users integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  avg_emotion_score numeric(3,2),
  top_keywords jsonb DEFAULT '[]',
  emotion_distribution jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(bot_id, date)
);

-- 3. 索引（加速仪表盘查询）
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_bot ON public.conversation_analytics(bot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_session ON public.conversation_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_analyzed_at ON public.conversation_analytics(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_bot_daily_stats_bot_date ON public.bot_daily_stats(bot_id, date);
