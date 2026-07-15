import { supabase } from '@/integrations/supabase/client';
import { db, type SyncOutbox } from '@/lib/db';
import { toast } from 'sonner';

let flushing = false;
const failedItems: SyncOutbox[] = [];

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export function getFailedItems(): readonly SyncOutbox[] {
  return failedItems;
}

export function retryAllFailedItems(): Promise<void> {
  failedItems.length = 0;
  return flushOutbox();
}

// Cache Supabase data into Dexie after fetch
export async function cacheFarms(userId: string) {
  const { data } = await supabase.from('farms').select('*').eq('user_id', userId);
  if (data && data.length > 0) {
    await db.farms.bulkPut(data);
  }
  return data;
}

export async function cacheBatches(farmId: string) {
  const { data } = await supabase.from('batches').select('*').eq('farm_id', farmId);
  if (data && data.length > 0) {
    await db.batches.bulkPut(data);
  }
  return data;
}

export async function cacheHouses(farmId: string) {
  const { data } = await supabase.from('houses').select('*').eq('farm_id', farmId);
  if (data && data.length > 0) {
    await db.houses.bulkPut(data);
  }
  return data;
}

export async function cacheActivities(farmId: string) {
  const { data } = await supabase
    .from('activity_log')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (data && data.length > 0) {
    await db.activity_log.bulkPut(data);
  }
  return data;
}

// Read from Dexie cache when offline
export async function getCachedFarms(userId: string) {
  return db.farms.where('user_id').equals(userId).toArray();
}

export async function getCachedBatches(farmId: string) {
  return db.batches.where('farm_id').equals(farmId).toArray();
}

export async function getCachedActivities(farmId: string) {
  return db.activity_log.where('farm_id').equals(farmId).toArray();
}

/** True when browser reports offline (SSR-safe). */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

// Queue a write operation for later sync
export async function queueWrite(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  recordId: string,
  data: Record<string, unknown>
) {
  const entry: SyncOutbox = {
    table,
    operation,
    record_id: recordId,
    data,
    created_at: new Date().toISOString(),
  };
  await db.sync_outbox.add(entry);
}

/**
 * Queue a SECURITY DEFINER RPC for later flush (offline intent writers).
 * Stored as table `rpc:<function_name>` with args as data.
 */
export async function queueRpc(
  functionName: string,
  args: Record<string, unknown>,
  recordId?: string
) {
  await queueWrite(
    `rpc:${functionName}`,
    'insert',
    recordId || crypto.randomUUID(),
    args
  );
}

// Flush all queued writes to Supabase
export async function flushOutbox() {
  if (flushing) return;
  flushing = true;

  try {
    const pending = await db.sync_outbox.toArray();
    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        await retryWithBackoff(async () => {
          if (item.table.startsWith('rpc:')) {
            const fn = item.table.slice(4) as 'stock_purchase' | 'confirm_day_feed' | 'log_day_water' | 'record_egg_sale' | 'complete_health_task' | 'record_mortality' | 'terminate_batch' | 'create_batch' | 'record_egg_collection' | 'allocate_fifo_by_quality' | 'record_bird_sale';
            const { error } = await supabase.rpc(fn, item.data as never);
            if (error) throw error;
          } else if (item.operation === 'insert') {
            const { error } = await supabase.from(item.table as 'farms').insert(item.data as never);
            if (error) throw error;
          } else if (item.operation === 'update') {
            const { error } = await supabase
              .from(item.table as 'farms')
              .update(item.data as never)
              .eq('id', item.record_id);
            if (error) throw error;
          } else if (item.operation === 'delete') {
            const { error } = await supabase
              .from(item.table as 'farms')
              .delete()
              .eq('id', item.record_id);
            if (error) throw error;
          }
        });
        if (item.id) await db.sync_outbox.delete(item.id);
      } catch (err) {
        console.error(`Sync failed for ${item.table}/${item.record_id}:`, err);
        failedItems.push(item);
        toast.error(`Sync failed: ${item.table}/${item.record_id}`, {
          description: 'Will retry on next sync',
        });
      }
    }
  } finally {
    flushing = false;
  }
}

// Auto-flush when coming back online
export function setupOnlineListener() {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => {
    void flushOutbox();
  });
}
