import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";

import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "강릉김씨 김양수 패밀리",
  description: "가족만 접근 가능한 강릉김씨 김양수 패밀리 정보 사이트",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f7f3ec",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSansKr.variable} suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
