"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import Logo from "@/components/icons/Logo";
import { Home, Search, PieChart, X, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface AppSidebarProps {
  isAdminArea?: boolean;
}

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function AppSidebar({ isAdminArea = false }: AppSidebarProps) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile, openMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const { isAdmin } = useAuth();

  const navItems: NavItem[] = [
    { href: "/dashboard", icon: <Home className="w-5 h-5" />, label: "Painel" },
    {
      href: "/dashboard/search",
      icon: <Search className="w-5 h-5" />,
      label: "Consultar",
    },
    {
      href: "/dashboard/monitoramento",
      icon: <PieChart className="w-5 h-5" />,
      label: "Monitoramento",
    },
  ];

  // if (isAdmin) {
  //   navItems.push({
  //     href: "/dashboard/forms/create",
  //     icon: <PlusCircle className="w-5 h-5" />,
  //     label: "Criar Formulário",
  //   });
  // }

  return (
    <div className="print:hidden">
      <Sidebar collapsible="icon" variant="floating" side="left">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          {/* Base dark glass */}
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" />

          {/* Strong gradient orbs */}
          <div className="absolute -top-20 -left-10 w-40 h-40 bg-cyan-400/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-20 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 w-40 h-40 bg-violet-500/15 rounded-full blur-3xl" />

          {/* Inner glow border effect */}
          <div className="absolute inset-0 rounded-2xl border border-white/10" />
          <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-b from-white/5 to-transparent" />
        </div>

        {/* Header */}
        <SidebarHeader className="relative z-10">
          <div className="flex items-center justify-between p-4">
            {/* Logo - Full */}
            <Link
              href="/dashboard"
              className="block group-data-[collapsible=icon]:hidden"
              aria-label="Ir para o painel"
              onClick={handleLinkClick}
            >
              <Logo textColor="#fff" iconColor="#22d3ee" />
            </Link>

            {/* Logo - Icon only */}
            <Link
              href="/dashboard"
              className="hidden group-data-[collapsible=icon]:flex items-center justify-center w-8 h-8"
              aria-label="Ir para o painel"
              onClick={handleLinkClick}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M5 10 L10 5 L10 19 L5 14 Z" fill="#22d3ee" />
                <path
                  d="M12 10 L17 5 L17 19 L12 14 Z"
                  fill="#22d3ee"
                  opacity="0.7"
                />
              </svg>
            </Link>

            {/* Close button for mobile */}
            {isMobile && openMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenMobile(false)}
                className="h-8 w-8 rounded-lg hover:bg-white/10 text-white group-data-[collapsible=icon]:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Glowing divider */}
          <div className="relative mx-4 group-data-[collapsible=icon]:hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="absolute inset-0 h-1 -top-0.5 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent blur-sm" />
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="relative px-3 pt-6 z-10">
          <SidebarMenu className="gap-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive && !isAdminArea}
                    tooltip={{ children: item.label, side: "right" }}
                    onClick={handleLinkClick}
                    size="lg"
                    className={`
                      rounded-xl transition-all duration-300
                      ${
                        isActive
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/20"
                          : "hover:bg-white/5 text-white/70 hover:text-white border border-transparent"
                      }
                    `}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3"
                    >
                      {item.icon}
                      <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="relative p-4 group-data-[collapsible=icon]:hidden z-10">
          <div className="rounded-xl bg-white/5 backdrop-blur-sm p-3 text-center border border-white/10">
            <p className="text-[11px] text-white/50">
              © {new Date().getFullYear()} Metalgalvano
            </p>
          </div>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
