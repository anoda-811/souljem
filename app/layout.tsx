import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth/auth-gate";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Soul Archive",
    template: "%s ｜ Soul Archive",
  },
  description:
    "毎日の生活と精神状態を記録し、自分自身を研究するための、自己観測の手帳。",
};

export const viewport: Viewport = {
  themeColor: "#f5eedc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
