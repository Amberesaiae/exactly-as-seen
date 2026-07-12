import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const steps = [
  {
    n: '01',
    title: 'Open a flock',
    body: 'Pick species, house, start date, and production system. Protocol tasks (vaccines, duck niacin, turkey blackhead) seed automatically.',
  },
  {
    n: '02',
    title: 'Work the day list',
    body: 'Feed log, water, due meds. One checklist — not three apps fighting for the same morning.',
  },
  {
    n: '03',
    title: 'Money follows the work',
    body: 'Intensive: stock and expense book on confirm. Flexible: formulation saves without silent charges. Sales and purchases always ledger.',
  },
];

export function WorkflowSteps() {
  return (
    <section id="workflow" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Three moves. Then you are in the rhythm.
        </h2>
      </div>

      <ol className="mt-10 space-y-0">
        {steps.map((s, i) => (
          <li key={s.n}>
            <div className="grid gap-4 py-8 sm:grid-cols-12 sm:gap-8 sm:py-10">
              <div className="sm:col-span-2">
                <span className="font-mono text-sm tabular-nums text-primary">{s.n}</span>
              </div>
              <div className="sm:col-span-4">
                <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
              </div>
              <div className="sm:col-span-6">
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {s.body}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && <Separator />}
          </li>
        ))}
      </ol>

      <div className="mt-4">
        <Button asChild>
          <Link to="/register">Create account and open a flock</Link>
        </Button>
      </div>
    </section>
  );
}
