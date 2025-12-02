'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { useFinancials } from '@/context/financial-context';

export default function SaltEdgeCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { updateUser } = useFinancials();
  const [message, setMessage] = useState("Processing Salt Edge connection...");

  useEffect(() => {
    if (!user) {
      return;
    }

    // Salt Edge widget redirects back with connection_id in query params
    // or we can check the connection status via API
    const connectionId = searchParams.get('connection_id');
    const error = searchParams.get('error');

    if (error) {
      setMessage(`An error occurred: ${error}`);
      toast({
        title: "Salt Edge Connection Failed",
        description: "Could not complete the connection with your bank.",
        variant: "destructive",
      });
      setTimeout(() => router.push('/settings'), 3000);
      return;
    }

    if (connectionId) {
      // Connection was successful
      // We should fetch connection details and update user data
      setMessage("Connection successful! Your bank account is now connected.");
      toast({
        title: "Bank Account Connected",
        description: "Your transactions will be available shortly.",
      });
      
      // Note: In a real implementation, you'd want to fetch the connection details
      // from Salt Edge API and update the user's connections list
      // For now, we'll just mark as connected
      
      setTimeout(() => router.push('/settings'), 3000);
    } else {
      // No connection_id, might be a direct return from widget
      // Check if we have a customer ID (connection was successful)
      setTimeout(() => {
        setMessage("Redirecting to settings...");
        router.push('/settings');
      }, 2000);
    }
  }, [searchParams, router, toast, user, updateUser]);

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connecting to Salt Edge</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    </div>
  );
}

