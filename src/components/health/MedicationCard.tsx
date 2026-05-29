import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, ThermometerSun, Check, AlertTriangle, Droplets, Info, Sparkles } from 'lucide-react';
import { format, differenceInDays, isBefore, addDays } from 'date-fns';

interface MedicationCardProps {
  task: any;
  medications: any[];
  containerTypes: any[];
  waterPrescription: any;
  onMarkComplete: (id: string) => void;
  computeDose: (med: any, volume: number) => { amount: number, unit: string };
}

export function MedicationCard({
  task, medications, containerTypes, waterPrescription, onMarkComplete, computeDose
}: MedicationCardProps) {
  const today = new Date();
  const med = medications.find(m => m.id === task.medication_id);

  const getWithdrawalStatus = (task: any) => {
    if (task.completed && (task.withdrawal_meat_until || task.withdrawal_eggs_until)) {
      const meatSafe = task.withdrawal_meat_until ? new Date(task.withdrawal_meat_until) : new Date();
      const eggSafe = task.withdrawal_eggs_until ? new Date(task.withdrawal_eggs_until) : new Date();
      return { 
        meatSafe, eggSafe, 
        meatDaysLeft: Math.max(0, differenceInDays(meatSafe, today)), 
        eggDaysLeft: Math.max(0, differenceInDays(eggSafe, today)), 
        isActive: false, 
        inMeatWithdrawal: task.withdrawal_meat_until ? isBefore(today, meatSafe) : false, 
        inEggWithdrawal: task.withdrawal_eggs_until ? isBefore(today, eggSafe) : false 
      };
    }
    const startDate = new Date(task.scheduled_date);
    const endDate = addDays(startDate, task.duration_days);
    const meatSafe = addDays(endDate, task.withdrawal_meat_days);
    const eggSafe = addDays(endDate, task.withdrawal_egg_days);
    return { 
      endDate, meatSafe, eggSafe, 
      meatDaysLeft: Math.max(0, differenceInDays(meatSafe, today)), 
      eggDaysLeft: Math.max(0, differenceInDays(eggSafe, today)), 
      isActive: isBefore(today, endDate) && !task.completed, 
      inMeatWithdrawal: isBefore(today, meatSafe) && task.withdrawal_meat_days > 0, 
      inEggWithdrawal: isBefore(today, eggSafe) && task.withdrawal_egg_days > 0 
    };
  };

  const ws = getWithdrawalStatus(task);
  const liveDose = (!task.completed && waterPrescription && med) ? computeDose(med, waterPrescription.liters) : null;
  const hasDoseChanged = liveDose && task.computed_dose_amount && Math.abs(liveDose.amount - Number(task.computed_dose_amount)) > 0.05;

  return (
    <Card className={ws.isActive ? 'border-primary/50' : ws.inMeatWithdrawal || ws.inEggWithdrawal ? 'border-yellow-500/50' : ''}>
      <CardContent className="py-3 px-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
              task.completed && !ws.inMeatWithdrawal && !ws.inEggWithdrawal ? 'bg-green-100 text-green-600' :
              ws.isActive ? 'bg-primary/10 text-primary' :
              ws.inMeatWithdrawal || ws.inEggWithdrawal ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'
            }`}>
              {task.task_type === 'medication' ? <Pill className="h-4 w-4" /> : <ThermometerSun className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium truncate ${task.completed && !ws.inMeatWithdrawal ? 'text-muted-foreground' : ''}`}>{task.product_name}</p>
                {task.blocked_reason && <Badge variant="destructive" className="text-[9px] h-3.5 px-1 py-0">{task.blocked_reason} BLOCKED</Badge>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                <span>{task.duration_days}d course</span><span>•</span>
                <span>Scheduled {format(new Date(task.scheduled_date), 'MMM d')}</span>
                {task.computed_dose_amount && <><span className="mx-1">•</span><span className="text-primary/70">Dose: {task.computed_dose_amount} {task.computed_dose_unit}</span></>}
              </div>
            </div>
          </div>
          {!task.completed && <Button size="sm" variant="outline" className="h-8 rounded-full text-xs shrink-0" onClick={() => onMarkComplete(task.id)}><Check className="h-3 w-3 mr-1" /> Complete</Button>}
        </div>

        {ws.isActive && (
          <div className="ml-10 mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-1.5 text-xs text-blue-900 dark:text-blue-200">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Daily Water</span><span className="font-medium">{task.water_volume_l ? `${task.water_volume_l}L` : 'N/A'}</span></div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Dosage</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-semibold text-primary">{task.computed_dose_amount} {task.computed_dose_unit}</span>
                  {hasDoseChanged && <Badge className="bg-blue-100 text-blue-700 border-none text-[8px] h-3.5 px-1 animate-pulse"><Sparkles className="h-2 w-2 mr-0.5" /> UPDATE</Badge>}
                </div>
              </div>
            </div>
            {hasDoseChanged && (
              <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-blue-200/50 mt-1">
                <p className="text-[10px] font-bold text-blue-800 flex items-center gap-1"><Info className="h-3 w-3" /> DOVETAIL ADJUSTMENT</p>
                <p className="text-[10px] text-blue-700 mt-0.5">Use <strong>{liveDose.amount} {liveDose.unit}</strong> due to population shift.</p>
              </div>
            )}
            {task.container_type_id && task.container_count && (
              <div className="pt-2 border-t border-blue-200/50 space-y-1">
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-tight">Lean Preparation</p>
                <p className="text-[11px]">Mix <strong>{hasDoseChanged ? (liveDose.amount / task.container_count).toFixed(1) : (task.computed_dose_amount / task.container_count).toFixed(1)} {liveDose?.unit || task.computed_dose_unit}</strong> into EACH of {task.container_count} drinkers.</p>
              </div>
            )}
          </div>
        )}
        
        {(ws.inMeatWithdrawal || ws.inEggWithdrawal) && (
          <div className="ml-10 space-y-1">
            {ws.inMeatWithdrawal && <div className="flex items-center gap-2 text-xs rounded-md bg-yellow-50 text-yellow-800 px-2 py-1"><AlertTriangle className="h-3 w-3 shrink-0" /><span>Meat: <strong>{ws.meatDaysLeft}d left</strong> (Safe: {format(ws.meatSafe, 'MMM d')})</span></div>}
            {ws.inEggWithdrawal && <div className="flex items-center gap-2 text-xs rounded-md bg-yellow-50 text-yellow-800 px-2 py-1"><AlertTriangle className="h-3 w-3 shrink-0" /><span>Egg: <strong>{ws.eggDaysLeft}d left</strong> (Safe: {format(ws.eggSafe, 'MMM d')})</span></div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
