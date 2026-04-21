export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="warm-surface flex min-h-screen items-center justify-center px-4 py-10">
      {children}
    </main>
  );
}
