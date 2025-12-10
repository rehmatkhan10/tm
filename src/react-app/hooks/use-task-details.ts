import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// --- TYPES ---
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  changeType: string;
  createdAt: string;
  changedBy: { name: string; image: string | null };
}

export interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  timeLimit: number | null; // Minutes
}

// --- HOOKS ---

// 1. Get Single Task Details
export function useTask(taskId: string) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const { data } = await axios.get<{ task: TaskDetail }>(`/api/tasks/${taskId}`);
      return data.task;
    },
    enabled: !!taskId,
  });
}

// 2. Get Comments
export function useComments(taskId: string) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const { data } = await axios.get<{ comments: Comment[] }>(`/api/tasks/${taskId}/comments`);
      return data.comments;
    },
    enabled: !!taskId,
  });
}

// 3. Add Comment
export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      await axios.post(`/api/tasks/${taskId}/comments`, { content });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["history", variables.taskId] }); // Update history too
    },
  });
}

// 4. Get Attachments
export function useAttachments(taskId: string) {
  return useQuery({
    queryKey: ["attachments", taskId],
    queryFn: async () => {
      const { data } = await axios.get<{ attachments: Attachment[] }>(`/api/tasks/${taskId}/attachments`);
      return data.attachments;
    },
    enabled: !!taskId,
  });
}

// 5. Add Attachment
export function useAddAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, fileName, fileUrl, fileType }: { taskId: string; fileName: string; fileUrl: string; fileType: string }) => {
      await axios.post(`/api/tasks/${taskId}/attachments`, { fileName, fileUrl, fileType });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["history", variables.taskId] });
    },
  });
}

// 5b. Upload Attachment (multipart)
export function useUploadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      await axios.post(`/api/tasks/${taskId}/attachments/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["history", variables.taskId] });
    },
  });
}

// 6. Get History
export function useHistory(taskId: string) {
  return useQuery({
    queryKey: ["history", taskId],
    queryFn: async () => {
      const { data } = await axios.get<{ history: HistoryItem[] }>(`/api/tasks/${taskId}/history`);
      return data.history;
    },
    enabled: !!taskId,
  });
}

// 7. Update Task (For Timer/Status)
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, ...data }: Partial<TaskDetail> & { taskId: string }) => {
      await axios.patch(`/api/tasks/${taskId}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["history", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Refresh main list
    },
  });
}