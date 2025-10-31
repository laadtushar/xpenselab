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

  useEffect(() => {
    console.log('AppLayout: State update. isUserLoading:', isUserLoading, 'User:', !!user);

    // Wait until Firebase has finished its initial user check.
    if (isUserLoading) {
      console.log('AppLayout: User state is loading. Waiting.');
      return;
    }

    // If no user is found after the initial check, it's safe to redirect.
    if (!user) {
      console.log('AppLayout: No user found after loading. Redirecting to /login.');
      router.push('/login');
      return;
    }

    // If there is a user, verify their Firestore document exists.
    // This part is less critical for the redirect logic but important for data integrity.
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
        // Use non-blocking set so UI can render while this happens in the background.
        setDocumentNonBlocking(userDocRef, newUserDoc).finally(() => {
          console.log('AppLayout: Firestore document creation finished.');
          setIsFirestoreCheckComplete(true);
        });
      } else {
        console.log('AppLayout: Firestore document exists.');
        setIsFirestoreCheckComplete(true); // Doc already exists, check is complete.
      }
    }).catch(error => {
      console.error("AppLayout: Error checking/creating user document:", error);
      // Allow the app to render to avoid getting stuck.
      setIsFirestoreCheckComplete(true);
    });

  }, [user, isUserLoading, firestore, router]);


  const handleSignOut = () => {
    if (auth) {
      console.log('AppLayout: Signing out.');
      auth.signOut();
      // The useEffect hook above will detect the user is null and redirect to login.
    }
  };
  
  // Show a loader until we are certain about the user's auth state AND their Firestore record.
  if (isUserLoading || !isFirestoreCheckComplete) {
    console.log('AppLayout: Rendering loading screen. isUserLoading:', isUserLoading, 'isFirestoreCheckComplete:', isFirestoreCheckComplete);
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
