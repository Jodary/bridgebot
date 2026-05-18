import { NextRequest } from "next/server";
import OpenAI from "openai";
import { createRouteClient } from "@/lib/supabase/route-client";
import { createServiceClient } from "@/lib/supabase/service";

async function getUser(req: NextRequest) {
  const routeClient = createRouteClient(req);
  return routeClient.auth.getUser().then((d) => d.data?.user ?? null);
}

export async function POST(req: NextRequest) {
  const { messages, systemPrompt, botId } = await req.json();

  if (!messages || !systemPrompt) {
    return Response.json({ error: "Missing messages or systemPrompt" }, { status: 400 });
  }

  const user = await getUser(req);
  const supabase = createServiceClient();

  // 1. 查找或创建聊天会话（复用同一次对话）
    let sessionId = "";
    if (user && botId) {
        const { data: existingSession } = await supabase
          .from("chat_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("bot_id", botId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingSession) {
          sessionId = existingSession.id;
        } else {
          const { data: newSession } = await supabase
            .from("chat_sessions")
            .insert({ user_id: user.id, bot_id: botId })
            .select("id")
            .single();
          sessionId = newSession?.id || "";
        }
    }

    // 2. 保存用户消息
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user" && lastUserMsg?.content) {
      await supabase.from("messages").insert({
        session_id: sessionId,
        role: "user",
        content: lastUserMsg.content,
      });
    }

  // 3. 读取记忆
  let memoryNotes = "";
  if (user && botId && sessionId) {
    const { data } = await supabase
      .from("user_bot_relations")
      .select("memory_notes")
      .eq("user_id", user.id)
      .eq("bot_id", botId)
      .maybeSingle();
    memoryNotes = data?.memory_notes ?? "";
  }

  const fullSystemPrompt = memoryNotes
    ? `${systemPrompt}\n\n关于当前用户的备忘信息（请在对话中自然引用，但不要刻意提起）：\n${memoryNotes}`
    : systemPrompt;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  const fullMessages = [
    { role: "system", content: fullSystemPrompt },
    ...messages,
  ];

  const tools = user && botId ? [{
    type: "function" as const,
    function: {
      name: "save_memory",
      description: "当用户要求你记住某些信息、或用户分享了值得长期记录的个人信息时调用此函数。将信息保存到持久记忆中，以便在未来的对话中引用。只在用户明确要求'记住'、或提供了重要的个人事实（如生日、喜好、经历等）时调用。",
      parameters: {
        type: "object",
        properties: {
          memory_content: {
            type: "string",
            description: "要保存的记忆内容，应为简洁的事实陈述。例如：'用户生日是5月20号，喜欢火锅和篮球。'",
          },
        },
        required: ["memory_content"],
      },
    },
  }] : undefined;

  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages: fullMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    temperature: 0.7,
    max_tokens: 1024,
    top_p: 0.9,
    frequency_penalty: 0,
    stream: true,
    tools,
    tool_choice: tools ? "auto" : undefined,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const toolCallMap = new Map<number, { id: string; name: string; arguments: string }>();
      let streamedContent = "";

      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;

          if (delta?.content) {
            streamedContent += delta.content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`));
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index;
              if (!toolCallMap.has(idx)) {
                toolCallMap.set(idx, { id: tc.id || "", name: "", arguments: "" });
              }
              const acc = toolCallMap.get(idx)!;
              if (tc.id) acc.id = tc.id;
              if (tc.function?.name) acc.name += tc.function.name;
              if (tc.function?.arguments) acc.arguments += tc.function.arguments;
            }
          }
        }

        // 4. 保存 AI 回复
        if (sessionId && streamedContent) {
          await supabase.from("messages").insert({
            session_id: sessionId,
            role: "assistant",
            content: streamedContent,
          });
        }

        // 处理 tool calls（保存记忆）
        if (toolCallMap.size > 0 && user && botId) {
          const toolCalls = Array.from(toolCallMap.values());

          const assistantMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
            role: "assistant",
            content: streamedContent || null,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: "function",
              function: { name: tc.name, arguments: tc.arguments },
            })),
          };

          const toolMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
          let memoryWasSaved = false;

          for (const tc of toolCalls) {
            if (tc.name === "save_memory") {
              try {
                const args = JSON.parse(tc.arguments);
                const newMemory = args.memory_content;
                const updatedMemory = memoryNotes
                  ? `${memoryNotes}\n${newMemory}`
                  : newMemory;

                await supabase
                  .from("user_bot_relations")
                  .upsert(
                    { user_id: user.id, bot_id: botId, memory_notes: updatedMemory },
                    { onConflict: "user_id,bot_id" }
                  );

                memoryWasSaved = true;
                toolMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: `已保存。当前记忆：\n${updatedMemory}`,
                });
              } catch {
                toolMessages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: "保存失败，请提示用户稍后重试。",
                });
              }
            }
          }

          if (memoryWasSaved) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ memory_updated: true })}\n\n`));
          }

          const followUpMessages = [
            ...fullMessages,
            assistantMessage,
            ...toolMessages,
          ];

          let followUpContent = "";
          const followUpStream = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
            messages: followUpMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.9,
            frequency_penalty: 0,
            stream: true,
          });

          for await (const chunk of followUpStream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              followUpContent += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          if (sessionId && followUpContent) {
            await supabase.from("messages").insert({
              session_id: sessionId,
              role: "assistant",
              content: followUpContent,
            });
          }
        }

        // 5. 发送 sessionId 给前端
        if (sessionId) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sessionId })}\n\n`));
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "流式响应中断" })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}