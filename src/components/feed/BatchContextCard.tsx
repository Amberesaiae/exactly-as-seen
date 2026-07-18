import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FeedPhase } from '@/lib/feed-data';
import { isIntensiveSystem, productionSystemLabel } from '@/lib/production-system';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

interface BatchContextCardProps {
  batch: Batch;
  phase: FeedPhase | undefined;
  week: number;
  productionSystem?: string;
}

export function BatchContextCard({ batch, phase, week, productionSystem }: BatchContextCardProps) {
  const system = isIntensiveSystem(batch.production_system)
    ? `${productionSystemLabel(batch.production_system)} (Automatic Feed Pattern)`
    : `${productionSystemLabel(batch.production_system)} (Flexible)`;

  return (
    <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
      <div className="p-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-green-700 dark:text-green-400">Batch:</span>
          <span className="font-semibold text-green-800 dark:text-green-300">{batch.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700 dark:text-green-400">Species / Phase:</span>
          <span className="font-semibold text-green-800 dark:text-green-300 capitalize">
            {batch.species} · Week {week} · {phase?.name ?? 'Unknown'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700 dark:text-green-400">Production System:</span>
          <span className="font-semibold text-green-800 dark:text-green-300">{system}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700 dark:text-green-400">Current Population:</span>
          <span className="font-semibold text-green-800 dark:text-green-300">{batch.current_population} birds</span>
        </div>
        {phase && (
          <div className="flex justify-between">
            <span className="text-green-700 dark:text-green-400">Daily Intake Rate:</span>
            <span className="font-semibold text-green-800 dark:text-green-300">{phase.feedPerBirdG}g / bird</span>
          </div>
        )}
      </div>
    </Card>
  );
}
