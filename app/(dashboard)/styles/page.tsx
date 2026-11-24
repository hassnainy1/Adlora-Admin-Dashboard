import { CatalogManager } from "@/components/catalog/catalog-manager";

export const metadata = { title: "Styles" };

export default function StylesPage() {
  return <CatalogManager resource="styles" title="Styles" singular="style" />;
}
