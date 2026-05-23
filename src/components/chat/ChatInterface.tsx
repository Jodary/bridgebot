"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, BookOpen, Check, X } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotInfo {
  id?: string;
  name: string;
  avatar_url?: string | null;
  systemPrompt: string;
  category?: string | null;
  speakingStyle?: string | null;
  visibility?: string | null;
}

interface Props {
  bot: ChatBotInfo;
}

export function ChatInterface({ bot }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const relationCreated = useRef(false);
  const sessionIdRef = useRef<string>("");

  // 记忆功能
  const [memoryNotes, setMemoryNotes] = useState("");
  const [memoryDraft, setMemoryDraft] = useState("");
  const [showMemoryEditor, setShowMemoryEditor] = useState(false);
  const [memorySaving, setMemorySaving] = useState(false);

  const refreshMemory = useCallback(() => {
    if (!bot.id) return;
    fetch(`/api/bots/relation?botId=${bot.id}`)
      .then((r) => r.json())
      .then((d) => {
        setMemoryNotes(d.memoryNotes ?? "");
        setMemoryDraft(d.memoryNotes ?? "");
      })
      .catch(() => {});
  }, [bot.id]);

  useEffect(() => {
    refreshMemory();
  }, [refreshMemory]);

  // 加载历史消息，恢复对话上下文
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    if (!bot.id || historyLoaded) return;

    fetch(`/api/chat?botId=${bot.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        }
        if (data.sessionId) {
          sessionIdRef.current = data.sessionId;
        }
        setHistoryLoaded(true);
      })
      .catch(() => {
        setHistoryLoaded(true);
      });
  }, [bot.id, historyLoaded]);

  const saveMemory = async () => {
    if (!bot.id || memorySaving) return;
    setMemorySaving(true);
    try {
      await fetch("/api/bots/relation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id, memoryNotes: memoryDraft }),
      });
      setMemoryNotes(memoryDraft);
      setShowMemoryEditor(false);
    } catch {}
    setMemorySaving(false);
  };

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // 建立用户关联（任何 bot 首次发消息时）
    if (bot.id && !relationCreated.current) {
      relationCreated.current = true;
      fetch("/api/bots/relation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id }),
      }).catch(() => {
        relationCreated.current = false;
      });
    }

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    setMessages([...updatedMessages, { role: "assistant", content: "" }]);

    // 后端负责从 DB 加载记忆并注入 system prompt，前端只传基础 prompt + botId
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          systemPrompt: bot.systemPrompt,
          botId: bot.id,
        }),
      });

      if (!response.ok) throw new Error("API error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let memoryUpdated = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.sessionId) {
  sessionIdRef.current = parsed.sessionId;
}
                if (parsed.memory_updated) {
                  memoryUpdated = true;
                }
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages((prev) => {
                    const newMsgs = [...prev];
                    const lastIdx = newMsgs.length - 1;
                    if (lastIdx >= 0 && newMsgs[lastIdx].role === "assistant") {
                      newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: fullContent };
                    }
                    return newMsgs;
                  });
                }
              } catch {
                // skip malformed JSON
              }
            }
          }
        }
      }

      // AI 保存了记忆 → 刷新本地状态
      if (memoryUpdated) {
        refreshMemory();
      }
    } catch {
      setMessages((prev) => {
        const newMsgs = [...prev];
        const lastIdx = newMsgs.length - 1;
        if (lastIdx >= 0 && newMsgs[lastIdx].role === "assistant") {
          newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: "抱歉，出了点问题...请重试" };
        }
        return newMsgs;
      });
    } finally {
            // AI 回复流结束后，触发分析
      if (sessionIdRef.current && bot.id) {
        fetch("/api/analytics/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            botId: bot.id,
          }),
        }).catch(() => {});
      }
      setLoading(false);
    }
  };

  const initials = (bot.name || "AI").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      {/* Bot Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white/80 backdrop-blur shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={bot.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-semibold">{bot.name}</div>
          <div className="text-xs text-muted-foreground">
            {bot.category || "custom"} · {bot.speakingStyle || "casual"}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMemoryEditor(!showMemoryEditor)}
          title="Bot 对你的记忆"
        >
          <BookOpen className="w-4 h-4" />
          {memoryNotes && (
            <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 inline-block" />
          )}
        </Button>
      </div>

      {/* Memory Editor */}
      {showMemoryEditor && (
        <div className="p-3 border-b bg-amber-50/50 space-y-2 shrink-0">
          <p className="text-xs text-muted-foreground">
            告诉 {bot.name} 关于你的重要信息，它会在对话中记住这些。例如：生日是 5 月 20 号、喜欢看电影和篮球、对猫过敏。
          </p>
          <Textarea
            value={memoryDraft}
            onChange={(e) => setMemoryDraft(e.target.value)}
            placeholder="输入希望 Bot 记住的信息..."
            rows={3}
            className="text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMemoryDraft(memoryNotes);
                setShowMemoryEditor(false);
              }}
            >
              <X className="w-3 h-3 mr-1" />
              取消
            </Button>
            <Button size="sm" onClick={saveMemory} disabled={memorySaving}>
              <Check className="w-3 h-3 mr-1" />
              保存
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-20">
            <div className="text-4xl mb-3">💬</div>
            <p>开始和 {bot.name} 聊天吧！</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              }`}
            >
              {msg.content || (
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-75">.</span>
                  <span className="animate-bounce delay-150">.</span>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white/80 backdrop-blur shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="输入消息..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
