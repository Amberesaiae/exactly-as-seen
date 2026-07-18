import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileNav } from '@/components/MobileNav';
import { SyncIndicator } from '@/components/SyncIndicator';
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
            <div className="flex md:hidden items-center">
              <span className="font-black tracking-tight text-foreground">LampFarms<sup className="ml-0.5 text-[9px]">®</sup></span>
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
