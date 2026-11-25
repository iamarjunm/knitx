import type { Metadata, Viewport } from "next";
import Script from "next/script";
import {
  Anton,
  Instrument_Serif,
  JetBrains_Mono,
  Space_Grotesk,
  Syne,
} from "next/font/google";
import "./globals.css";
import { StorefrontConfigProvider } from "@/context/StorefrontConfigContext";
import { AuthProvider } from "@/context/AuthContext";
import { VaultProvider } from "@/context/VaultContext";
import { SanityLive } from "@/sanity/lib/live";
import FlagshipShell from "@/components/flagship/FlagshipShell";
import AuthModal from "@/components/AuthModal";
import VaultBagDrawer from "@/components/VaultBagDrawer";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KNITX — Limited-Edition Streetwear & Core Wardrobe",
  description:
    "Numbered Indian streetwear cut to order with zero deadstock. Curated limited-batch drops alongside the heavyweight KNITX CORE wardrobe.",
  openGraph: {
    title: "KNITX — Limited-Edition Streetwear House",
    description:
      "Limited-batch drops, one-of-one collector works, and the heavyweight KNITX CORE wardrobe. Account-based waitlist & community access.",
    type: "website",
    locale: "en_IN",
    siteName: "KNITX",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${anton.variable} ${instrumentSerif.variable} ${syne.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-white font-sans text-black antialiased"
      >
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <StorefrontConfigProvider>
          <AuthProvider>
            <VaultProvider>
              <FlagshipShell>{children}</FlagshipShell>
              <AuthModal />
              <VaultBagDrawer />
              <SanityLive />
            </VaultProvider>
          </AuthProvider>
        </StorefrontConfigProvider>
      </body>
    </html>
  );
}
