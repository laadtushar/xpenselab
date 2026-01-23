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
import { Shield, ExternalLink, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useFinancials } from "@/context/financial-context";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { userData } = useFinancials();
  const isPremium = userData?.tier === 'premium';

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader title="Settings">
        {isPremium && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium</span>
          </div>
        )}
      </DashboardHeader>
      
      {/* Premium Status Card */}
      {isPremium && (
        <Card className="border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Premium Membership
              <Badge variant="default" className="ml-2 bg-primary/20 text-primary border-primary/30">
                Active
              </Badge>
            </CardTitle>
            <CardDescription>
              You're enjoying all premium features including AI categorization, receipt scanning, and advanced insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>AI Expense Categorization</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Receipt Scanning</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Predictive Forecasting</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Advanced Insights</span>
              </div>
            </div>
            {userData?.premiumActivatedAt && (
              <p className="text-xs text-muted-foreground mt-4">
                Member since {new Date(userData.premiumActivatedAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}
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
