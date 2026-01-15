import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "destructive" | "success";

const variantClasses: Record<Variant, string> = {
  default: "border-black/10 bg-white text-[var(--text)]",
  destructive: "border-red-500/30 bg-red-50 text-red-700",
  success: "border-emerald-400/30 bg-emerald-50 text-emerald-700",
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "w-full rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-[0_10px_24px_rgba(0,0,0,0.08)]",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = "Alert";
