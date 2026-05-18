"use client";

import { ChatInterface } from "@/components/chat/ChatInterface";

interface ChatWrapperProps {
  bot: {
    id: string;
    name: string;
    avatar_url: string | null;
    system_prompt: string;
    category: string | null;
    speaking_style: string | null;
    visibility: string | null;
  };
}

export function ChatWrapper({ bot }: ChatWrapperProps) {
  return (
    <div className="h-screen flex flex-col bg-white">
      <ChatInterface
        bot={{
          id: bot.id,
          name: bot.name,
          avatar_url: bot.avatar_url,
          systemPrompt: bot.system_prompt,
          category: bot.category,
          speakingStyle: bot.speaking_style,
          visibility: bot.visibility,
        }}
      />
    </div>
  );
}
