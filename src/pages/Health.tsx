import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { useHealthData } from '@/hooks/useHealthData';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Plus, Pill, Syringe, Droplets, ListChecks, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';

import { HealthAlertBanner } from '@/components/health/HealthAlertBanner';
import { VaccinationTab } from '@/components/health/VaccinationTab';
import { MedicationTab } from '@/components/health/MedicationTab';
import { WaterTab } from '@/components/health/WaterTab';
import { CompleteCareTaskModal } from '@/components/health/CompleteCareTaskModal';

export default function Health() {
  const { costPrivacyEnabled } = useAppStore();
  const [activeTab, setActiveTab] = useState('this_week');
  const {
    batches,
    selectedBatch,
    setSelectedBatch,
    vaccinations,
    healthTasks,
    waterRecords,
    loading,
    generatingVaccines,
    medSubmitting,
    waterSaving,
    batch,
    batchAge,
    pendingVaccines,
    overdueVaccines,
    activeMeds,
    latestTemp,
    healthAlerts,
    activeWithdrawals,
    eggDiscardInfo,
    waterChartData,
    waterPrescription,
    todayWaterLogged,
    generateVaccinationSchedule,
    markVaccineAdministered,
    addMedication,
    markTaskComplete,
    logWater,
    medications,
    containerTypes,
    waterSourceChlorinated,
    todayTemp,
    farmRegion,
    weeklySummary,
    weeklyLoading,
    batchTasks,
    bulkCompleteWeekTasks,
    waterRatePesewas,
    updateWaterRate,
    fulfillOperationalTask,
    totalWaterCostPesewas,
    pendingWaterMeds,
    dailyOperationalTasks,
  } = useHealthData();

  const [showMedModal, setShowMedModal] = useState(false);
  const [completeTask, setCompleteTask] = useState<{ id: string; product_name: string; task_type: string } | null>(null);
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  const currentWeekTasks = useMemo(() => {
    if (!batch || !batchAge || !healthTasks.length) return [];
    const startDate = new Date(batch.start_date);
    const weekStart = addDays(startDate, (batchAge.week - 1) * 7);
    const weekEnd = addDays(weekStart, 7);
    return healthTasks.filter(t => {
      const d = new Date(t.scheduled_date);
      return (d >= weekStart && d < weekEnd);
    }).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  }, [healthTasks, batch, batchAge]);

  if (loading) {
    return <div className="p-4 md:p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Care &amp; Water</h1>
        <Button className="gap-1.5 rounded-full" onClick={() => setShowMedModal(true)} disabled={!selectedBatch}>
          <Plus className="h-4 w-4" /> Medication
        </Button>
      </div>

      {batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-semibold mb-1">No active batches</h3>
            <p className="text-sm text-muted-foreground">Create a batch first to manage health.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Active Batch</Label>
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} ({b.species})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <HealthAlertBanner
            batch={batch}
            batchAge={batchAge}
            overdueVaccines={overdueVaccines}
            pendingVaccines={pendingVaccines}
            vaccinations={vaccinations}
            activeMeds={activeMeds}
            activeWithdrawals={activeWithdrawals}
            todayWaterLogged={todayWaterLogged}
            latestTemp={latestTemp}
            healthAlerts={healthAlerts}
            eggDiscardInfo={eggDiscardInfo}
            waterPrescription={waterPrescription}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="this_week" className="gap-1">
                <ListChecks className="h-3.5 w-3.5" /> This Week
                {weeklySummary && weeklySummary.health_tasks_pending > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                    {weeklySummary.health_tasks_pending}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="vaccinations" className="gap-1">
                <Syringe className="h-3.5 w-3.5" /> Vaccines
                {overdueVaccines.length > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">{overdueVaccines.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="medications" className="gap-1">
                <Pill className="h-3.5 w-3.5" /> Meds
                {activeMeds.length > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{activeMeds.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="water" className="gap-1">
                <Droplets className="h-3.5 w-3.5" /> Water
              </TabsTrigger>
            </TabsList>

            <TabsContent value="this_week" className="mt-4 space-y-4">
              {/* Keep last summary visible while refreshing — skeleton only on first load */}
              {weeklyLoading && !weeklySummary ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground font-medium">Total Tasks</p>
                        <h3 className="text-2xl font-bold mt-1">
                          {weeklySummary ? (weeklySummary.health_tasks_total + weeklySummary.batch_tasks_total) : 0}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {weeklySummary?.health_tasks_total ?? 0} health + {weeklySummary?.batch_tasks_total ?? 0} daily
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground font-medium">Completed</p>
                        <h3 className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                          {weeklySummary ? (weeklySummary.health_tasks_completed + weeklySummary.batch_tasks_completed) : 0}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {weeklySummary?.health_tasks_completed ?? 0} health + {weeklySummary?.batch_tasks_completed ?? 0} daily
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground font-medium">Pending Care</p>
                        <h3 className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                          {weeklySummary?.health_tasks_pending ?? 0}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1">Requires action</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground font-medium">Est. Cost</p>
                        <h3 className="text-2xl font-bold mt-1">
                          {costPrivacyEnabled ? '••••' : `GH₵ ${((weeklySummary?.total_health_cost_pesewas ?? 0) / 100).toFixed(2)}`}
                        </h3>
                        <p className="text-[10px] text-muted-foreground mt-1">This week's health cost</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Header and Bulk Complete */}
                  <div className="flex justify-between items-center flex-wrap gap-3 pt-2">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Health Tasks for Week {batchAge?.week ?? 1}</h2>
                      <p className="text-xs text-muted-foreground">Manage scheduled treatments and daily tasks</p>
                    </div>
                    {weeklySummary && weeklySummary.health_tasks_pending > 0 && selectedBatch && (
                      <Button 
                        onClick={() => bulkCompleteWeekTasks(selectedBatch, batchAge?.week ?? 1)}
                        className="rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold h-9 text-xs"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Complete All Pending Care ({weeklySummary.health_tasks_pending})
                      </Button>
                    )}
                  </div>

                  {/* Daily Farm Operations */}
                  {batchTasks.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Daily Farm Operations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {batchTasks.map(task => {
                          const linkMap: Record<string, string> = {
                            feed_log: '/feed',
                            water_log: '/health',
                            egg_collection: '/eggs'
                          };
                          const labelMap: Record<string, string> = {
                            feed_log: 'Log Feed',
                            water_log: 'Log Water',
                            egg_collection: 'Collect Eggs'
                          };
                          return (
                            <Card key={task.id} className={task.completed ? 'bg-muted/30 border-none' : 'border-primary/20'}>
                              <CardContent className="p-3.5 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-xs capitalize truncate">{task.title || task.task_type.replace('_', ' ')}</h4>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">Due: {task.due_date}</p>
                                </div>
                                {task.completed ? (
                                  <Badge className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-none text-[10px]">Done</Badge>
                                ) : (
                                  <Button size="sm" variant="outline" className="rounded-full h-7 text-xs gap-1 shrink-0" asChild>
                                    <Link to={linkMap[task.task_type] || '/health'}>
                                      {labelMap[task.task_type] || 'Log'} <ArrowRight className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Medical & Care Tasks */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Medical & Care Tasks</h3>
                    {currentWeekTasks.filter(t => !t.completed).length === 0 ? (
                      <Card className="border-dashed bg-muted/10">
                        <CardContent className="py-6 flex flex-col items-center justify-center text-center">
                          <CheckCircle2 className="h-6 w-6 text-green-500 mb-1.5" />
                          <p className="text-xs font-medium text-muted-foreground">All care tasks for this week are completed!</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentWeekTasks.filter(t => !t.completed).map(task => (
                          <Card key={task.id} className="border-amber-200 dark:border-amber-800 bg-amber-50/10">
                            <CardHeader className="pb-1.5 pt-3 px-3">
                              <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-sm font-semibold truncate">{task.product_name || 'Care Task'}</CardTitle>
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-none text-[10px] capitalize shrink-0">{task.task_type}</Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground">Scheduled: {task.scheduled_date}</p>
                            </CardHeader>
                            <CardContent className="space-y-2 pb-3 px-3">
                              <p className="text-[11px] text-muted-foreground line-clamp-2">{task.notes || 'No description provided.'}</p>
                              <div className="flex justify-between items-center pt-1.5 border-t">
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                  {task.duration_days}d course &bull; {task.withdrawal_meat_days + task.withdrawal_egg_days > 0 ? 'Withdrawal' : 'No withdrawal'}
                                </span>
                                <Button 
                                  size="sm" 
                                  className="rounded-full bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs px-2.5"
                                  onClick={() => setCompleteTask({
                                    id: task.id,
                                    product_name: task.product_name || 'Care Task',
                                    task_type: task.task_type || 'care',
                                  })}
                                >
                                  Complete
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Completed Care Section */}
                  {currentWeekTasks.filter(t => t.completed).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed Care</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentWeekTasks.filter(t => t.completed).map(task => (
                          <Card key={task.id} className="opacity-75 bg-muted/20 border-none">
                            <CardHeader className="pb-1 pt-2.5 px-3">
                              <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-sm font-semibold text-muted-foreground line-through truncate">{task.product_name}</CardTitle>
                                <Badge variant="secondary" className="text-[10px] shrink-0 border-none bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">Completed</Badge>
                              </div>
                              <p className="text-[9px] text-muted-foreground">
                                Completed at: {task.completed_at ? format(new Date(task.completed_at), 'yyyy-MM-dd HH:mm') : 'N/A'}
                              </p>
                            </CardHeader>
                            <CardContent className="pb-2.5 px-3">
                              <p className="text-[11px] text-muted-foreground truncate">{task.notes}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Preview */}
                  {weeklySummary?.next_week_tasks && weeklySummary.next_week_tasks.length > 0 && (
                    <div className="space-y-2 mt-4 pt-2 border-t">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        Upcoming Next Week (Week { (batchAge?.week ?? 1) + 1 })
                      </h3>
                      <div className="bg-muted/10 border rounded-lg p-3 space-y-2">
                        {weeklySummary.next_week_tasks.map((t, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] border-b last:border-none pb-1.5 last:pb-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-foreground truncate">{t.product_name}</span>
                              <Badge variant="outline" className="text-[8px] h-4 py-0 px-1 capitalize shrink-0">{t.task_type}</Badge>
                              {t.is_vaccination && <Badge className="text-[8px] h-4 py-0 px-1 bg-purple-50 text-purple-700 border-none shrink-0">Vaccine</Badge>}
                            </div>
                            <span className="text-muted-foreground text-[10px] shrink-0">Scheduled: {t.scheduled_date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="vaccinations" className="mt-4">
              <VaccinationTab batch={batch} vaccinations={vaccinations} generatingVaccines={generatingVaccines} onGenerateSchedule={generateVaccinationSchedule} onMarkAdministered={markVaccineAdministered} />
            </TabsContent>

            <TabsContent value="medications" className="mt-4">
              <MedicationTab 
                healthTasks={healthTasks} 
                medSubmitting={medSubmitting} 
                showMedModal={showMedModal} 
                setShowMedModal={setShowMedModal} 
                onAddMedication={addMedication} 
                onMarkComplete={markTaskComplete}
                medications={medications}
                containerTypes={containerTypes}
                waterSourceChlorinated={waterSourceChlorinated}
                batch={batch}
                batchAge={batchAge}
                waterPrescription={waterPrescription}
                waterRatePesewas={waterRatePesewas}
                onUpdateWaterRate={updateWaterRate}
              />
            </TabsContent>

            <TabsContent value="water" className="mt-4">
              <WaterTab
                batch={batch}
                waterRecords={waterRecords}
                waterChartData={waterChartData}
                waterPrescription={waterPrescription}
                waterSaving={waterSaving}
                onFulfillTask={fulfillOperationalTask}
                todayTemp={todayTemp}
                farmRegion={farmRegion}
                totalWaterCostPesewas={totalWaterCostPesewas}
                costPrivacyEnabled={costPrivacyEnabled}
                pendingWaterMeds={pendingWaterMeds}
                dailyOperationalTasks={dailyOperationalTasks}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      <CompleteCareTaskModal
        open={!!completeTask}
        onOpenChange={(open) => { if (!open) setCompleteTask(null); }}
        productName={completeTask?.product_name || ''}
        taskType={completeTask?.task_type}
        submitting={completeSubmitting}
        onConfirm={async (costPesewas) => {
          if (!completeTask) return;
          setCompleteSubmitting(true);
          try {
            await markTaskComplete(completeTask.id, costPesewas);
          } finally {
            setCompleteSubmitting(false);
            setCompleteTask(null);
          }
        }}
      />
    </div>
  );
}
