
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { DashboardNav } from '@/components/dashboard-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, LogOut } from 'lucide-react';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { FinancialProvider } from '@/context/financial-context';
import { Button } from '@/components/ui/button';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User as UserData } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  console.log('AppLayout: Component rendered.');
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [isUserDocVerified, setIsUserDocVerified] = useState(false);

  useEffect(() => {
    console.log('AppLayout useEffect [user, isUserLoading, firestore, router]: Running...');
    console.log(`AppLayout useEffect: isUserLoading=${isUserLoading}, user=${!!user}`);

    if (isUserLoading) {
      console.log('AppLayout useEffect: Waiting for Firebase auth state to resolve.');
      return; // Wait until Firebase auth state is resolved
    }

    if (!user) {
      console.log('AppLayout useEffect: No user found after auth loaded. Redirecting to /login.');
      router.push('/login');
      return;
    }

    // Once we have a user, ensure their Firestore document exists.
    const checkAndCreateUserDoc = async () => {
      console.log('AppLayout checkAndCreateUserDoc: Starting for user:', user.uid);
      if (firestore && user.uid) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
              console.log('AppLayout checkAndCreateUserDoc: User document does not exist. Creating it...');
              const newUserDoc: Omit<UserData, 'id'> = {
                email: user.email!,
                createdAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, newUserDoc);
              console.log('AppLayout checkAndCreateUserDoc: User document created successfully.');
            } else {
              console.log('AppLayout checkAndCreateUserDoc: User document already exists.');
            }
            // Mark as verified whether it existed or was just created
            setIsUserDocVerified(true);
            console.log('AppLayout checkAndCreateUserDoc: Setting isUserDocVerified to true.');
        } catch (error) {
            console.error("AppLayout checkAndCreateUserDoc: Error checking/creating user document:", error);
            // Optional: handle error, e.g., sign out user
        }
      }
    };

    checkAndCreateUserDoc();

  }, [user, isUserLoading, firestore, router]);


  const handleSignOut = () => {
    console.log('handleSignOut: Clicked.');
    if (auth) {
      auth.signOut();
    }
  };
  
  console.log(`AppLayout render: isUserLoading=${isUserLoading}, isUserDocVerified=${isUserDocVerified}`);

  // Show a loading screen while auth state is being determined OR we are verifying the user doc.
  if (isUserLoading || !isUserDocVerified) {
    console.log('AppLayout render: Showing loading screen.');
    return (
      <div className="flex h-screen items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // The redirect for a non-existent user is handled in the useEffect hook.
  // If we reach this point, it means we have a user and their doc is verified.
  console.log('AppLayout render: All checks passed. Rendering app layout.');
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
