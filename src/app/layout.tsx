import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "우리가족 상상스케치 | DSHS AI Booth",
  description:
    "대구과학고등학교 AI 동아리 부스에서 가족의 상상을 AI 그림으로 만드는 체험 프로그램",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script
          src="/mediapipe/selfie-segmentation/selfie_segmentation.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
