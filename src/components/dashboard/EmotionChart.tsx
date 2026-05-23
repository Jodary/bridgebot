"use client";

    import { useMemo } from "react";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

    interface EmotionChartProps {
      dailyStats: Array<{
        date: string;
        avgEmotionScore: number | null;
      }>;
    }

    export function EmotionChart({ dailyStats }: EmotionChartProps) {
      const data = useMemo(() => {
        return dailyStats.map((d) => ({
          date: d.date.split("-").slice(1).join("/"),
          score: d.avgEmotionScore ?? 0,
        }));
      }, [dailyStats]);

      if (data.length === 0) {
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">情绪趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm text-center py-8">暂无数据</p>
            </CardContent>
          </Card>
        );
      }

      const maxScore = Math.max(...data.map((d) => Math.abs(d.score)), 0.5);

      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">情绪趋势（过去 {data.length} 天）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-40">
              {/* Y 轴标签 */}
              <div className="absolute -left-2 -top-1 text-[10px] text-muted-foreground">+1</div>
              <div className="absolute -left-2 bottom-0 text-[10px] text-muted-foreground">-1</div>
              {/* 中线 */}
              <div className="absolute left-6 right-0 top-1/2 border-t border-dashed border-muted-foreground/30" />

              {/* 柱状图 */}
              <div className="flex items-end gap-1 h-full pl-8 pr-2">
                {data.map((d, i) => {
                  const heightPct = (Math.abs(d.score) / maxScore) * 50;
                  const isPositive = d.score >= 0;

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end h-full"
                    >
                      <div
                        className={`w-full rounded-t-sm transition-all ${
                          isPositive ? "bg-green-400" : "bg-red-400"
                        }`}
                        style={{
                          height: `${Math.max(heightPct, 2)}%`,
                          marginTop: isPositive ? "auto" : undefined,
                          marginBottom: isPositive ? undefined : "auto",
                          transform: isPositive ? undefined : "rotate(180deg)",
                        }}
                        title={`${d.date}: ${d.score.toFixed(2)}`}
                      />
                      <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                        {d.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }