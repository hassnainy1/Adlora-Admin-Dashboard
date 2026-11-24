import { PageHeader } from "@/components/ui/page-header";
import { SettingsPanel } from "@/components/settings/settings-panel";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Settings" subtitle="Platform configuration" />
      <SettingsPanel />
    </div>
  );
}
