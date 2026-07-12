import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductFrame } from '@/components/landing/ProductFrame';
import { ProofStrip } from '@/components/landing/ProofStrip';
import { WorkflowSteps } from '@/components/landing/WorkflowSteps';
import { ModuleTabs } from '@/components/landing/ModuleTabs';
import { FieldNote } from '@/components/landing/FieldNote';
import { LandingFaq } from '@/components/landing/LandingFaq';
import { CloseCta } from '@/components/landing/CloseCta';

const species = ['Broiler', 'Layer', 'Duck', 'Turkey'];

/**
 * Marketing home — field-ledger direction (anti generic AI SaaS).
 * Composes reusable landing sections + shadcn/Radix primitives only.
 */
export default function Welcome() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle ledger rules — craft, not decorative blobs */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 31px, hsl(var(--border) / 0.55) 31px, hsl(var(--border) / 0.55) 32px)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14">
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6 lg:pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  Offline-first
                </Badge>
                <Badge variant="outline" className="font-normal">
                  West Africa
                </Badge>
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.15rem]">
                The house ledger
                <br className="hidden sm:block" />
                {' '}
                for serious flocks.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                Log feed and mortality. Run vaccinations without guessing withdrawal.
                Formulate with what is at the market — even when the tower is dead.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/register">Open free farm</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#workflow">How it works</a>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-1.5">
                {species.map((s) => (
                  <Badge key={s} variant="outline" className="rounded-sm font-normal">
                    {s}
                  </Badge>
                ))}
              </div>

              <Separator className="my-8 max-w-md" />

              <dl className="grid max-w-md grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Books
                  </dt>
                  <dd className="mt-0.5 text-foreground">
                    Intensive auto-ledger or flexible manual
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Safety
                  </dt>
                  <dd className="mt-0.5 text-foreground">
                    Withdrawal blocks sale until clear
                  </dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-6">
              <ProductFrame className="lg:ml-auto lg:max-w-[26rem]" />
              <p className="mt-3 text-center text-[11px] text-muted-foreground lg:pr-1 lg:text-right">
                Live product surface · not a stock photo
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProofStrip />
      <WorkflowSteps />
      <ModuleTabs />
      <FieldNote />
      <LandingFaq />
      <CloseCta />
    </div>
  );
}
