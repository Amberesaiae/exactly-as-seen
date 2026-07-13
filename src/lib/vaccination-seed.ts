/**
 * Single seed path for vaccination_schedule (H4).
 * Used by create_batch RPC payload and Health "Generate Schedule".
 */
import { addDays, format, parseISO } from 'date-fns';
import { VACCINATION_TEMPLATES } from '@/lib/health-data';

export type VaccinationSeedRow = {
  vaccine_name: string;
  scheduled_week: number;
  scheduled_date: string;
};

export function buildVaccinationSeedRows(args: {
  species: string;
  startDate: string;
  cycleLengthWeeks: number;
}): VaccinationSeedRow[] {
  const { species, startDate, cycleLengthWeeks } = args;
  const start = parseISO(startDate);
  return VACCINATION_TEMPLATES.filter(
    (t) => t.species.includes(species) && t.scheduledWeek <= cycleLengthWeeks
  ).map((t) => ({
    vaccine_name: t.name,
    scheduled_week: t.scheduledWeek,
    scheduled_date: format(
      addDays(start, (t.scheduledDay ?? t.scheduledWeek * 7) - 1),
      'yyyy-MM-dd'
    ),
  }));
}

export function countVaccinationTemplates(species: string, cycleLengthWeeks: number): number {
  return VACCINATION_TEMPLATES.filter(
    (t) => t.species.includes(species) && t.scheduledWeek <= cycleLengthWeeks
  ).length;
}
