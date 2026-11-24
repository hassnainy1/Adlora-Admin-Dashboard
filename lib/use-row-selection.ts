"use client";

import { useState, useMemo, useCallback } from "react";

/** Manages a set of selected row ids for bulk-action tables. */
export function useRowSelection(allIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === allIds.length ? new Set() : new Set(allIds),
    );
  }, [allIds]);

  const selectedIds = useMemo(() => [...selected], [selected]);

  return {
    selected,
    selectedIds,
    count: selected.size,
    isSelected: (id: string) => selected.has(id),
    toggle,
    toggleAll,
    clear,
    allSelected,
    someSelected,
  };
}
