import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="warm-surface min-h-screen overflow-x-hidden pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <AppHeader />
      {children}
      <BottomNav />
    </div>
  );
}
