import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getBatchAge, mortalityRate, recordMortality, cleanupBatchCompletion } from '@/lib/batch-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Users, Calendar, Skull, FileText, Calculator, Droplets, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type MortalityRecord = Database['public']['Tables']['mortality_records']['Row'];

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [mortalities, setMortalities] = useState<MortalityRecord[]>([]);

  const [mCount, setMCount] = useState('1');
  const [mCause, setMCause] = useState('');
  const [mNotes, setMNotes] = useState('');
  const [mSubmitting, setMSubmitting] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const [batchResult, mortalityResult] = await Promise.all([
        supabase.from('batches').select('*').eq('id', id).single(),
        supabase.from('mortality_records').select('*').eq('batch_id', id).order('recorded_at', { ascending: false }),
      ]);
      if (batchResult.error) toast.error('Failed to load batch');
      setBatch(batchResult.data);
      setMortalities(mortalityResult.data ?? []);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleRecordMortality = async () => {
    if (!batch) return;
    setMSubmitting(true);
    const count = parseInt(mCount) || 0;
    if (count <= 0) { toast.error('Count must be positive'); setMSubmitting(false); return; }
    if (count > batch.current_population) { toast.error('Count exceeds current population'); setMSubmitting(false); return; }

    const newPop = await recordMortality({
      batchId: batch.id,
      farmId: batch.farm_id,
      batchName: batch.name,
      currentPopulation: batch.current_population,
      count,
      cause: mCause || undefined,
      notes: mNotes || undefined,
    });

    if (newPop === null) { toast.error('Failed to record mortality'); setMSubmitting(false); return; }

    // Re-fetch mortality records
    const { data: newMortalities } = await supabase.from('mortality_records').select('*').eq('batch_id', batch.id).order('recorded_at', { ascending: false });
    setMortalities(newMortalities ?? []);
    setBatch({ ...batch, current_population: newPop });
    setMCount('1');
    setMCause('');
    setMNotes('');
    setMSubmitting(false);
    toast.success(`Recorded ${count} mortality`);
  };

  const saveNote = async () => {
    if (!batch || !noteText.trim()) return;
    const timestamp = format(new Date(), 'MMM d, yyyy h:mm a');
    const newNotes = batch.notes
      ? `${batch.notes}\n\n[${timestamp}]\n${noteText}`
      : `[${timestamp}]\n${noteText}`;
    const { error } = await supabase.from('batches').update({ notes: newNotes }).eq('id', batch.id);
    if (error) { toast.error(error.message); return; }
    setBatch({ ...batch, notes: newNotes });
    setNoteText('');
    toast.success('Note saved');
  };

  const completeBatch = async () => {
    if (!batch) return;
    setCompleting(true);
    const { error } = await supabase.from('batches').update({ status: 'completed' }).eq('id', batch.id);
    if (error) { toast.error(error.message); setCompleting(false); return; }

    // Cleanup related records
    await cleanupBatchCompletion(batch.id);

    await supabase.from('activity_log').insert({
      farm_id: batch.farm_id,
      batch_id: batch.id,
      event_type: 'batch_completed',
      description: `Batch "${batch.name}" marked as completed`,
    });
    setBatch({ ...batch, status: 'completed' });
    setCompleting(false);
    toast.success('Batch marked as completed');
  };

  if (loading) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  if (!batch) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Batch not found.</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => navigate('/batches')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Batches
        </Button>
      </div>
    );
  }

  const age = getBatchAge(batch.start_date, batch.species);
  const totalMortality = mortalities.reduce((sum, m) => sum + m.count, 0);
  const mRate = mortalityRate(batch.initial_quantity, batch.current_population);

  const mortalityChartData = mortalities.slice().reverse().reduce((acc: { date: string; cumulative: number }[], m) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    acc.push({ date: format(new Date(m.recorded_at), 'MMM d'), cumulative: prev + m.count });
    return acc;
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/batches"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{batch.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">
              {batch.species} • {age.phase} • Week {age.week}
              {batch.status === 'completed' && <span className="ml-2 text-muted-foreground">(Completed)</span>}
            </p>
          </div>
        </div>
        {batch.status === 'active' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                <CheckCircle2 className="h-4 w-4" /> Complete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete this batch?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark "{batch.name}" as completed. All pending feed schedules, vaccinations, and health tasks will be closed. The batch will move to your records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={completeBatch} disabled={completing}>
                  {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Complete Batch'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="mortality">Mortality</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{batch.current_population}</p>
              <p className="text-xs text-muted-foreground">Current Population</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">{batch.initial_quantity}</p>
              <p className="text-xs text-muted-foreground">Initial Quantity</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <Skull className="h-5 w-5 mx-auto text-destructive mb-1" />
              <p className="text-2xl font-bold">{mRate}%</p>
              <p className="text-xs text-muted-foreground">Mortality Rate</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-2xl font-bold">Day {age.day}</p>
              <p className="text-xs text-muted-foreground">Week {age.week}</p>
            </CardContent></Card>
          </div>

          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Species</p>
                  <p className="font-medium capitalize">{batch.species}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Production System</p>
                  <p className="font-medium capitalize">{batch.production_system.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-medium">{format(new Date(batch.start_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{batch.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feed">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calculator className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold mb-1">Feed Schedule</h3>
              <p className="text-sm text-muted-foreground mb-4">View and manage feed for this batch</p>
              <Button variant="outline" className="rounded-full" asChild><Link to="/feed">Go to Feed Calculator</Link></Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Droplets className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold mb-1">Health & Vaccination</h3>
              <p className="text-sm text-muted-foreground mb-4">View vaccination schedule and health tasks</p>
              <Button variant="outline" className="rounded-full" asChild><Link to="/health">Go to Health</Link></Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mortality" className="space-y-4">
          {batch.status === 'active' && (
            <Card>
              <CardHeader><CardTitle className="text-base">Record Mortality</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-20 space-y-1">
                    <Label>Count</Label>
                    <Input type="number" min="1" max={batch.current_population} value={mCount} onChange={e => setMCount(e.target.value)} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label>Cause</Label>
                    <Input value={mCause} onChange={e => setMCause(e.target.value)} placeholder="e.g., Disease" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea value={mNotes} onChange={e => setMNotes(e.target.value)} placeholder="Details..." rows={2} />
                </div>
                <Button onClick={handleRecordMortality} disabled={mSubmitting} size="sm" className="rounded-full">
                  {mSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record'}
                </Button>
              </CardContent>
            </Card>
          )}

          {mortalityChartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Cumulative Mortality ({totalMortality} total)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mortalityChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip />
                    <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--destructive))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
            <CardContent>
              {mortalities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mortality records yet.</p>
              ) : (
                <div className="space-y-2">
                  {mortalities.map((m, i) => (
                    <div key={m.id || i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <span className="font-medium text-destructive">-{m.count}</span>
                        {m.cause && <span className="text-muted-foreground ml-2">{m.cause}</span>}
                        {m.notes && <p className="text-xs text-muted-foreground mt-0.5">{m.notes}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(m.recorded_at), 'MMM d, h:mm a')}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {batch.status === 'active' && (
            <Card>
              <CardHeader><CardTitle className="text-base">Add Note</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write a note..." rows={3} />
                <Button onClick={saveNote} disabled={!noteText.trim()} size="sm" className="rounded-full">
                  <FileText className="h-4 w-4 mr-1" /> Save Note
                </Button>
              </CardContent>
            </Card>
          )}
          {batch.notes ? (
            <Card>
              <CardHeader><CardTitle className="text-base">Notes History</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap text-foreground font-sans">{batch.notes}</pre>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
