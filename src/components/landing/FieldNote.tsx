import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

export function FieldNote() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <Card className="border-border/80 bg-card shadow-none">
        <CardContent className="p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            From the field
          </p>
          <blockquote className="mt-6 max-w-3xl text-xl font-medium leading-snug tracking-tight text-foreground sm:text-2xl">
            “I log from the house with no bars. When I get back to the road, it just catches up.
            That is the only software that survived our rainy-season route.”
          </blockquote>
          <div className="mt-8 flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
                KA
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">Kwesi A.</p>
              <p className="text-xs text-muted-foreground">Layer house · Ashanti Region</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
