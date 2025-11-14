import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "晶晶體 - 中英夾雜語音輸入工具",
  description:
    "專為處理中英夾雜語音設計的工具，輕鬆轉換你的語音為中英文交錯語句，並完整保留你的語音內容。",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "晶晶體 - 中英夾雜語音輸入工具",
    description:
      "專為處理中英夾雜語音設計的工具，輕鬆轉換你的語音為中英文交錯語句，並完整保留你的語音內容。",
    url: "https://jin-t.vercel.app",
    siteName: "晶晶體",
    images: [
      {
        url: "https://jin-t.vercel.app/favicon.ico",
        width: 512,
        height: 512,
        alt: "晶晶體",
      },
    ],
    locale: "zh-TW",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
