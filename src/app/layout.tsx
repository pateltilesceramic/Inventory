import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

const recoleta = localFont({
  src: "./fonts/Recoleta Bold.woff2",
  variable: "--font-recoleta",
});

const berthold = localFont({
  src: [
    {
      path: "./fonts/Berthold-Akzidenz-Grotesk-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Berthold-Akzidenz-Grotesk-Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-berthold",
});

export const metadata: Metadata = {
  title: "Patel Tiles & Ceramic - Inventory & Sales System",
  description: "Internal inventory and billing management system.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
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
      className={`${recoleta.variable} ${berthold.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
