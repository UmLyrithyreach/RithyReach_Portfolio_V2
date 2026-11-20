import type { Metadata } from "next";
import { Oswald, Space_Grotesk, JetBrains_Mono, Playfair_Display, Inter, Fragment_Mono } from "next/font/google";
import "./globals.css";
import "./hero.css";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

// The works section (Adaline feature overview): Inter stands in for Adaline's Akkurat.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inter",
  display: "swap",
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fragment-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reach — Web Developer Portfolio",
  description:
    "I'm Reach, an aspiring web developer with a strong foundation in the MERN stack. I develop responsive and interactive websites that are coherent to your needs.",
  authors: [{ name: "Reach" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${oswald.variable} ${jetbrainsMono.variable} ${playfair.variable} ${inter.variable} ${fragmentMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
