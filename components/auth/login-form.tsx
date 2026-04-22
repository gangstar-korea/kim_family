"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { loginAction } from "@/lib/auth/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {
  ok: false,
  message: "",
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="phone">휴대폰 번호</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="010-1234-5678"
          required
          aria-describedby="phone-help"
        />
        <p id="phone-help" className="text-xs text-muted-foreground">
          하이픈은 입력하지 않아도 됩니다.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          required
        />
      </div>

      {state.message ? (
        <p
          className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        로그인
      </Button>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        로그인에 성공하면 실제 가족 공간으로 이동합니다.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        처음 방문하셨나요?{" "}
        <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
          가족 등록 신청
        </Link>
      </p>
    </form>
  );
}
