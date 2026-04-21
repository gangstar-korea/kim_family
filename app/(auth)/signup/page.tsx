import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthCard title="가족 등록 신청" description="관리자 승인 후 가족 사이트 이용이 가능합니다.">
      <SignupForm />
    </AuthCard>
  );
}
