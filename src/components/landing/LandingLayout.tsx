import { Outlet } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { ScrollToTop } from './ScrollToTop';

/** @deprecated Prefer Badge / section labels — kept for sub-pages still importing Eyebrow */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="h-px w-5 bg-border" aria-hidden />
      {children}
    </span>
  );
}

export default function LandingLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <ScrollToTop />
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
