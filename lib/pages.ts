import { apiFetch } from "@/lib/api";

/**
 * Static content pages (Postman: Admin/Pages + User/pages).
 * GET pages/ lists all pages; GET pages/:id fetches one; POST pages/
 * upserts (create when no id, update when id is set); DELETE pages/:id removes one.
 */

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageInput {
  id?: number;
  title: string;
  slug: string;
  content: string;
}

export const pagesApi = {
  list: () => apiFetch<Page[]>("pages/"),

  getById: (id: number) => apiFetch<Page>(`pages/${id}`),

  upsert: (input: PageInput) =>
    apiFetch<Page>("pages/", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    apiFetch<void>(`pages/${id}`, { method: "DELETE" }),
};

/** Turns "Help & Instructions" into "help-instructions". */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
