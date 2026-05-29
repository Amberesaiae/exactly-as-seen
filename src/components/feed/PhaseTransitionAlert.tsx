import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wheat, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

interface PhaseTransitionAlertProps {
  phase: any;
  lastSchedule: any;
}

export function PhaseTransitionAlert({ phase, lastSchedule }: PhaseTransitionAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !phase || !lastSchedule) return null;
  
  const isTransition = lastSchedule.amount_per_bird_g !== phase.feedPerBirdG;
  if (!isTransition) return null;

  return (
    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
      <Wheat className="h-4 w-4 text-amber-600" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <AlertTitle className="text-amber-800 dark:text-amber-300">
            🌾 Feed Phase Changed — {phase.name} Phase
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400 mt-1">
            New consumption rate: <strong>{phase.feedPerBirdG}g</strong> / bird / day
            {' '}(was {lastSchedule.amount_per_bird_g}g)
          </AlertDescription>
          <Button size="sm" className="mt-2 rounded-full h-7 text-xs gap-1" asChild>
            <Link to="/feed/formulate">Plan {phase.name} Feed →</Link>
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-amber-600 hover:text-amber-800" onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
