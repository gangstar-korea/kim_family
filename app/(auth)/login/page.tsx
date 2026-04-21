import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthCard title="가족 로그인" description="승인된 가족만 정보를 확인할 수 있습니다.">
      <LoginForm />
    </AuthCard>
  );
}
