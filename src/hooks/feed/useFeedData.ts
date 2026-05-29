import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getBatchAge } from '@/lib/batch-utils';
import { getCurrentPhase } from '@/lib/feed-data';

export function useFeedData() {
  const { user } = useAuth();
  const [farmId, setFarmId] = useState<string | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [formulations, setFormulations] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: farm } = await supabase.from('farms').select('id').eq('user_id', user.id).order('setup_complete', { ascending: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (!farm) { setLoading(false); return; }
      setFarmId(farm.id);

      const [batchResult, formulationResult, recipeResult] = await Promise.all([
        supabase.from('batches').select('*').eq('farm_id', farm.id).eq('status', 'active'),
        supabase.from('feed_formulations').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('feed_recipes').select('*').eq('farm_id', farm.id).order('name'),
      ]);

      setBatches(batchResult.data ?? []);
      setFormulations(formulationResult.data ?? []);
      setRecipes(recipeResult.data ?? []);
      if (batchResult.data?.length) setSelectedBatch(batchResult.data[0].id);
      setLoading(false);
    };
    load();
  }, [user]);

  const fetchSchedules = async (batchId: string) => {
    const { data } = await supabase
      .from('feed_schedules')
      .select('*')
      .eq('batch_id', batchId)
      .order('day', { ascending: false })
      .limit(14);
    setSchedules(data ?? []);
  };

  useEffect(() => {
    if (selectedBatch && farmId) fetchSchedules(selectedBatch);
  }, [selectedBatch, farmId]);

  const batch = batches.find(b => b.id === selectedBatch);
  const dynamics = batch ? getBatchAge(batch.start_date, batch.species) : null;
  const phase = batch && dynamics ? getCurrentPhase(batch.species, dynamics.week) : null;

  return {
    farmId,
    batches,
    selectedBatch,
    setSelectedBatch,
    loading,
    formulations,
    schedules,
    setSchedules,
    recipes,
    batch,
    dynamics,
    phase,
    refreshSchedules: () => selectedBatch && fetchSchedules(selectedBatch)
  };
}
