import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTasksQuery } from "@/hooks/use-tasks-query";
import { useUpdateTaskMutation } from "@/hooks/use-update-task-mutation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { KanbanColumn } from "./kanban-column";

type TaskStatus = "todo" | "in_progress" | "completed";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export function KanbanBoard() {
  const { data, isPending, isError } = useTasksQuery();
  const updateTask = useUpdateTaskMutation();
  const [tasks, setTasks] = useState<Task[]>([]);

  // Update local state when data loads
  if (data?.tasks && tasks.length === 0) {
    setTasks(data.tasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (newStatus === "todo" || newStatus === "in_progress" || newStatus === "completed") {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      );

      // Actually update backend
      try {
        await updateTask.mutateAsync({
          id: taskId,
          status: newStatus,
        });
        toast.success("Task moved");
      } catch {
        // Revert on error
        setTasks(data?.tasks || []);
        toast.error("Failed to move task");
      }
    }
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Error loading tasks. Please try again.
      </div>
    );
  }

  const columns: TaskStatus[] = ["todo", "in_progress", "completed"];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
          />
        ))}
      </div>
    </DndContext>
  );
}
