import { APIEndpoints } from "@/constants/api-endpoints";
import { QueryKeys } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod";

// FIX: Added teamId and priority to the schema
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  teamId: z.string().optional(),       // <--- ADDED THIS
  priority: z.string().optional(),     // <--- ADDED THIS
});

export type CreateTaskForm = z.infer<typeof createTaskSchema>;

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "completed"]),
  createdAt: z.string(),
});

const schema = z.object({
  task: taskSchema,
});

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CreateTaskForm) => {
      // The formData will now include teamId when you pass it
      const { data } = await api.post(APIEndpoints.Tasks, formData);
      return schema.parse(data);
    },
    onSuccess: () => {
      // Refresh the list so the new task shows up immediately
      queryClient.invalidateQueries({ queryKey: [QueryKeys.Tasks] });
    },
  });
};