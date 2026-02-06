"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { applyTheme, getInitialTheme, type ThemeOption } from "@/lib/utils";

const OPTIONS: { value: ThemeOption; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Sistema" },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeOption>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleChange = (next: ThemeOption) => {
    setTheme(next);
  };

  return (
    <div className="flex w-full items-center justify-center gap-2 rounded-full bg-white/5 px-2 py-2 shadow-inner shadow-black/10 ring-1 ring-white/10 backdrop-blur-md">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={theme === opt.value ? "default" : "secondary"}
          size="sm"
          className="flex-1 rounded-full text-xs"
          type="button"
          onClick={() => handleChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
