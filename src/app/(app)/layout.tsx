
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { DashboardNav } from '@/components/dashboard-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, LogOut } from 'lucide-react';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { FinancialProvider } from '@/context/financial-context';
import { Button } from '@/components/ui/button';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User as UserData } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [isUserDocVerified, setIsUserDocVerified] = useState(false);

  useEffect(() => {
    // This effect handles redirection and user document creation.
    if (isUserLoading) {
      // Still waiting for Firebase to determine the auth state.
      return; 
    }

    if (!user) {
      // If auth is loaded and there's no user, redirect to login.
      router.push('/login');
      return;
    }

    // If we have a user, we must ensure their Firestore document exists.
    const checkAndCreateUserDoc = async () => {
      if (firestore && user.uid) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
              const newUserDoc: Omit<UserData, 'id'> = {
                email: user.email!,
                createdAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, newUserDoc);
            }
            // Mark as verified whether it existed or was just created.
            setIsUserDocVerified(true);
        } catch (error) {
            console.error("Error checking/creating user document:", error);
            // Optional: handle error, e.g., sign out user
        }
      }
    };

    checkAndCreateUserDoc();

  }, [user, isUserLoading, firestore, router]);


  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
    }
  };
  
  // Show a loading screen while auth state is being determined OR we are verifying the user doc.
  // This is a crucial step to prevent rendering the app before we are sure the user is authenticated and ready.
  if (isUserLoading || !isUserDocVerified) {
    return (
      <div className="flex h-screen items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // If we reach this point, it means:
  // 1. Firebase auth check is complete.
  // 2. We have a valid user object.
  // 3. The user's Firestore document has been verified or created.
  // It is now safe to render the full application layout.
  return (
    <FinancialProvider>
      <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <Logo />
                <span className="text-xl font-headline font-semibold">FinanceFlow</span>
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
