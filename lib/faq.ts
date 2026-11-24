import { apiFetch } from "@/lib/api";

/**
 * FAQ admin API (Postman: Admin/Faqs + User/Faqs).
 * Endpoints: GET faq, GET faq/:id, POST faq/create, PATCH faq/:id, DELETE faq/:id.
 * Validation: question >= 5 chars, answer >= 10 chars.
 */

export interface Faq {
  id: number;
  question: string;
  answer: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FaqInput {
  question: string;
  answer: string;
  order?: number;
}

export const faqApi = {
  list: () => apiFetch<Faq[]>("faq"),

  get: (id: number) => apiFetch<Faq>(`faq/${id}`),

  create: (input: FaqInput) =>
    apiFetch<Faq>("faq/create", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: number, input: FaqInput) =>
    apiFetch<Faq>(`faq/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  remove: (id: number) => apiFetch<null>(`faq/${id}`, { method: "DELETE" }),

  /** Partial update of just the display order (used by drag-to-reorder). */
  reorder: (id: number, order: number) =>
    apiFetch<Faq>(`faq/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),
};
