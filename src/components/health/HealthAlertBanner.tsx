import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, Info, Egg, ThermometerSun, Droplets } from 'lucide-react';
import { format } from 'date-fns';

interface HealthAlertBannerProps {
  batch: any;
  batchAge: any;
  overdueVaccines: any[];
  pendingVaccines: any[];
  vaccinations: any[];
  activeMeds: any[];
  activeWithdrawals: any[];
  todayWaterLogged: boolean;
  latestTemp: number | string | null;
  healthAlerts: any[];
  eggDiscardInfo: any;
  waterPrescription: any;
}

export function HealthAlertBanner({
  batch,
  batchAge,
  overdueVaccines,
  pendingVaccines,
  vaccinations,
  activeMeds,
  activeWithdrawals,
  todayWaterLogged,
  latestTemp,
  healthAlerts,
  eggDiscardInfo,
  waterPrescription,
}: HealthAlertBannerProps) {
  if (!batch || !batchAge) return null;

  return (
    <div className="space-y-4">
      {/* Today's Health Summary Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-4 px-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Today's Health Summary</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-background p-2.5 text-center">
              <p className="text-xs text-muted-foreground">Age</p>
              <p className="text-lg font-bold text-foreground">Week {batchAge.week}</p>
              <p className="text-xs text-muted-foreground capitalize">Day {batchAge.day} • {batchAge.phase}</p>
            </div>
            <div className={`rounded-lg p-2.5 text-center ${overdueVaccines.length > 0 ? 'bg-destructive/10' : 'bg-background'}`}>
              <p className="text-xs text-muted-foreground">Vaccines</p>
              <p className={`text-lg font-bold ${overdueVaccines.length > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {overdueVaccines.length > 0 ? `${overdueVaccines.length} overdue` : pendingVaccines.length > 0 ? `${pendingVaccines.length} due` : '✓ OK'}
              </p>
              <p className="text-xs text-muted-foreground">
                {vaccinations.filter(v => v.administered).length}/{vaccinations.length} done
              </p>
            </div>
            <div className={`rounded-lg p-2.5 text-center ${activeMeds.length > 0 ? 'bg-primary/10' : activeWithdrawals.length > 0 ? 'bg-warning/20' : 'bg-background'}`}>
              <p className="text-xs text-muted-foreground">Medications</p>
              <p className={`text-lg font-bold ${activeMeds.length > 0 ? 'text-primary' : activeWithdrawals.length > 0 ? 'text-warning' : 'text-foreground'}`}>
                {activeMeds.length > 0 ? `${activeMeds.length} active` : activeWithdrawals.length > 0 ? 'Withdrawal' : 'None'}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeWithdrawals.length > 0 ? `${activeWithdrawals.length} in withdrawal` : 'All clear'}
              </p>
            </div>
            <div className={`rounded-lg p-2.5 text-center ${todayWaterLogged ? 'bg-background' : 'bg-warning/10'}`}>
              <p className="text-xs text-muted-foreground">Water Today</p>
              <p className={`text-lg font-bold ${todayWaterLogged ? 'text-foreground' : 'text-warning'}`}>
                {todayWaterLogged ? '✓ Logged' : 'Not yet'}
              </p>
              <p className="text-xs text-muted-foreground">
                {latestTemp ? `Last: ${latestTemp}°C` : 'No temp recorded'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heat Stress Advisory (Refactored from hard multiplier) */}
      {waterPrescription?.caution && (
        <Alert className={waterPrescription.caution.type === 'extreme_heat' ? 'border-destructive bg-destructive/10' : 'border-warning/50 bg-warning/10'}>
          <ThermometerSun className={`h-4 w-4 ${waterPrescription.caution.type === 'extreme_heat' ? 'text-destructive' : 'text-warning'}`} />
          <AlertTitle className="text-sm font-bold flex items-center gap-2">
            {waterPrescription.caution.type === 'extreme_heat' ? 'EXTREME HEAT DANGER' : 'HEAT STRESS ADVISORY'}
            <Badge variant="outline" className="text-[10px] h-4 bg-background border-warning/30">Lean Guidance</Badge>
          </AlertTitle>
          <AlertDescription className="text-xs font-medium text-warning-foreground">
            {waterPrescription.caution.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Species-Specific Health Alerts */}
      {healthAlerts.length > 0 && (
        <div className="space-y-2">
          {healthAlerts.map(alert => (
            <Alert
              key={alert.id}
              variant={alert.severity === 'critical' ? 'destructive' : 'default'}
              className={
                alert.severity === 'warning' ? 'border-warning/50 bg-warning/10 text-warning-foreground' :
                alert.severity === 'info' ? 'border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan-foreground' : ''
              }
            >
              {alert.severity === 'critical' ? <AlertTriangle className="h-4 w-4" /> :
               alert.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-warning" /> :
               <Info className="h-4 w-4 text-accent-cyan" />}
              <AlertTitle className="text-sm">{alert.title}</AlertTitle>
              <AlertDescription className="text-xs">{alert.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Egg Discard Warning */}
      {eggDiscardInfo && (
        <Alert variant="destructive" className="border-warning/50 bg-warning/10 text-warning-foreground">
          <Egg className="h-4 w-4 text-warning" />
          <AlertTitle className="text-sm">Egg Discard Required</AlertTitle>
          <AlertDescription className="text-xs">
            Due to {(eggDiscardInfo.products ?? ['medication']).join(', ')} — discard all eggs until{' '}
            <strong>
              {eggDiscardInfo.safeDate
                ? format(eggDiscardInfo.safeDate, 'MMM d, yyyy')
                : eggDiscardInfo.until}
            </strong>
            {eggDiscardInfo.daysLeft != null ? ` (${eggDiscardInfo.daysLeft} days remaining)` : ''}.
            {eggDiscardInfo.estimatedEggs > 0 && (
              <> Estimated <strong>~{eggDiscardInfo.estimatedEggs} eggs</strong> affected.</>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
