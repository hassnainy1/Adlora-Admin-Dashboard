import { BlogView } from "@/components/blog/blog-view";

export const metadata = { title: "View Blog Post" };

export default async function ViewBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogView id={id} />;
}
