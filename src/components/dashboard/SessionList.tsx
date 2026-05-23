"use client";

    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { Badge } from "@/components/ui/badge";

    interface SessionItem {
      id: string;
      userId: string;
      emotion: string | null;
      emotionScore: number | null;
      keywords: string[] | null;
      summary: string | null;
      messageCount: number | null;
      analyzedAt: string | null;
    }

    interface SessionListProps {
      sessions: SessionItem[];
    }

    const EMOTION_EMOJI: Record<string, string> = {
      happy: "😊",
      sad: "😢",
      anxious: "😰",
      angry: "😠",
      neutral: "😐",
    };

    export function SessionList({ sessions }: SessionListProps) {
      if (sessions.length === 0) {
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">最近对话</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm text-center py-8">暂无对话数据</p>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">最近对话（{sessions.length}）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-lg shrink-0">
                    {EMOTION_EMOJI[s.emotion || "neutral"] || "😐"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{s.summary || "（无摘要）"}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(s.keywords || []).slice(0, 3).map((kw) => (
                        <Badge key={kw} variant="outline" className="text-[10px] px-1.5 py-0">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {s.messageCount}条
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }