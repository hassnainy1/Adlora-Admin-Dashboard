import { apiFetch, apiFetchEnvelope } from "@/lib/api";

/**
 * Admin blog management API (`/api/blogs`).
 * List/detail-by-slug are public; id lookup, create, update, delete require ADMIN.
 * Create/update are multipart/form-data (optional cover image via multer).
 */

export interface Blog {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  /** Alt text for the cover `image`. */
  imageAlt: string | null;
  /** SEO `<title>` override — the website falls back to `title` when null. */
  metaTitle: string | null;
  /** SEO `<meta name="description">` — the website falls back to `description` when null. */
  metaDescription: string | null;
  /** JSON-LD structured data, stored as a JSON string. */
  schema: string | null;
  contentHtml: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPayload {
  title?: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  imageAlt?: string;
  schema?: string;
  contentHtml?: string;
  image?: File;
}

/** Character limits — keep in sync with the backend validation. */
export const BLOG_LIMITS = {
  slug: 200,
  metaTitle: 100,
  metaDescription: 300,
  imageAlt: 150,
  /** Search engines truncate beyond these, so they're shown as guidance only. */
  metaTitleRecommended: 60,
  metaDescriptionRecommended: 160,
} as const;

const TEXT_FIELDS = [
  "title",
  "slug",
  "description",
  "metaTitle",
  "metaDescription",
  "imageAlt",
  "schema",
  "contentHtml",
] as const;

function toFormData(fields: BlogPayload): FormData {
  const fd = new FormData();
  for (const key of TEXT_FIELDS) {
    const value = fields[key];
    if (value !== undefined) fd.set(key, value);
  }
  if (fields.image) fd.set("image", fields.image);
  return fd;
}

export const blogApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 1));
    qs.set("limit", String(params.limit ?? 20));
    if (params.search) qs.set("search", params.search);
    return apiFetchEnvelope<Blog[]>(`blogs?${qs.toString()}`);
  },

  getBySlug: (slug: string) => apiFetch<Blog>(`blogs/slug/${slug}`),

  get: (id: number | string) => apiFetch<Blog>(`blogs/${id}`),

  create: (fields: BlogPayload) =>
    apiFetch<Blog>("blogs", { method: "POST", body: toFormData(fields) }),

  update: (id: number | string, fields: BlogPayload) =>
    apiFetch<Blog>(`blogs/${id}`, { method: "PATCH", body: toFormData(fields) }),

  remove: (id: number | string) => apiFetch<null>(`blogs/${id}`, { method: "DELETE" }),

  /** Uploads an image placed inside the post body; returns its public URL. */
  uploadContentImage: (file: File) => {
    const fd = new FormData();
    fd.set("image", file);
    return apiFetch<{ url: string }>("blogs/images", { method: "POST", body: fd });
  },
};

/** "Hello, World! 2026" → "hello-world-2026". */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, BLOG_LIMITS.slug);
}

/**
 * Light cleanup while the user types a slug — unlike `slugify`, it keeps a
 * trailing hyphen so "my-" can still become "my-post".
 */
export function normalizeSlugInput(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, BLOG_LIMITS.slug);
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface BlogValidationInput {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  imageAlt: string;
  schema: string;
  contentHtml: string;
}

/** Mirrors backend validation so errors surface before hitting the API. */
export function validateBlogFields(input: BlogValidationInput): string | null {
  if (input.title.trim().length < 3) return "Title must be at least 3 characters.";
  if (!SLUG_PATTERN.test(input.slug)) {
    return "Slug may only contain lowercase letters, numbers and single hyphens.";
  }
  if (input.metaTitle.trim().length > BLOG_LIMITS.metaTitle) {
    return `Meta title must be at most ${BLOG_LIMITS.metaTitle} characters.`;
  }
  if (input.metaDescription.trim().length > BLOG_LIMITS.metaDescription) {
    return `Meta description must be at most ${BLOG_LIMITS.metaDescription} characters.`;
  }
  if (input.imageAlt.trim().length > BLOG_LIMITS.imageAlt) {
    return `Image alt text must be at most ${BLOG_LIMITS.imageAlt} characters.`;
  }
  if (input.schema.trim() && !isJsonObject(input.schema)) {
    return "Schema must be a valid JSON object (JSON-LD).";
  }
  const textOnly = input.contentHtml.replace(/<[^>]*>/g, "").trim();
  if (textOnly.length < 10) return "Content must be at least 10 characters.";
  return null;
}

function isJsonObject(text: string): boolean {
  try {
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
}

/** Builds a starter schema.org `BlogPosting` JSON-LD from the post's fields. */
export function buildBlogSchema(input: {
  title: string;
  metaTitle: string;
  description: string;
  metaDescription: string;
  imageUrl: string | null;
  datePublished?: string;
  dateModified?: string;
}): string {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: (input.metaTitle || input.title).trim(),
    description: (input.metaDescription || input.description).trim() || undefined,
    image: input.imageUrl ?? undefined,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
  };
  return JSON.stringify(schema, null, 2);
}
