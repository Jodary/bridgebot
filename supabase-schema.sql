-- =============================================
-- 许小熊 Bot V2 — 数据库 Schema
-- 直接在 Supabase SQL Editor 执行此文件
-- =============================================

-- 1. 用户 Profile 表（扩展 auth.users）
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  identity text, -- student, teacher, business, content_creator, other
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 先启用 pgcrypto 扩展（uuid 需要）
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 自动为新注册用户创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器（如果已存在则跳过，不执行 DROP）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

-- =============================================
-- 2. Bots 表
-- =============================================
CREATE TABLE IF NOT EXISTS public.bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  gender text,
  age int,
  relationship text,
  personality text,
  speaking_style text,
  forbidden_behaviors text,
  system_prompt text NOT NULL,
  category text DEFAULT 'custom', -- emotional_companion, study_assistant, tutor, customer_service, custom
  visibility text DEFAULT 'private' CHECK (visibility IN ('private', 'specific_users', 'public')),
  slug text UNIQUE,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 3. 聊天会话表
-- =============================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 4. 消息表
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 5. Bot 权限表（白名单）
-- =============================================
CREATE TABLE IF NOT EXISTS public.bot_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  allowed_email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 5.5 用户-Bot 关联表（公开 bot 对话即关联）
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_bot_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  memory_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, bot_id)
);

-- =============================================
-- 索引
-- =============================================
CREATE INDEX IF NOT EXISTS idx_bots_creator ON public.bots(creator_id);
CREATE INDEX IF NOT EXISTS idx_bots_slug ON public.bots(slug);
CREATE INDEX IF NOT EXISTS idx_bots_visibility ON public.bots(visibility);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_bot ON public.chat_sessions(bot_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_user_bot_relations_user ON public.user_bot_relations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bot_relations_bot ON public.user_bot_relations(bot_id);

-- =============================================
-- 6. 会话分析表（仪表盘数据来源）
-- =============================================
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

-- =============================================
-- 7. Bot 每日统计表（仪表盘折线图数据来源）
-- =============================================
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

-- 补充索引
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_bot ON public.conversation_analytics(bot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_session ON public.conversation_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_analyzed_at ON public.conversation_analytics(analyzed_at);
CREATE INDEX IF NOT EXISTS idx_bot_daily_stats_bot_date ON public.bot_daily_stats(bot_id, date);

-- =============================================
-- Slug 生成函数
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_bot_slug()
RETURNS trigger AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter int := 0;
BEGIN
  -- 从名字生成 base slug（转拼音/英文，或直接用随机）
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9一-鿿]', '-', 'g'));
  -- 截断到合理长度
  base_slug := substring(base_slug from 1 for 40);

  -- 如果名字不含英文/数字，用随机字符串
  IF base_slug = '' OR base_slug = '-' THEN
    base_slug := substring(replace(NEW.id::text, '-', ''), 1, 8);
  END IF;

  new_slug := base_slug;
  LOOP
    -- 显式检查 slug 是否已存在（EXCEPTION 在 BEFORE INSERT 中无效）
    IF NOT EXISTS (SELECT 1 FROM public.bots WHERE slug = new_slug) THEN
      NEW.slug := new_slug;
      RETURN NEW;
    END IF;
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 创建 Bot 时自动生成 slug
DROP TRIGGER IF EXISTS trigger_generate_bot_slug ON public.bots;
CREATE TRIGGER trigger_generate_bot_slug
  BEFORE INSERT ON public.bots
  FOR EACH ROW
  WHEN (NEW.slug IS NULL)
  EXECUTE FUNCTION public.generate_bot_slug();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Bots
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creator can do anything" ON public.bots;
CREATE POLICY "Creator can do anything"
  ON public.bots FOR ALL
  USING (auth.uid() = creator_id);
DROP POLICY IF EXISTS "Anyone can read public bots" ON public.bots;
CREATE POLICY "Anyone can read public bots"
  ON public.bots FOR SELECT
  USING (visibility = 'public' AND published = true);
-- link_only 已移除，不再需要对应策略
DROP POLICY IF EXISTS "Specified users can read bot" ON public.bots;
CREATE POLICY "Specified users can read bot"
  ON public.bots FOR SELECT
  USING (
    visibility = 'specific_users'
    AND published = true
    AND (
      auth.uid() = creator_id
      OR EXISTS (
        SELECT 1 FROM public.bot_permissions
        WHERE bot_permissions.bot_id = bots.id
        AND bot_permissions.allowed_email = auth.jwt()->>'email'
      )
    )
  );

-- Chat Sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants can read sessions" ON public.chat_sessions;
CREATE POLICY "Participants can read sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create sessions" ON public.chat_sessions;
CREATE POLICY "Users can create sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Session participants can read messages" ON public.messages;
CREATE POLICY "Session participants can read messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Users can insert messages in their sessions" ON public.messages;
CREATE POLICY "Users can insert messages in their sessions"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Bot Permissions
ALTER TABLE public.bot_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creator manages permissions" ON public.bot_permissions;
CREATE POLICY "Creator manages permissions"
  ON public.bot_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = bot_permissions.bot_id
      AND bots.creator_id = auth.uid()
    )
  );

-- User-Bot Relations
ALTER TABLE public.user_bot_relations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own relations" ON public.user_bot_relations;
CREATE POLICY "Users can read own relations"
  ON public.user_bot_relations FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own relations" ON public.user_bot_relations;
CREATE POLICY "Users can insert own relations"
  ON public.user_bot_relations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
