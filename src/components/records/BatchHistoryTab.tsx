import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Eye, Skull, ShieldAlert, Sparkles, ShoppingBag, Landmark, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

interface Props {
  batches: Batch[];
  farmId: string | null;
}

interface TimelineEvent {
  id: string;
  kind: 'mortality' | 'vaccination' | 'feed' | 'weight' | 'expense' | 'revenue' | 'general';
  date: string;
  title: string;
  description: string;
}

export default function BatchHistoryTab({ batches, farmId }: Props) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  useEffect(() => {
    if (!farmId || !selectedBatchId) return;
    const fetchTimeline = async () => {
      setLoading(true);
      try {
        const [mortRes, feedRes, taskRes, expRes, revRes] = await Promise.all([
          supabase.from('mortality_records').select('*').eq('batch_id', selectedBatchId).order('recorded_at', { ascending: false }),
          supabase.from('feed_schedules').select('*').eq('batch_id', selectedBatchId).eq('completed', true).order('completed_at', { ascending: false }),
          supabase.from('health_tasks').select('*').eq('batch_id', selectedBatchId).eq('completed', true).order('completed_at', { ascending: false }),
          supabase.from('expenses').select('*').eq('batch_id', selectedBatchId).order('date', { ascending: false }),
          supabase.from('revenue').select('*').eq('batch_id', selectedBatchId).order('date', { ascending: false }),
        ]);

        const events: TimelineEvent[] = [];

        (mortRes.data ?? []).forEach(r => {
          events.push({
            id: r.id,
            kind: 'mortality',
            date: r.recorded_at,
            title: `Mortality Recorded`,
            description: `${r.count} bird(s) lost. Reason: ${r.cause || 'Not specified'}.`,
          });
        });

        (feedRes.data ?? []).forEach(s => {
          events.push({
            id: s.id,
            kind: 'feed',
            date: s.completed_at || s.day ? new Date().toISOString() : '', // fallback
            title: `Fed Flock`,
            description: `Flock successfully fed for Day ${s.day || '—'}.`,
          });
        });

        (taskRes.data ?? []).forEach(t => {
          events.push({
            id: t.id,
            kind: 'vaccination',
            date: t.completed_at || '',
            title: `Medication / Vaccine Complete`,
            description: `Administered: ${t.product_name || 'treatment'}.`,
          });
        });

        (expRes.data ?? []).forEach(e => {
          events.push({
            id: e.id,
            kind: 'expense',
            date: e.date,
            title: `Expense Logged`,
            description: `${e.category}: ${e.description}.`,
          });
        });

        (revRes.data ?? []).forEach(r => {
          events.push({
            id: r.id,
            kind: 'revenue',
            date: r.date,
            title: `Revenue Recorded`,
            description: `${r.category}: ${r.description}. Buyer: ${r.buyer || 'Unknown'}.`,
          });
        });

        // Sort descending
        const sorted = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTimeline(sorted);
      } catch (e) {
        console.error('Failed to load history timeline', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [farmId, selectedBatchId]);

  const batch = batches.find(b => b.id === selectedBatchId);

  return (
    <div className="space-y-4 mt-4">
      <div className="max-w-xs space-y-1">
        <Label>Select Active or Terminated Flock</Label>
        <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
          <SelectTrigger>
            <SelectValue placeholder="Select flock..." />
          </SelectTrigger>
          <SelectContent>
            {batches.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {batch ? (
        <Card>
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0 border-b">
            <div>
              <CardTitle className="text-base flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" /> Timeline of Events
              </CardTitle>
              <CardDescription>Chronological biosecurity log and records for "{batch.name}"</CardDescription>
            </div>
            {batch.status && (
              <Badge variant={batch.status === 'active' ? 'default' : 'secondary'} className="text-xxs uppercase">
                {batch.status}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-12">No event records found for this flock cycle.</p>
            ) : (
              <ScrollArea className="h-[380px] pr-2">
                <div className="relative border-l-2 border-primary/20 ml-3 pl-5 space-y-5 py-2">
                  {timeline.map((event, idx) => {
                    let icon = <Sparkles className="h-3 w-3 text-white" />;
                    let color = 'bg-primary';

                    if (event.kind === 'mortality') {
                      icon = <Skull className="h-3 w-3 text-white" />;
                      color = 'bg-destructive animate-pulse';
                    } else if (event.kind === 'vaccination') {
                      icon = <ShieldAlert className="h-3 w-3 text-white" />;
                      color = 'bg-amber-500';
                    } else if (event.kind === 'feed') {
                      icon = <ShoppingBag className="h-3 w-3 text-white" />;
                      color = 'bg-emerald-500';
                    } else if (event.kind === 'expense' || event.kind === 'revenue') {
                      icon = <Landmark className="h-3 w-3 text-white" />;
                      color = 'bg-indigo-500';
                    }

                    return (
                      <div key={idx} className="relative group">
                        {/* Dot Indicator */}
                        <div className={`absolute -left-[27px] top-1 h-5.5 w-5.5 rounded-full flex items-center justify-center ${color} shadow-sm border border-background`}>
                          {icon}
                        </div>
                        {/* Info details */}
                        <div className="space-y-0.5">
                          <p className="text-xxs text-muted-foreground font-mono">
                            {event.date ? format(new Date(event.date), 'MMM d, yyyy • h:mm a') : '—'}
                          </p>
                          <h4 className="text-xs font-bold text-foreground leading-none">{event.title}</h4>
                          <p className="text-xs text-muted-foreground pt-0.5">{event.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center flex flex-col items-center justify-center">
            <Eye className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Select a batch to inspect its lifecycle history.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
