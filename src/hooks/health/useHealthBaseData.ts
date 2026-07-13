import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Batch = Database['public']['Tables']['batches']['Row'];

export function useHealthBaseData() {
  const { user, farmId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [containerTypes, setContainerTypes] = useState<any[]>([]);
  const [waterSourceChlorinated, setWaterSourceChlorinated] = useState(false);
  const [waterRatePesewas, setWaterRatePesewas] = useState<number | null>(null);
  const [farmRegion, setFarmRegion] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!user || !farmId) return;
    let cancelled = false;
    const load = async () => {
      // Soft: only full skeleton on first load (never re-blank Care page)
      if (!hasLoadedRef.current) setLoading(true);

      const [batchRes, medsRes, containersRes, farmRes] = await Promise.all([
        supabase.from('batches').select('*').eq('farm_id', farmId).eq('status', 'active'),
        supabase.from('medications').select('*'),
        supabase.from('container_types').select('*'),
        supabase.from('farms').select('water_source_chlorinated, location_region, water_rate_per_liter_pesewas').eq('id', farmId).maybeSingle(),
      ]);

      if (cancelled) return;

      setBatches(batchRes.data ?? []);
      setMedications(medsRes.data ?? []);
      setContainerTypes(containersRes.data ?? []);
      setWaterSourceChlorinated(farmRes.data?.water_source_chlorinated ?? false);
      setWaterRatePesewas(farmRes.data?.water_rate_per_liter_pesewas ?? null);
      setFarmRegion(farmRes.data?.location_region ?? null);
      hasLoadedRef.current = true;
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [user, farmId]);

  return {
    batches,
    medications,
    containerTypes,
    waterSourceChlorinated,
    waterRatePesewas,
    setWaterRatePesewas,
    farmRegion,
    baseLoading: loading,
  };
}
