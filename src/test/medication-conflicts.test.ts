import { describe, it, expect } from 'vitest';
import { detectConflicts, Medication, HealthTask } from '../lib/medication-conflicts';

const baseMed: Medication = {
  id: 'some_med',
  name: 'Some Med',
  category: 'supplement',
  delivery_method: 'drinking_water',
  withdrawal_meat_days: 0,
  withdrawal_egg_days: 0,
  is_live_vaccine: false,
  is_sulfa: false,
  contains_calcium: false,
  is_tetracycline: false,
  is_activated_charcoal: false,
};

describe('medication-conflicts', () => {
  it('Rule C8: Live vaccine + chlorinated water should BLOCK', () => {
    const liveVaccine: Medication = {
      ...baseMed,
      id: 'gumboro',
      is_live_vaccine: true,
    };

    const hits = detectConflicts({
      newMed: liveVaccine,
      newDate: '2026-05-20',
      newDuration: 1,
      neighborhood: [],
      waterSourceChlorinated: true,
    });

    expect(hits).toHaveLength(1);
    expect(hits[0].code).toBe('C8');
    expect(hits[0].severity).toBe('BLOCK');
  });

  it('Rule C8: Live vaccine + non-chlorinated water should NOT BLOCK', () => {
    const liveVaccine: Medication = {
      ...baseMed,
      id: 'gumboro',
      is_live_vaccine: true,
    };

    const hits = detectConflicts({
      newMed: liveVaccine,
      newDate: '2026-05-20',
      newDuration: 1,
      neighborhood: [],
      waterSourceChlorinated: false,
    });

    expect(hits).toHaveLength(0);
  });

  it('Rule C1: Coccidiostat + Sulfa drug within [today, +5d] should BLOCK', () => {
    const coccidiostat: Medication = {
      ...baseMed,
      id: 'amprolium',
      category: 'coccidiostat',
    };

    const sulfa: Medication = {
      ...baseMed,
      id: 'sulfadimethoxine',
      is_sulfa: true,
    };

    const task: HealthTask = {
      scheduled_date: '2026-05-23',
      duration_days: 3,
    };

    // Case A: Coccidiostat is new, Sulfa is existing (+3 days)
    const hits1 = detectConflicts({
      newMed: coccidiostat,
      newDate: '2026-05-20',
      newDuration: 3,
      neighborhood: [{ task, med: sulfa }],
      waterSourceChlorinated: false,
    });

    expect(hits1.some(h => h.code === 'C1' && h.severity === 'BLOCK')).toBe(true);

    // Case B: Sulfa is new, Coccidiostat is existing
    const hits2 = detectConflicts({
      newMed: sulfa,
      newDate: '2026-05-23',
      newDuration: 3,
      neighborhood: [{ task: { scheduled_date: '2026-05-20', duration_days: 3 }, med: coccidiostat }],
      waterSourceChlorinated: false,
    });

    expect(hits2.some(h => h.code === 'C1' && h.severity === 'BLOCK')).toBe(true);
  });

  it('Rule C2: Antibiotic treatments overlapping should BLOCK', () => {
    const ab1: Medication = {
      ...baseMed,
      id: 'oxytetracycline',
      category: 'antibiotic',
    };

    const ab2: Medication = {
      ...baseMed,
      id: 'tylosin',
      category: 'antibiotic',
    };

    const hits = detectConflicts({
      newMed: ab1,
      newDate: '2026-05-20',
      newDuration: 5,
      neighborhood: [{
        task: { scheduled_date: '2026-05-22', duration_days: 5 },
        med: ab2
      }],
      waterSourceChlorinated: false,
    });

    expect(hits.some(h => h.code === 'C2' && h.severity === 'BLOCK')).toBe(true);
  });

  it('Rule C3: Dewormer + Coccidiostat same day should WARN', () => {
    const dewormer: Medication = {
      ...baseMed,
      id: 'fenbendazole',
      category: 'dewormer',
    };

    const coccidiostat: Medication = {
      ...baseMed,
      id: 'amprolium',
      category: 'coccidiostat',
    };

    const hits = detectConflicts({
      newMed: dewormer,
      newDate: '2026-05-20',
      newDuration: 1,
      neighborhood: [{
        task: { scheduled_date: '2026-05-20', duration_days: 1 },
        med: coccidiostat
      }],
      waterSourceChlorinated: false,
    });

    expect(hits.some(h => h.code === 'C3' && h.severity === 'WARN')).toBe(true);
  });

  it('Rule C4: Live vaccine and antibiotic within 72h should BLOCK', () => {
    const liveVaccine: Medication = {
      ...baseMed,
      id: 'gumboro',
      is_live_vaccine: true,
    };

    const antibiotic: Medication = {
      ...baseMed,
      id: 'tylosin',
      category: 'antibiotic',
    };

    const hits = detectConflicts({
      newMed: liveVaccine,
      newDate: '2026-05-20',
      newDuration: 1,
      neighborhood: [{
        task: { scheduled_date: '2026-05-22', duration_days: 3 },
        med: antibiotic
      }],
      waterSourceChlorinated: false,
    });

    expect(hits.some(h => h.code === 'C4' && h.severity === 'BLOCK')).toBe(true);
  });

  it('Rule C5: Enrofloxacin overlapping with any antibiotic should BLOCK', () => {
    const enro: Medication = {
      ...baseMed,
      id: 'enrofloxacin',
      category: 'antibiotic',
    };

    const antibiotic: Medication = {
      ...baseMed,
      id: 'amoxicillin',
      category: 'antibiotic',
    };

    const hits = detectConflicts({
      newMed: enro,
      newDate: '2026-05-20',
      newDuration: 5,
      neighborhood: [{
        task: { scheduled_date: '2026-05-22', duration_days: 5 },
        med: antibiotic
      }],
      waterSourceChlorinated: false,
    });

    expect(hits.some(h => h.code === 'C5' && h.severity === 'BLOCK')).toBe(true);
  });

  it('Rule C6: Activated charcoal + oral med on same day should BLOCK', () => {
    const charcoal: Medication = {
      ...baseMed,
      id: 'activated_charcoal',
      is_activated_charcoal: true,
      delivery_method: 'drinking_water',
    };

    const oralMed: Medication = {
      ...baseMed,
      id: 'tylosin',
      delivery_method: 'drinking_water',
    };

    const hits = detectConflicts({
      newMed: charcoal,
      newDate: '2026-05-20',
      newDuration: 1,
      neighborhood: [{
        task: { scheduled_date: '2026-05-20', duration_days: 1, delivery_method: 'drinking_water' },
        med: oralMed
      }],
      waterSourceChlorinated: false,
    });

    expect(hits.some(h => h.code === 'C6' && h.severity === 'BLOCK')).toBe(true);
  });

  it('Rule C7: Calcium + Tetracycline same day should BLOCK', () => {
    const calcium: Medication = {
      ...baseMed,
      id: 'calcium_supplement',
      contains_calcium: true,
    };

    const tetracycline: Medication = {
      ...baseMed,
      id: 'doxycycline',
      is_tetracycline: true,
    };

    const hits = detectConflicts({
      newMed: calcium,
      newDate: '2026-05-20',
      newDuration: 1,
      neighborhood: [{
        task: { scheduled_date: '2026-05-20', duration_days: 1 },
        med: tetracycline
      }],
      waterSourceChlorinated: false,
    });

    expect(hits.some(h => h.code === 'C7' && h.severity === 'BLOCK')).toBe(true);
  });
});
