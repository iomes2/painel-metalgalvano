import type React from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col print:block print:h-auto min-h-screen">
          <AppHeader />
          {/* Main content - pt-0 because header is not sticky anymore */}
          <main className="flex-1 w-full max-w-full px-3 pb-3 pt-3 print:p-0 print:bg-white print:h-auto">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
