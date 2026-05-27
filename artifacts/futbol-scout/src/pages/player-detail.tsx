import { useParams, useLocation } from "wouter";
import logoPng from "../assets/logo_dinamo.png";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetPlayer,
  useUpdatePlayer,
  useListTeams,
  getListPlayersQueryKey,
  getGetPlayerStatsQueryKey,
  getGetPlayerQueryKey,
} from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Edit2, Check, X, CheckSquare, Square, Download, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { FifaCard } from "@/components/fifa-card";

const POSICIONES = ["Portero", "Cierre", "Ala", "Pivot", "Entrenador"];
const PIERNAS = ["Derecha", "Izquierda", "Ambidiestro"];
const PAISES = [
  "Euskal Herria", "Galiza", "Catalunya", "País Valenciano",
  "Andalucía", "Aragón", "Asturias", "Cantabria", "Castilla y León",
  "Castilla-La Mancha", "Extremadura", "Islas Baleares", "Islas Canarias",
  "La Rioja", "Madrid", "Murcia", "Navarra",
  "España", "Portugal", "Francia", "Argentina", "Brasil", "Uruguay",
  "Colombia", "Venezuela", "México", "Alemania", "Italia", "Reino Unido",
  "Marruecos", "Senegal", "Nigeria", "Bélgica", "Países Bajos", "Otro",
];

function getCategoria(ano: number | null | undefined): string {
  if (!ano) return "";
  if (ano >= 2019) return "Pre-Benjamín";
  if (ano >= 2017) return "Benjamín";
  if (ano >= 2015) return "Alevín";
  if (ano >= 2013) return "Infantil";
  if (ano >= 2011) return "Cadete";
  if (ano >= 2008) return "Juvenil";
  return "Sénior";
}

function calcEdadDisplay(ano: number | null | undefined): string {
  if (!ano || ano < 1960 || ano > 2030) return "";
  const yr = new Date().getFullYear();
  return `${yr - ano - 1}/${yr - ano}`;
}

