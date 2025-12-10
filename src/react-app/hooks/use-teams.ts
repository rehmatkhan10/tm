import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// TypeScript interfaces for our data
interface Team {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
}

interface CreateTeamResponse {
  teamId: string;
  name: string;
}

// 1. Hook to FETCH the list of teams I belong to
export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data } = await axios.get<{ teams: Team[] }>("/api/teams");
      return data.teams;
    },
  });
}

// 2. Hook to CREATE a new team
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await axios.post<CreateTeamResponse>("/api/teams", {
        name,
      });
      return data;
    },
    onSuccess: () => {
      // Refresh the list of teams immediately after creating one
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}