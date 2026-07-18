import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PrivacyMask } from '@/components/ui/PrivacyMask';

interface CostAnalysisCardProps {
  selected: any[];
  totalCost: number;
}

export function CostAnalysisCard({ selected, totalCost }: CostAnalysisCardProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Cost Analysis</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        {selected.filter(s => s.quantityKg > 0).map(s => (
          <div key={s.ingredient.name} className="flex justify-between text-xs">
            <span className="truncate max-w-[140px]">{s.ingredient.name}</span>
            <span>GH₵ <PrivacyMask value={(s.quantityKg * s.unitPrice).toFixed(2)} /></span>
          </div>
        ))}
        {selected.some(s => s.quantityKg > 0) && (
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total Cost</span>
            <span>GH₵ <PrivacyMask value={totalCost.toFixed(2)} /></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
