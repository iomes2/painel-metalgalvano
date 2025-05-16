
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Logo from '@/components/icons/Logo';
import { formDefinitions } from '@/config/forms';
import { Home } from 'lucide-react';
import { getFormIcon } from '@/components/icons/icon-resolver';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset" side="left">
      <SidebarHeader className="items-center">
        <Link href="/dashboard" className="block group-data-[collapsible=icon]:hidden" aria-label="Ir para o painel">
          <Logo textColor="hsl(var(--sidebar-foreground))" iconColor="hsl(var(--sidebar-primary))" />
        </Link>
         <Link href="/dashboard" className="hidden group-data-[collapsible=icon]:block" aria-label="Ir para o painel">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-sidebar-primary"><path d="M5 10 L10 5 L10 19 L5 14 Z" fill="hsl(var(--sidebar-primary))" /><path d="M12 10 L17 5 L17 19 L12 14 Z" fill="hsl(var(--sidebar-primary))" opacity="0.7" /></svg>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={pathname === '/dashboard'}
              tooltip={{children: "Painel", side:"right"}}
            >
              <Link href="/dashboard">
                <Home />
                <span>Painel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {formDefinitions.map((form) => {
            const IconComponent = getFormIcon(form.iconName);
            return (
              <SidebarMenuItem key={form.id}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === `/dashboard/forms/${form.id}`}
                  tooltip={{children: form.name, side:"right"}}
                >
                  <Link href={`/dashboard/forms/${form.id}`}>
                    <IconComponent />
                    <span>{form.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 text-center text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
        <p>&copy; {new Date().getFullYear()} Metalgalvano</p>
      </SidebarFooter>
    </Sidebar>
  );
}
