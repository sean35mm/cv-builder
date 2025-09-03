import "./globals.css";
import type { Metadata } from "next";
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: "CV Builder",
  description: "Create and share your professional CV",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
