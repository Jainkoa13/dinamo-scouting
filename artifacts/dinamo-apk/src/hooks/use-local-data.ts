import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as db from "@/lib/db";
import type { LocalPlayer, LocalTeam } from "@/lib/db";

export const PLAYERS_KEY = ["players"] as const;
export const TEAMS_KEY = ["teams"] as const;

export function usePlayers() {
  return useQuery({ queryKey: PLAYERS_KEY, queryFn: db.getPlayers });
}

export function usePlayer(id: number) {
  return useQuery({
    queryKey: ["players", id],
    queryFn: () => db.getPlayer(id),
    enabled: !!id,
  });
}

export function useTeams() {
  return useQuery({ queryKey: TEAMS_KEY, queryFn: db.getTeams });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LocalPlayer, "id" | "createdAt">) => db.addPlayer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAYERS_KEY }),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<LocalPlayer, "id" | "createdAt">> }) =>
      db.updatePlayer(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: PLAYERS_KEY });
      qc.invalidateQueries({ queryKey: ["players", updated.id] });
    },
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => db.deletePlayer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAYERS_KEY }),
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => db.addTeam(nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAMS_KEY }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) => db.updateTeam(id, nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEAMS_KEY }),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => db.deleteTeam(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TEAMS_KEY });
      qc.invalidateQueries({ queryKey: PLAYERS_KEY });
    },
  });
}

export type { LocalPlayer, LocalTeam };