const updateSchema = z.object({
  nombre: z.string().min(1),
  alias: z.string().nullable().optional(),
  posiciones: z.array(z.string()).min(1, "Selecciona al menos una posición"),
  pierna: z.string().min(1),
  foto: z.string().nullable().optional(),
  fotoTarjeta: z.string().nullable().optional(),
  edad: z.coerce.number().int().min(1).max(99),
  ano: z.union([z.coerce.number().int().min(1960).max(2030), z.literal("")]).nullable().optional(),
  altura: z.union([z.coerce.number().min(100).max(230), z.literal("")]).nullable().optional(),
  peso: z.union([z.coerce.number().min(20).max(200), z.literal("")]).nullable().optional(),
  velocidad: z.number().min(1).max(10),
  tecnica: z.number().min(1).max(10),
  fisico: z.number().min(1).max(10),
  actitud: z.number().min(1).max(10),
  reflejo: z.number().min(1).max(10).nullable().optional(),
  pais: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  teamId: z.number().int().positive().nullable().optional(),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

function PosicionTag({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs font-mono bg-primary/15 text-primary border border-primary/30 rounded px-2 py-0.5">
      {label}
    </span>
  );
}

function ScoreGauge({ value, label }: { value: number; label: string }) {
  const pct = (value / 10) * 100;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle
            cx="28" cy="28" r="22" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold font-mono text-primary">{value}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-mono uppercase">{label}</span>
    </div>
  );
}

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [exportingCard, setExportingCard] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [removingBgTarjeta, setRemovingBgTarjeta] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const fotoFileRef = useRef<HTMLInputElement>(null);
  const fotoTarjetaFileRef = useRef<HTMLInputElement>(null);
  const numericId = parseInt(id, 10);

  const { data: player, isLoading } = useGetPlayer(numericId, {
    query: { enabled: !!numericId, queryKey: getGetPlayerQueryKey(numericId) },
  });
  const { data: teams } = useListTeams();

  const updatePlayer = useUpdatePlayer();

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    values: player
      ? {
          nombre: player.nombre,
          posiciones: player.posicion.split(",").filter(Boolean),
          pierna: player.pierna,
          foto: player.foto ?? null,
          fotoTarjeta: player.fotoTarjeta ?? null,
          alias: player.alias ?? null,
          edad: player.edad,
          ano: player.ano ?? null,
          altura: player.altura ?? null,
          peso: player.peso ?? null,
          velocidad: player.velocidad,
          tecnica: player.tecnica,
          fisico: player.fisico,
          actitud: player.actitud,
          reflejo: player.reflejo ?? null,
          pais: player.pais ?? null,
          observaciones: player.observaciones ?? "",
          teamId: player.teamId ?? null,
        }
      : undefined as unknown as UpdateFormValues,
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      form.setValue("foto", reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handlePhotoTarjetaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const original = reader.result as string;
      form.setValue("fotoTarjeta", original);
      setRemovingBgTarjeta(true);
      try {
        const res = await fetch("/api/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: original }),
        });
        if (res.ok) {
          const { result } = await res.json() as { result: string };
          form.setValue("fotoTarjeta", result);
        }
      } catch {
        // keep original on failure
      } finally {
        setRemovingBgTarjeta(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleExportCard() {
    if (!cardRef.current || !player) return;
    setExportingCard(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `ficha-${player.nombre.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      toast({ title: "Ficha exportada" });
    } catch {
      toast({ title: "Error al exportar la ficha", variant: "destructive" });
    } finally {
      setExportingCard(false);
    }
  }

  async function onSubmit(values: UpdateFormValues) {
    const anoVal = values.ano === "" || values.ano == null ? null : Number(values.ano);
    const alturaVal = values.altura === "" || values.altura == null ? null : Number(values.altura);
    const pesoVal = values.peso === "" || values.peso == null ? null : Number(values.peso);
    await updatePlayer.mutateAsync({
      id: numericId,
      data: {
        nombre: values.nombre,
        posicion: values.posiciones.join(","),
        pierna: values.pierna,
        foto: values.foto ?? null,
        fotoTarjeta: values.fotoTarjeta ?? null,
        alias: values.alias || null,
        edad: values.edad,
        ano: anoVal,
        altura: alturaVal,
        peso: pesoVal,
        velocidad: values.velocidad,
        tecnica: values.tecnica,
        fisico: values.fisico,
        actitud: values.actitud,
        reflejo: values.posiciones.includes("Portero") ? (values.reflejo ?? null) : null,
        pais: values.pais || null,
        observaciones: values.observaciones || null,
        teamId: values.teamId ?? null,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey(numericId) });
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPlayerStatsQueryKey() });
        setEditing(false);
        toast({ title: "Jugador actualizado" });
      },
      onError: () => {
        toast({ title: "Error al actualizar", variant: "destructive" });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="player-not-found">
        <div className="text-center">
          <p className="text-muted-foreground">Jugador no encontrado</p>
          <Button variant="ghost" onClick={() => setLocation("/")} className="mt-2">Volver</Button>
        </div>
      </div>
    );
  }

  const posArr = player.posicion.split(",").filter(Boolean);
  const overallScore = Math.round(((player.velocidad + player.tecnica + player.fisico + player.actitud) / 4) * 10) / 10;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img src={logoPng} alt="Dinamo Ibaiondo" className="w-8 h-8 object-contain" />
          <span className="text-sm font-bold tracking-tight">DINAMO IBAIONDO SCOUTING</span>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); form.reset(); }} data-testid="button-cancel-edit">
                <X className="w-3.5 h-3.5 mr-1" />Cancelar
              </Button>
              <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={updatePlayer.isPending} data-testid="button-save-edit">
                <Check className="w-3.5 h-3.5 mr-1" />{updatePlayer.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={handleExportCard} disabled={exportingCard} data-testid="button-export-card">
                <Download className="w-3.5 h-3.5 mr-1" />{exportingCard ? "..." : "Ficha"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="button-edit">
                <Edit2 className="w-3.5 h-3.5 mr-1" />Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={logout} title="Cerrar sesión">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Profile card */}
        <div className="bg-card border border-border rounded-lg p-4 flex gap-4 items-start" data-testid="profile-card">
          <div className="w-20 h-20 rounded bg-muted flex-shrink-0 overflow-hidden">
            {player.foto
              ? <img src={player.foto} alt={player.nombre} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><User className="w-8 h-8 text-muted-foreground" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <Form {...form}>
                <div className="space-y-3">
                  {/* Foto de perfil (cara) */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Foto de perfil</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden cursor-pointer border border-border"
                        onClick={() => fotoFileRef.current?.click()}
                      >
                        {form.watch("foto")
                          ? <img src={form.watch("foto")!} alt="foto" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground" /></div>
                        }
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => fotoFileRef.current?.click()}>
                          Cambiar foto de perfil
                        </Button>
                        {form.watch("foto") && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue("foto", null)} className="text-xs text-muted-foreground h-7">
                            <X className="w-3 h-3 mr-1" />Quitar
                          </Button>
                        )}
                      </div>
                      <input ref={fotoFileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </div>
                  </div>

                  {/* Foto para la carta FIFA */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Foto para la carta</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden cursor-pointer border border-border"
                        onClick={() => fotoTarjetaFileRef.current?.click()}
                        style={{ background: form.watch("fotoTarjeta") ? "transparent" : undefined }}
                      >
                        {form.watch("fotoTarjeta")
                          ? <img src={form.watch("fotoTarjeta")!} alt="carta" className="w-full h-full object-contain" style={{ background: "repeating-conic-gradient(#aaa 0% 25%, #fff 0% 50%) 0 0 / 8px 8px" }} />
                          : <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground" /></div>
                        }
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Button type="button" variant="outline" size="sm" onClick={() => fotoTarjetaFileRef.current?.click()} disabled={removingBgTarjeta}>
                          {removingBgTarjeta ? "Eliminando fondo..." : "Cambiar foto de carta"}
                        </Button>
                        <p className="text-[10px] text-muted-foreground">El fondo se eliminará automáticamente</p>
                        {form.watch("fotoTarjeta") && !removingBgTarjeta && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue("fotoTarjeta", null)} className="text-xs text-muted-foreground h-7">
                            <X className="w-3 h-3 mr-1" />Quitar
                          </Button>
                        )}
                      </div>
                      <input ref={fotoTarjetaFileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoTarjetaChange} />
                    </div>
                  </div>

                  <FormField control={form.control} name="nombre" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} className="font-bold" data-testid="input-edit-nombre" />
                      </FormControl>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="alias" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Alias en la carta</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Nombre corto para la carta FIFA" className="font-bold" data-testid="input-edit-alias" />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground">Si no se rellena, se usará el apellido</p>
                    </FormItem>
                  )} />

                  {/* Posiciones multi-select */}
                  <FormField control={form.control} name="posiciones" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Posición</FormLabel>
                      <div className="grid grid-cols-2 gap-1.5">
                        {POSICIONES.map((pos) => {
                          const checked = (field.value ?? []).includes(pos);
                          return (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => {
                                if (checked) {
                                  field.onChange((field.value ?? []).filter((v: string) => v !== pos));
                                } else {
                                  field.onChange([...(field.value ?? []), pos]);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-xs transition-colors text-left ${
                                checked
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background text-foreground"
                              }`}
                              data-testid={`edit-checkbox-posicion-${pos}`}
                            >
                              {checked ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" /> : <Square className="w-3.5 h-3.5 flex-shrink-0" />}
                              {pos}
                            </button>
                          );
                        })}
                      </div>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="pierna" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Pierna</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs" data-testid="select-edit-pierna">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PIERNAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="pais" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">País / Comunidad</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === "__none__" ? null : v)} value={field.value ?? "__none__"}>
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs" data-testid="select-edit-pais">
                            <SelectValue placeholder="Sin especificar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="max-h-64 overflow-y-auto">
                          <SelectItem value="__none__">Sin especificar</SelectItem>
                          {PAISES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />

                  {teams && teams.length > 0 && (
                    <FormField control={form.control} name="teamId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Equipo <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === "__none__" ? null : Number(v))}
                          value={field.value != null ? String(field.value) : "__none__"}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs" data-testid="select-edit-equipo">
                              <SelectValue placeholder="Sin equipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent position="popper">
                            <SelectItem value="__none__">Sin equipo</SelectItem>
                            {teams.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="edad" render={() => {
                      const anoVal = form.watch("ano");
                      const display = calcEdadDisplay(anoVal ? Number(anoVal) : null);
                      return (
                        <FormItem>
                          <FormLabel className="text-xs">Edad</FormLabel>
                          <div
                            className="h-8 text-xs flex items-center px-3 rounded-md border border-input bg-muted text-muted-foreground select-none"
                            data-testid="input-edit-edad"
                          >
                            {display || <span className="opacity-50">Pon el año</span>}
                          </div>
                        </FormItem>
                      );
                    }} />
                    <FormField control={form.control} name="ano" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Año nacimiento</FormLabel>
                        <FormControl>
                          <Input
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? null : e.target.value;
                              field.onChange(val);
                              const yr = parseInt(e.target.value);
                              if (!isNaN(yr) && yr >= 1960 && yr <= 2030) {
                                form.setValue("edad", new Date().getFullYear() - yr);
                              }
                            }}
                            type="number" className="h-8 text-xs"
                            placeholder="Ej. 2005"
                            data-testid="input-edit-ano"
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="altura" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Altura (cm)</FormLabel>
                        <FormControl>
                          <Input
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                            type="number" className="h-8 text-xs"
                            data-testid="input-edit-altura"
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="peso" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Peso (kg)</FormLabel>
                        <FormControl>
                          <Input
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                            type="number" className="h-8 text-xs"
                            data-testid="input-edit-peso"
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>
                </div>
              </Form>
            ) : (
              <>
                <h1 className="text-xl font-bold" data-testid="text-nombre">{player.nombre}</h1>
                {getCategoria(player.ano) && !posArr.includes("Entrenador") && (
                  <div className="mt-1 mb-1">
                    <span className="inline-block text-xs font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded px-2 py-0.5" data-testid="text-categoria">
                      {getCategoria(player.ano)}
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mt-1 mb-1.5">
                  {posArr.map((p) => <PosicionTag key={p} label={p} />)}
                </div>
                <p className="text-muted-foreground text-sm" data-testid="text-posicion-pierna">
                  {player.pierna}{player.pais ? ` · ${player.pais}` : ""}
                </p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                  <span data-testid="text-edad">{player.ano ? `${calcEdadDisplay(player.ano)} años` : `${player.edad} años`}</span>
                  {player.ano && <span data-testid="text-ano">Nacido en {player.ano}</span>}
                  {player.altura && <span data-testid="text-altura">{player.altura} cm</span>}
                  {player.peso && <span data-testid="text-peso">{player.peso} kg</span>}
                </div>
                {!posArr.includes("Entrenador") && <div className="mt-2">
                  <span className="text-primary font-mono font-bold text-lg" data-testid="text-overall">{overallScore}</span>
                  <span className="text-muted-foreground text-xs font-mono"> / 10 global</span>
                </div>}
              </>
            )}
          </div>
        </div>

        {/* Ratings — hidden for Entrenador */}
        {(editing ? !(form.watch("posiciones") ?? []).includes("Entrenador") : !posArr.includes("Entrenador")) && <div className="bg-card border border-border rounded-lg p-4" data-testid="section-ratings">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Valoraciones</h2>
          {editing ? (
            <Form {...form}>
              <div className="space-y-4">
                {(["velocidad", "tecnica", "fisico", "actitud"] as const).map((fieldName) => (
                  <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel className="capitalize text-xs">{fieldName}</FormLabel>
                        <span className="text-primary font-mono text-sm font-bold">{field.value}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1} max={10} step={1}
                          value={[field.value]}
                          onValueChange={([v]) => field.onChange(v)}
                          data-testid={`slider-edit-${fieldName}`}
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                ))}
                {(form.watch("posiciones") ?? []).includes("Portero") && (
                  <FormField control={form.control} name="reflejo" render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel className="text-xs flex items-center gap-1.5">
                          reflejos
                          <span className="text-[10px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded px-1 py-0.5 leading-none">Portero</span>
                        </FormLabel>
                        <span className="text-primary font-mono text-sm font-bold">{field.value ?? 5}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1} max={10} step={1}
                          value={[field.value ?? 5]}
                          onValueChange={([v]) => field.onChange(v)}
                          data-testid="slider-edit-reflejo"
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                )}
              </div>
            </Form>
          ) : (
            <div className="flex justify-around flex-wrap gap-3">
              <ScoreGauge value={player.velocidad} label="VEL" />
              <ScoreGauge value={player.tecnica} label="TEC" />
              <ScoreGauge value={player.fisico} label="FIS" />
              <ScoreGauge value={player.actitud} label="ACT" />
              {posArr.includes("Portero") && player.reflejo != null && (
                <ScoreGauge value={player.reflejo} label="REF" />
              )}
            </div>
          )}
        </div>}

        {/* Observations */}
        <div className="bg-card border border-border rounded-lg p-4" data-testid="section-observaciones">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Observaciones</h2>
          {editing ? (
            <Form {...form}>
              <FormField control={form.control} name="observaciones" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      className="resize-none h-28"
                      data-testid="textarea-edit-observaciones"
                    />
                  </FormControl>
                </FormItem>
              )} />
            </Form>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-observaciones">
              {player.observaciones || "Sin observaciones registradas."}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-right font-mono" data-testid="text-created-at">
          Registrado: {new Date(player.createdAt).toLocaleDateString("es-ES")}
        </p>

        {/* FIFA Card preview */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Vista previa de ficha</h2>
          <div className="flex justify-center">
            <FifaCard ref={cardRef} player={player} />
          </div>
        </div>
      </main>
    </div>
  );
}
