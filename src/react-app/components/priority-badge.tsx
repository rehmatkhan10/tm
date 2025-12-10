import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const priorityConfig = {
    low: {
      label: "Low",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    medium: {
      label: "Medium",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    high: {
      label: "High",
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const config = priorityConfig[priority];

  return (
    <Badge className={cn(config.className, className)} variant="outline">
      {config.label}
    </Badge>
  );
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case "high":
      return "border-red-500";
    case "medium":
      return "border-yellow-500";
    case "low":
      return "border-green-500";
    default:
      return "border-gray-500";
  }
}
