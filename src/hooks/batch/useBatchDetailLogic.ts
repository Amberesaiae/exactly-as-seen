import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { isOffline, queueWrite } from '@/lib/sync';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];
type MortalityRecord = Database['public']['Tables']['mortality_records']['Row'];

export function useBatchDetailLogic(id: string | undefined) {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [mortalities, setMortalities] = useState<MortalityRecord[]>([]);
  const [noteText, setNoteText] = useState('');

  const fetchBatch = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from('batches').select('*').eq('id', id).maybeSingle();
    if (error) toast.error(error.message);
    else setBatch(data);
    setLoading(false);
  };

  const fetchMortalities = async () => {
    if (!id) return;
    const { data } = await supabase.from('mortality_records').select('*').eq('batch_id', id).order('recorded_at', { ascending: false });
    setMortalities(data ?? []);
  };

  useEffect(() => {
    fetchBatch();
    fetchMortalities();
  }, [id]);

  const saveNote = async () => {
    if (!batch || !noteText.trim()) return;
    const timestamp = format(new Date(), 'MMM d, yyyy h:mm a');
    const newNotes = batch.notes
      ? `${batch.notes}\n\n[${timestamp}]\n${noteText}`
      : `[${timestamp}]\n${noteText}`;

    if (isOffline()) {
      await queueWrite('batches', 'update', batch.id, { notes: newNotes } as unknown as Record<string, unknown>);
      setBatch({ ...batch, notes: newNotes });
      setNoteText('');
      toast.success('Note added (offline — will sync)');
      return;
    }

    const { error } = await supabase.from('batches').update({ notes: newNotes }).eq('id', batch.id);
    if (error) toast.error(error.message);
    else {
      setBatch({ ...batch, notes: newNotes });
      setNoteText('');
      toast.success('Note added');
    }
  };

  const mortalityStats = useMemo(() => {
    const total = mortalities.reduce((sum, m) => sum + m.count, 0);
    const chartData = [...mortalities].reverse().reduce((acc: { date: string; cumulative: number }[], m) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      acc.push({ date: format(new Date(m.recorded_at), 'MMM d'), cumulative: prev + m.count });
      return acc;
    }, []);

    const causes: Record<string, number> = {};
    mortalities.forEach(m => {
      const rawCause = m.cause || 'Unknown';
      const causeKey = rawCause.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      causes[causeKey] = (causes[causeKey] || 0) + m.count;
    });
    const causeData = Object.entries(causes).map(([name, value]) => ({ name, value }));

    return { total, chartData, causeData };
  }, [mortalities]);

  return {
    batch,
    setBatch,
    loading,
    mortalities,
    setMortalities,
    noteText,
    setNoteText,
    mortalityStats,
    saveNote,
    refreshMortalities: fetchMortalities,
  };
}
