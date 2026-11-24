import { Suspense } from "react";
import { TattoosManager } from "@/components/tattoos/tattoos-manager";

export const metadata = { title: "Tattoos" };

export default function TattoosPage() {
  return (
    <Suspense>
      <TattoosManager />
    </Suspense>
  );
}
