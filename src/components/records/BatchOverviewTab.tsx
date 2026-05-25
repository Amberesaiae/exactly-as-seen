import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { mortalityRate } from '@/lib/batch-utils';
import type { Database } from '@/integrations/supabase/types';
import type { BatchPerformance } from '@/hooks/useRecordsPerformance';

type Batch = Database['public']['Tables']['batches']['Row'];

interface Props {
  batches: Batch[];
  performanceData: Record<string, BatchPerformance>;
}

export function BatchOverviewTab({ batches, performanceData }: Props) {
  if (batches.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No records to display.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="pt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">Name</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">Species</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">Initial</th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">Current</th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">Mortality %</th>
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">Started</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="py-2 px-2 font-medium">{b.name}</td>
                <td className="py-2 px-2 capitalize">{b.species}</td>
                <td className="py-2 px-2 capitalize">{b.status}</td>
                <td className="py-2 px-2 text-right">{b.initial_quantity}</td>
                <td className="py-2 px-2 text-right">{b.current_population}</td>
                <td className="py-2 px-2 text-right">
                  {performanceData[b.id]?.mortalityPct
                    ?? mortalityRate(b.initial_quantity, b.current_population)}%
                </td>
                <td className="py-2 px-2">{format(new Date(b.start_date), 'MMM d, yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
