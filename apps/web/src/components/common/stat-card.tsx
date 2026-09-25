import { Icon, type IconName } from "@/components/icon";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: IconName;
  description?: string;
  iconClassName?: string;
}

export function StatCard({ title, value, icon, description, iconClassName }: StatCardProps) {
  return (
    <Card className="gap-0">
      <CardContent className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon name={icon} className={cn("size-4 text-muted-foreground", iconClassName)} />
      </CardContent>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
