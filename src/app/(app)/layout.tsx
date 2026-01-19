'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { DashboardNav } from '@/components/dashboard-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, LogOut } from 'lucide-react';
import { useUser, useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { FinancialProvider } from '@/context/financial-context';
import { EncryptionProvider } from '@/context/encryption-context';
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import type { User as UserData } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { MobileQuickAddFAB } from '@/components/mobile-quick-add-fab';
import { EncryptionUnlockModal } from '@/components/encryption-unlock-modal';
import { PageTransition } from '@/components/ui/page-transition';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const [isFirestoreCheckComplete, setIsFirestoreCheckComplete] = useState(false);

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait for Firebase Auth to initialize
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (!firestore) return; // Wait for firestore to be available

    // Check for the user document in Firestore
    const userDocRef = doc(firestore, 'users', user.uid);
    getDoc(userDocRef).then(userDocSnap => {
      if (!userDocSnap.exists()) {
        const newUserDoc: Omit<UserData, 'id'> = {
          email: user.email!,
          createdAt: new Date().toISOString(),
          currency: 'USD',
          tier: 'basic',
          hasCreatedDefaultCategories: false,
        };
        // Set the document and then confirm the check is complete
        setDocumentNonBlocking(userDocRef, newUserDoc);
        setIsFirestoreCheckComplete(true);
      } else {
        const userData = userDocSnap.data() as UserData;
        // If user exists but has no tier or category flag, update them.
        if (!userData.tier || userData.hasCreatedDefaultCategories === undefined) {
          setDocumentNonBlocking(userDocRef, { tier: 'basic', hasCreatedDefaultCategories: userData.hasCreatedDefaultCategories || false }, { merge: true });
        }
        setIsFirestoreCheckComplete(true);
      }
    }).catch(error => {
      console.error("AppLayout: Error checking/creating user document:", error);
      // In case of error, we still proceed to avoid getting stuck on the loading screen.
      // The error will likely manifest elsewhere, but this prevents a total app blockage.
      setIsFirestoreCheckComplete(true);
    });

  }, [user, isUserLoading, firestore, router]);

  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
    }
  };

  // Render a global loading indicator until both Firebase Auth and our Firestore check are complete.
  if (isUserLoading || !isFirestoreCheckComplete) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <EncryptionProvider>
      <FinancialProvider>
        <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Logo />
              <span className="text-xl font-headline font-semibold">XpenseLab</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <DashboardNav />
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback>
                    <UserIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm">
                  <span className="font-medium">{user?.displayName || 'User'}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 w-full min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-full pb-20 md:pb-4">
          <div className="w-full max-w-full min-w-0">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
        <MobileBottomNav />
        <MobileQuickAddFAB />
        <EncryptionUnlockModal />
      </SidebarProvider>
      </FinancialProvider>
    </EncryptionProvider>
  );
}
