import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StylistChat } from "@/components/ai/stylist-chat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SMARTBUY",
  description: "SMARTBUY - Premium Brands and Latest Trends",
};

import { StylistProvider } from "@/context/style-context";
import NextAuthProvider from "@/components/auth/NextAuthProvider";

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
        <NextAuthProvider>
          <StylistProvider>
            {children}
            <StylistChat />
          </StylistProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
