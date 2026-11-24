import { BlogEdit } from "@/components/blog/blog-edit";

export const metadata = { title: "Edit Blog Post" };

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogEdit id={id} />;
}
