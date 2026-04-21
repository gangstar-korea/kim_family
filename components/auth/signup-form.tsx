"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { signupAction } from "@/lib/auth/auth-actions";
import { BRANCH_OPTIONS, FAMILY_ROLE_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState = {
  ok: false,
  message: "",
};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName">이름</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          placeholder="김가족"
          required
        />
      </div>

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
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="branchCode">지파</Label>
          <Select name="branchCode" required>
            <SelectTrigger id="branchCode">
              <SelectValue placeholder="지파 선택" />
            </SelectTrigger>
            <SelectContent>
              {BRANCH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="familyRoleType">가족 구분</Label>
          <Select name="familyRoleType" required>
            <SelectTrigger id="familyRoleType">
              <SelectValue placeholder="구분 선택" />
            </SelectTrigger>
            <SelectContent>
              {FAMILY_ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="8자 이상"
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 한 번 더 입력"
          minLength={8}
          required
        />
      </div>

      {state.message ? (
        <div
          className={
            state.ok
              ? "rounded-md bg-primary/10 p-3 text-sm leading-6 text-primary"
              : "text-sm text-destructive"
          }
          role="status"
        >
          {state.message}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        가입 신청
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
