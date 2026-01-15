export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type ThemeOption = "light" | "dark" | "system";

export function applyTheme(theme: ThemeOption) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
  localStorage.setItem("theme", theme);
}

export function getInitialTheme(): ThemeOption {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("theme") as ThemeOption | null;
  return stored ?? "system";
}

export function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
