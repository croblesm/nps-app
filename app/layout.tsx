import type { Metadata } from "next";
import { Header } from "@/components/ui/Header";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Header />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()}{" "}
          <a
            href="https://croblesm.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            croblesm
          </a>
          . All rights reserved.
        </footer>
      </body>
    </html>
  );
}
