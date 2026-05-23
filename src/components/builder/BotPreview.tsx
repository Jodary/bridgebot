import type { BotFormData } from "@/lib/bot-types";
import { generateSystemPrompt } from "@/lib/prompt-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: BotFormData;
}

export function BotPreview({ data }: Props) {
  const systemPrompt = generateSystemPrompt(data);
  const initials = (data.name || "AI").slice(0, 2).toUpperCase();

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          实时预览
          <Badge variant="secondary" className="text-xs">Preview</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bot Profile */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="w-12 h-12">
            <AvatarImage src={data.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{data.name || "未命名 Bot"}</div>
            <div className="text-xs text-muted-foreground">
              {data.gender && `${data.gender} · `}
              {data.age && `${data.age}岁 · `}
              {data.speakingStyle || "casual"}
            </div>
          </div>
        </div>

        {/* Info Tags */}
        <div className="flex flex-wrap gap-1">
          {data.relationship && (
            <Badge variant="outline">关系：{data.relationship}</Badge>
          )}
          {data.identity && (
            <Badge variant="outline">用户身份：{data.identity}</Badge>
          )}
          {data.category && (
            <Badge variant="outline">类型：{data.category}</Badge>
          )}
        </div>

        {/* System Prompt Preview */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">
            生成的 System Prompt
          </div>
          <pre className="text-xs bg-muted p-3 rounded-lg whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {systemPrompt || "填写信息后自动生成..."}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
