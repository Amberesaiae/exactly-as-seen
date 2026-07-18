export interface Medication {
  id: string;
  delivery_method: string;
  dose_per_gallon?: number | null;
}

export interface DoseResult {
  amount: number;
  unit: string;
}

export function computeDose(med: Medication, waterVolumeL: number): DoseResult | null {
  if (med.delivery_method !== 'drinking_water') {
    return null;
  }

  const dosePerGal = med.dose_per_gallon ?? 1.0;
  // amount = dose_per_gallon * (waterVolumeL / 3.785)
  const amount = Number((dosePerGal * (waterVolumeL / 3.785)).toFixed(1));

  // Determine dose unit dynamically based on medication ID
  let unit = 'tsp';
  const id = med.id.toLowerCase();
  
  if (id === 'oxytetracycline' || id === 'multivitamins' || id === 'glucose' || id === 'activated_charcoal' || id === 'apple_cider_vinegar') {
    unit = 'tbsp';
  } else if (id === 'enrofloxacin' || id === 'fenbendazole' || id === 'ivermectin' || id === 'levamisole') {
    unit = 'ml';
  }

  return { amount, unit };
}
