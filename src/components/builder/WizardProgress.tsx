const STEPS = [
  { num: 1, label: "你的身份" },
  { num: 2, label: "Bot 类型" },
  { num: 3, label: "基础设定" },
  { num: 4, label: "充实的 Ta" },
  { num: 5, label: "发布设置" },
];

export function WizardProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              current >= s.num
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s.num}
          </div>
          <span
            className={`text-sm hidden sm:inline ${
              current >= s.num ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 h-[2px] hidden sm:block ${
                current > s.num ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
