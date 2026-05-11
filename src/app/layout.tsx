import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DOSHUB — Share & Discover Videos",
  description:
    "DOSHUB is a modern video sharing platform. Upload, watch, and discover videos from creators around the world.",
  keywords: ["video", "sharing", "upload", "streaming", "DOSHUB"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
