import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const links = [
  { name: 'Platform', to: '/platform' },
  { name: 'Solutions', to: '/solutions' },
  { name: 'Impact', to: '/impact' },
  { name: 'Resources', to: '/resources' },
];
function scrollToHash(to: string) {
  const id = to.split('#')[1];
  if (!id) return;
  setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80);
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-[background-color,box-shadow] duration-200',
        scrolled
          ? 'border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90'
          : 'border-border/60 bg-background'
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/welcome" className="group flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            LampFarms
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:inline">
            ledger
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {links.map((l) =>
            l.hash ? (
              <a
                key={l.name}
                href={l.to}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {l.name}
              </a>
            ) : (
              <NavLink
                key={l.name}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted hover:text-foreground',
                    isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'
                  )
                }
              >
                {l.name}
              </NavLink>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">Open free farm</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100%,20rem)]">
            <SheetHeader>
              <SheetTitle className="text-left font-semibold tracking-tight">LampFarms</SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-0.5" aria-label="Mobile">
              {links.map((l) => (
                <Link
                  key={l.name}
                  to={l.hash ? '/welcome' : l.to}
                  onClick={() => {
                    setOpen(false);
                    if (l.hash) scrollToHash(l.to);
                  }}
                  className="rounded-md px-3 py-3 text-base font-medium hover:bg-muted"
                >
                  {l.name}
                </Link>
              ))}
            </nav>
            <Separator className="my-6" />
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild onClick={() => setOpen(false)}>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild onClick={() => setOpen(false)}>
                <Link to="/register">Open free farm</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
