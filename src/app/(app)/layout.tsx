'use client';
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { DashboardNav } from '@/components/dashboard-nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, LogOut } from 'lucide-react';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { FinancialProvider } from '@/context/financial-context';
import { Button } from '@/components/ui/button';
import { doc, setDoc } from 'firebase/firestore';
import type { User as UserData } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  
  console.log('AppLayout Render:', { isUserLoading, user: !!user, pathname });


  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userDoc, isLoading: isUserDocLoading } = useDoc<UserData>(userDocRef);

  useEffect(() => {
    // This effect handles creating a user document in Firestore the first time they log in.
    if (user && !isUserDocLoading && !userDoc && userDocRef) {
      console.log(`User document for ${user.uid} not found, creating it...`);
      const newUserDoc: Omit<UserData, 'id'> = {
        email: user.email!,
        createdAt: new Date().toISOString(),
      };
      // Use non-blocking write. No need to await.
      setDoc(userDocRef, newUserDoc);
    }
  }, [user, userDoc, isUserDocLoading, userDocRef]);


  useEffect(() => {
    // This effect handles routing based on auth state.
    console.log(`Auth effect: isUserLoading=${isUserLoading}, user=${!!user}`);
    if (!isUserLoading && !user) {
        console.log('Redirecting to /login because user is not loaded and not present.');
        router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = () => {
    if (auth) {
      console.log('Signing out...');
      auth.signOut();
    }
  };
  
  // Show a loading screen while auth state is being determined, or if the user doc is still loading for an authenticated user.
  if (isUserLoading || (user && isUserDocLoading)) {
    console.log('Showing AppLayout loading screen:', {isUserLoading, isUserDocLoading: user && isUserDocLoading});
    return (
      <div className="flex h-screen items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If there's no user after loading, this layout shouldn't render anything,
  // as the useEffect above will have already started the redirect to /login.
  if (!user) {
    console.log('AppLayout returning null, redirect should be in progress.');
    return null;
  }

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
