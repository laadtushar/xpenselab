
'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { SaltEdgeTransactionImporter } from '@/components/integrations/saltedge-transaction-importer';
import { FEATURES } from '@/lib/config';

export default function IntegrationsPage() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
                <DashboardHeader title="Integrations" />
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
                <DashboardHeader title="Integrations" />
                <Card className="w-full min-w-0 max-w-full">
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>Please log in to manage your integrations.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 w-full min-w-0 max-w-full">
            <DashboardHeader title="Integrations" />
            <div className="w-full min-w-0 max-w-full">
                {FEATURES.isSaltEdgeEnabled ? (
                    <SaltEdgeTransactionImporter userId={user.uid} />
                ) : (
                    <Card className="w-full min-w-0 max-w-full">
                        <CardHeader>
                            <CardTitle>No Active Integrations</CardTitle>
                            <CardDescription>
                                Bank integrations are currently disabled. You can still import data via CSV in Settings.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </div>
    );
}
