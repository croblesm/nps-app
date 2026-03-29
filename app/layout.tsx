import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
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
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <TopBar />
                <div className="flex-1 p-4 md:p-6">{children}</div>
                <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
                  &copy; {new Date().getFullYear()}{" "}
                  <a
                    href="https://croblesm.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    croblesm
                  </a>
                  . All rights reserved.
                </footer>
              </SidebarInset>
            </SidebarProvider>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
