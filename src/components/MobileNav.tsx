import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bird, FlaskConical, HeartPulse, MoreHorizontal, Egg, Wallet, Package, LineChart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { db } from '@/lib/db';

const primaryItems = [
  { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Flocks', url: '/batches', icon: Bird },
  { title: 'Feed Lab', url: '/feed', icon: FlaskConical },
  { title: 'Care & Water', url: '/health', icon: HeartPulse },
];

const baseMoreItems = [
  { title: 'Harvest', url: '/eggs', icon: Egg },
  { title: 'Ledger', url: '/finance', icon: Wallet },
  { title: 'Inventory', url: '/stock', icon: Package },
  { title: 'Performance', url: '/records', icon: LineChart },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function MobileNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
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
        console.error('Error checking egg layers in mobile nav:', err);
      }
    };
    checkBatches();
    
    const interval = setInterval(checkBatches, 3000);
    return () => clearInterval(interval);
  }, []);

  const moreItems = useMemo(() => {
    return baseMoreItems.filter(item => {
      if (item.title === 'Harvest') {
        return hasEggLayers;
      }
      return true;
    });
  }, [hasEggLayers]);

  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + '/');
  const moreActive = moreItems.some(item => isActive(item.url));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
        <div className="flex items-center justify-around py-2">
          {primaryItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold transition-colors',
                isActive(item.url) ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowMore(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold transition-colors',
              moreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <Sheet open={showMore} onOpenChange={setShowMore}>
        <SheetContent side="bottom" className="rounded-t-xl pb-8">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
            <SheetDescription>Access all modules</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {moreItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors',
                  isActive(item.url) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
