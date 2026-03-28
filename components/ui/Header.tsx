"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ActiveProvider {
  provider: string;
  modelName: string;
}

export function Header() {
  const [active, setActive] = useState<ActiveProvider | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((configs) => {
        const defaultConfig = configs.find(
          (c: { isDefault: boolean }) => c.isDefault
        );
        if (defaultConfig) {
          setActive({
            provider: defaultConfig.provider,
            modelName: defaultConfig.modelName,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-gray-900 dark:text-gray-100">
          NPS Insight Engine
        </Link>
        <div className="flex items-center gap-4">
          {active ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
              {active.provider} / {active.modelName}
            </span>
          ) : (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              No LLM configured
            </span>
          )}
          <Link
            href="/settings"
            className="text-sm text-blue-500 hover:text-blue-400"
          >
            Settings
          </Link>
        </div>
      </div>
    </header>
  );
}
