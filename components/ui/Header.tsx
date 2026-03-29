"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActiveProvider {
  provider: string;
  modelName: string;
}

export function Header() {
  const [active, setActive] = useState<ActiveProvider | null>(null);
  const { theme, setTheme } = useTheme();
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
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
              {active.provider} / {active.modelName}
            </span>
          ) : (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
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
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <UserCircle className="h-4 w-4" />
            </Button>
          </Link>
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
