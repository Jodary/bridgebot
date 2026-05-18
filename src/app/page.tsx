"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Sparkles, Store } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/chat");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-100 p-4">
      <Card className="w-full max-w-lg p-8 sm:p-12 text-center space-y-8 shadow-lg border-0">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Create or Use Your Own AI
          </h1>
          <p className="text-muted-foreground text-lg">
            创建专属 AI 伙伴，或与已有的 AI 对话
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="default"
            className="flex-1 h-14 text-base gap-2"
            onClick={() => router.push("/chat")}
          >
            <MessageCircle className="w-5 h-5" />
            使用 AI
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 h-14 text-base gap-2"
            onClick={() => router.push("/market")}
          >
            <Store className="w-5 h-5" />
            Bot 市场
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 h-14 text-base gap-2"
            onClick={() => router.push("/builder/start")}
          >
            <Sparkles className="w-5 h-5" />
            创建我的 AI
          </Button>
        </div>
      </Card>
    </div>
  );
}
