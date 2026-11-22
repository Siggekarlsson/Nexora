import type { Metadata } from "next";
import { Cinzel, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { Providers } from "@/components/layout/Providers";
import { TopBar } from "@/components/layout/TopBar";
import { CosmicBackground } from "@/components/layout/CosmicBackground";
import { TrialPill } from "@/components/layout/TrialPill";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} ${cinzel.variable} min-h-screen`}>
        <Providers>
          <CosmicBackground />
          <TopBar />
          <main className="relative z-10 pt-14 min-h-screen">{children}</main>
          <TrialPill />
        </Providers>
      </body>
    </html>
  );
}
