import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, format, parseISO } from 'date-fns';
import { cacheBatches } from '@/lib/sync';
import { generateAutoTasks } from '@/lib/health-auto-tasks';
import { VACCINATION_TEMPLATES } from '@/lib/health-data';
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
    if (species === 'duck' && !duckType) return 'Select duck type (meat or layer)';
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

    // Build care seeds client-side (templates), then pass into atomic create_batch
    const autoTasks = generateAutoTasks({
      batchId: 'pending',
      farmId,
      species,
      startDate,
      cycleLengthWeeks: cycleWeeks,
    });
    const healthTasksJson = autoTasks.map((t) => ({
      task_type: t.task_type,
      product_name: t.product_name,
      medication_id: t.medication_id || null,
      delivery_method: t.delivery_method || null,
      scheduled_date: t.scheduled_date,
      duration_days: t.duration_days ?? 1,
      withdrawal_meat_days: t.withdrawal_meat_days ?? 0,
      withdrawal_egg_days: t.withdrawal_egg_days ?? 0,
      notes: t.notes ?? t.indication ?? null,
    }));

    const vaxTemplates = VACCINATION_TEMPLATES.filter(
      (t) => t.species.includes(species) && t.scheduledWeek <= cycleWeeks
    );
    const start = parseISO(startDate);
    const vaccinationsJson = vaxTemplates.map((t) => ({
      vaccine_name: t.name,
      scheduled_week: t.scheduledWeek,
      scheduled_date: format(
        addDays(start, (t.scheduledDay ?? t.scheduledWeek * 7) - 1),
        'yyyy-MM-dd'
      ),
    }));

    // W6: atomic batch + house + seed + activity
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_batch' as any, {
      p_farm_id: farmId,
      p_name: name.trim(),
      p_species: species,
      p_house_id: houseId,
      p_production_system: productionSystem,
      p_initial_quantity: qty,
      p_start_date: startDate,
      p_cycle_length_weeks: cycleWeeks,
      p_current_week: age.week,
      p_current_day: age.day,
      p_phase: age.phase,
      p_duck_type: species === 'duck' ? duckType : null,
      p_health_tasks: healthTasksJson,
      p_vaccinations: vaccinationsJson,
    });

    if (!rpcError && rpcData && (rpcData as any).ok) {
      const batchId = (rpcData as any).batch_id as string;
      const batch = {
        id: batchId,
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
      };
      await cacheBatches(farmId).catch(err => console.error('Cache sync error:', err));
      toast.success(
        `Batch created (${(rpcData as any).health_tasks_seeded ?? 0} care tasks, ${(rpcData as any).vaccinations_seeded ?? 0} vaccines)`
      );
      setSubmitting(false);
      return batch as any;
    }

    if (rpcError) {
      console.warn('create_batch RPC failed, client fallback:', rpcError.message);
      if (/house not available|name is required|duck_type/i.test(rpcError.message)) {
        toast.error(rpcError.message);
        setSubmitting(false);
        return null;
      }
    }

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

    await supabase.from('houses').update({ occupied_by_batch_id: batch.id }).eq('id', houseId);

    if (autoTasks.length > 0) {
      const { error: taskErr } = await supabase.from('health_tasks').insert(
        autoTasks.map((t) => ({
          batch_id: batch.id,
          farm_id: farmId,
          task_type: t.task_type,
          product_name: t.product_name,
          medication_id: t.medication_id || null,
          delivery_method: t.delivery_method || null,
          scheduled_date: t.scheduled_date,
          duration_days: t.duration_days ?? 1,
          withdrawal_meat_days: t.withdrawal_meat_days ?? 0,
          withdrawal_egg_days: t.withdrawal_egg_days ?? 0,
          notes: t.notes ?? t.indication ?? null,
          completed: false,
        }))
      );
      if (taskErr) {
        console.error('Auto health tasks seed failed:', taskErr.message);
        toast.warning('Batch created, but care tasks failed to seed — open Health to regenerate.');
      }
    }

    if (vaxTemplates.length > 0) {
      const { error: vaxErr } = await supabase.from('vaccination_schedule').insert(
        vaxTemplates.map((t) => ({
          batch_id: batch.id,
          farm_id: farmId,
          vaccine_name: t.name,
          scheduled_week: t.scheduledWeek,
          scheduled_date: format(
            addDays(start, (t.scheduledDay ?? t.scheduledWeek * 7) - 1),
            'yyyy-MM-dd'
          ),
        }))
      );
      if (vaxErr) {
        console.error('Vaccination schedule seed failed:', vaxErr.message);
        toast.warning('Batch created, but vaccination schedule failed — use Generate in Health if empty.');
      }
    }

    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'batch_created',
      description: `Created new ${species} flock: "${name}" (${qty} birds)`,
    });

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
