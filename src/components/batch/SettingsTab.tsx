import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Settings, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isOffline, queueWrite } from '@/lib/sync';

interface SettingsTabProps {
  batch: any;
  setBatch: (b: any) => void;
}

export function SettingsTab({ batch, setBatch }: SettingsTabProps) {
  if (!batch) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="h-4 w-4" /> Batch Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Production System</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Select 
                value={batch.production_system} 
                onValueChange={async (val) => {
                  if (isOffline()) {
                    await queueWrite('batches', 'update', batch.id, { production_system: val } as unknown as Record<string, unknown>);
                    setBatch({ ...batch, production_system: val });
                    toast.success('Production system updated (offline — will sync)');
                    return;
                  }
                  const { error } = await supabase.from('batches').update({ production_system: val }).eq('id', batch.id);
                  if (!error) {
                    setBatch({ ...batch, production_system: val });
                    toast.success('Production system updated');
                  } else {
                    toast.error(error.message);
                  }
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deep_litter">Deep Litter (Intensive)</SelectItem>
                  <SelectItem value="semi_intensive">Semi-Intensive (Indoor + Foraging)</SelectItem>
                  <SelectItem value="free_range">Free Range (Semi-Intensive)</SelectItem>
                  <SelectItem value="cage">Cage System (Intensive)</SelectItem>
                  <SelectItem value="pasture">Pasture-Based (Semi-Intensive)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic">
                Changing this affects how feed requirements are computed (foraging reductions).
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
              <p className="text-xs font-bold text-primary flex items-center gap-1.5 mb-1">
                <Lightbulb className="h-3 w-3" /> Lean Logic
              </p>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                <strong>Intensive:</strong> Fully controlled. System auto-logs expenses.<br/>
                <strong>Semi-Intensive:</strong> Uses foraging. System suggests a reduced "Lean Target" to save costs.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Started on {format(new Date(batch.start_date), 'MMMM d, yyyy')} • Initial Quantity: {batch.initial_quantity} birds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
