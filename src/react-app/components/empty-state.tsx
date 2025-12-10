import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title = "No tasks yet",
  description = "Create your first task to get started",
  action,
}: {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void; loading?: boolean };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} disabled={action.loading}>
          {action.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {action.label}
        </Button>
      )}
    </div>
  );
}
