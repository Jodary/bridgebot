import { IDENTITY_OPTIONS, type UserIdentity, type BotFormData } from "@/lib/bot-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: BotFormData;
  onUpdate: (field: "identity", value: UserIdentity) => void;
  onNext: () => void;
}

export function Step1Identity({ data, onUpdate, onNext }: Props) {
  return (
    <div className="space-y-6">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">What best describes you?</CardTitle>
        <CardDescription>选择你的身份，我们会推荐合适的 Bot 模板</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {IDENTITY_OPTIONS.map((opt) => (
            <Card
              key={opt.value}
              className={`cursor-pointer text-center p-4 transition-all hover:shadow-md ${
                data.identity === opt.value
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => onUpdate("identity", opt.value)}
            >
              <div className="text-2xl mb-1">{opt.emoji}</div>
              <div className="font-medium text-sm">{opt.label}</div>
            </Card>
          ))}
        </div>
      </CardContent>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!data.identity} size="lg">
          下一步
        </Button>
      </div>
    </div>
  );
}
