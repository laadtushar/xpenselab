"use client";

import { DashboardHeader } from "@/components/shared/dashboard-header";
import { DataImporter } from "@/components/settings/data-importer";
import { ResetData } from "@/components/settings/reset-data";
import { CurrencySettings } from "@/components/settings/currency-settings";
import { SaltEdgeSettings } from "@/components/settings/saltedge-settings";
import { MonzoSettings } from "@/components/settings/monzo-settings";
import { EncryptionSettings } from "@/components/settings/encryption-settings";
import { FEATURES } from "@/lib/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Settings" />
      <EncryptionSettings />
      <CurrencySettings />
      {FEATURES.isSaltEdgeEnabled && <SaltEdgeSettings />}
      {FEATURES.isMonzoEnabled && <MonzoSettings />}
      <DataImporter />
      <ResetData />
      
      {/* Privacy & GDPR Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & GDPR Compliance
          </CardTitle>
          <CardDescription>
            Learn about how we protect your data and your rights under GDPR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            XpenseLab is committed to protecting your personal data and ensuring full compliance with GDPR. 
            View our privacy policy, understand your rights, and learn about our data protection measures.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/privacy">
                <Shield className="h-4 w-4 mr-2" />
                View Privacy Policy
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="/docs/GDPR_COMPLIANCE.md" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Full GDPR Documentation
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
