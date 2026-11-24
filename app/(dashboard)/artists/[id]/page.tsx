import { ArtistDetail } from "@/components/artists/artist-detail";

export const metadata = { title: "Artist" };

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArtistDetail id={id} />;
}
