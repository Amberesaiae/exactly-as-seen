import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Cta = { label: string; to: string; variant?: 'default' | 'outline' };

export function PageHero({
  eyebrow,
  title,
  lead,
  ctas,
  meta,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
  ctas?: Cta[];
  meta?: string[];
}) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <Badge variant="secondary" className="font-normal">
          {eyebrow}
        </Badge>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {lead}
        </p>
        {ctas && ctas.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            {ctas.map((c) => (
              <Button key={c.label} size="lg" variant={c.variant ?? 'default'} asChild>
                <Link to={c.to}>{c.label}</Link>
              </Button>
            ))}
          </div>
        )}
        {meta && meta.length > 0 && (
          <>
            <Separator className="my-8 max-w-xl" />
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {meta.map((m) => (
                <li key={m} className="flex gap-2">
                  <span className="text-primary" aria-hidden>
                    —
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
