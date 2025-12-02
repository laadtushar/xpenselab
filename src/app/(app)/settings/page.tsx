"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { DataImporter } from "@/components/settings/data-importer";
import { ResetData } from "@/components/settings/reset-data";
import { CurrencySettings } from "@/components/settings/currency-settings";
import { SaltEdgeSettings } from "@/components/settings/saltedge-settings";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Settings" />
      <CurrencySettings />
      <SaltEdgeSettings />
      <DataImporter />
      <ResetData />
    </div>
  );
}
