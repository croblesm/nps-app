import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "NPS Insight Engine",
  description: "AI-powered NPS analysis platform for product managers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Header />
        {children}
      </body>
    </html>
  );
}
