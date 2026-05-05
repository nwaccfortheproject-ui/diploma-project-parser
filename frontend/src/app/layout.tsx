import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StylistChat } from "@/components/ai/stylist-chat";
import { StylistProvider } from "@/context/style-context";
import NextAuthProvider from "@/components/auth/NextAuthProvider";
import { PWARegister } from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "SMARTBUY";
const APP_DESCRIPTION = "SMARTBUY — премиум маркетплейс брендовой одежды с AI-стилистом и виртуальной примеркой.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} — Premium Brands & Latest Trends`,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — Premium Brands & Latest Trends`,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${APP_NAME} — Premium Brands & Latest Trends`,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b1020" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <StylistProvider>
            {children}
            <StylistChat />
          </StylistProvider>
        </NextAuthProvider>
        <PWARegister />
      </body>
    </html>
  );
}
