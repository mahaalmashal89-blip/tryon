import type { Metadata } from "next";
import { Bodoni_Moda, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TRYON — AI Fashion Studio",
  description: "See it on you before you buy. Upload a photo, drop a clothing link, and our AI dresses you in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bodoniModa.variable} ${spaceGrotesk.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
