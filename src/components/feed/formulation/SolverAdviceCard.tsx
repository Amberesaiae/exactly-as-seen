import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface SolverAdviceCardProps {
  status: 'optimal' | 'fallback' | 'manual';
  fallbackReason?: string;
  advice: Array<{ issue: string; suggestion: string }>;
}

export function SolverAdviceCard({ status, fallbackReason, advice }: SolverAdviceCardProps) {
  if (status !== 'fallback') return null;
  
  return (
    <Card className="border-amber-200 bg-amber-50/20">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs font-bold flex items-center gap-2 text-amber-700 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" /> Solver Intelligence: Fallback Applied
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-3 px-3">
        <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
          Reason: <strong>{fallbackReason?.replace('_', ' ')}</strong>. The optimizer could not meet all nutritional targets with the current ingredients and usage limits.
        </p>
        
        {advice.length > 0 && (
          <div className="space-y-2 pt-1">
            {advice.map((a, i) => (
              <div key={i} className="rounded-lg bg-white/50 p-2 border border-amber-200/50">
                <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" /> ISSUE: {a.issue}
                </p>
                <p className="text-[10px] text-amber-700 mt-1 italic">
                  💡 SUGGESTION: {a.suggestion}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
