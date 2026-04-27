import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide";
};

export function PageContainer({ children, className, size = "default" }: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto min-w-0 w-full max-w-full overflow-x-hidden [contain:inline-size] px-4 py-5 md:px-6 md:py-8",
        size === "default" ? "max-w-5xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </main>
  );
}
