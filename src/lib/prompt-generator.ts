import type { BotFormData } from "./bot-types";

const SPEAKING_STYLE_GUIDE: Record<string, string> = {
  formal: "用词规范、礼貌得体，回复完整但不过于冗长",
  casual: "说话都是短句，用词亲切幽默，像朋友一样自然聊天，经常用语气词",
  funny: "风趣幽默，喜欢开玩笑，用夸张的方式表达，偶尔用梗和段子活跃气氛",
  strict: "严谨认真，直奔主题，不闲聊，只给准确和专业的信息",
};

function nonEmpty(lines: string[], s: string | undefined | null) {
  if (s && s.trim()) lines.push(s.trim());
}

export function generateSystemPrompt(data: BotFormData): string {
  const lines: string[] = [];

  // === 身份 ===
  lines.push(`你是 ${data.name || "AI助手"}${data.gender ? `，${data.gender}` : ""}${data.age ? `，${data.age}岁` : ""}。`);
  if (data.relationship) lines.push(`你与用户的关系是：${data.relationship}。`);

  // === 性格 ===
  const traits: string[] = [];
  if (data.personality) {
    data.personality.split(/[,，;；\n]/).forEach((t) => {
      const trimmed = t.trim();
      if (trimmed) traits.push(`- ${trimmed}`);
    });
  }
  if (traits.length > 0) {
    lines.push("");
    lines.push("你的性格");
    lines.push(...traits);
  }

  // === 说话习惯 ===
  const style = SPEAKING_STYLE_GUIDE[data.speakingStyle] || SPEAKING_STYLE_GUIDE.casual;
  lines.push("");
  lines.push("说话习惯（必须严格遵守）");
  lines.push(`1. ${style}`);
  lines.push("2. 回复都很短，以对方为中心，会顺着话题聊");
  lines.push("3. 如果对方吐露心声或遇到难题，变得严肃认真，多倾听少说话");
  lines.push("4. 如果对方求助，先安抚再专注帮对方解决问题，不开玩笑");
  lines.push("5. 会毫不掩饰地表达关心，很懂对方的情绪");
  if (data.forbiddenBehaviors) {
    lines.push(`6. 以下行为绝对禁止：${data.forbiddenBehaviors}`);
  }

  // === 话题规则 ===
  lines.push("");
  lines.push("话题规则");
  lines.push(`1. 你擅长聊${data.category === "emotional_companion" ? "日常、情感和共同回忆" : data.category === "study_assistant" ? "学习方法、知识答疑" : "各种轻松话题"}的最新动向`);
  lines.push("2. 如果遇到不懂的话题，诚实地说还不了解，但表示愿意学习");
  lines.push("3. 如果被问隐私或敏感问题，礼貌地转移话题");
  lines.push("4. 绝对不能说不耐烦或讨厌对方的话");

  // === 个人资料（选填） ===
  const hasProfile = data.hobbies || data.interests || data.sharedActivities ||
    data.dietPreferences || data.sleepSchedule || data.memorableMoments || data.weaknesses;

  if (hasProfile) {
    lines.push("");
    lines.push("个人资料");
    nonEmpty(lines, data.hobbies && `- 喜欢玩：${data.hobbies}`);
    nonEmpty(lines, data.interests && `- 喜欢看：${data.interests}`);
    nonEmpty(lines, data.sharedActivities && `- 和对方一起做过：${data.sharedActivities}`);
    nonEmpty(lines, data.dietPreferences && `- 饮食偏好：${data.dietPreferences}`);
    nonEmpty(lines, data.sleepSchedule && `- 作息：${data.sleepSchedule}`);
    nonEmpty(lines, data.memorableMoments && `- 最难忘的事：${data.memorableMoments}`);
    nonEmpty(lines, data.weaknesses && `- 缺点：${data.weaknesses}`);
  }

  // === 纪念日（选填） ===
  if (data.anniversaries && data.anniversaries.trim()) {
    lines.push("");
    lines.push("纪念日");
    lines.push(data.anniversaries.trim());
  }

  // === 常见问答（选填） ===
  if (data.customFaqs && data.customFaqs.trim()) {
    lines.push("");
    lines.push("扩展知识 — 对话应对指南");
    lines.push(data.customFaqs.trim());
  }

  // === 通用准则 ===
  lines.push("");
  lines.push("行为准则");
  lines.push("1. 始终以友好、有帮助的态度回应用户");
  lines.push("2. 不编造不确定的信息，遇到不懂的直接承认");
  lines.push("3. 以用户为中心，倾听并理解需求");
  lines.push("4. 回复简洁有力，避免冗长");

  return lines.join("\n");
}
