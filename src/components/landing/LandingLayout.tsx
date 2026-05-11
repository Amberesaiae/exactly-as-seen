import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const LANDING_NAV = [
  { label: 'Platform', to: '/platform' },
  { label: 'Solutions', to: '/solutions' },
  { label: 'Impact', to: '/impact' },
  { label: 'Resources', to: '/resources' },
];

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
      <span className="h-px w-6 bg-foreground/40" />
      {children}
    </span>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{title}</div>
      <ul className="mt-4 space-y-2">
        {links.map(l => (
          <li key={l}><a href="#" className="text-sm hover:underline underline-offset-4">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

export default function LandingLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === '/welcome' || pathname === '/';

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 lg:px-10">
          <Link to="/welcome" className="text-xl font-black tracking-tight">
            LampFarms<sup className="ml-0.5 text-[10px] font-bold align-super">®</sup>
          </Link>
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-foreground/10 bg-card/60 px-2 py-1.5">
            {LANDING_NAV.map(n => (
              <NavLink key={n.label} to={n.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    isActive ? 'bg-foreground text-background' : 'text-foreground/80 hover:bg-foreground/5'
                  }`
                }>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold hover:underline underline-offset-4">Sign in</Link>
            <Link to="/register"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition">
              Get started <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 -mr-2" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background w-[88vw]">
              <div className="flex items-center justify-between mb-10">
                <span className="text-xl font-black">LampFarms</span>
                <button onClick={() => setOpen(false)}><X className="h-6 w-6" /></button>
              </div>
              <div className="flex flex-col gap-1">
                {LANDING_NAV.map(n => (
                  <NavLink key={n.label} to={n.to} onClick={() => setOpen(false)}
                    className="py-3 text-2xl font-bold tracking-tight border-b border-foreground/10">
                    {n.label}
                  </NavLink>
                ))}
              </div>
              <div className="mt-10 flex flex-col gap-3">
                <Link to="/login" className="rounded-full border border-foreground/20 px-5 py-3 text-center text-sm font-semibold">Sign in</Link>
                <Link to="/register" className="rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground">Get started</Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-foreground/10 mt-12">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="text-2xl font-black tracking-tight">LampFarms<sup className="ml-0.5 text-xs">®</sup></div>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
                Smart poultry management for the next generation of West African farmers.
              </p>
              {!isHome && (
                <Link to="/register"
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background">
                  Start your free farm <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <FooterCol title="Platform" links={['Overview', 'Flocks', 'Feed Lab', 'Care & Water', 'Ledger']} />
            <FooterCol title="Company" links={['About', 'Contact', 'Careers', 'Press']} />
            <FooterCol title="Legal" links={['Privacy', 'Terms', 'Cookies', 'Security']} />
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-6 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} LampFarms. All rights reserved.</span>
            <span>EN · FR · TWI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
