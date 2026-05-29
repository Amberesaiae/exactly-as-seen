import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Info } from 'lucide-react';
import { type FeedPhase } from '@/lib/feed-data';

interface BatchLeanTipsProps {
  batch: any;
  targetKg: number;
  phase: FeedPhase | undefined;
}

/**
 * Lean Engineering Component: Provides 'Protocol-Based Estimates' as guidance
 * rather than hard-coded secondary primary input.
 */
export function BatchLeanTips({ batch, targetKg, phase }: BatchLeanTipsProps) {
  if (!batch || !phase) return null;

  const isSemiIntensive = batch.production_system === 'semi_intensive' || 
                         batch.production_system === 'free_range' || 
                         batch.production_system === 'pasture';

  return (
    <Card className="bg-primary/5 border-primary/10 shadow-none">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <Lightbulb className="h-4 w-4" /> Lean Planning Guide
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Protocol Standard ({phase.name}):</span>
            <span className="font-semibold">{phase.feedPerBirdG}g / bird</span>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Est. Batch Need ({batch.current_population} birds):</span>
            <span className="font-semibold">{(phase.feedPerBirdG * batch.current_population / 1000).toFixed(1)} kg / day</span>
          </div>

          {isSemiIntensive && (
            <div className="pt-2 border-t border-primary/10">
               <div className="flex items-start gap-2 text-[10px] text-green-700 leading-relaxed italic">
                 <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                 <span>
                   <strong>Lean Tip:</strong> Since this is a {batch.species} semi-intensive batch, birds will supplement their diet by foraging. Protocol suggests reducing commercial feed by 15-25% to save costs.
                 </span>
               </div>
            </div>
          )}
          
          {!isSemiIntensive && (
            <div className="pt-2 border-t border-primary/10">
               <div className="flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                 <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                 <span>
                   Estimates are based on {batch.species} {phase.name} phase protocol. Actual intake may vary by ±10% based on ambient temperature.
                 </span>
               </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
