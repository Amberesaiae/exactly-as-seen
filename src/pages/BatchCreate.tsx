import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBatchCreateLogic } from '@/hooks/batch/useBatchCreateLogic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check, Loader2, Bird } from 'lucide-react';
import { useState } from 'react';

export default function BatchCreate() {
  const { farmId, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const {
    name, setName,
    species, setSpecies,
    duckType, setDuckType,
    houseId, setHouseId,
    productionSystem, setProductionSystem,
    initialQuantity, setInitialQuantity,
    startDate, setStartDate,
    cycleLength, setCycleLength,
    houses,
    loading,
    submitting,
    createBatch,
  } = useBatchCreateLogic(farmId, user?.id);

  const handleCreate = async () => {
    const batch = await createBatch();
    if (batch) navigate(`/batches/${batch.id}`);
  };

  if (loading) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-lg mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/batches')} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">New Flock</h1>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bird className="h-6 w-6" />
          </div>
          <CardTitle>Flock Registration</CardTitle>
          <CardDescription>Step {step} of 2</CardDescription>
          <Progress value={(step / 2) * 100} className="mt-4 h-2" />
        </CardHeader>
        <CardContent className="pt-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. October Broilers A" />
              </div>

              <div className="space-y-2">
                <Label>Species</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broiler">Broiler (Meat Chicken)</SelectItem>
                    <SelectItem value="layer">Layer (Egg Chicken)</SelectItem>
                    <SelectItem value="duck">Duck</SelectItem>
                    <SelectItem value="turkey">Turkey</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {species === 'duck' && (
                <div className="space-y-2">
                  <Label>Duck Type</Label>
                  <Select value={duckType || ''} onValueChange={v => setDuckType(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meat">Meat Purpose</SelectItem>
                      <SelectItem value="layer">Egg Purpose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Assigned House</Label>
                <Select value={houseId} onValueChange={setHouseId}>
                  <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
                  <SelectContent>
                    {houses.map(h => <SelectItem key={h.id} value={h.id}>{h.name} (Cap: {h.capacity})</SelectItem>)}
                  </SelectContent>
                </Select>
                {houses.length === 0 && (
                  <p className="text-[10px] text-destructive">No available houses. Clean a house or create one in Settings.</p>
                )}
              </div>

              <Button className="w-full rounded-full mt-4" onClick={() => setStep(2)} disabled={!name || !houseId}>Next Step</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label>Production System</Label>
                <Select value={productionSystem} onValueChange={setProductionSystem}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(species === 'broiler' || species === 'layer') ? (
                      <>
                        <SelectItem value="deep_litter">Deep Litter (Intensive)</SelectItem>
                        <SelectItem value="cage">Cage System (Intensive)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="semi_intensive">Semi-Intensive (Indoor + Foraging)</SelectItem>
                        <SelectItem value="free_range">Free Range (Semi-Intensive)</SelectItem>
                        <SelectItem value="pasture">Pasture-Based (Semi-Intensive)</SelectItem>
                        <SelectItem value="deep_litter">Deep Litter (Intensive)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Initial Quantity</Label>
                  <Input type="number" value={initialQuantity} onChange={e => setInitialQuantity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Expected Cycle (Wks)</Label>
                  <Input type="number" value={cycleLength} onChange={e => setCycleLength(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>

              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-[2] rounded-full gap-1.5" onClick={handleCreate} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Create Flock</>}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
