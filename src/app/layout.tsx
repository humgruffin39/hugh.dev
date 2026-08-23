import type { Metadata } from "next";
import localFont from "next/font/local";
import LoadingGate from "@/components/loading-gate";
import "./globals.css";

const hostGrotesk = localFont({
  src: [
    {
      path: "./fonts/HostGrotesk-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/HostGrotesk-500.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-host-grotesk",
  display: "swap",
});

const signifier = localFont({
  src: "./fonts/Signifier-400.woff2",
  variable: "--font-signifier-display",
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
      className={`${hostGrotesk.variable} ${signifier.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <LoadingGate>{children}</LoadingGate>
      </body>
    </html>
  );
}
