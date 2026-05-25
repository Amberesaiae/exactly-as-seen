import Dexie, { type Table } from 'dexie';

export interface LocalFarm {
  id: string;
  user_id: string;
  name: string;
  location_region?: string;
  location_district?: string;
  farm_type: string;
  setup_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalHouse {
  id: string;
  farm_id: string;
  name: string;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface LocalBatch {
  id: string;
  farm_id: string;
  house_id?: string;
  name: string;
  species: string;
  production_system: string;
  status: string;
  initial_quantity: number;
  current_population: number;
  start_date: string;
  current_week: number;
  current_day: number;
  phase: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalActivity {
  id: string;
  farm_id: string;
  batch_id?: string;
  event_type: string;
  description: string;
  created_at: string;
}

export interface SyncOutbox {
  id?: number;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  record_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

export interface SyncMeta {
  entity: string;
  last_synced_at: string;
  server_version: string | null;
}

export interface ConflictRecord {
  id?: number;
  entity: string;
  record_id: string;
  local_data: unknown;
  server_data: unknown;
  created_at: string;
}

export interface DashboardCache {
  farm_id: string;
  payload: unknown;
  fetched_at: string;
}

class LampFarmsDB extends Dexie {
  farms!: Table<LocalFarm, string>;
  houses!: Table<LocalHouse, string>;
  batches!: Table<LocalBatch, string>;
  activity_log!: Table<LocalActivity, string>;
  sync_outbox!: Table<SyncOutbox, number>;
  sync_meta!: Table<SyncMeta, string>;
  conflicts!: Table<ConflictRecord, number>;
  dashboard_cache!: Table<DashboardCache, string>;

  constructor() {
    super('lampfarms');
    this.version(1).stores({
      farms: 'id, user_id',
      houses: 'id, farm_id',
      batches: 'id, farm_id, house_id, status',
      activity_log: 'id, farm_id, batch_id',
      sync_outbox: '++id, table, record_id',
    });

    this.version(2).stores({
      sync_meta: 'entity',
      conflicts: '++id, entity, record_id',
      dashboard_cache: 'farm_id',
    });
  }
}

export const db = new LampFarmsDB();
