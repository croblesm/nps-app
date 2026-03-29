"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { Sun, Moon, Settings, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActiveProvider {
  provider: string;
  modelName: string;
}

export function Header() {
  const [active, setActive] = useState<ActiveProvider | null>(null);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const fetchActive = useCallback(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((configs) => {
        const defaultConfig = configs.find(
          (c: { isDefault: boolean }) => c.isDefault
        );
        setActive(
          defaultConfig
            ? {
                provider: defaultConfig.provider,
                modelName: defaultConfig.modelName,
              }
            : null
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchActive();
    const handler = () => fetchActive();
    window.addEventListener("llm-config-changed", handler);
    return () => window.removeEventListener("llm-config-changed", handler);
  }, [fetchActive]);

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold text-foreground hover:text-primary transition-colors"
        >
          NPS Insight Engine
        </Link>
        <div className="flex items-center gap-3">
          {active ? (
            <span className="text-xs text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--nps-promoter)] mr-1" />
              {active.provider} / {active.modelName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              No LLM configured
            </span>
          )}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
              <UserCircle className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {session?.user && (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem>
                <Link href="/admin" className="w-full">Account Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
