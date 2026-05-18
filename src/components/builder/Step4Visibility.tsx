import { useState } from "react";
import type { BotFormData, Visibility } from "@/lib/bot-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const VISIBILITY_OPTIONS = [
  { value: "private" as const, label: "私人", desc: "只有你自己可以看到和使用" },
  { value: "specific_users" as const, label: "定制", desc: "只有你和指定的用户可以使用" },
  { value: "public" as const, label: "公开", desc: "在市场中展示，所有人都可以使用" },
];

interface Props {
  data: BotFormData;
  onUpdate: <K extends keyof BotFormData>(field: K, value: BotFormData[K]) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function Step4Visibility({ data, onUpdate, onSubmit, onBack, loading }: Props) {
  const [emailInput, setEmailInput] = useState("");

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && email.includes("@") && !data.allowedEmails.includes(email)) {
      onUpdate("allowedEmails", [...data.allowedEmails, email]);
      setEmailInput("");
    }
  };

  const removeEmail = (email: string) => {
    onUpdate(
      "allowedEmails",
      data.allowedEmails.filter((e) => e !== email)
    );
  };

  return (
    <div className="space-y-6">
      <CardHeader className="p-0 text-center">
        <CardTitle className="text-2xl">发布 Bot</CardTitle>
        <CardDescription>设置谁可以使用你的 Bot</CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        <RadioGroup
          value={data.visibility}
          onValueChange={(v) => onUpdate("visibility", v as Visibility)}
        >
          {VISIBILITY_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
              onClick={() => onUpdate("visibility", opt.value)}
            >
              <RadioGroupItem value={opt.value} id={opt.value} />
              <Label htmlFor={opt.value} className="cursor-pointer">
                <div className="font-medium">{opt.label}</div>
                <div className="text-sm text-muted-foreground">{opt.desc}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        {data.visibility === "specific_users" && (
          <div className="space-y-2 pl-10">
            <Label>添加授权邮箱</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="user@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
              />
              <Button type="button" variant="outline" onClick={addEmail}>
                添加
              </Button>
            </div>
            {data.allowedEmails.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {data.allowedEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeEmail(email)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          上一步
        </Button>
        <Button onClick={onSubmit} disabled={loading} size="lg">
          {loading ? "创建中..." : "创建 Bot"}
        </Button>
      </div>
    </div>
  );
}
