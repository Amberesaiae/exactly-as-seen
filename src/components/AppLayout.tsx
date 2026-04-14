import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileNav } from '@/components/MobileNav';
import { SyncIndicator } from '@/components/SyncIndicator';
import { Sprout } from 'lucide-react';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4">
            <SidebarTrigger className="hidden md:flex" />
            <div className="flex md:hidden items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sprout className="h-4 w-4" />
              </div>
              <span className="font-bold text-foreground">LampFarms</span>
            </div>
            <SyncIndicator />
          </header>

          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            <Outlet />
          </main>

          <MobileNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
