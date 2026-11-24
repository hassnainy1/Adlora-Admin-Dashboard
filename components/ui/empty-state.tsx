import type { Icon } from "@/components/icons";

export function EmptyState({
  icon: IconCmp,
  title,
  description,
}: {
  icon?: Icon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {IconCmp && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-(--surface-2) text-(--text-subtle)">
          <IconCmp width={22} height={22} />
        </span>
      )}
      <p className="text-sm font-medium text-(--text)">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-(--text-muted)">{description}</p>
      )}
    </div>
  );
}
