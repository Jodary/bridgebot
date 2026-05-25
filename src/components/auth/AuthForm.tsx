"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      } else {
        router.push("/chat");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/chat` },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      } else {
        toast.success("注册成功！请检查邮箱确认（或直接登录）");
        router.push("/auth/login");
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {isLogin ? "欢迎回来" : "创建账号"}
        </CardTitle>
        <CardDescription>
          {isLogin ? "登录以管理你的 AI Bot" : "注册后即可创建专属 AI"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="至少 6 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {isLogin && (
              <div className="text-right">
                <a href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  忘记密码？
                </a>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "处理中..." : isLogin ? "登录" : "注册"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isLogin ? (
              <>
                还没有账号？{" "}
                <a href="/auth/register" className="text-primary hover:underline">
                  注册
                </a>
              </>
            ) : (
              <>
                已有账号？{" "}
                <a href="/auth/login" className="text-primary hover:underline">
                  登录
                </a>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
