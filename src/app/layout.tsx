import type React from "react";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { SessionProvider } from "@/components/providers/session-provider";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { LazyLayoutComponents } from "@/components/layout/lazy-layout-components";
import "@/app/globals.css";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { XpToastProvider } from "@/components/xp/xp-toast";
import { LevelUpProvider } from "@/components/xp/xp-level-up-modal";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DailyEng - Master English the Smart Way!",
  description:
    "Master English with AI-powered vocabulary, speaking, and grammar lessons.",
  icons: {
    icon: "/dailyeng.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${nunito.variable} scroll-smooth`}>
      <body
        className={`${nunito.className} bg-background text-foreground font-sans`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <UserProfileProvider>
              <XpToastProvider>
              <LevelUpProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <NavigationProvider>
                  <ConditionalLayout>
                    <main className="min-h-screen">{children}</main>
                  </ConditionalLayout>
                </NavigationProvider>
                <LazyLayoutComponents />
              </Suspense>
              </LevelUpProvider>
              </XpToastProvider>
            </UserProfileProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}


