import { Suspense } from "react";
import { ReviewsManager } from "@/components/reviews/reviews-manager";

export const metadata = { title: "Reviews" };

export default function ReviewsPage() {
  return (
    <Suspense>
      <ReviewsManager />
    </Suspense>
  );
}
