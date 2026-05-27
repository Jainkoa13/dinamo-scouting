import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Download, Edit2, Save, X } from "lucide-react";
import html2canvas from "html2canvas";
import { usePlayer, useUpdatePlayer, useTeams } from "@/hooks/use-local-data";
import type { LocalPlayer } from "@/lib/db";
import { FifaCard } from "@/components/fifa-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/toaster";

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

const editSchema = z.object({
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
type EditValues = z.infer<typeof editSchema>;

function RatingBar({ value, label, color }: { value: number; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-muted-foreground w-8">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(value / 10) * 100}%`, background: color ?? "hsl(82 100% 50%)" }}/>
      </div>
      <span className="text-xs font-mono text-primary w-4 text-right">{value}</span>
    </div>
  );
}

export default function PlayerDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const id = Number(params.id);

  const { data: player, isLoading } = usePlayer(id);
  const { data: teams = [] } = useTeams();
  const updatePlayer = useUpdatePlayer();

  const [editing, setEditing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCardRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  function startEdit(p: LocalPlayer) {
    reset({
      nombre: p.nombre,
      posiciones: p.posicion.split(",").filter(Boolean),
      pierna: p.pierna,
      pais: p.pais ?? null,
      edad: p.edad,
      ano: p.ano ?? "",
      altura: p.altura ?? "",
      peso: p.peso ?? "",
      velocidad: p.velocidad,
      tecnica: p.tecnica,
      fisico: p.fisico,
      actitud: p.actitud,
      reflejo: p.reflejo ?? null,
      observaciones: p.observaciones ?? "",
      foto: p.foto ?? null,
      fotoTarjeta: p.fotoTarjeta ?? null,
      alias: p.alias ?? "",
      teamId: p.teamId ?? null,
    });
    setEditing(true);
  }

  const watchPosiciones = watch("posiciones") ?? [];
  const watchVelocidad = watch("velocidad");
  const watchTecnica = watch("tecnica");
  const watchFisico = watch("fisico");
  const watchActitud = watch("actitud");
  const watchReflejo = watch("reflejo");
  const isPorteroSelected = watchPosiciones.includes("Portero");

  async function fileToBase64(file: File): Promise<string> {
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
    setValue(field, await fileToBase64(file));
  }

  async function onSave(values: EditValues) {
    await updatePlayer.mutateAsync({
      id,
      data: {
        nombre: values.nombre,
        posicion: values.posiciones.join(","),
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
      },
    });
    toast({ title: "Jugador actualizado" });
    setEditing(false);
  }

  async function exportCard() {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { useCORS: true, allowTaint: true, scale: 2, backgroundColor: null });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${player?.nombre ?? "carta"}.png`;
      a.click();
      toast({ title: "Carta exportada" });
    } catch {
      toast({ title: "Error al exportar la carta", variant: "destructive" });
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-screen text-muted-foreground text-sm">Cargando...</div>;
  if (!player) return <div className="flex flex-col items-center justify-center h-screen gap-4 text-muted-foreground"><p className="text-sm">Jugador no encontrado.</p><Button variant="outline" size="sm" onClick={() => setLocation("/")}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></div>;

  const posArr = player.posicion.split(",").filter(Boolean);
  const isEntrenador = posArr.includes("Entrenador");
  const isPortero = posArr.includes("Portero");
  const overall = Math.round(((player.velocidad + player.tecnica + player.fisico + player.actitud) / 4) * 10) / 10;
  const cat = getCategoria(player.ano);
  const edadDisplay = calcEdadDisplay(player.ano);
  const teamName = teams.find(t => t.id === player.teamId)?.nombre ?? null;

  return (
    <div className="min-h-screen bg-background pb-8">
      <Toaster/>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4"/>
          </Button>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {player.foto ? <img src={player.foto} alt={player.nombre} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold">{player.nombre[0]}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-sm truncate">{player.nombre}</h1>
            <p className="text-[10px] text-muted-foreground">{posArr.join(", ")}</p>
          </div>
          {!editing ? (
            <>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => startEdit(player)}>
                <Edit2 className="w-3.5 h-3.5"/>Editar
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={exportCard}>
                <Download className="w-3.5 h-3.5"/>PNG
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" className="gap-1 text-xs" onClick={handleSubmit(onSave)} disabled={updatePlayer.isPending}>
                <Save className="w-3.5 h-3.5"/>Guardar
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => setEditing(false)}>
                <X className="w-3.5 h-3.5"/>Cancelar
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 py-4 space-y-4">
        {/* FIFA Card */}
        <div className="flex justify-center">
          <div ref={cardRef}>
            <FifaCard player={{
              nombre: player.nombre,
              alias: player.alias,
              posicion: player.posicion,
              velocidad: player.velocidad,
              tecnica: player.tecnica,
              fisico: player.fisico,
              actitud: player.actitud,
              reflejo: player.reflejo,
              foto: player.foto,
              fotoTarjeta: player.fotoTarjeta,
              ano: player.ano,
              pais: player.pais,
            }}/>
          </div>
        </div>

        {!editing ? (
          /* ── VIEW MODE ── */
          <div className="space-y-4">
            {/* Info cards */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Información</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  { label: "Pierna", value: player.pierna },
                  { label: "Edad", value: edadDisplay || player.edad },
                  ...(player.ano ? [{ label: "Año nac.", value: player.ano }, { label: "Categoría", value: cat }] : []),
                  ...(player.altura ? [{ label: "Altura", value: `${player.altura} cm` }] : []),
                  ...(player.peso ? [{ label: "Peso", value: `${player.peso} kg` }] : []),
                  ...(player.pais ? [{ label: "País/Región", value: player.pais }] : []),
                  ...(teamName ? [{ label: "Equipo", value: teamName }] : []),
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ratings */}
            {!isEntrenador && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Valoraciones</h2>
                  <span className="text-lg font-bold font-mono text-primary">{overall}</span>
                </div>
                <RatingBar value={player.velocidad} label="VEL"/>
                <RatingBar value={player.tecnica} label="TEC"/>
                <RatingBar value={player.fisico} label="FIS"/>
                <RatingBar value={player.actitud} label="ACT"/>
                {isPortero && player.reflejo != null && <RatingBar value={player.reflejo} label="REF"/>}
              </div>
            )}

            {/* Observaciones */}
            {player.observaciones && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Observaciones</h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{player.observaciones}</p>
              </div>
            )}
          </div>
        ) : (
          /* ── EDIT MODE ── */
          <form onSubmit={handleSubmit(onSave)} className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h2 className="font-bold text-sm text-primary font-mono uppercase tracking-wider">Editar jugador</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre *</Label>
                <Input {...register("nombre")} className="h-8 text-sm"/>
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Alias (carta)</Label>
                <Input {...register("alias")} className="h-8 text-sm"/>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Posición(es) *</Label>
              <div className="flex flex-wrap gap-2">
                {POSICIONES.map(pos => {
                  const checked = watchPosiciones.includes(pos);
                  return (
                    <button key={pos} type="button" onClick={() => setValue("posiciones", checked ? watchPosiciones.filter(p => p !== pos) : [...watchPosiciones, pos])} className={`text-xs px-3 py-1 rounded border transition-colors ${checked ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>{pos}</button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pierna *</Label>
                <select {...register("pierna")} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Seleccionar</option>
                  {PIERNAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Edad *</Label>
                <Input {...register("edad")} type="number" className="h-8 text-sm"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Año nac.</Label>
                <Input {...register("ano")} type="number" className="h-8 text-sm" placeholder="2008"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Altura (cm)</Label>
                <Input {...register("altura")} type="number" className="h-8 text-sm"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Peso (kg)</Label>
                <Input {...register("peso")} type="number" className="h-8 text-sm"/>
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
                    <Label className="text-xs">Reflejos</Label>
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
              <Textarea {...register("observaciones")} className="text-sm min-h-16"/>
            </div>

            <Button type="submit" className="w-full" disabled={updatePlayer.isPending}>
              {updatePlayer.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
