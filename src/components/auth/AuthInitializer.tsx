
"use client";

import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';


interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export function AuthInitializer({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login';
    const isDashboardPage = pathname.startsWith('/dashboard');

    if (!user && isDashboardPage) {
      router.replace('/login');
    } else if (user && isAuthPage) {
      router.replace('/dashboard');
    } else if (!user && pathname === '/') {
      router.replace('/login');
    } else if (user && pathname === '/') {
      router.replace('/dashboard');
    }
  }, [user, loading, pathname, router]);

  if (loading && (pathname.startsWith('/dashboard') || pathname === '/')) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading }}>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </AuthContext.Provider>
  );
}

