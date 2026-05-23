"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { generateSystemPrompt } from "@/lib/prompt-generator";
import { DEFAULT_BOT_FORM, type BotFormData } from "@/lib/bot-types";
import { WizardProgress } from "@/components/builder/WizardProgress";
import { Step1Identity } from "@/components/builder/Step1Identity";
import { Step2BotType } from "@/components/builder/Step2BotType";
import { Step3Customize } from "@/components/builder/Step3Customize";
import { Step4Advanced } from "@/components/builder/Step4Advanced";
import { Step4Visibility } from "@/components/builder/Step4Visibility";
import { BotPreview } from "@/components/builder/BotPreview";

export default function BuilderPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BotFormData>(DEFAULT_BOT_FORM);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateField = <K extends keyof BotFormData>(
    field: K,
    value: BotFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    setLoading(true);
    const systemPrompt = generateSystemPrompt(form);

    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: form.age ? parseInt(form.age) : null,
          systemPrompt,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "创建失败");
        setLoading(false);
        return;
      }

      toast.success("Bot 创建成功！");
      router.push("/chat");
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 to-white p-4">
      <div className="max-w-5xl mx-auto">
        <WizardProgress current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：表单 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              {step === 1 && (
                <Step1Identity
                  data={form}
                  onUpdate={updateField}
                  onNext={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <Step2BotType
                  data={form}
                  onUpdate={updateField}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <Step3Customize
                  data={form}
                  onUpdate={updateField}
                  onNext={() => setStep(4)}
                  onBack={() => setStep(2)}
                />
              )}
              {step === 4 && (
                <Step4Advanced
                  data={form}
                  onUpdate={updateField}
                  onNext={() => setStep(5)}
                  onBack={() => setStep(3)}
                />
              )}
              {step === 5 && (
                <Step4Visibility
                  data={form}
                  onUpdate={updateField}
                  onSubmit={handleCreate}
                  onBack={() => setStep(4)}
                  loading={loading}
                />
              )}
            </div>
          </div>

          {/* 右侧：预览 */}
          <div className="lg:col-span-1">
            <BotPreview data={form} />
          </div>
        </div>
      </div>
    </div>
  );
}
