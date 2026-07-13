import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { VACCINATION_TEMPLATES } from '@/lib/health-data';
import {
  seedPostVaccinationSupplements,
  syncHealthTaskFromSchedule,
} from '@/lib/care-completion';

export function useVaccinationLogic(farmId: string | null, batch: any) {
  const [generatingVaccines, setGeneratingVaccines] = useState(false);
  const [vaccinations, setVaccinations] = useState<any[]>([]);

  const generateVaccinationSchedule = async () => {
    if (!farmId || !batch) return;
    setGeneratingVaccines(true);
    const templates = VACCINATION_TEMPLATES.filter(t => t.species.includes(batch.species));
    const startDate = new Date(batch.start_date);
    const records = templates.map(t => ({
      batch_id: batch.id,
      farm_id: farmId,
      vaccine_name: t.name,
      scheduled_week: t.scheduledWeek,
      scheduled_date: format(addDays(startDate, t.scheduledWeek * 7), 'yyyy-MM-dd'),
    }));

    const { data, error } = await supabase.from('vaccination_schedule').insert(records).select();
    if (error) {
      toast.error(error.message);
      setGeneratingVaccines(false);
      return;
    }

    setVaccinations(data ?? []);
    await supabase.from('activity_log').insert({
      farm_id: farmId,
      batch_id: batch.id,
      event_type: 'vaccination',
      description: `Generated ${records.length} vaccination schedule entries for ${batch.name}`,
    });

    toast.success(`Generated ${records.length} vaccinations`);
    setGeneratingVaccines(false);
  };

  const markVaccineAdministered = async (vId: string, currentVaccinations: any[], costPesewas: number = 0, notes?: string) => {
    const completedAt = new Date().toISOString();
    const { error } = await supabase.from('vaccination_schedule')
      .update({ 
        administered: true, 
        administered_at: completedAt 
      } as any)
      .eq('id', vId);
    
    if (error) { toast.error(error.message); return; }
    
    const vaccine = currentVaccinations.find(v => v.id === vId);
    
    // Dual writer: vaccination_schedule → health_tasks
    if (batch?.id && vaccine?.vaccine_name) {
      await syncHealthTaskFromSchedule({
        batchId: batch.id,
        vaccineName: vaccine.vaccine_name,
        completedAt,
      });
    }

    // Dual pattern: intensive auto-expense only (research VACCINATION_COMPLETED)
    if (costPesewas > 0 && farmId && batch) {
      const { isIntensiveSystem } = await import('@/lib/production-system');
      if (isIntensiveSystem(batch.production_system)) {
        const { autoCreateExpense } = await import('@/lib/synergy');
        const { LEDGER_SOURCES } = await import('@/lib/canonical');
        await autoCreateExpense({
          farmId,
          batchId: batch.id,
          category: 'health_and_medicine',
          description: `Vaccination: ${vaccine?.vaccine_name ?? 'Vaccine'}`,
          amount: costPesewas / 100,
          source: LEDGER_SOURCES.vaccination,
          sourceRef: vId,
        });
      }
    }

    const updated = currentVaccinations.map(v => v.id === vId ? { ...v, administered: true, administered_at: completedAt } : v);
    setVaccinations(updated);

    if (farmId && batch) {
      await supabase.from('activity_log').insert({
        farm_id: farmId,
        batch_id: batch.id,
        event_type: 'vaccination',
        description: `Administered ${vaccine?.vaccine_name ?? 'vaccine'}${notes ? `: ${notes}` : ''}`,
      });

      await seedPostVaccinationSupplements(farmId, batch.id);
    }
    
    return true;
  };

  return {
    generatingVaccines,
    vaccinations,
    setVaccinations,
    generateVaccinationSchedule,
    markVaccineAdministered,
  };
}
