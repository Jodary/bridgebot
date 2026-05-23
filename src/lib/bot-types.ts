export type UserIdentity = "student" | "teacher" | "business" | "content_creator" | "other";

export type BotCategory =
  | "emotional_companion"
  | "study_assistant"
  | "tutor"
  | "customer_service"
  | "custom";

export type SpeakingStyle = "formal" | "casual" | "funny" | "strict";

export type Visibility = "private" | "specific_users" | "public";

export interface BotFormData {
  // Step 1
  identity: UserIdentity | null;
  // Step 2
  category: BotCategory | null;
  // Step 3 - 基础设定（必填）
  name: string;
  avatar_url: string;
  gender: string;
  age: string;
  relationship: string;
  personality: string;
  speakingStyle: SpeakingStyle;
  forbiddenBehaviors: string;
  // Step 4 - 高级定制（选填）
  hobbies: string;
  interests: string;
  sharedActivities: string;
  dietPreferences: string;
  sleepSchedule: string;
  memorableMoments: string;
  weaknesses: string;
  anniversaries: string;
  customFaqs: string;
  // Step 5 - 发布
  visibility: Visibility;
  allowedEmails: string[];
}

export const DEFAULT_BOT_FORM: BotFormData = {
  identity: null,
  category: null,
  name: "",
  avatar_url: "",
  gender: "",
  age: "",
  relationship: "",
  personality: "",
  speakingStyle: "casual",
  forbiddenBehaviors: "",
  hobbies: "",
  interests: "",
  sharedActivities: "",
  dietPreferences: "",
  sleepSchedule: "",
  memorableMoments: "",
  weaknesses: "",
  anniversaries: "",
  customFaqs: "",
  visibility: "private",
  allowedEmails: [],
};

export const IDENTITY_OPTIONS = [
  { value: "student" as const, label: "学生", emoji: "📚" },
  { value: "teacher" as const, label: "教师", emoji: "🏫" },
  { value: "business" as const, label: "商务", emoji: "💼" },
  { value: "content_creator" as const, label: "内容创作者", emoji: "🎬" },
  { value: "other" as const, label: "其他", emoji: "✨" },
];

export const CATEGORY_OPTIONS = [
  { value: "emotional_companion" as const, label: "情感陪伴", emoji: "💝", desc: "像朋友一样聊天、倾诉" },
  { value: "study_assistant" as const, label: "学习助手", emoji: "📖", desc: "帮助学习、答疑解惑" },
  { value: "tutor" as const, label: "辅导老师", emoji: "👩‍🏫", desc: "系统性教学、指导" },
  { value: "customer_service" as const, label: "客服助手", emoji: "🎧", desc: "回答客户问题" },
  { value: "custom" as const, label: "自定义角色", emoji: "🎭", desc: "自由定义 Bot 人格" },
];

export const SPEAKING_STYLE_OPTIONS = [
  { value: "formal" as const, label: "正式", desc: "用词规范、礼貌得体" },
  { value: "casual" as const, label: "随性", desc: "像朋友一样自然聊天" },
  { value: "funny" as const, label: "幽默", desc: "风趣搞笑、轻松愉快" },
  { value: "strict" as const, label: "严肃", desc: "严谨认真、不苟言笑" },
];
