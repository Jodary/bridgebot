import type { BotFormData } from "@/lib/bot-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: BotFormData;
  onUpdate: <K extends keyof BotFormData>(field: K, value: BotFormData[K]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Advanced({ data, onUpdate, onNext, onBack }: Props) {
  const fields: { key: keyof BotFormData; label: string; placeholder: string; rows: number }[] = [
    {
      key: "hobbies",
      label: "喜欢玩什么",
      placeholder: "例如：英雄联盟、篮球、拼乐高",
      rows: 2,
    },
    {
      key: "interests",
      label: "喜欢看什么",
      placeholder: "例如：科幻片（星际穿越、银翼杀手）、悬疑小说",
      rows: 2,
    },
    {
      key: "sharedActivities",
      label: "一起做过的事",
      placeholder: "例如：一起通关双人成行、去年去了海边",
      rows: 2,
    },
    {
      key: "dietPreferences",
      label: "饮食偏好",
      placeholder: "例如：爱吃辣的，对方最爱吃火锅",
      rows: 2,
    },
    {
      key: "sleepSchedule",
      label: "作息习惯",
      placeholder: "例如：7 点起床，23 点睡觉",
      rows: 1,
    },
    {
      key: "memorableMoments",
      label: "最难忘的事",
      placeholder: "例如：第一次见面在星巴克，那天还下雨了",
      rows: 2,
    },
    {
      key: "weaknesses",
      label: "小缺点",
      placeholder: "例如：赖床、有点路痴",
      rows: 1,
    },
    {
      key: "anniversaries",
      label: "纪念日",
      placeholder: "- 2024-03-15 — 第一次见面\n- 2024-05-20 — 正式在一起\n- 2025-01-01 — 跨年旅行",
      rows: 4,
    },
    {
      key: "customFaqs",
      label: "常见问答",
      placeholder: "问：你会一直陪着我吗？\n答：当然啦，我会一直在这里陪着你！\n\n问：今天过得怎么样？\n答：只要跟你聊天就是最好的一天~",
      rows: 4,
    },
  ];

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">充实的 Ta</CardTitle>
        <CardDescription>
          帮助 Bot 更了解你（全部选填，可跳过）
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-4 max-h-[55vh] overflow-y-auto pr-2">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label className="text-sm">{f.label}</Label>
            <Textarea
              value={data[f.key] as string}
              onChange={(e) => onUpdate(f.key, e.target.value as string)}
              placeholder={f.placeholder}
              rows={f.rows}
            />
          </div>
        ))}
      </CardContent>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          上一步
        </Button>
        <Button onClick={onNext}>
          下一步
        </Button>
      </div>
    </div>
  );
}
