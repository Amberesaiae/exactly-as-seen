import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function CloseCta() {
  return (
    <section className="border-t border-border bg-foreground text-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-16">
        <div className="max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-background/50">
            Next step
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Open the house ledger.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-background/65">
            Free account. First flock. Offline logs. No card required.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            className="bg-background text-foreground hover:bg-background/90"
            asChild
          >
            <Link to="/register">Create account</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-background/25 bg-transparent text-background hover:bg-background/10 hover:text-background"
            asChild
          >
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
