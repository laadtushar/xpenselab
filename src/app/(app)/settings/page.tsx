"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { DataImporter } from "@/components/settings/data-importer";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Settings" />
      <DataImporter />
    </div>
  );
}
