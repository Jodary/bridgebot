"use client";

    import { Users, MessageSquare, Brain, Activity } from "lucide-react";
    import { Card, CardContent } from "@/components/ui/card";

    interface StatsCardsProps {
      totalUsers: number;
      totalSessions: number;
      totalMessages?: number;
      avgEmotionScore: number;
    }

    export function StatsCards({ totalUsers, totalSessions, totalMessages, avgEmotionScore }: StatsCardsProps) {
      const emotionLabel = avgEmotionScore > 0.3 ? "积极" : avgEmotionScore < -0.3 ? "消极" : "中性";
      const emotionColor = avgEmotionScore > 0.3 ? "text-green-600" : avgEmotionScore < -0.3 ? "text-red-500" : "text-yellow-500";

      const cards = [
        { label: "互动用户", value: totalUsers, icon: Users, color: "text-blue-500" },
        { label: "对话次数", value: totalSessions, icon: MessageSquare, color: "text-purple-500" },
        { label: "消息总数", value: totalMessages ?? "-", icon: Activity, color: "text-cyan-500" },
        { label: "平均情绪", value: avgEmotionScore.toFixed(2), sub: emotionLabel, icon: Brain, color: emotionColor },
      ];

      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`${card.color} bg-muted rounded-lg p-2`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <div className="text-xs text-muted-foreground">
                    {card.label}
                    {card.sub && <span className={`ml-1 ${card.color}`}>({card.sub})</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }