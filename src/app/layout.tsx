import type { Metadata } from "next";
import { Space_Grotesk, Inter, Noto_Sans_Tamil } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansTamil = Noto_Sans_Tamil({
  variable: "--font-tamil",
  subsets: ["tamil"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Veeramani Tracker | Unofficial Tamil Nadu Public Appearance Discovery",
  description: "Playful, community-verified Tamil Nadu public appearance discovery and interactive map. Only announced public events, zero private tracking.",
  keywords: ["Veeramani Tracker", "Tamil Nadu Events", "Public Appearances", "Chennai Events", "Interactive Map"],
  authors: [{ name: "Veeramani Tracker Community" }],
  openGraph: {
    title: "Veeramani Tracker | Map-la Enna Scene?",
    description: "Explore verified, publicly announced appearances and cultural events across Tamil Nadu.",
    type: "website",
    locale: "en_IN",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${notoSansTamil.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#19182B] text-[#FFF8E8] selection:bg-[#F5C542] selection:text-[#19182B]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
