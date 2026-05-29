import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Progress } from '@/components/ui/progress';

// Note: The UI component was actually using its own Check/X from Lucide, 
// and a custom layout. Correcting to match the original style.
import { Check as CheckIcon, X as XIcon } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface NutrientComplianceCardProps {
  nutrition: { protein: number; energy: number; calcium: number };
  dbRequirements: any;
  phase: any;
}

export function NutrientComplianceCard({ nutrition, dbRequirements, phase }: NutrientComplianceCardProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Nutrient Compliance</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        {[
          { label: 'Protein', value: nutrition.protein, target: dbRequirements?.protein_min || phase?.proteinPct || 18, unit: '%' },
          { label: 'Energy', value: nutrition.energy, target: dbRequirements?.energy_min || phase?.energyKcal || 3000, unit: ' kcal/kg' },
          { label: 'Calcium', value: nutrition.calcium, target: dbRequirements?.calcium_min || phase?.calciumPct || 0.9, unit: '%' },
        ].map(n => {
          const complies = n.value >= n.target;
          return (
            <div key={n.label} className="border-b pb-2 last:border-none last:pb-0">
              <div className="flex justify-between mb-1 items-center">
                <span>{n.label}</span>
                <div className="flex items-center gap-1 font-semibold">
                  {complies ? <CheckIcon className="h-4 w-4 text-green-600" /> : <XIcon className="h-4 w-4 text-red-500" />}
                  <span>{n.value.toFixed(1)}{n.unit}</span>
                </div>
              </div>
              {n.target > 0 && (
                <div className="flex items-center gap-1.5">
                  <Progress value={Math.min((n.value / n.target) * 100, 100)} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-muted-foreground">Req: ≥ {n.target}{n.unit}</span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
