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
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import type { User as UserData } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [isFirestoreCheckComplete, setIsFirestoreCheckComplete] = useState(false);
  // This new state tracks whether a redirect is expected.
  const [isAuthRedirecting, setIsAuthRedirecting] = useState(true);

  useEffect(() => {
    console.log('AppLayout: State update. isUserLoading:', isUserLoading, 'User:', !!user);
    
    // Check session storage to see if a redirect was just initiated.
    const redirectInProgress = sessionStorage.getItem('auth_redirect_in_progress');
    if (redirectInProgress === 'true') {
        console.log('AppLayout: Auth redirect is in progress, waiting...');
        // We don't clear the flag here, the login page will do that.
        // We just need to wait and not redirect prematurely.
    } else {
        // If no redirect is in progress, we can stop waiting.
        setIsAuthRedirecting(false);
    }

    // Wait until Firebase has finished its initial user check AND we are not in an auth redirect.
    if (isUserLoading || isAuthRedirecting) {
      console.log('AppLayout: User state is loading or redirecting. Waiting.');
      return;
    }

    // If no user is found after all checks, it's safe to redirect.
    if (!user) {
      console.log('AppLayout: No user found after loading. Redirecting to /login.');
      router.push('/login');
      return;
    }

    // If there is a user, verify their Firestore document exists.
    console.log('AppLayout: User found. Checking for Firestore document.');
    const userDocRef = doc(firestore, 'users', user.uid);
    getDoc(userDocRef).then(userDocSnap => {
      if (!userDocSnap.exists()) {
        console.log('AppLayout: Firestore doc not found. Creating new user document.');
        const newUserDoc: Omit<UserData, 'id'> = {
          email: user.email!,
          createdAt: new Date().toISOString(),
          currency: 'USD',
        };
        setDocumentNonBlocking(userDocRef, newUserDoc).finally(() => {
          console.log('AppLayout: Firestore document creation finished.');
          setIsFirestoreCheckComplete(true);
        });
      } else {
        console.log('AppLayout: Firestore document exists.');
        setIsFirestoreCheckComplete(true);
      }
    }).catch(error => {
      console.error("AppLayout: Error checking/creating user document:", error);
      setIsFirestoreCheckComplete(true);
    });

  }, [user, isUserLoading, firestore, router, isAuthRedirecting]);

  const handleSignOut = () => {
    if (auth) {
      console.log('AppLayout: Signing out.');
      auth.signOut();
    }
  };
  
  // Show a loader while we are loading the user, waiting for a potential redirect, or checking Firestore.
  if (isUserLoading || isAuthRedirecting || !isFirestoreCheckComplete) {
    console.log('AppLayout: Rendering loading screen. isUserLoading:', isUserLoading, 'isAuthRedirecting:', isAuthRedirecting, 'isFirestoreCheckComplete:', isFirestoreCheckComplete);
    return (
      <div className="flex h-screen items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  console.log('AppLayout: Rendering main application layout.');
  return (
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
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
      </SidebarProvider>
    </FinancialProvider>
  );
}
