import { SPEAKING_STYLE_OPTIONS, type BotFormData, type SpeakingStyle } from "@/lib/bot-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: BotFormData;
  onUpdate: <K extends keyof BotFormData>(field: K, value: BotFormData[K]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Customize({ data, onUpdate, onNext, onBack }: Props) {
  const valid = data.name.trim().length > 0 && data.personality.trim().length > 0;

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">定制你的 AI 人格</CardTitle>
        <CardDescription>填写以下信息，让 Bot 拥有独特个性</CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bot 名称 *</Label>
            <Input
              id="name"
              placeholder="给你的 Bot 起个名字"
              value={data.name}
              onChange={(e) => onUpdate("name", e.target.value)}
              maxLength={30}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">性别</Label>
            <Input
              id="gender"
              placeholder="如：男、女、无"
              value={data.gender}
              onChange={(e) => onUpdate("gender", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">年龄</Label>
            <Input
              id="age"
              type="number"
              placeholder="如：20"
              value={data.age}
              onChange={(e) => onUpdate("age", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship">与用户的关系</Label>
            <Input
              id="relationship"
              placeholder="如：朋友、导师、助手"
              value={data.relationship}
              onChange={(e) => onUpdate("relationship", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="personality">人格描述 *</Label>
          <Textarea
            id="personality"
            placeholder="描述 Bot 的性格，如：温柔、耐心、像学长一样鼓励人"
            value={data.personality}
            onChange={(e) => onUpdate("personality", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>说话风格</Label>
          <Select
            value={data.speakingStyle}
            onValueChange={(v) => onUpdate("speakingStyle", v as SpeakingStyle)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEAKING_STYLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label} — {opt.desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="forbidden">禁止事项</Label>
          <Textarea
            id="forbidden"
            placeholder="Bot 绝对不能说的话或做的事，如：不能说脏话、不讨论政治"
            value={data.forbiddenBehaviors}
            onChange={(e) => onUpdate("forbiddenBehaviors", e.target.value)}
            rows={2}
          />
        </div>
      </CardContent>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          上一步
        </Button>
        <Button onClick={onNext} disabled={!valid} size="lg">
          下一步
        </Button>
      </div>
    </div>
  );
}
