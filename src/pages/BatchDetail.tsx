import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBatchDetailLogic } from '@/hooks/batch/useBatchDetailLogic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Calculator, Droplets } from 'lucide-react';
import { MortalityDialog } from '@/components/MortalityDialog';
import { BirdSaleDialog } from '@/components/BirdSaleDialog';
import { OverviewTab } from '@/components/batch/OverviewTab';
import { MortalityTab } from '@/components/batch/MortalityTab';
import { SettingsTab } from '@/components/batch/SettingsTab';
import { TerminationDialog } from '@/components/batch/TerminationDialog';

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    batch, setBatch, loading, mortalities, noteText, setNoteText, mortalityStats, saveNote, refreshMortalities
  } = useBatchDetailLogic(id);

  const [isMortalityDialogOpen, setIsMortalityDialogOpen] = useState(false);
  const [isBirdSaleDialogOpen, setIsBirdSaleDialogOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);

  const handleMortalitySuccess = async (batchId: string, newPop: number) => {
    await refreshMortalities();
    if (batch) setBatch({ ...batch, current_population: newPop });
  };

  const handleSaleSuccess = (batchId: string, newPop: number) => {
    if (batch && batch.id === batchId) {
      setBatch({ ...batch, current_population: newPop });
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-4 md:p-6 text-center">
        <h2 className="text-xl font-bold">Flock not found</h2>
        <Button variant="link" asChild><Link to="/batches">Back to Flocks</Link></Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/batches')} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{batch.name}</h1>
          <p className="text-sm text-muted-foreground">Flock management and tracking</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feed">Feed Lab</TabsTrigger>
          <TabsTrigger value="health">Care</TabsTrigger>
          <TabsTrigger value="mortality">Mortality</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab 
            batch={batch} 
            onRecordMortality={() => setIsMortalityDialogOpen(true)}
            onSellBirds={() => setIsBirdSaleDialogOpen(true)}
            onTerminate={() => setIsTerminateOpen(true)}
          />
        </TabsContent>

        <TabsContent value="feed">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calculator className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold mb-1">Feed Schedule</h3>
              <p className="text-sm text-muted-foreground mb-4">View and manage feed for this batch</p>
              <Button variant="outline" className="rounded-full" asChild><Link to="/feed">Go to Feed Calculator</Link></Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Droplets className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold mb-1">Health & Vaccination</h3>
              <p className="text-sm text-muted-foreground mb-4">View vaccination schedule and health tasks</p>
              <Button variant="outline" className="rounded-full" asChild><Link to="/health">Go to Health</Link></Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mortality">
          <MortalityTab 
            mortalities={mortalities}
            chartData={mortalityStats.chartData}
            causeData={mortalityStats.causeData}
            totalMortality={mortalityStats.total}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab batch={batch} setBatch={setBatch} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Flock Notes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note">Add a new note</Label>
                <Textarea 
                  id="note" 
                  placeholder="Record observations, behavior changes, or special events..." 
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  rows={4}
                />
                <Button onClick={saveNote} disabled={!noteText.trim()} className="rounded-full w-full">Save Note</Button>
              </div>

              {batch.notes && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-2">History</h3>
                  <div className="bg-muted/30 rounded-lg p-3 whitespace-pre-wrap text-sm text-foreground/80 font-mono">
                    {batch.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MortalityDialog
        batch={isMortalityDialogOpen ? { id: batch.id, name: batch.name, current_population: batch.current_population, species: batch.species } : null}
        farmId={batch.farm_id}
        onClose={() => setIsMortalityDialogOpen(false)}
        onSuccess={handleMortalitySuccess}
      />

      <BirdSaleDialog
        batch={isBirdSaleDialogOpen ? batch : null}
        farmId={batch.farm_id}
        onClose={() => setIsBirdSaleDialogOpen(false)}
        onSuccess={handleSaleSuccess}
      />

      <TerminationDialog 
        open={isTerminateOpen}
        onOpenChange={setIsTerminateOpen}
        batch={batch}
        onSuccess={setBatch}
      />
    </div>
  );
}
