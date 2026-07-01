import { useQuery } from "@tanstack/react-query";
import { userService } from "../services/userService";

export function useCapabilities(enabled = true) {
  return useQuery({
    queryKey: ["userCapabilities"],
    queryFn: async () => (await userService.getMyCapabilities()).data,
    staleTime: 30_000,
    enabled,
  });
}
