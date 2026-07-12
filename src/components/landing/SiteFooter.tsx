import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'Home', to: '/welcome' },
      { label: 'Platform', to: '/platform' },
      { label: 'Solutions', to: '/solutions' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', to: '/login' },
      { label: 'Register', to: '/register' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Impact', to: '/impact' },
      { label: 'Resources', to: '/resources' },
      { label: 'FAQ', to: '/welcome#faq' },
    ],
  },
];
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="text-lg font-semibold tracking-tight">LampFarms</div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Poultry house records that work when the network does not — built for
              broilers, layers, ducks, and turkeys on West African farms.
            </p>
            <Button className="mt-6" size="sm" asChild>
              <Link to="/register">Start free</Link>
            </Button>
          </div>
          {cols.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to.startsWith('/welcome#') ? '/welcome' : l.to}
                      onClick={() => {
                        if (l.to.includes('#')) {
                          const id = l.to.split('#')[1];
                          setTimeout(
                            () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }),
                            50
                          );
                        }
                      }}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} LampFarms. Records stay on your device until you sync.</p>
          <p className="flex gap-4">
            <span>English</span>
            <span className="text-border">·</span>
            <span>Français</span>
            <span className="text-border">·</span>
            <span>Twi</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
