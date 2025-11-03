
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Zap, AlertTriangle, Star, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { scanReceipt } from '@/ai/flows/scan-receipt';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { ExpenseFormFromReceipt } from './expense-form-from-receipt';
import type { Expense } from '@/lib/types';
import { useFinancials, useAiRequest } from '@/context/financial-context';

export function ReceiptScanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [scannedData, setScannedData] = useState<Partial<Expense> | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { userData, canMakeAiRequest, incrementAiRequestCount } = useFinancials();
  const isPremium = userData?.tier === 'premium';
  
  const { remainingRequests } = useMemo(() => {
    const { remaining } = canMakeAiRequest();
    return { remainingRequests: remaining };
  }, [canMakeAiRequest, userData]);

  useEffect(() => {
    if (!isPremium) return;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };
    getCameraPermission();

    return () => {
        if(videoRef.current && videoRef.current.srcObject){
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast, isPremium]);

  const handleScanReceipt = async () => {
    const { canRequest, reason } = canMakeAiRequest();
    if (!canRequest) {
      toast({
        title: "Cannot perform AI request",
        description: reason,
        variant: "destructive",
      });
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if(!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    setIsLoading(true);
    setScannedData(null);

    try {
      const result = await scanReceipt({ photoDataUri });
      incrementAiRequestCount();
      if (!result.description || !result.amount) {
        throw new Error("AI could not extract necessary details. Please try again.");
      }
      setScannedData({
          description: result.description,
          amount: result.amount,
          date: result.date ? new Date(result.date).toISOString() : new Date().toISOString(),
          category: result.category,
      });
    } catch (error: any) {
      console.error('AI receipt scanning failed:', error);
      toast({
        title: 'Scan Failed',
        description: error.message || 'Could not process the receipt image.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isPremium) {
      return (
           <Card>
                <CardHeader>
                    <CardTitle>AI-Powered Receipt Scanner</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Star className="h-4 w-4" />
                        <AlertTitle>Premium Feature</AlertTitle>
                        <AlertDescription>
                            Upgrade to a premium account to unlock the receipt scanner and automatically log expenses from a photo.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
      )
  }
  
  if (scannedData) {
      return <ExpenseFormFromReceipt receiptData={scannedData} onCancel={() => setScannedData(null)} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                AI-Powered Receipt Scanner
            </div>
            {isPremium && remainingRequests !== undefined && (
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {remainingRequests} requests left today
                </div>
            )}
        </CardTitle>
        <CardDescription>Point your camera at a receipt and let AI extract the details automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    Please grant camera access in your browser to use this feature. You may need to refresh the page after granting permissions.
                </AlertDescription>
            </Alert>
        )}

        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden"></canvas>
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                    <Loader2 className="h-12 w-12 animate-spin" />
                    <p className="mt-4 text-lg">Analyzing Receipt...</p>
                </div>
            )}
        </div>

        <div className="flex justify-center">
            <Button onClick={handleScanReceipt} disabled={isLoading || !hasCameraPermission}>
                <Zap className="mr-2 h-4 w-4" />
                Scan Receipt
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

    