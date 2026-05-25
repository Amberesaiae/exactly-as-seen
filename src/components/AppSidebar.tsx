import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Bird, FlaskConical, HeartPulse, Egg,
  Wallet, Package, LineChart, Settings, LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const groups = [
  {
    label: 'Today',
    items: [{ title: 'Overview', url: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Flocks', url: '/batches', icon: Bird },
      { title: 'Feed Lab', url: '/feed', icon: FlaskConical },
      { title: 'Care & Water', url: '/health', icon: HeartPulse },
      { title: 'Harvest', url: '/eggs', icon: Egg },
      { title: 'Inventory', url: '/stock', icon: Package },
    ],
  },
  {
    label: 'Insights',
    items: [
      { title: 'Ledger', url: '/finance', icon: Wallet },
      { title: 'Performance', url: '/records', icon: LineChart },
    ],
  },
  {
    label: 'Account',
    items: [{ title: 'Farm Settings', url: '/settings', icon: Settings }],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { signOut } = useAuth();
  const [hasEggLayers, setHasEggLayers] = useState<boolean>(true);

  useEffect(() => {
    const checkBatches = async () => {
      try {
        const activeBatches = await db.batches.where('status').equals('active').toArray();
        if (activeBatches.length > 0) {
          const hasLayers = activeBatches.some(b => b.species === 'layer' || b.species === 'duck');
          setHasEggLayers(hasLayers);
        } else {
          setHasEggLayers(true);
        }
      } catch (err) {
        console.error('Error checking egg layers in sidebar:', err);
      }
    };
    checkBatches();
    
    // Periodically update active layers check to handle creation/updates
    const interval = setInterval(checkBatches, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredGroups = useMemo(() => {
    return groups.map(group => {
      if (group.label === 'Operations') {
        return {
          ...group,
          items: group.items.filter(item => {
            if (item.title === 'Harvest') {
              return hasEggLayers;
            }
            return true;
          })
        };
      }
      return group;
    });
  }, [hasEggLayers]);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex h-16 items-center px-4 border-b border-sidebar-border">
        {collapsed
          ? <span className="text-sm font-black tracking-tight text-sidebar-foreground">LF</span>
          : <span className="text-lg font-black tracking-tight text-sidebar-foreground">LampFarms<sup className="ml-0.5 text-[9px]">®</sup></span>
        }
      </div>

      <SidebarContent className="px-2 py-3">
        {filteredGroups.map(group => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '/');
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-sidebar-foreground'
                          }`}
                          activeClassName=""
                        >
                          <item.icon className="h-[18px] w-[18px] shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent">
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
