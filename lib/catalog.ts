import { apiFetch } from "@/lib/api";

/**
 * Specialities and styles share the same shape and endpoints
 * (list / get / create / update / delete on a name+description entity),
 * so both pages run on this one API client.
 */

export type CatalogResource = "specialities" | "styles";

export interface CatalogItem {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogInput {
  name: string;
  description: string;
}

export function catalogApi(resource: CatalogResource) {
  return {
    list: () => apiFetch<CatalogItem[]>(resource),

    get: (id: number) => apiFetch<CatalogItem>(`${resource}/${id}`),

    create: (input: CatalogInput) =>
      apiFetch<CatalogItem>(resource, {
        method: "POST",
        body: JSON.stringify(input),
      }),

    update: (id: number, input: CatalogInput) =>
      apiFetch<CatalogItem>(`${resource}/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),

    remove: (id: number) =>
      apiFetch<null>(`${resource}/${id}`, { method: "DELETE" }),
  };
}

export type CatalogApi = ReturnType<typeof catalogApi>;
