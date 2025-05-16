
"use client";

import Logo from '@/components/icons/Logo';
import { UserNav } from '@/components/layout/UserNav';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <Link href="/dashboard" aria-label="Ir para o painel">
            <Logo textColor="hsl(var(--card-foreground))" iconColor="hsl(var(--primary))" />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Add any other header items here, like notifications */}
          <UserNav />
        </div>
      </div>
    </header>
  );
}
