import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import SiteTour from "@/components/SiteTour";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tripshare.org"),
  title: "Share and Plan - Build your next trip with help from fellow travelers",
  description: "Share the details of your trips, day by day, and build your next one from other travelers' real itineraries.",
  openGraph: {
    siteName: "Share and Plan",
    type: "website",
    title: "Share and Plan",
    description: "Build your next trip with help from fellow travelers. Real trips, day by day: where they stayed, ate and explored.",
    images: [{ url: "/sea-warm.jpg" }],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} antialiased`}
      >
        <Navigation />
        {children}
        <SiteTour />
      </body>
    </html>
  );
}
