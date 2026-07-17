import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets, Loader2, ThermometerSun, CheckCircle2, Info, Pill } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { WaterTrendChart } from './WaterTrendChart';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';

type WaterRecord = Database['public']['Tables']['water_records']['Row'];
type Batch = Database['public']['Tables']['batches']['Row'];
type HealthTask = Database['public']['Tables']['health_tasks']['Row'];

interface WaterTabProps {
  batch: Batch | undefined;
  waterRecords: WaterRecord[];
  waterChartData: any[];
  waterPrescription: any;
  waterSaving: boolean;
  onFulfillTask: (task: any) => void;
  todayTemp?: number | null;
  farmRegion?: string | null;
  totalWaterCostPesewas?: number;
  costPrivacyEnabled?: boolean;
  pendingWaterMeds?: HealthTask[];
  batchTasks?: any[];
}

/**
 * Lean Tool: Water & Hydration Management.
 * Replaced 'Overkill Registry' with proactive Task Orchestration.
 * The system prescribes what birds need; the farmer confirms execution.
 */
export function WaterTab({
  batch,
  waterRecords,
  waterChartData,
  waterPrescription,
  waterSaving,
  onFulfillTask,
  todayTemp,
  farmRegion,
  totalWaterCostPesewas = 0,
  costPrivacyEnabled = false,
  pendingWaterMeds = [],
  batchTasks = [],
}: WaterTabProps) {
  const { currency } = useAuth();
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const hydrationTask = useMemo(() => {
    const waterTask = batchTasks.find(
      t => t.task_type === 'water_log' && t.due_date === todayStr && !t.completed
    );
    if (!waterTask) return null;
    // Adapt batch_task row to the shape fulfillOperationalTask expects
    return {
      ...waterTask,
      task_type: 'hydration',
      amount: waterPrescription?.gallons ?? 10,
      unit: 'gal',
      estimated_cost: waterPrescription
        ? (waterPrescription.liters * (waterPrescription.costPerLiterPesewas ?? 0)) / 100
        : 0,
    };
  }, [batchTasks, todayStr, waterPrescription]);

  const isTodayCompleted = waterRecords.some(w => w.date === todayStr);

  return (
    <div className="space-y-4 mt-4">
      {/* 1. Financial Context Section */}
      {totalWaterCostPesewas > 0 && (
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Water Expense</p>
                <h3 className="text-xl font-black text-foreground">
                  {costPrivacyEnabled ? '••••' : formatCurrency(totalWaterCostPesewas / 100, currency)}
                </h3>
              </div>
            </div>
            <Badge variant="outline" className="bg-background text-[10px] font-bold border-primary/20 px-2 py-0.5 uppercase">Auto-Calculated</Badge>
          </CardContent>
        </Card>
      )}

      {/* 2. Today's Operational Tool (The 'Better Way') */}
      {!isTodayCompleted && hydrationTask ? (
        <Card className="border-primary/30 shadow-md overflow-hidden ring-1 ring-primary/5">
          <CardHeader className="bg-primary/5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" /> Today's Hydration Tool
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-bold">TASK PENDING</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Prescribed Volume</p>
                <p className="text-2xl font-black text-foreground">{hydrationTask.amount} <span className="text-sm font-medium text-muted-foreground">Gallons</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Cost</p>
                <p className="text-2xl font-black text-foreground">
                  {costPrivacyEnabled ? '••••' : formatCurrency(hydrationTask.estimated_cost, currency)}
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-3 flex items-start gap-3 border border-muted">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Smallholder Ambient Logic</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Estimated house temp: <strong>{todayTemp}°C</strong>. 
                  Intake capped at <strong>{waterPrescription?.appliedMultiplier}x</strong> for safety.
                  {waterPrescription?.caution && (
                    <span className="ml-1 text-primary/70"> (Spec recommends {waterPrescription.caution.suggestedMultiplier}x)</span>
                  )}
                </p>
              </div>
            </div>

            {waterPrescription?.caution && (
              <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3 flex items-start gap-3">
                <ThermometerSun className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-orange-800 leading-tight font-medium">
                  {waterPrescription.caution.message}
                </p>
              </div>
            )}

            <Button 
              data-testid="confirm-hydration"
              onClick={() => onFulfillTask(hydrationTask)}
              disabled={waterSaving}
              className="w-full rounded-full py-6 text-base font-bold gap-2 shadow-lg shadow-primary/20"
            >
              {waterSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Confirm Hydration Protocol</>}
            </Button>
          </CardContent>
        </Card>
      ) : isTodayCompleted ? (
        <Card className="border-green-200 bg-green-50/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-900">Protocol Fulfilled</p>
              <p className="text-xs text-green-800/70">Today&apos;s water requirements have been provided and ledgered.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              No prescription yet (select an active batch with population). You can still log water manually.
            </p>
            <Button
              data-testid="confirm-hydration"
              variant="outline"
              className="w-full rounded-full"
              disabled={waterSaving || !batch}
              onClick={() => onFulfillTask({
                task_type: 'hydration',
                amount: waterPrescription?.gallons ?? 10,
                unit: 'gal',
              })}
            >
              {waterSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log water (fallback)'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3. Synergy Section (Active Treatments) */}
      {pendingWaterMeds.length > 0 && !isTodayCompleted && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Pill className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800/70">Treatment Synergy</p>
              <p className="text-xs font-medium text-amber-900">
                You have <strong>{pendingWaterMeds.length}</strong> drinking water treatments scheduled for today. 
                These will be automatically completed when you fulfill the Hydration Protocol.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Trend Analytics Section */}
      <WaterTrendChart data={waterChartData} prescribedGallons={waterPrescription?.gallons} />

      {/* 5. Log History Section */}
      {waterRecords.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Operational History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {waterRecords.map((w, idx) => {
                const isHighTemp = w.temperature_c && Number(w.temperature_c) > 32;
                let dateLabel = '—';
                try {
                  if (w.date) dateLabel = format(new Date(`${w.date}T12:00:00`), 'MMM d');
                } catch { /* ignore bad dates */ }
                return (
                  <div key={w.id || `water-${idx}`} className={`flex items-center justify-between text-sm border-b pb-1.5 last:border-0 ${isHighTemp ? 'bg-orange-50 rounded px-1' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>{dateLabel}</span>
                      {w.notes && <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">— {w.notes}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                      <span>{w.gallons_consumed} gal</span>
                      {w.temperature_c != null && <span>{w.temperature_c}°C</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
