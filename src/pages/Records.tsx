import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

export default function Records() {
  const { user } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Compare
  const [compareBatch1, setCompareBatch1] = useState('');
  const [compareBatch2, setCompareBatch2] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);
      let query = supabase.from('batches').select('*').eq('farm_id', farm.id);
      if (speciesFilter !== 'all') query = query.eq('species', speciesFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data } = await query.order('created_at', { ascending: false });
      setBatches(data ?? []);
      setLoading(false);
    };
    load();
  }, [user, speciesFilter, statusFilter]);

  const mask = (v: string) => costPrivacyEnabled ? '****' : v;

  const exportCSV = () => {
    if (batches.length === 0) return;
    const headers = ['Name', 'Species', 'Status', 'Phase', 'Initial Qty', 'Current Pop', 'Start Date', 'Week', 'Day'];
    const rows = batches.map(b => [b.name, b.species, b.status, b.phase, b.initial_quantity, b.current_population, b.start_date, b.current_week, b.current_day]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lampfarms_records_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const batch1 = batches.find(b => b.id === compareBatch1);
  const batch2 = batches.find(b => b.id === compareBatch2);

  if (loading) return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Records</h1>
        <Button variant="outline" className="gap-1.5 rounded-full" onClick={exportCSV}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            <SelectItem value="broiler">Broiler</SelectItem>
            <SelectItem value="layer">Layer</SelectItem>
            <SelectItem value="duck">Duck</SelectItem>
            <SelectItem value="turkey">Turkey</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Batch Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {batches.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No records to display.</p>
              </CardContent>
            </Card>
          ) : (
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
                    {batches.map(b => {
                      const mortalityPct = b.initial_quantity > 0 ? (((b.initial_quantity - b.current_population) / b.initial_quantity) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={b.id} className="border-b last:border-0">
                          <td className="py-2 px-2 font-medium">{b.name}</td>
                          <td className="py-2 px-2 capitalize">{b.species}</td>
                          <td className="py-2 px-2 capitalize">{b.status}</td>
                          <td className="py-2 px-2 text-right">{b.initial_quantity}</td>
                          <td className="py-2 px-2 text-right">{b.current_population}</td>
                          <td className="py-2 px-2 text-right">{mortalityPct}%</td>
                          <td className="py-2 px-2">{format(new Date(b.start_date), 'MMM d, yyyy')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold mb-1">Performance Metrics</h3>
              <p className="text-sm text-muted-foreground">FCR, mortality rate, and growth data will appear here once batches have feed and mortality records.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <div className="flex gap-3">
            <Select value={compareBatch1} onValueChange={setCompareBatch1}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select batch 1" /></SelectTrigger>
              <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <span className="self-center text-muted-foreground">vs</span>
            <Select value={compareBatch2} onValueChange={setCompareBatch2}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select batch 2" /></SelectTrigger>
              <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {batch1 && batch2 ? (
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Metric</th>
                      <th className="text-right py-2 px-2 font-medium">{batch1.name}</th>
                      <th className="text-right py-2 px-2 font-medium">{batch2.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Species', batch1.species, batch2.species],
                      ['Initial Qty', String(batch1.initial_quantity), String(batch2.initial_quantity)],
                      ['Current Pop', String(batch1.current_population), String(batch2.current_population)],
                      ['Mortality %', `${(((batch1.initial_quantity - batch1.current_population) / batch1.initial_quantity) * 100).toFixed(1)}%`, `${(((batch2.initial_quantity - batch2.current_population) / batch2.initial_quantity) * 100).toFixed(1)}%`],
                      ['Week', String(batch1.current_week), String(batch2.current_week)],
                      ['Phase', batch1.phase, batch2.phase],
                    ].map(([metric, v1, v2]) => (
                      <tr key={metric} className="border-b last:border-0">
                        <td className="py-2 px-2 text-muted-foreground">{metric}</td>
                        <td className="py-2 px-2 text-right font-medium capitalize">{v1}</td>
                        <td className="py-2 px-2 text-right font-medium capitalize">{v2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">Select two batches to compare.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
