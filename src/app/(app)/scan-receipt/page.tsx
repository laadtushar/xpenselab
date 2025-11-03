
"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { ReceiptScanner } from "@/components/receipt-scanner/receipt-scanner";

export default function ScanReceiptPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Scan Receipt" />
      <ReceiptScanner />
    </div>
  );
}
