"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";

const AUTH_PAGES = ["/login", "/register"];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  // Auth pages render without sidebar/topbar (clean login experience)
  // All other pages get the full layout — middleware handles route protection
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
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
  );
}
