export const GHANA_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
] as const;

/**
 * Typical midday shade °C by region (climatology fallback when no sensor/water log).
 * Not live weather — used only when latestTemp is null (H2).
 */
export const REGION_TYPICAL_TEMP_C: Record<string, number> = {
  'Ahafo': 27,
  'Ashanti': 28,
  'Bono': 28,
  'Bono East': 29,
  'Central': 28,
  'Eastern': 27,
  'Greater Accra': 29,
  'North East': 32,
  'Northern': 33,
  'Oti': 30,
  'Savannah': 33,
  'Upper East': 34,
  'Upper West': 33,
  'Volta': 29,
  'Western': 27,
  'Western North': 27,
};

const DEFAULT_TEMP_C = 28;

/** Resolve ambient temp: prefer measured, else regional typical, else national default. */
export function resolveAmbientTempC(
  latestMeasured: number | null | undefined,
  farmRegion: string | null | undefined,
): number {
  if (latestMeasured != null && !Number.isNaN(Number(latestMeasured))) {
    return Number(latestMeasured);
  }
  if (farmRegion && REGION_TYPICAL_TEMP_C[farmRegion] != null) {
    return REGION_TYPICAL_TEMP_C[farmRegion];
  }
  return DEFAULT_TEMP_C;
}

export const DISTRICTS_BY_REGION: Record<string, string[]> = {
  'Ahafo': ['Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South'],
  'Ashanti': ['Kumasi Metro', 'Obuasi Municipal', 'Ejisu Municipal', 'Mampong Municipal', 'Offinso North', 'Offinso Municipal', 'Bekwai Municipal', 'Adansi North', 'Adansi South', 'Amansie Central', 'Amansie South', 'Amansie West', 'Atwima Kwanwoma', 'Atwima Mponua', 'Atwima Nwabiagya'],
  'Bono': ['Sunyani Municipal', 'Sunyani West', 'Berekum Municipal', 'Dormaa Municipal', 'Dormaa East', 'Dormaa West', 'Jaman North', 'Jaman South', 'Tain'],
  'Bono East': ['Techiman Municipal', 'Techiman North', 'Nkoranza North', 'Nkoranza South', 'Atebubu-Amantin', 'Sene East', 'Sene West', 'Pru East', 'Pru West'],
  'Central': ['Cape Coast Metro', 'Effutu Municipal', 'Mfantsiman Municipal', 'Abura-Asebu-Kwamankese', 'Ajumako-Enyan-Essiam', 'Asikuma-Odoben-Brakwa', 'Assin Central', 'Assin North', 'Assin South', 'Awutu Senya East', 'Awutu Senya West', 'Gomoa Central', 'Gomoa East', 'Gomoa West', 'Hemang Lower Denkyira', 'Komenda-Edina-Eguafo-Abirem', 'Twifo-Atti Mokwa', 'Upper Denkyira East', 'Upper Denkyira West'],
  'Eastern': ['Koforidua Municipal', 'Birim Central', 'Birim North', 'Birim South', 'Denkyembuor', 'Kwahu Afram Plains North', 'Kwahu Afram Plains South', 'Kwahu East', 'Kwahu South', 'Kwahu West', 'Achiase', 'Akuapim North', 'Akuapim South', 'Akyemansa', 'Asuogyaman', 'Atiwa East', 'Atiwa West', 'Ayensuano', 'Fanteakwa North', 'Fanteakwa South'],
  'Greater Accra': ['Accra Metro', 'Tema Metro', 'Ga Central', 'Ga East', 'Ga North', 'Ga South', 'Ga West', 'Ledzokuku', 'La Dade-Kotopon', 'La-Nkwantanang-Madina', 'Ablekuma Central', 'Ablekuma North', 'Ablekuma West', 'Adentan', 'Ayawaso Central', 'Ayawaso East', 'Ayawaso North', 'Ayawaso West', 'Kpone-Katamanso', 'Korle Klottey', 'Okaikwei North', 'Weija-Gbawe'],
  'North East': ['Nalerigu-Gambaga', 'Bunkpurugu-Nakpanduri', 'Chereponi', 'East Mamprusi', 'Mamprugu Moagduri', 'West Mamprusi', 'Yunyoo-Nasuan'],
  'Northern': ['Tamale Metro', 'Sagnarigu Municipal', 'Kpandai', 'Mion', 'Nanton', 'Nanumba North', 'Nanumba South', 'Saboba', 'Tatale-Sanguli', 'Tolon', 'Yendi Municipal', 'Zabzugu'],
  'Oti': ['Kadjebi', 'Krachi East', 'Krachi Nchumuru', 'Krachi West', 'Nkwanta North', 'Nkwanta South', 'Biakoye', 'Jasikan'],
  'Savannah': ['Damongo', 'Bole', 'Central Gonja', 'East Gonja', 'North East Gonja', 'North Gonja', 'Sawla-Tuna-Kalba', 'West Gonja'],
  'Upper East': ['Bolgatanga Municipal', 'Bawku Municipal', 'Bawku West', 'Binduri', 'Bongo', 'Builsa North', 'Builsa South', 'Garu', 'Kassena Nankana East', 'Kassena Nankana West', 'Nabdam', 'Pusiga', 'Talensi', 'Tempane'],
  'Upper West': ['Wa Municipal', 'Daffiama-Bussie-Issa', 'Jirapa', 'Lambussie-Karni', 'Lawra', 'Nadowli-Kaleo', 'Nandom', 'Sissala East', 'Sissala West', 'Wa East', 'Wa West'],
  'Volta': ['Ho Municipal', 'Hohoe Municipal', 'Keta Municipal', 'Ketu North', 'Ketu South', 'Adaklu', 'Afadzato South', 'Agotime-Ziope', 'Akatsi North', 'Akatsi South', 'Anloga', 'Central Tongu', 'Ho West', 'North Dayi', 'North Tongu', 'South Dayi', 'South Tongu'],
  'Western': ['Sekondi-Takoradi Metro', 'Ahanta West', 'Effia-Kwesimintsim', 'Ellembelle', 'Jomoro', 'Mpohor', 'Nzema East', 'Prestea-Huni Valley', 'Shama', 'Tarkwa-Nsuaem', 'Wassa Amenfi Central', 'Wassa Amenfi East', 'Wassa Amenfi West', 'Wassa East'],
  'Western North': ['Sefwi Wiawso', 'Akontombra', 'Aowin', 'Bia East', 'Bia West', 'Bibiani-Anhwiaso-Bekwai', 'Bodi', 'Juaboso', 'Sefwi Akontombra', 'Suaman'],
};
