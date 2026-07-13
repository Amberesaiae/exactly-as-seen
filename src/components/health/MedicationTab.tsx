import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, Plus } from 'lucide-react';
import { MedicationCard } from './MedicationCard';
import { AddMedicationModal } from './AddMedicationModal';
import { computeDose } from '@/lib/dosing';

interface MedicationTabProps {
  healthTasks: any[];
  medSubmitting: boolean;
  showMedModal: boolean;
  setShowMedModal: (show: boolean) => void;
  onAddMedication: (params: any) => void;
  onMarkComplete: (id: string) => void;
  medications: any[];
  containerTypes: any[];
  waterSourceChlorinated: boolean;
  batch?: any;
  batchAge?: any;
  waterPrescription?: any;
  waterRatePesewas?: number | null;
  onUpdateWaterRate?: (rate: number | null) => void;
}

export function MedicationTab({
  healthTasks,
  medSubmitting,
  showMedModal,
  setShowMedModal,
  onAddMedication,
  onMarkComplete,
  medications,
  containerTypes,
  waterSourceChlorinated,
  batch,
  batchAge,
  waterPrescription,
  waterRatePesewas,
  onUpdateWaterRate,
}: MedicationTabProps) {
  const medTasks = healthTasks.filter(
    task => task.task_type === 'medication' || task.task_type === 'supplement'
  );

  return (
    <div className="space-y-4 mt-4">
      {medTasks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Pill className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No medications recorded yet.</p>
            <Button variant="outline" className="rounded-full gap-1" onClick={() => setShowMedModal(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {medTasks.map(task => (
            <MedicationCard
              key={task.id}
              task={task}
              medications={medications}
              containerTypes={containerTypes}
              waterPrescription={waterPrescription}
              onMarkComplete={onMarkComplete}
              computeDose={computeDose}
            />
          ))}
        </div>
      )}

      <AddMedicationModal
        open={showMedModal}
        onOpenChange={setShowMedModal}
        onAdd={onAddMedication}
        medications={medications}
        containerTypes={containerTypes}
        healthTasks={healthTasks}
        waterSourceChlorinated={waterSourceChlorinated}
        batch={batch}
        submitting={medSubmitting}
        waterRatePesewas={waterRatePesewas}
        onUpdateWaterRate={onUpdateWaterRate}
      />
    </div>
  );
}
