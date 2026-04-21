import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <section className="w-full max-w-[430px]" aria-label={title}>
      <div className="mb-7 space-y-2 text-center">
        <p className="text-sm font-semibold text-primary">{SITE_NAME}</p>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{SITE_DESCRIPTION}</p>
      </div>
      <Card className="border-border/80 shadow-[0_18px_45px_rgb(85_72_55_/_0.10)]">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
