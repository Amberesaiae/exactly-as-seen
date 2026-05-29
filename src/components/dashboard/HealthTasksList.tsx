import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, CheckCircle2, ArrowRight, Droplets, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HealthTasksListProps {
  tasks: any[];
}

/**
 * Proactive Task List for the Dashboard.
 * Displays both health-scheduled medications and daily operational protocols (Tool Effect).
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
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-muted group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    task.task_type === 'hydration' ? 'bg-blue-50 text-blue-500' :
                    task.task_type === 'feeding' ? 'bg-amber-50 text-amber-500' :
                    'bg-purple-50 text-purple-500'
                  }`}>
                    {task.task_type === 'hydration' ? <Droplets className="h-4 w-4" /> :
                     task.task_type === 'feeding' ? <Utensils className="h-4 w-4" /> :
                     <Pill className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate text-foreground leading-tight">
                      {task.title || task.product_name || 'Treatment Task'}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mt-0.5">
                      {task.batch_name} • {task.task_type}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" asChild>
                  <Link to={task.task_type === 'feeding' ? '/feed' : '/health'}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full text-xs h-9 rounded-full font-bold border-primary/20 text-primary hover:bg-primary/5 mt-2" asChild>
              <Link to="/health">Manage All Protocols</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
