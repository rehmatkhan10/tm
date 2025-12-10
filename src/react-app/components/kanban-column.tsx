import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { KanbanCard } from "./kanban-card";

type TaskStatus = "todo" | "in_progress" | "completed";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

const statusConfig = {
  todo: { label: "To Do", color: "bg-blue-50 dark:bg-blue-900/20" },
  in_progress: { label: "In Progress", color: "bg-yellow-50 dark:bg-yellow-900/20" },
  completed: { label: "Completed", color: "bg-green-50 dark:bg-green-900/20" },
};

export function KanbanColumn({ status, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg ${config.color} p-4 min-h-[600px]`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{config.label}</h2>
        <Badge variant="outline" className="text-sm">
          {tasks.length}
        </Badge>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex flex-col gap-3 min-h-[500px] rounded-md p-2 transition-colors"
        >
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No tasks yet. Drag tasks here.
            </div>
          ) : (
            tasks.map((task) => <KanbanCard key={task.id} task={task} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}
