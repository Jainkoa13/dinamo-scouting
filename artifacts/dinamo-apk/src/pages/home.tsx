import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, X, ChevronUp, ChevronDown, BarChart3,
  FileSpreadsheet, Users, Search, Filter, CheckSquare, Square, Edit2,
} from "lucide-react";
import ExcelJS from "exceljs";
import { usePlayers, useTeams, useCreatePlayer, useDeletePlayer, useCreateTeam, useUpdateTeam, useDeleteTeam, PLAYERS_KEY } from "@/hooks/use-local-data";
import type { LocalPlayer } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/toaster";
import logoPng from "@/assets/logo_dinamo.png";

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
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(value / 10) * 100}%` }}/>
      </div>
      <span className="text-xs font-mono text-primary w-4 text-right">{value}</span>
    </div>
  );
}

function PosicionTag({ label }: { label: string }) {
  return <span className="inline-block text-[10px] font-mono bg-primary/15 text-primary border border-primary/30 rounded px-1.5 py-0.5 leading-none">{label}</span>;
}

function CategoriaTag({ label }: { label: string }) {
  return <span className="inline-block text-[10px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded px-1.5 py-0.5 leading-none">{label}</span>;
}

function EquipoTag({ label }: { label: string }) {
  return <span className="inline-block text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded px-1.5 py-0.5 leading-none">{label}</span>;
}

export default function Home() {
  const [, setLocation] = useLocation();
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
  const fileInputCardRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: players = [], isLoading: playersLoading } = usePlayers();
  const { data: teams = [] } = useTeams();
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      nombre: "", posiciones: [], pierna: "", pais: null,
      edad: 0, velocidad: 5, tecnica: 5, fisico: 5, actitud: 5,
      reflejo: null, observaciones: "", foto: null, fotoTarjeta: null, alias: "", teamId: null,
    },
  });

  const watchPosiciones = watch("posiciones") ?? [];
  const watchVelocidad = watch("velocidad");
  const watchTecnica = watch("tecnica");
  const watchFisico = watch("fisico");
  const watchActitud = watch("actitud");
  const watchReflejo = watch("reflejo");
  const isPorteroSelected = watchPosiciones.includes("Portero");

  function getTeamName(teamId: number | null | undefined): string | null {
    if (!teamId || !teams) return null;
    return teams.find((t) => t.id === teamId)?.nombre ?? null;
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>, field: "foto" | "fotoTarjeta") {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setValue(field, b64);
    if (field === "foto") setPhotoPreview(b64);
  }

  async function onSubmit(values: PlayerFormValues) {
    const posicion = values.posiciones.join(",");
    await createPlayer.mutateAsync({
      nombre: values.nombre,
      posicion,
      pierna: values.pierna,
      pais: values.pais ?? null,
      edad: values.edad,
      ano: values.ano && values.ano !== "" ? Number(values.ano) : null,
      altura: values.altura && values.altura !== "" ? Number(values.altura) : null,
      peso: values.peso && values.peso !== "" ? Number(values.peso) : null,
      velocidad: values.velocidad,
      tecnica: values.tecnica,
      fisico: values.fisico,
      actitud: values.actitud,
      reflejo: values.reflejo ?? null,
      observaciones: values.observaciones ?? null,
      foto: values.foto ?? null,
      fotoTarjeta: values.fotoTarjeta ?? null,
      alias: values.alias ?? null,
      teamId: values.teamId ?? null,
    });
    toast({ title: "Jugador añadido" });
    reset();
    setPhotoPreview(null);
    setShowForm(false);
  }

  const CATEGORIAS = ["Pre-Benjamín", "Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Sénior"];

  const filteredPlayers = players.filter((p) => {
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase()) && !(p.alias ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPosicion !== "all" && !p.posicion.split(",").includes(filterPosicion)) return false;
    if (filterPierna !== "all" && p.pierna !== filterPierna) return false;
    if (filterCategoria !== "all" && getCategoria(p.ano) !== filterCategoria) return false;
    if (filterEquipo !== "all") {
      if (filterEquipo === "__sin__") { if (p.teamId) return false; }
      else { if (String(p.teamId) !== filterEquipo) return false; }
    }
    return true;
  });

  async function handleExportExcel() {
    const toExport = filteredPlayers.filter((p) => exportSelectedIds.includes(p.id));
    if (!toExport.length) { toast({ title: "Sin jugadores seleccionados", variant: "destructive" }); return; }
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Jugadores");
    ws.columns = [
      { header: "Nombre", key: "nombre", width: 22 },
      { header: "Alias", key: "alias", width: 14 },
      { header: "Posición", key: "posicion", width: 16 },
      { header: "Pierna", key: "pierna", width: 12 },
      { header: "Edad", key: "edad", width: 8 },
      { header: "Año nac.", key: "ano", width: 10 },
      { header: "Categoría", key: "categoria", width: 14 },
      { header: "Altura (cm)", key: "altura", width: 12 },
      { header: "Peso (kg)", key: "peso", width: 10 },
      { header: "Velocidad", key: "velocidad", width: 10 },
      { header: "Técnica", key: "tecnica", width: 10 },
      { header: "Físico", key: "fisico", width: 10 },
      { header: "Actitud", key: "actitud", width: 10 },
      { header: "Reflejos", key: "reflejo", width: 10 },
      { header: "País/Región", key: "pais", width: 16 },
      { header: "Equipo", key: "equipo", width: 18 },
      { header: "Observaciones", key: "observaciones", width: 36 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E1E2E" } };
    ws.getRow(1).font = { bold: true, color: { argb: "FFADFB30" } };
    toExport.forEach((p) => {
      ws.addRow({
        nombre: p.nombre, alias: p.alias ?? "", posicion: p.posicion, pierna: p.pierna,
        edad: p.edad, ano: p.ano ?? "", categoria: getCategoria(p.ano),
        altura: p.altura ?? "", peso: p.peso ?? "",
        velocidad: p.velocidad, tecnica: p.tecnica, fisico: p.fisico, actitud: p.actitud,
        reflejo: p.reflejo ?? "",
        pais: p.pais ?? "", equipo: getTeamName(p.teamId) ?? "",
        observaciones: p.observaciones ?? "",
      });
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "scouting_dinamo.xlsx"; a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    toast({ title: `${toExport.length} jugador(es) exportados` });
  }

  const totalStats = {
    total: players.length,
    porteros: players.filter(p => p.posicion.includes("Portero")).length,
    cierres: players.filter(p => p.posicion.includes("Cierre")).length,
    alas: players.filter(p => p.posicion.includes("Ala")).length,
    pivots: players.filter(p => p.posicion.includes("Pivot")).length,
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Toaster />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
          <div className="rounded-full bg-black overflow-hidden w-9 h-9 flex-shrink-0 ring-1 ring-primary/40">
            <img src={logoPng} alt="Dinamo Ibaiondo" className="w-full h-full object-contain"/>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm leading-tight">Dinamo Ibaiondo</h1>
            <p className="text-[10px] text-muted-foreground font-mono">SCOUTING</p>
          </div>
          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => setShowTeamsModal(true)}>
            <Users className="w-3.5 h-3.5"/>Equipos
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => { setExportSelectedIds(filteredPlayers.map(p=>p.id)); setShowExportModal(true); }}>
            <FileSpreadsheet className="w-3.5 h-3.5"/>Excel
          </Button>
          {selectedIds.length >= 2 && (
            <Button size="sm" variant="default" className="gap-1 text-xs" onClick={() => setLocation(`/compare?ids=${selectedIds.join(",")}`)}>
              <BarChart3 className="w-3.5 h-3.5"/>Comparar ({selectedIds.length})
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 py-3 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-1.5">
          {[
            { label: "Total", value: totalStats.total },
            { label: "POR", value: totalStats.porteros },
            { label: "CIE", value: totalStats.cierres },
            { label: "ALA", value: totalStats.alas },
            { label: "PIV", value: totalStats.pivots },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded p-2 text-center">
              <div className="text-lg font-bold font-mono text-primary">{s.value}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
            <Input placeholder="Buscar jugador..." className="pl-8 h-8 text-sm" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: "Posición", value: filterPosicion, setter: setFilterPosicion, opts: ["all", ...POSICIONES] },
              { label: "Pierna", value: filterPierna, setter: setFilterPierna, opts: ["all", ...PIERNAS] },
              { label: "Categoría", value: filterCategoria, setter: setFilterCategoria, opts: ["all", ...CATEGORIAS] },
            ].map(f => (
              <select key={f.label} className="flex-1 h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-0" value={f.value} onChange={e => f.setter(e.target.value)}>
                <option value="all">{f.label}: Todos</option>
                {f.opts.slice(1).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            <select className="flex-1 h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-0" value={filterEquipo} onChange={e => setFilterEquipo(e.target.value)}>
              <option value="all">Equipo: Todos</option>
              <option value="__sin__">Sin equipo</option>
              {teams.map(t => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
            </select>
          </div>
          <div className="text-xs text-muted-foreground font-mono">{filteredPlayers.length} jugador(es)</div>
        </div>

        {/* Add player button */}
        <Button className="w-full gap-2" onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "default"}>
          {showForm ? <><ChevronUp className="w-4 h-4"/>Cancelar</> : <><Plus className="w-4 h-4"/>Añadir jugador</>}
        </Button>

        {/* Add player form */}
        {showForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h2 className="font-bold text-sm text-primary font-mono uppercase tracking-wider">Nuevo jugador</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre *</Label>
                <Input {...register("nombre")} className="h-8 text-sm" placeholder="Nombre completo"/>
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Alias (nombre carta)</Label>
                <Input {...register("alias")} className="h-8 text-sm" placeholder="Apellido o alias"/>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Posición(es) *</Label>
              <div className="flex flex-wrap gap-2">
                {POSICIONES.map(pos => {
                  const checked = watchPosiciones.includes(pos);
                  return (
                    <button key={pos} type="button" onClick={() => {
                      const curr = watchPosiciones;
                      setValue("posiciones", checked ? curr.filter(p => p !== pos) : [...curr, pos]);
                    }} className={`text-xs px-3 py-1 rounded border transition-colors ${checked ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>{pos}</button>
                  );
                })}
              </div>
              {errors.posiciones && <p className="text-xs text-destructive">{errors.posiciones.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pierna *</Label>
                <select {...register("pierna")} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Seleccionar</option>
                  {PIERNAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.pierna && <p className="text-xs text-destructive">{errors.pierna.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Edad *</Label>
                <Input {...register("edad")} type="number" className="h-8 text-sm" placeholder="Edad"/>
                {errors.edad && <p className="text-xs text-destructive">{errors.edad.message as string}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Año nac.</Label>
                <Input {...register("ano")} type="number" className="h-8 text-sm" placeholder="2008"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Altura (cm)</Label>
                <Input {...register("altura")} type="number" className="h-8 text-sm" placeholder="175"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Peso (kg)</Label>
                <Input {...register("peso")} type="number" className="h-8 text-sm" placeholder="70"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">País/Región</Label>
                <select {...register("pais")} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Seleccionar</option>
                  {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Equipo</Label>
                <Controller name="teamId" control={control} render={({ field }) => (
                  <select className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">Sin equipo</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                )}/>
              </div>
            </div>

            {/* Ratings */}
            <div className="space-y-3">
              <Label className="text-xs font-mono uppercase tracking-wider text-primary">Valoraciones</Label>
              {[
                { field: "velocidad" as const, label: "Velocidad", val: watchVelocidad },
                { field: "tecnica" as const, label: "Técnica", val: watchTecnica },
                { field: "fisico" as const, label: "Físico", val: watchFisico },
                { field: "actitud" as const, label: "Actitud", val: watchActitud },
              ].map(({ field, label, val }) => (
                <div key={field} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{label}</Label>
                    <span className="text-xs font-mono text-primary font-bold">{val}</span>
                  </div>
                  <Slider min={1} max={10} step={1} value={[val]} onValueChange={([v]) => setValue(field, v)}/>
                </div>
              ))}
              {isPorteroSelected && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Reflejos (portero)</Label>
                    <span className="text-xs font-mono text-primary font-bold">{watchReflejo ?? 5}</span>
                  </div>
                  <Slider min={1} max={10} step={1} value={[watchReflejo ?? 5]} onValueChange={([v]) => setValue("reflejo", v)}/>
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Foto cara</Label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoChange(e, "foto")}/>
                <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => fileInputRef.current?.click()}>
                  {watch("foto") ? "✓ Foto cargada" : "Subir foto"}
                </Button>
                {photoPreview && <img src={photoPreview} className="w-16 h-16 rounded-full object-cover mx-auto border border-border mt-1"/>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Foto sin fondo (carta)</Label>
                <input ref={fileInputCardRef} type="file" accept="image/png,image/webp" className="hidden" onChange={e => handlePhotoChange(e, "fotoTarjeta")}/>
                <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => fileInputCardRef.current?.click()}>
                  {watch("fotoTarjeta") ? "✓ PNG cargado" : "Subir PNG"}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Observaciones</Label>
              <Textarea {...register("observaciones")} className="text-sm min-h-16" placeholder="Notas sobre el jugador..."/>
            </div>

            <Button type="submit" className="w-full" disabled={createPlayer.isPending}>
              {createPlayer.isPending ? "Guardando..." : "Guardar jugador"}
            </Button>
          </form>
        )}

        {/* Player list */}
        {playersLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-3">⚽</div>
            <p className="text-sm">{players.length === 0 ? "Sin jugadores. Añade el primero." : "Sin resultados con los filtros aplicados."}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPlayers.map((player) => {
              const overall = Math.round(((player.velocidad + player.tecnica + player.fisico + player.actitud) / 4) * 10) / 10;
              const cat = getCategoria(player.ano);
              const posArr = player.posicion.split(",").filter(Boolean);
              const isEntrenador = posArr.includes("Entrenador");
              const edadDisplay = calcEdadDisplay(player.ano);
              const teamName = getTeamName(player.teamId);
              const isSelected = selectedIds.includes(player.id);
              return (
                <div key={player.id} className={`bg-card border rounded-lg p-3 transition-all ${isSelected ? "border-primary/60 bg-primary/5" : "border-border hover:border-border/80"}`}>
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={() => toggleSelect(player.id)} className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-primary"/> : <Square className="w-4 h-4"/>}
                    </button>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 cursor-pointer" onClick={() => setLocation(`/player/${player.id}`)}>
                      {player.foto ? <img src={player.foto} alt={player.nombre} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold">{player.nombre[0]}</div>}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setLocation(`/player/${player.id}`)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{player.nombre}</span>
                        {player.alias && <span className="text-xs text-muted-foreground font-mono">"{player.alias}"</span>}
                        {!isEntrenador && <span className="text-xs font-mono text-primary font-bold">{overall}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {posArr.map(pos => <PosicionTag key={pos} label={pos}/>)}
                        <span className="text-[10px] text-muted-foreground">{player.pierna}</span>
                        {edadDisplay && <span className="text-[10px] font-mono text-muted-foreground">{edadDisplay}</span>}
                        {cat && !isEntrenador && <CategoriaTag label={cat}/>}
                        {teamName && <EquipoTag label={teamName}/>}
                      </div>
                      {!isEntrenador && (
                        <div className="mt-1.5 space-y-0.5">
                          <RatingBar value={player.velocidad} label="VEL"/>
                          <RatingBar value={player.tecnica} label="TEC"/>
                          <RatingBar value={player.fisico} label="FIS"/>
                          <RatingBar value={player.actitud} label="ACT"/>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setLocation(`/player/${player.id}`)}>
                        <Edit2 className="w-3.5 h-3.5"/>
                      </Button>
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={async () => {
                        if (!confirm(`¿Eliminar a ${player.nombre}?`)) return;
                        await deletePlayer.mutateAsync(player.id);
                        toast({ title: "Jugador eliminado" });
                      }}>
                        <Trash2 className="w-3.5 h-3.5"/>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-sm max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm">Exportar a Excel</h3>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setShowExportModal(false)}><X className="w-4 h-4"/></Button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setExportSelectedIds(filteredPlayers.map(p=>p.id))}>Todos ({filteredPlayers.length})</Button>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setExportSelectedIds([])}>Ninguno</Button>
              <span className="text-xs text-muted-foreground ml-auto">{exportSelectedIds.length} sel.</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {filteredPlayers.map(p => {
                const sel = exportSelectedIds.includes(p.id);
                return (
                  <button key={p.id} type="button" className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-muted text-left" onClick={() => setExportSelectedIds(prev => sel ? prev.filter(x=>x!==p.id) : [...prev, p.id])}>
                    {sel ? <CheckSquare className="w-4 h-4 text-primary flex-shrink-0"/> : <Square className="w-4 h-4 text-muted-foreground flex-shrink-0"/>}
                    <span className="text-sm">{p.nombre}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{p.posicion.split(",")[0]}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-border">
              <Button className="w-full gap-2" onClick={handleExportExcel} disabled={exportSelectedIds.length === 0}>
                <FileSpreadsheet className="w-4 h-4"/>Exportar {exportSelectedIds.length} jugador(es)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Teams Modal */}
      {showTeamsModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-sm max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm">Gestión de equipos</h3>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setShowTeamsModal(false)}><X className="w-4 h-4"/></Button>
            </div>
            <div className="p-4 border-b border-border flex gap-2">
              <Input className="h-8 text-sm flex-1" placeholder="Nombre del equipo" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} onKeyDown={async e => { if (e.key === "Enter" && newTeamName.trim()) { await createTeam.mutateAsync(newTeamName.trim()); setNewTeamName(""); toast({ title: "Equipo creado" }); }}}/>
              <Button size="sm" onClick={async () => { if (!newTeamName.trim()) return; await createTeam.mutateAsync(newTeamName.trim()); setNewTeamName(""); toast({ title: "Equipo creado" }); }}>
                <Plus className="w-4 h-4"/>
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {teams.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Sin equipos creados</p>
              ) : teams.map(t => (
                <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded bg-muted/50">
                  {editingTeam?.id === t.id ? (
                    <>
                      <Input className="h-7 text-xs flex-1" value={editingTeam.nombre} onChange={e => setEditingTeam({ ...editingTeam, nombre: e.target.value })}/>
                      <Button size="sm" className="h-7 text-xs" onClick={async () => { await updateTeam.mutateAsync({ id: t.id, nombre: editingTeam.nombre }); setEditingTeam(null); toast({ title: "Equipo actualizado" }); }}>OK</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingTeam(null)}>✕</Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm flex-1">{t.nombre}</span>
                      <span className="text-xs text-muted-foreground">{players.filter(p=>p.teamId===t.id).length}j</span>
                      <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setEditingTeam({ id: t.id, nombre: t.nombre })}><Edit2 className="w-3 h-3"/></Button>
                      <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive hover:text-destructive" onClick={async () => { if (!confirm(`¿Eliminar equipo "${t.nombre}"?`)) return; await deleteTeam.mutateAsync(t.id); toast({ title: "Equipo eliminado" }); }}><Trash2 className="w-3 h-3"/></Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
