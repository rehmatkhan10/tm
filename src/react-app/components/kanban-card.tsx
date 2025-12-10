import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { PriorityBadge } from "./priority-badge";
import { TaskSheet } from "./task-sheet";

type TaskStatus = "todo" | "in_progress" | "completed";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

interface KanbanCardProps {
  task: Task;
}

export function KanbanCard({ task }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TaskSheet taskId={task.id}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <Card className="p-3 hover:shadow-md transition-shadow hover:bg-accent">
          <div className="space-y-2">
            <p className="font-semibold text-sm line-clamp-2 hover:underline cursor-pointer">
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={task.priority} className="text-xs" />
            </div>
          </div>
        </Card>
      </div>
    </TaskSheet>
  );
}
