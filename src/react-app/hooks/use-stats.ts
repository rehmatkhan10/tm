import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface ActivityStat {
  date: string;
  count: number;
}

export function useActivityStats() {
  return useQuery({
    queryKey: ["stats-activity"],
    queryFn: async () => {
      // Fetch data from the backend
      const { data } = await axios.get<{ activity: ActivityStat[] }>("/api/stats/activity");
      return data.activity;
    },
  });
}