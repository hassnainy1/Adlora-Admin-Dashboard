import { CatalogManager } from "@/components/catalog/catalog-manager";

export const metadata = { title: "Specialities" };

export default function SpecialitiesPage() {
  return (
    <CatalogManager
      resource="specialities"
      title="Specialities"
      singular="speciality"
    />
  );
}
