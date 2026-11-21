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
import { AuthProvider } from "@/context/AuthContext";
import { VaultProvider } from "@/context/VaultContext";
import { SanityLive } from "@/sanity/lib/live";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import VaultBagDrawer from "@/components/VaultBagDrawer";
import VersionSwitcher from "@/components/VersionSwitcher";

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
  title: "KNITX® — DROP 01 · WAITLIST ONLY STREETWEAR",
  description:
    "No open store. 3–4 units per design. Two 1-of-1s. Community-voted Indian streetwear made only after you claim.",
  openGraph: {
    title: "KNITX® — YOU CAN'T BUY UNTIL WE CALL YOUR NUMBER",
    description:
      "3–4 units per design. Two 1-of-1 collector pieces. Zero deadstock. Join Drop 01.",
    type: "website",
    locale: "en_IN",
    siteName: "KNITX",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F6F2",
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
        className="min-h-screen bg-paper font-sans text-ink antialiased"
      >
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <AuthProvider>
          <VaultProvider>
            <Navbar />
            <main className="relative min-h-screen pb-24 md:pb-0">{children}</main>
            <Footer />
            <VersionSwitcher />
            <AuthModal />
            <VaultBagDrawer />
            <SanityLive />
          </VaultProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
