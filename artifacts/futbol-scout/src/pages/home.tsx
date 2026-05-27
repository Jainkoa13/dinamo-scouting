import { useState, useRef } from "react";
import { useLocation } from "wouter";
import logoPng from "../assets/logo_dinamo.png";
import ExcelJS from "exceljs";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useListPlayers,
  useCreatePlayer,
  useDeletePlayer,
  useGetPlayerStats,
  useListTeams,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  getListPlayersQueryKey,
  getGetPlayerStatsQueryKey,
  getListTeamsQueryKey,
} from "@workspace/api-client-react";
import { FLAG_EMOJI } from "@/components/fifa-card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ChevronRight, User, Plus, X, GitCompareArrows, CheckSquare, Square, Search, FileSpreadsheet, LogOut, Settings, Users, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const POSICIONES = ["Portero", "Cierre", "Ala", "Pivot", "Entrenador"];
const PIERNAS = ["Derecha", "Izquierda", "Ambidiestro"];

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

const PAISES = [
  "Euskal Herria", "Galiza", "Catalunya", "País Valenciano",
  "Andalucía", "Aragón", "Asturias", "Cantabria", "Castilla y León",
  "Castilla-La Mancha", "Extremadura", "Islas Baleares", "Islas Canarias",
  "La Rioja", "Madrid", "Murcia", "Navarra",
  "España", "Portugal", "Francia", "Argentina", "Brasil", "Uruguay",
  "Colombia", "Venezuela", "México", "Alemania", "Italia", "Reino Unido",
  "Marruecos", "Senegal", "Nigeria", "Bélgica", "Países Bajos", "Otro",
];

const playerSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  posiciones: z.array(z.string()).min(1, "Selecciona al menos una posición"),
  pierna: z.string().min(1, "Pierna requerida"),
  pais: z.string().nullable().optional(),
  edad: z.coerce.number().int().min(1).max(99),
  ano: z.union([z.coerce.number().int().min(1960).max(2030), z.literal("")]).nullable().optional(),
  altura: z.union([z.coerce.number().min(100).max(230), z.literal("")]).nullable().optional(),
  peso: z.union([z.coerce.number().min(20).max(200), z.literal("")]).nullable().optional(),
  velocidad: z.number().min(1).max(10),
  tecnica: z.number().min(1).max(10),
  fisico: z.number().min(1).max(10),
  actitud: z.number().min(1).max(10),
  reflejo: z.number().min(1).max(10).nullable().optional(),
  observaciones: z.string().nullable().optional(),
  foto: z.string().nullable().optional(),
  fotoTarjeta: z.string().nullable().optional(),
  alias: z.string().nullable().optional(),
  teamId: z.number().int().positive().nullable().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

function RatingBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-muted-foreground w-8">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(value / 10) * 100}%` }} />
      </div>
      <span className="text-xs font-mono text-primary w-4 text-right">{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded p-3 text-center">
      <div className="text-xl font-bold font-mono text-primary">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function PosicionTag({ label }: { label: string }) {
  return (
    <span className="inline-block text-[10px] font-mono bg-primary/15 text-primary border border-primary/30 rounded px-1.5 py-0.5 leading-none">
      {label}
    </span>
  );
}

function CategoriaTag({ label }: { label: string }) {
  return (
    <span className="inline-block text-[10px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded px-1.5 py-0.5 leading-none">
      {label}
    </span>
  );
}

function EquipoTag({ label }: { label: string }) {
  return (
    <span className="inline-block text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded px-1.5 py-0.5 leading-none">
      {label}
    </span>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [filterPosicion, setFilterPosicion] = useState("all");
  const [filterPierna, setFilterPierna] = useState("all");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [filterEquipo, setFilterEquipo] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelectedIds, setExportSelectedIds] = useState<number[]>([]);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [editingTeam, setEditingTeam] = useState<{ id: number; nombre: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: players, isLoading: playersLoading } = useListPlayers();
  const { data: stats } = useGetPlayerStats();
  const { data: teams } = useListTeams();
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  function getTeamName(teamId: number | null | undefined): string | null {
    if (!teamId || !teams) return null;
    return teams.find((t) => t.id === teamId)?.nombre ?? null;
  }

  function invalidateTeams() {
    queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function openExportModal() {
    if (!filteredPlayers || filteredPlayers.length === 0) {
      toast({ title: "No hay jugadores para exportar" });
      return;
    }
    setExportSelectedIds(filteredPlayers.map((p) => p.id));
    setShowExportModal(true);
  }

  function toggleExportPlayer(id: number) {
    setExportSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleCreateTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    await createTeam.mutateAsync({ data: { nombre: name } }, {
      onSuccess: () => {
        invalidateTeams();
        setNewTeamName("");
        toast({ title: `Equipo "${name}" creado` });
      },
      onError: () => toast({ title: "Error al crear el equipo", variant: "destructive" }),
    });
  }

  async function handleUpdateTeam() {
    if (!editingTeam) return;
    const name = editingTeam.nombre.trim();
    if (!name) return;
    await updateTeam.mutateAsync({ id: editingTeam.id, data: { nombre: name } }, {
      onSuccess: () => {
        invalidateTeams();
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey() });
        setEditingTeam(null);
        toast({ title: "Equipo actualizado" });
      },
      onError: () => toast({ title: "Error al actualizar el equipo", variant: "destructive" }),
    });
  }

  async function handleDeleteTeam(id: number, nombre: string) {
    await deleteTeam.mutateAsync({ id }, {
      onSuccess: () => {
        invalidateTeams();
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey() });
        if (filterEquipo === String(id)) setFilterEquipo("all");
        toast({ title: `Equipo "${nombre}" eliminado` });
      },
      onError: () => toast({ title: "Error al eliminar el equipo", variant: "destructive" }),
    });
  }

  async function handleExportExcel() {
    if (!players) return;
    const toExport = filteredPlayers.filter((p) => exportSelectedIds.includes(p.id));
    if (toExport.length === 0) {
      toast({ title: "Selecciona al menos un jugador" });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Jugadores");

    ws.columns = [
      { header: "Foto", key: "foto", width: 13 },
      { header: "Nombre", key: "nombre", width: 22 },
      { header: "Equipo", key: "equipo", width: 18 },
      { header: "Categoría", key: "categoria", width: 14 },
      { header: "Nacionalidad", key: "pais", width: 22 },
      { header: "Posición", key: "posicion", width: 18 },
      { header: "Pierna", key: "pierna", width: 14 },
      { header: "Edad", key: "edad", width: 6 },
      { header: "Año nac.", key: "ano", width: 10 },
      { header: "Altura (cm)", key: "altura", width: 11 },
      { header: "Peso (kg)", key: "peso", width: 10 },
      { header: "Velocidad", key: "velocidad", width: 10 },
      { header: "Técnica", key: "tecnica", width: 10 },
      { header: "Físico", key: "fisico", width: 8 },
      { header: "Actitud", key: "actitud", width: 10 },
      { header: "Reflejos", key: "reflejos", width: 10 },
      { header: "Media", key: "media", width: 8 },
      { header: "Observaciones", key: "obs", width: 35 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.commit();

    for (let i = 0; i < toExport.length; i++) {
      const p = toExport[i];
      const rowIdx = i + 2;
      const row = ws.getRow(rowIdx);
      row.height = 72;

      row.getCell("nombre").value = p.nombre;
      row.getCell("equipo").value = getTeamName(p.teamId) ?? "";
      row.getCell("categoria").value = getCategoria(p.ano);
      row.getCell("posicion").value = p.posicion.split(",").join(" / ");
      row.getCell("pierna").value = p.pierna;
      row.getCell("edad").value = p.edad;
      row.getCell("ano").value = p.ano ?? "";
      row.getCell("altura").value = p.altura ?? "";
      row.getCell("peso").value = p.peso ?? "";
      const esEntrenador = p.posicion.split(",").includes("Entrenador");
      row.getCell("velocidad").value = esEntrenador ? "" : p.velocidad;
      row.getCell("tecnica").value = esEntrenador ? "" : p.tecnica;
      row.getCell("fisico").value = esEntrenador ? "" : p.fisico;
      row.getCell("actitud").value = esEntrenador ? "" : p.actitud;
      const flagEmoji = p.pais ? (FLAG_EMOJI[p.pais] ?? "") : "";
      row.getCell("pais").value = p.pais
        ? flagEmoji ? `${flagEmoji} ${p.pais}` : p.pais
        : "";
      row.getCell("reflejos").value = !esEntrenador && p.posicion.split(",").includes("Portero") ? (p.reflejo ?? "") : "";
      row.getCell("media").value = esEntrenador ? "" :
        Math.round(((p.velocidad + p.tecnica + p.fisico + p.actitud) / 4) * 10) / 10;
      row.getCell("obs").value = p.observaciones ?? "";

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: "middle" };
      });

      if (p.foto) {
        const base64 = p.foto.split(",")[1];
        const ext = p.foto.startsWith("data:image/png") ? "png" : "jpeg";
        const imageId = workbook.addImage({ base64, extension: ext });
        ws.addImage(imageId, {
          tl: { col: 0, row: rowIdx - 1 } as never,
          ext: { width: 72, height: 72 },
        });
      }

      row.commit();
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dinamo-ibaiondo-scouting.xlsx";
    a.click();
    URL.revokeObjectURL(url);

    setShowExportModal(false);
    toast({ title: `Excel descargado con ${toExport.length} jugador${toExport.length !== 1 ? "es" : ""}` });
  }

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      nombre: "",
      posiciones: [],
      pierna: "Derecha",
      edad: 18,
      ano: null,
      altura: null,
      peso: null,
      velocidad: 5,
      tecnica: 5,
      fisico: 5,
      actitud: 5,
      reflejo: null,
      pais: null,
      observaciones: "",
      foto: null,
      fotoTarjeta: null,
      alias: null,
      teamId: null,
    },
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      form.setValue("foto", dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setPhotoPreview(null);
    form.setValue("foto", null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(values: PlayerFormValues) {
    const anoVal = values.ano === "" || values.ano == null ? null : Number(values.ano);
    const alturaVal = values.altura === "" || values.altura == null ? null : Number(values.altura);
    const pesoVal = values.peso === "" || values.peso == null ? null : Number(values.peso);
    await createPlayer.mutateAsync({
      data: {
        nombre: values.nombre,
        posicion: values.posiciones.join(","),
        pierna: values.pierna,
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
        foto: values.foto ?? null,
        fotoTarjeta: null,
        alias: values.alias || null,
        teamId: values.teamId ?? null,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPlayerStatsQueryKey() });
        form.reset();
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowForm(false);
        toast({ title: "Jugador guardado" });
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        toast({ title: "Error al guardar", description: msg, variant: "destructive" });
      },
    });
  }

  function handleDelete(id: number, nombre: string) {
    deletePlayer.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlayersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPlayerStatsQueryKey() });
        setSelectedIds((prev) => prev.filter((x) => x !== id));
        toast({ title: `${nombre} eliminado` });
      },
    });
  }

  const avgScore = stats
    ? Math.round(((stats.avgVelocidad + stats.avgTecnica + stats.avgFisico + stats.avgActitud) / 4) * 10) / 10
    : 0;

  const anyFilterActive = search || filterPosicion !== "all" || filterPierna !== "all" || filterCategoria !== "all" || filterEquipo !== "all";

  const filteredPlayers = (players ?? []).filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    const posArr = p.posicion.split(",");
    const matchesPosicion = filterPosicion === "all" || posArr.includes(filterPosicion);
    const matchesPierna = filterPierna === "all" || p.pierna === filterPierna;
    const matchesCategoria = filterCategoria === "all" || getCategoria(p.ano) === filterCategoria;
    const matchesEquipo = filterEquipo === "all" || String(p.teamId) === filterEquipo;
    return matchesSearch && matchesPosicion && matchesPierna && matchesCategoria && matchesEquipo;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 sticky top-0 bg-background/95 backdrop-blur z-20 space-y-2">
        {/* Fila 1: logo + título | iconos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoPng} alt="Dinamo Ibaiondo" className="w-9 h-9 object-contain shrink-0" />
            <div>
              <h1 className="text-sm font-bold tracking-tight font-sans leading-tight">DINAMO IBAIONDO SCOUTING</h1>
              <p className="text-xs text-muted-foreground font-mono">Sistema de evaluación</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTeamsModal(true)}
              title="Gestionar equipos"
              data-testid="button-teams"
            >
              <Users className="w-3.5 h-3.5" />
            </Button>
            {user?.role === "admin" && (
              <Button size="sm" variant="ghost" onClick={() => setLocation("/admin")} title="Gestión de usuarios">
                <Settings className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={logout} title="Cerrar sesión">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        {/* Fila 2: botones de acción */}
        <div className="flex items-center gap-2 justify-end">
          {selectedIds.length >= 2 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => setLocation(`/compare?ids=${selectedIds.join(",")}`)}
              data-testid="button-compare"
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              Comparar ({selectedIds.length})
            </Button>
          )}
          <Button
            data-testid="button-toggle-form"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
            className="gap-1.5"
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? "Cancelar" : "Nuevo jugador"}
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-4 gap-2" data-testid="stats-panel">
            <StatCard label="Jugadores" value={stats.total} />
            <StatCard label="Vel. media" value={stats.avgVelocidad.toFixed(1)} />
            <StatCard label="Tec. media" value={stats.avgTecnica.toFixed(1)} />
            <StatCard label="Prom. global" value={avgScore} />
          </div>
        )}

        {/* Registration form */}
        {showForm && (
          <section className="bg-card border border-border rounded-lg p-4 space-y-4" data-testid="section-form">
            <h2 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">Nuevo jugador</h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Photo upload */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded border border-border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-photo-upload"
                  >
                    {photoPreview
                      ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                      : <User className="w-6 h-6 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-select-photo">
                      Seleccionar foto
                    </Button>
                    {photoPreview && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearPhoto} data-testid="button-clear-photo">
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} data-testid="input-photo" />
                </div>

                {/* Nombre */}
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre completo" data-testid="input-nombre" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Alias */}
                <FormField control={form.control} name="alias" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias en la carta <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="Nombre corto para la carta FIFA" data-testid="input-alias" />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Si no se rellena, se usará el apellido</p>
                  </FormItem>
                )} />

                {/* Equipo */}
                {teams && teams.length > 0 && (
                  <FormField control={form.control} name="teamId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipo <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === "__none__" ? null : Number(v))}
                        value={field.value != null ? String(field.value) : "__none__"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-team">
                            <SelectValue placeholder="Sin equipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Sin equipo</SelectItem>
                          {teams.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                )}

                {/* Posicion — multi-select checkboxes */}
                <FormField control={form.control} name="posiciones" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posición <span className="text-muted-foreground font-normal">(puedes elegir varias)</span></FormLabel>
                    <div className="grid grid-cols-2 gap-2">
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
                            className={`flex items-center gap-2 px-3 py-2 rounded border text-sm transition-colors text-left ${
                              checked
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-foreground hover:border-primary/50"
                            }`}
                            data-testid={`checkbox-posicion-${pos}`}
                          >
                            {checked ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0" />}
                            {pos}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Pierna */}
                <FormField control={form.control} name="pierna" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pierna dominante</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-pierna">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PIERNAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* País de origen */}
                <FormField control={form.control} name="pais" render={({ field }) => (
                  <FormItem>
                    <FormLabel>País / Comunidad de origen</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "__none__" ? null : v)} value={field.value ?? "__none__"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-pais">
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

                {/* Edad + Año */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="edad" render={() => {
                    const anoVal = form.watch("ano");
                    const display = calcEdadDisplay(anoVal ? Number(anoVal) : null);
                    return (
                      <FormItem>
                        <FormLabel>Edad</FormLabel>
                        <div
                          className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground select-none"
                          data-testid="input-edad"
                        >
                          {display || <span className="opacity-50">Se calcula con el año</span>}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }} />

                  <FormField control={form.control} name="ano" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Año de nacimiento</FormLabel>
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
                          type="number"
                          min={1960}
                          max={2030}
                          placeholder="Ej. 2005"
                          data-testid="input-ano"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Altura + Peso */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="altura" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                          type="number" min={100} max={230}
                          placeholder="Opcional"
                          data-testid="input-altura"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="peso" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                          type="number" min={20} max={200}
                          placeholder="Opcional"
                          data-testid="input-peso"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Ratings — hidden for Entrenador */}
                {(() => {
                  const watchedPosiciones = form.watch("posiciones") ?? [];
                  const esEntrenador = watchedPosiciones.includes("Entrenador");
                  if (esEntrenador) return null;
                  const esPortero = watchedPosiciones.includes("Portero");
                  const ratingFields = ["velocidad", "tecnica", "fisico", "actitud"] as const;
                  return (
                    <div className="space-y-3 bg-muted/40 rounded p-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valoraciones</h3>
                      {ratingFields.map((fieldName) => (
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
                                data-testid={`slider-${fieldName}`}
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                      ))}
                      {esPortero && (
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
                                data-testid="slider-reflejo"
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                      )}
                    </div>
                  );
                })()}

                {/* Observations */}
                <FormField control={form.control} name="observaciones" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Notas del scouting..."
                        className="resize-none h-20"
                        data-testid="textarea-observaciones"
                      />
                    </FormControl>
                  </FormItem>
                )} />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createPlayer.isPending}
                  data-testid="button-submit"
                >
                  {createPlayer.isPending ? "Guardando..." : "Guardar jugador"}
                </Button>
              </form>
            </Form>
          </section>
        )}

        {/* Player list */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Jugadores registrados {players && `(${filteredPlayers.length}${filteredPlayers.length !== players.length ? `/${players.length}` : ""})`}
            </h2>
            <div className="flex items-center gap-2">
              {anyFilterActive && (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  onClick={() => { setSearch(""); setFilterPosicion("all"); setFilterPierna("all"); setFilterCategoria("all"); setFilterEquipo("all"); }}
                  data-testid="button-clear-filters"
                >
                  Limpiar
                </button>
              )}
              {players && players.length > 0 && (
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={openExportModal}
                  data-testid="button-export"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Exportar Excel
                </button>
              )}
            </div>
          </div>

          {/* Search & filters */}
          {!playersLoading && players && players.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  data-testid="input-search"
                />
                {search && (
                  <button
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearch("")}
                    data-testid="button-clear-search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={filterPosicion}
                  onChange={(e) => setFilterPosicion(e.target.value)}
                  className="flex-1 text-xs bg-card border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  data-testid="select-filter-posicion"
                >
                  <option value="all">Todas las posiciones</option>
                  {POSICIONES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  value={filterPierna}
                  onChange={(e) => setFilterPierna(e.target.value)}
                  className="flex-1 text-xs bg-card border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  data-testid="select-filter-pierna"
                >
                  <option value="all">Todas las piernas</option>
                  {PIERNAS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="flex-1 text-xs bg-card border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  data-testid="select-filter-categoria"
                >
                  <option value="all">Todas las categorías</option>
                  {["Pre-Benjamín", "Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Sénior"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {teams && teams.length > 0 && (
                  <select
                    value={filterEquipo}
                    onChange={(e) => setFilterEquipo(e.target.value)}
                    className="flex-1 text-xs bg-card border border-border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    data-testid="select-filter-equipo"
                  >
                    <option value="all">Todos los equipos</option>
                    {teams.map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
                  </select>
                )}
              </div>
            </div>
          )}

          {playersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded" />)}
            </div>
          ) : players && players.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg" data-testid="empty-state">
              <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Sin jugadores registrados</p>
              <p className="text-muted-foreground text-xs mt-1">Agrega tu primer jugador con el botón de arriba</p>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-lg" data-testid="empty-state-filtered">
              <Search className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Sin resultados</p>
              <p className="text-muted-foreground text-xs mt-1">Prueba cambiando los filtros</p>
            </div>
          ) : (
            <div className="space-y-2" data-testid="player-list">
              {filteredPlayers.map((player) => {
                const isSelected = selectedIds.includes(player.id);
                const posArr = player.posicion.split(",");
                const categoria = getCategoria(player.ano);
                const equipo = getTeamName(player.teamId);
                return (
                  <div
                    key={player.id}
                    className={`bg-card border rounded-lg p-3 flex gap-3 items-center hover:border-primary/40 transition-colors ${isSelected ? "border-primary" : "border-border"}`}
                    data-testid={`card-player-${player.id}`}
                  >
                    {/* Select checkbox */}
                    <button
                      className={`flex-shrink-0 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                      onClick={() => toggleSelect(player.id)}
                      data-testid={`button-select-player-${player.id}`}
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>

                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden cursor-pointer"
                      onClick={() => setLocation(`/player/${player.id}`)}
                      data-testid={`link-player-${player.id}`}
                    >
                      {player.foto
                        ? <img src={player.foto} alt={player.nombre} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-muted-foreground" /></div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setLocation(`/player/${player.id}`)}>
                      <div className="font-bold text-sm truncate">{player.nombre}</div>
                      <div className="flex flex-wrap gap-1 mb-1 mt-0.5 items-center">
                        {equipo && <EquipoTag label={equipo} />}
                        {categoria && !posArr.includes("Entrenador") && <CategoriaTag label={categoria} />}
                        {posArr.map((p) => <PosicionTag key={p} label={p} />)}
                        <span className="text-xs text-muted-foreground">{player.pierna}{player.ano ? ` · ${calcEdadDisplay(player.ano)} años` : ` · ${player.edad} años`}</span>
                      </div>
                      {!posArr.includes("Entrenador") && <div className="space-y-0.5">
                        <RatingBar value={player.velocidad} label="VEL" />
                        <RatingBar value={player.tecnica} label="TEC" />
                        <RatingBar value={player.fisico} label="FIS" />
                        <RatingBar value={player.actitud} label="ACT" />
                      </div>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setLocation(`/player/${player.id}`)}
                        data-testid={`button-view-player-${player.id}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleDelete(player.id, player.nombre)}
                        data-testid={`button-delete-player-${player.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Export modal */}
      {showExportModal && filteredPlayers && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0"
          onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false); }}
          data-testid="modal-export"
        >
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h2 className="font-bold text-sm">Exportar a Excel</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {exportSelectedIds.length} de {filteredPlayers.length} jugadores seleccionados
                </p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowExportModal(false)}
                data-testid="button-close-export-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Select all / none */}
            <div className="flex gap-2 px-4 py-2 border-b border-border bg-muted/20">
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setExportSelectedIds(filteredPlayers.map((p) => p.id))}
              >
                Todos
              </button>
              <span className="text-muted-foreground text-xs">·</span>
              <button
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                onClick={() => setExportSelectedIds([])}
              >
                Ninguno
              </button>
            </div>

            {/* Player list */}
            <div className="overflow-y-auto max-h-72">
              {filteredPlayers.map((p) => {
                const checked = exportSelectedIds.includes(p.id);
                const categoria = getCategoria(p.ano);
                const equipo = getTeamName(p.teamId);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleExportPlayer(p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-border/50 text-left transition-colors last:border-0 ${checked ? "bg-primary/5" : "hover:bg-muted/30"}`}
                    data-testid={`export-player-${p.id}`}
                  >
                    {checked
                      ? <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                      : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.nombre}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {equipo && <span className="text-[10px] text-emerald-400">{equipo}</span>}
                        {equipo && <span className="text-muted-foreground text-[10px]">·</span>}
                        {categoria && !p.posicion.split(",").includes("Entrenador") && <span className="text-[10px] text-blue-400">{categoria}</span>}
                        {categoria && !p.posicion.split(",").includes("Entrenador") && <span className="text-muted-foreground text-[10px]">·</span>}
                        <span className="text-[10px] text-muted-foreground">{p.posicion.split(",").join(" / ")}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-primary">
                      {Math.round(((p.velocidad + p.tecnica + p.fisico + p.actitud) / 4) * 10) / 10}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-3 border-t border-border">
              <Button
                className="w-full gap-2"
                onClick={handleExportExcel}
                disabled={exportSelectedIds.length === 0}
                data-testid="button-download-excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Descargar Excel ({exportSelectedIds.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Teams modal */}
      {showTeamsModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTeamsModal(false); }}
          data-testid="modal-teams"
        >
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h2 className="font-bold text-sm">Gestionar equipos</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Crea equipos y asigna jugadores a ellos</p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setShowTeamsModal(false); setEditingTeam(null); setNewTeamName(""); }}
                data-testid="button-close-teams-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Create new team */}
            <div className="px-4 py-3 border-b border-border bg-muted/10">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Nuevo equipo</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: Cadete A, Juvenil..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateTeam(); } }}
                  className="flex-1 text-sm bg-background border border-border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                  data-testid="input-new-team-name"
                />
                <Button
                  size="sm"
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim() || createTeam.isPending}
                  className="gap-1"
                  data-testid="button-create-team"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear
                </Button>
              </div>
            </div>

            {/* Teams list */}
            <div className="overflow-y-auto max-h-72">
              {!teams || teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Users className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  Sin equipos creados
                </div>
              ) : (
                teams.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0"
                    data-testid={`team-row-${t.id}`}
                  >
                    {editingTeam?.id === t.id ? (
                      <>
                        <input
                          type="text"
                          value={editingTeam.nombre}
                          onChange={(e) => setEditingTeam({ ...editingTeam, nombre: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUpdateTeam(); } if (e.key === "Escape") setEditingTeam(null); }}
                          className="flex-1 text-sm bg-background border border-primary rounded px-2 py-1 focus:outline-none"
                          autoFocus
                          data-testid={`input-edit-team-${t.id}`}
                        />
                        <button
                          onClick={handleUpdateTeam}
                          className="text-xs text-primary hover:underline font-medium"
                          data-testid={`button-save-team-${t.id}`}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingTeam(null)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium">{t.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {(players ?? []).filter((p) => p.teamId === t.id).length} jugadores
                        </span>
                        <button
                          onClick={() => setEditingTeam({ id: t.id, nombre: t.nombre })}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          data-testid={`button-edit-team-${t.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(t.id, t.nombre)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          data-testid={`button-delete-team-${t.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
