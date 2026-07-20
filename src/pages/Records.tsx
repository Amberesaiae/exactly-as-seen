import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Scale, Landmark, Download, Activity } from 'lucide-react';

import { useRecordsPerformance } from '@/hooks/useRecordsPerformance';
import { BatchOverviewTab } from '@/components/records/BatchOverviewTab';
import BatchHistoryTab from '@/components/records/BatchHistoryTab';
import { BatchCompareTab } from '@/components/records/BatchCompareTab';
import FinancialSummaryTab from '@/components/records/FinancialSummaryTab';
import DataExportsTab from '@/components/records/DataExportsTab';

import type { Database } from '@/integrations/supabase/types';
type Batch = Database['public']['Tables']['batches']['Row'];

export default function Records() {
  const { user, farmId, currency } = useAuth();
  const { costPrivacyEnabled } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [compareBatch1, setCompareBatch1] = useState('');
  const [compareBatch2, setCompareBatch2] = useState('');

  const batchIds = useMemo(() => batches.map(b => b.id), [batches]);
  const { data: performanceData, loading: perfLoading } = useRecordsPerformance(batchIds, farmId);

  useEffect(() => {
    if (!user || !farmId) return;
    const load = async () => {
      setLoading(true);
      let query = supabase.from('batches').select('*').eq('farm_id', farmId);
      if (speciesFilter !== 'all') query = query.eq('species', speciesFilter);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      const { data } = await query.order('created_at', { ascending: false });
      setBatches(data ?? []);
      setLoading(false);
    };
    load();
  }, [user, farmId, speciesFilter, statusFilter]);

  const mask = (v: string) => costPrivacyEnabled ? '****' : v;

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Analytics Ledger</h1>
        <Badge variant="outline" className="text-xs gap-1">
          <Activity className="h-3 w-3" /> Performance
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Species" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            <SelectItem value="broiler">Broiler</SelectItem>
            <SelectItem value="layer">Layer</SelectItem>
            <SelectItem value="duck">Duck</SelectItem>
            <SelectItem value="turkey">Turkey</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Composed Premium Tabs List */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-5 h-10 p-1 bg-secondary/50 rounded-full">
          <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><FileText className="h-3.5 w-3.5 hidden md:block" /> Overview</TabsTrigger>
          <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><Calendar className="h-3.5 w-3.5 hidden md:block" /> Timeline</TabsTrigger>
          <TabsTrigger value="compare" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><Scale className="h-3.5 w-3.5 hidden md:block" /> Compare</TabsTrigger>
          <TabsTrigger value="finance" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><Landmark className="h-3.5 w-3.5 hidden md:block" /> Margins</TabsTrigger>
          <TabsTrigger value="exports" className="rounded-full data-[state=active]:bg-background text-xs py-2 gap-1"><Download className="h-3.5 w-3.5 hidden md:block" /> Compiles</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><BatchOverviewTab batches={batches} performanceData={performanceData} /></TabsContent>
        <TabsContent value="history"><BatchHistoryTab batches={batches} farmId={farmId} /></TabsContent>
        <TabsContent value="compare"><BatchCompareTab batches={batches} performanceData={performanceData} currency={currency} mask={mask} compareBatch1={compareBatch1} compareBatch2={compareBatch2} setCompareBatch1={setCompareBatch1} setCompareBatch2={setCompareBatch2} /></TabsContent>
        <TabsContent value="finance"><FinancialSummaryTab batches={batches} performanceData={performanceData} currency={currency} mask={mask} costPrivacyEnabled={costPrivacyEnabled} /></TabsContent>
        <TabsContent value="exports"><DataExportsTab batches={batches} performanceData={performanceData} currency={currency} costPrivacyEnabled={costPrivacyEnabled} /></TabsContent>
      </Tabs>
    </div>
  );
}
