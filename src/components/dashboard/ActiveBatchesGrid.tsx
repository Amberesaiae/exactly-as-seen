import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bird, Skull } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBatchAge } from '@/lib/batch-utils';

interface ActiveBatchesGridProps {
  batches: any[];
  onRecordMortality: (batch: any) => void;
}

export function ActiveBatchesGrid({ batches, onRecordMortality }: ActiveBatchesGridProps) {
  if (batches.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Bird className="h-5 w-5 text-primary" /> Active Flocks
        </h2>
        <Button variant="link" size="sm" className="text-xs" asChild>
          <Link to="/batches">View All</Link>
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {batches.map(batch => {
          const age = getBatchAge(batch.start_date, batch.species);
          return (
            <Card key={batch.id} className="min-w-[280px] border-primary/10 hover:border-primary/30 transition-colors shrink-0">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base truncate max-w-[160px]">{batch.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
                      {batch.species} • Week {age.week}
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none rounded-full text-[10px]">
                    {batch.current_population} birds
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="rounded-full text-[10px] h-8 gap-1.5" onClick={() => onRecordMortality(batch)}>
                    <Skull className="h-3 w-3" /> Record Death
                  </Button>
                  <Button variant="default" size="sm" className="rounded-full text-[10px] h-8 gap-1.5" asChild>
                    <Link to={`/batches/${batch.id}`}>
                      Details <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
