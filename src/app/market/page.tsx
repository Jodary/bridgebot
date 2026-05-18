"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, MessageCircle } from "lucide-react";

interface Bot {
  id: string;
  name: string;
  slug: string;
  visibility: "private" | "specific_users" | "public";
  creator_id: string;
  category?: string;
  personality?: string;
}

export default function MarketPage() {
  const { user, loading: authLoading } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadMarket = useCallback(async () => {
    try {
      const res = await fetch("/api/bots/market");
      if (res.ok) {
        setBots(await res.json());
      }
    } catch {
      setBots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    loadMarket();
  }, [user, authLoading, router, loadMarket]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 to-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/chat")}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Bot 市场</h1>
              <p className="text-muted-foreground text-sm">
                发现更多有趣的 AI 伙伴
              </p>
            </div>
          </div>
        </div>

        {/* Bot Grid */}
        {bots.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <div className="text-4xl">📭</div>
            <div className="text-muted-foreground">还没有公开的 Bot</div>
            <Button onClick={() => router.push("/builder/start")}>
              <Sparkles className="w-4 h-4 mr-1" />
              创建第一个 Bot
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots.map((bot) => (
              <Card
                key={bot.id}
                className="p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => router.push(`/bot/${bot.slug}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(bot.name || "AI").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{bot.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {bot.category || "custom"}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    对话
                  </Badge>
                </div>
                {bot.personality && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {bot.personality}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
