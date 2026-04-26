"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

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

const TEXT = {
  name: "이름",
  phone: "휴대폰 번호",
  familyLine: "1대 가족",
  familyRole: "가족 구분",
  password: "비밀번호",
  passwordConfirm: "비밀번호 확인",
  namePlaceholder: "이름 입력",
  familyLinePlaceholder: "가족 선택",
  familyRolePlaceholder: "구분 선택",
  passwordPlaceholder: "8자 이상 입력",
  passwordConfirmPlaceholder: "비밀번호를 다시 입력",
  submit: "가입 신청",
  alreadyAccount: "이미 계정이 있나요?",
  login: "로그인",
  successTitle: "등록 신청이 접수되었습니다",
  successDescription:
    "관리자 김동인, 김동선 승인 후 가족 사이트 이용이 가능합니다.",
};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  if (state.ok) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </div>
          <h3 className="mt-4 text-xl font-bold text-foreground">{TEXT.successTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{state.message}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {TEXT.successDescription}
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {TEXT.alreadyAccount}{" "}
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            {TEXT.login}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName">{TEXT.name}</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          placeholder={TEXT.namePlaceholder}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{TEXT.phone}</Label>
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
          <Label htmlFor="branchCode">{TEXT.familyLine}</Label>
          <Select name="branchCode" required>
            <SelectTrigger id="branchCode">
              <SelectValue placeholder={TEXT.familyLinePlaceholder} />
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
          <Label htmlFor="familyRoleType">{TEXT.familyRole}</Label>
          <Select name="familyRoleType" required>
            <SelectTrigger id="familyRoleType">
              <SelectValue placeholder={TEXT.familyRolePlaceholder} />
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
        <Label htmlFor="password">{TEXT.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={TEXT.passwordPlaceholder}
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">{TEXT.passwordConfirm}</Label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder={TEXT.passwordConfirmPlaceholder}
          minLength={8}
          required
        />
      </div>

      {state.message ? (
        <div className="text-sm text-destructive" role="status">
          {state.message}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {TEXT.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {TEXT.alreadyAccount}{" "}
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          {TEXT.login}
        </Link>
      </p>
    </form>
  );
}
