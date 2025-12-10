import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  image?: string;
}

// 1. Hook to FETCH the list of members for a specific team
export function useMembers(teamId?: string) {
  return useQuery({
    queryKey: ["members", teamId],
    queryFn: async () => {
      if (!teamId) return [];
      const { data } = await axios.get<{ members: Member[] }>(`/api/teams/${teamId}/members`);
      return data.members;
    },
    enabled: !!teamId,
  });
}

// 2. Hook to INVITE a new person to the team
export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, email }: { teamId: string; email: string }) => {
      const { data } = await axios.post(`/api/teams/${teamId}/invite`, { email });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members", variables.teamId] });
    },
  });
}

// 3. NEW: Hook to GET ALL USERS (for the invite dropdown)
export function useAllUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await axios.get<{ users: Member[] }>("/api/users");
      return data.users;
    },
  });
}