import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, CheckCircle2, ArrowRight, Droplets, Utensils, Syringe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTaskTypeLabel } from '@/lib/today-tasks';

interface HealthTasksListProps {
  tasks: any[];
}

/**
 * Proactive Task List for the Dashboard.
 * Displays care + daily operational protocols (Tool Effect).
 */
export function HealthTasksList({ tasks }: HealthTasksListProps) {
  return (
    <Card className="border-primary/10 shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-muted pb-3">
          <h2 className="text-sm font-black text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" /> TODAY'S HOUSE TASKS
          </h2>
          <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">READY</Badge>
        </div>

        {tasks.length === 0 ? (
          <div className="py-10 text-center">
            <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-xs font-bold text-muted-foreground">All operational protocols fulfilled!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const label = formatTaskTypeLabel(task);
              const isHydration = task.task_type === 'hydration';
              const isFeeding = task.task_type === 'feeding';
              const isVaccine = label === 'Vaccine';
              // Stable key: virtual ops use type:batch:date; care uses uuid
              const rowKey = task.id || `${task.task_type}:${task.batch_id}:${task.scheduled_date || task.title}`;
              return (
              <div key={rowKey} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors duration-200 border border-transparent hover:border-muted group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isHydration ? 'bg-blue-50 text-blue-500' :
                    isFeeding ? 'bg-amber-50 text-amber-500' :
                    isVaccine ? 'bg-indigo-50 text-indigo-500' :
                    'bg-purple-50 text-purple-500'
                  }`}>
                    {isHydration ? <Droplets className="h-4 w-4" /> :
                     isFeeding ? <Utensils className="h-4 w-4" /> :
                     isVaccine ? <Syringe className="h-4 w-4" /> :
                     <Pill className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate text-foreground leading-tight">
                      {task.title || task.product_name || 'Treatment Task'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight mt-0.5">
                      {task.batch_name} • {label}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" asChild>
                  <Link to={isFeeding ? '/feed' : '/health'}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              );
            })}
            <Button variant="outline" className="w-full text-xs h-9 rounded-full font-bold border-primary/20 text-primary hover:bg-primary/5 mt-2" asChild>
              <Link to="/health">Manage All Protocols</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
