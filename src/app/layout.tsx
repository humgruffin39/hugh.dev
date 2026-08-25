import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import LoadingGate from "@/components/loading-gate";
import "./globals.css";

const soehne = localFont({
  src: [
    {
      path: "./fonts/Soehne-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Soehne-500.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-soehne",
  display: "swap",
});

const newsreader = localFont({
  src: "./fonts/Newsreader-400.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hugh Fabre",
  description: "Web Engineer / Designer",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${soehne.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <LoadingGate>{children}</LoadingGate>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
