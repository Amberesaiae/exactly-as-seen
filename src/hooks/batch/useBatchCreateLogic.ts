import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cacheBatches } from '@/lib/sync';
import { generateAutoTasks } from '@/lib/health-auto-tasks';
import { getBatchAge } from '@/lib/batch-utils';

export function useBatchCreateLogic(farmId: string | null, userId: string | undefined) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('broiler');
  const [duckType, setDuckType] = useState<'meat' | 'layer' | null>(null);
  const [houseId, setHouseId] = useState('');
  const [productionSystem, setProductionSystem] = useState('deep_litter');
  const [initialQuantity, setInitialQuantity] = useState('100');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cycleLength, setCycleLength] = useState('8');
  
  const [houses, setHouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!farmId) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from('houses').select('*').eq('farm_id', farmId);
      const available = (data ?? []).filter(h => !h.occupied_by_batch_id);
      setHouses(available);
      if (available.length) setHouseId(available[0].id);
      setLoading(false);
    };
    load();
  }, [farmId]);

  useEffect(() => {
    // Default cycle lengths & Production System constraints (Elite Spec Alignment)
    if (species === 'broiler') {
      setCycleLength('8');
      setProductionSystem('deep_litter'); // Broilers are intensive only
    } else if (species === 'layer') {
      setCycleLength('72');
      setProductionSystem('cage'); // Layers are intensive only
    } else if (species === 'duck') {
      setCycleLength('12');
      if (productionSystem === 'cage' || productionSystem === 'deep_litter') {
        setProductionSystem('semi_intensive');
      }
    } else if (species === 'turkey') {
      setCycleLength('20');
      if (productionSystem === 'cage' || productionSystem === 'deep_litter') {
        setProductionSystem('semi_intensive');
      }
    }
  }, [species]);

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!houseId) return 'House is required';
    if (!initialQuantity || parseInt(initialQuantity) <= 0) return 'Invalid initial quantity';
    if (!cycleLength || parseInt(cycleLength) <= 0) return 'Invalid cycle length';
    return null;
  };

  const createBatch = async () => {
    const error = validate();
    if (error) { toast.error(error); return null; }
    if (!farmId || !userId) return null;

    setSubmitting(true);
    const qty = parseInt(initialQuantity);
    const cycleWeeks = parseInt(cycleLength);
    const age = getBatchAge(startDate, species);
    const { data: batch, error: batchError } = await supabase.from('batches').insert({
      farm_id: farmId,
      name: name.trim(),
      species,
      duck_type: species === 'duck' ? duckType : null,
      house_id: houseId,
      production_system: productionSystem,
      initial_quantity: qty,
      current_population: qty,
      start_date: startDate,
      cycle_length_weeks: cycleWeeks,
      current_week: age.week,
      current_day: age.day,
      status: 'active',
      phase: age.phase,
    }).select().single();

    if (batchError) {
      toast.error(batchError.message);
      setSubmitting(false);
      return null;
    }

    // Occupy house
    await supabase.from('houses').update({ occupied_by_batch_id: batch.id }).eq('id', houseId);

    // Seed vaccination / protocol health tasks from templates
    const autoTasks = generateAutoTasks({
      batchId: batch.id,
      farmId,
      species,
      startDate,
      cycleLengthWeeks: cycleWeeks,
    });
    if (autoTasks.length > 0) {
      const { error: taskErr } = await supabase.from('health_tasks').insert(
        autoTasks.map((t) => ({
          batch_id: t.batch_id,
          farm_id: t.farm_id,
          task_type: t.task_type,
          product_name: t.product_name,
          medication_id: t.medication_id,
          delivery_method: t.delivery_method,
          scheduled_date: t.scheduled_date,
          scheduled_week: t.scheduled_week,
          duration_days: t.duration_days,
          indication: t.indication,
          priority: t.priority,
          withdrawal_meat_days: t.withdrawal_meat_days,
          withdrawal_egg_days: t.withdrawal_egg_days,
          completed: false,
        }))
      );
      if (taskErr) {
        console.error('Auto health tasks seed failed:', taskErr.message);
      }
    }

    // Log activity
    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'batch_created',
      description: `Created new ${species} flock: "${name}" (${qty} birds)`,
    });

    // Cache updated batches
    await cacheBatches(farmId).catch(err => console.error('Cache sync error:', err));

    toast.success('Batch created successfully');
    setSubmitting(false);
    return batch;
  };

  return {
    name, setName,
    species, setSpecies,
    duckType, setDuckType,
    houseId, setHouseId,
    productionSystem, setProductionSystem,
    initialQuantity, setInitialQuantity,
    startDate, setStartDate,
    cycleLength, setCycleLength,
    houses,
    loading,
    submitting,
    createBatch,
  };
}
