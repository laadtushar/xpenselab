
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ReceiptScanner } from "@/components/receipt-scanner/receipt-scanner";

export default function ScanReceiptPage() {
  return (
    <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
      <DashboardHeader title="Scan Receipt" />
      <div className="w-full min-w-0 max-w-full">
        <ReceiptScanner />
      </div>
    </div>
  );
}
