import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { LayoutWrapper } from "@/components/layout-wrapper";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "NPS Insight Engine",
  description: "AI-powered NPS analysis platform for product managers",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
