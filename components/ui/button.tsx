import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary:
    "bg-(--accent) text-(--accent-foreground) hover:bg-(--accent-hover) shadow-sm shadow-(--accent)/20",
  secondary:
    "border border-(--border) bg-(--surface) text-(--text-secondary) hover:bg-(--surface-2) hover:border-(--border)",
  ghost: "text-(--text-secondary) hover:bg-(--surface-2)",
  danger: "bg-(--danger) text-white hover:brightness-95 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-(--accent)/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
