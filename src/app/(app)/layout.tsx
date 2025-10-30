
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
    console.log('[AppLayout] Effect triggered. isUserLoading:', isUserLoading, 'user:', !!user);
    if (isUserLoading) {
      console.log('[AppLayout] Still loading user auth state. Aborting effect.');
      return; 
    }

    if (!user) {
      console.log('[AppLayout] No user found. Redirecting to /login.');
      router.push('/login');
      return;
    }

    console.log('[AppLayout] User is authenticated. Checking Firestore document for UID:', user.uid);
    const checkAndCreateUserDoc = async () => {
      if (firestore && user.uid) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
            console.log('[AppLayout] Getting user doc from Firestore.');
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
              console.log('[AppLayout] User doc does not exist. Creating it now.');
              const newUserDoc: Omit<UserData, 'id'> = {
                email: user.email!,
                createdAt: new Date().toISOString(),
              };
              await setDoc(userDocRef, newUserDoc);
              console.log('[AppLayout] User doc created successfully.');
            } else {
              console.log('[AppLayout] User doc already exists.');
            }
            console.log('[AppLayout] Setting isUserDocVerified to true.');
            setIsUserDocVerified(true);
        } catch (error) {
            console.error("[AppLayout] Error checking/creating user document:", error);
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
  
  if (isUserLoading || !isUserDocVerified) {
    console.log('[AppLayout] Render: Showing full-page loader. isUserLoading:', isUserLoading, 'isUserDocVerified:', isUserDocVerified);
    return (
      <div className="flex h-screen items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  console.log('[AppLayout] Render: Rendering full app layout for user:', user?.email);
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
