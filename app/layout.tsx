import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "Blog",
    template: "%s · Blog",
  },
  description: "Personal blog — poems, series, and stories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className={body.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}
