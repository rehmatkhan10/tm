import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
}

interface SubtaskListProps {
  taskId: string;
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");

  // Fetch subtasks
  const { data, isLoading } = useQuery({
    queryKey: ["subtasks", taskId],
    queryFn: async () => {
      const { data } = await api.get(`/api/tasks/${taskId}/subtasks`);
      return data.subtasks as Subtask[];
    },
  });

  // Create subtask mutation
  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data } = await api.post(`/api/tasks/${taskId}/subtasks`, { title });
      return data.subtask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] });
      setNewTitle("");
      toast.success("Subtask created");
    },
    onError: () => {
      toast.error("Failed to create subtask");
    },
  });

  // Update subtask mutation
  const updateMutation = useMutation({
    mutationFn: async ({ subtaskId, ...data }: { subtaskId: string; completed?: boolean; title?: string }) => {
      const { data: response } = await api.patch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, data);
      return response.subtask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] });
    },
    onError: () => {
      toast.error("Failed to update subtask");
    },
  });

  // Delete subtask mutation
  const deleteMutation = useMutation({
    mutationFn: async (subtaskId: string) => {
      await api.delete(`/api/tasks/${taskId}/subtasks/${subtaskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] });
      toast.success("Subtask deleted");
    },
    onError: () => {
      toast.error("Failed to delete subtask");
    },
  });

  const handleAddSubtask = async () => {
    if (!newTitle.trim()) return;
    createMutation.mutate(newTitle);
  };

  const completedCount = data?.filter((s) => s.completed).length ?? 0;

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading subtasks...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      {data && data.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">
              {completedCount} of {data.length}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${data.length > 0 ? (completedCount / data.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-2">
        {data?.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={(checked) => {
                updateMutation.mutate({ subtaskId: subtask.id, completed: checked as boolean });
              }}
              disabled={updateMutation.isPending}
            />
            <span
              className={`flex-1 ${subtask.completed ? "line-through text-muted-foreground" : ""}`}
            >
              {subtask.title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteMutation.mutate(subtask.id)}
              disabled={deleteMutation.isPending}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add subtask input */}
      <div className="flex gap-2 pt-2">
        <Input
          placeholder="Add a subtask..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddSubtask();
            }
          }}
          disabled={createMutation.isPending}
        />
        <Button
          onClick={handleAddSubtask}
          disabled={!newTitle.trim() || createMutation.isPending}
          size="sm"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
