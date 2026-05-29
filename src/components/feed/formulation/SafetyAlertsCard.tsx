import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Info } from 'lucide-react';

interface SafetyAlertsCardProps {
  warnings: string[];
}

export function SafetyAlertsCard({ warnings }: SafetyAlertsCardProps) {
  if (warnings.length === 0) return null;
  
  return (
    <Card className="border-yellow-500/50 bg-yellow-50/30">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-yellow-700 uppercase tracking-wider">
          <AlertTriangle className="h-3.5 w-3.5" /> Safety & Quality Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-3 px-3">
        {warnings.map((w, i) => (
          <div key={i} className="flex items-start gap-2 text-[11px] text-yellow-900 font-medium">
            <Info className="h-3 w-3 text-yellow-600 shrink-0 mt-0.5" />
            <span>{w}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
