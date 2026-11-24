import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-(--border)">
      <tr className="text-left">{children}</tr>
    </thead>
  );
}

export function TH({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 py-2.5 text-xs font-semibold tracking-wide text-(--text-muted) uppercase sm:px-5 sm:py-3",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-(--border-subtle)">{children}</tbody>;
}

export function TR({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition-colors hover:bg-(--surface-hover)",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td
      className={cn("px-3 py-2.5 text-(--text-secondary) sm:px-5 sm:py-3", className)}
      {...props}
    >
      {children}
    </td>
  );
}
