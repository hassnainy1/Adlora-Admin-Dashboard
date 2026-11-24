"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EventsList } from "@/components/events/events-list";

export function EventsManager() {
  const [creating, setCreating] = useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Events"
        subtitle="Expos, conventions and RSVPs"
        actions={<Button onClick={() => setCreating(true)}>Create Event</Button>}
      />

      <EventsList createOpen={creating} onCreateClose={() => setCreating(false)} />
    </div>
  );
}
