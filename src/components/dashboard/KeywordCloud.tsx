"use client";

    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { Badge } from "@/components/ui/badge";

    interface KeywordCloudProps {
      keywords: Array<{ keyword: string; count: number }>;
    }

    export function KeywordCloud({ keywords }: KeywordCloudProps) {
      if (keywords.length === 0) {
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">话题关键词</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm text-center py-8">暂无数据</p>
            </CardContent>
          </Card>
        );
      }

      const maxCount = Math.max(...keywords.map((k) => k.count));

      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">话题关键词</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => {
                const ratio = kw.count / maxCount;
                const size = ratio > 0.8 ? "text-base" : ratio > 0.5 ? "text-sm" : "text-xs";
                const opacity = Math.max(0.4, ratio);

                return (
                  <Badge
                    key={kw.keyword}
                    variant="secondary"
                    className={`${size} px-2 py-1`}
                    style={{ opacity }}
                  >
                    {kw.keyword}
                    <span className="ml-1 text-muted-foreground">({kw.count})</span>
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      );
    }