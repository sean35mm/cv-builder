import "./globals.css";
import type { Metadata } from "next";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  title: "OpenCV - Create Your Personal Website",
  description:
    "Build a beautiful, shareable online CV in minutes. Stand out to hiring managers with your personalized website.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
