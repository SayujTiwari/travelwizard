import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { auth } from "@/auth";
import { isAuthConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Travel Wizard",
    template: "%s | Travel Wizard",
  },
  description:
    "Plan memorable trips, organize every destination, and optimize your driving route in one place.",
  icons: {
    icon: "/travelWizlogo.png",
    apple: "/travelWizlogo.png",
  },
  openGraph: {
    title: "Travel Wizard",
    description:
      "Build organized itineraries and find a faster route between every stop.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Travel Wizard route-planning preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Wizard",
    description:
      "Build organized itineraries and find a faster route between every stop.",
    images: ["/og.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authConfigured = isAuthConfigured();
  const session = authConfigured ? await auth() : null;
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar session={session} authConfigured={authConfigured} />
        {children}
      </body>
    </html>
  );
}
