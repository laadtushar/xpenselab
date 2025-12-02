
'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/shared/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { SaltEdgeTransactionImporter } from '@/components/integrations/saltedge-transaction-importer';

export default function IntegrationsPage() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="flex flex-col gap-8">
                <DashboardHeader title="Integrations" />
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (!user) {
         return (
            <div className="flex flex-col gap-8">
                <DashboardHeader title="Integrations" />
                 <Card>
                    <CardHeader>
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>Please log in to manage your integrations.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-8">
            <DashboardHeader title="Integrations" />
            <SaltEdgeTransactionImporter userId={user.uid} />
        </div>
    );
}
