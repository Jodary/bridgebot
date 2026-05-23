import { CATEGORY_OPTIONS, type BotCategory, type BotFormData } from "@/lib/bot-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: BotFormData;
  onUpdate: (field: "category", value: BotCategory) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2BotType({ data, onUpdate, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">What kind of AI do you want?</CardTitle>
        <CardDescription>选择 Bot 的应用场景</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORY_OPTIONS.map((opt) => (
            <Card
              key={opt.value}
              className={`cursor-pointer p-4 transition-all hover:shadow-md ${
                data.category === opt.value
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => onUpdate("category", opt.value)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opt.emoji}</span>
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          上一步
        </Button>
        <Button onClick={onNext} disabled={!data.category} size="lg">
          下一步
        </Button>
      </div>
    </div>
  );
}
