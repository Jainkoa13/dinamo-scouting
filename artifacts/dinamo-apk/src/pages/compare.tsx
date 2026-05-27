import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayers } from "@/hooks/use-local-data";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import logoPng from "@/assets/dinamo_compare.png";
import type { LocalPlayer } from "@/lib/db";

const COLORS = [
  "hsl(82 100% 50%)", "hsl(190 90% 50%)", "hsl(310 90% 60%)",
  "hsl(45 100% 50%)", "hsl(160 80% 50%)",
];

function PlayerCard({ player, color }: { player: LocalPlayer; color: string }) {
  const overall = Math.round(((player.velocidad + player.tecnica + player.fisico + player.actitud) / 4) * 10) / 10;
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
          {player.foto ? <img src={player.foto} alt={player.nombre} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">{player.nombre[0]}</div>}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm truncate" style={{ color }}>{player.nombre}</div>
          <div className="text-xs text-muted-foreground">{player.posicion.split(",")[0]} · {player.pierna}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: "VEL", value: player.velocidad },
          { label: "TEC", value: player.tecnica },
          { label: "FIS", value: player.fisico },
          { label: "ACT", value: player.actitud },
          ...(player.reflejo != null ? [{ label: "REF", value: player.reflejo }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground font-mono">{label}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(value / 10) * 100}%`, background: color }}/>
            </div>
            <span className="text-xs font-mono font-bold" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>OVERALL</span>
        <span className="font-bold text-base font-mono" style={{ color }}>{overall}</span>
      </div>
    </div>
  );
}

export default function Compare() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const ids = (params.get("ids") ?? "").split(",").map(Number).filter(Boolean);

  const { data: players = [], isLoading } = usePlayers();
  const selected = players.filter(p => ids.includes(p.id));

  if (isLoading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Cargando...</div>;
  if (selected.length < 2) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground px-4">
      <p className="text-sm">Selecciona 2 o más jugadores para comparar.</p>
      <Button variant="outline" size="sm" onClick={() => setLocation("/")}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
    </div>
  );

  const radarData = ["velocidad", "tecnica", "fisico", "actitud"].map(key => ({
    stat: key === "velocidad" ? "VEL" : key === "tecnica" ? "TEC" : key === "fisico" ? "FIS" : "ACT",
    ...Object.fromEntries(selected.map(p => [p.nombre.split(" ")[0], p[key as keyof LocalPlayer] as number])),
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4"/>
          </Button>
          <img src={logoPng} alt="Dinamo Ibaiondo" className="w-8 h-8 object-contain"/>
          <div>
            <h1 className="font-bold text-sm">Comparar jugadores</h1>
            <p className="text-[10px] text-muted-foreground">{selected.length} jugadores</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 py-4 space-y-4">
        {/* Radar chart */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Radar de habilidades</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)"/>
              <PolarAngleAxis dataKey="stat" tick={{ fill: "#94a3b8", fontSize: 11 }}/>
              <Tooltip contentStyle={{ background: "#1e2130", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}/>
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }}/>
              {selected.map((p, i) => (
                <Radar key={p.id} name={p.nombre.split(" ")[0]} dataKey={p.nombre.split(" ")[0]} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.1}/>
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Player cards */}
        <div className="flex gap-3 flex-wrap">
          {selected.map((p, i) => <PlayerCard key={p.id} player={p} color={COLORS[i % COLORS.length]}/>)}
        </div>

        {/* Stats table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-3 py-2 font-mono text-muted-foreground">STAT</th>
                {selected.map((p, i) => <th key={p.id} className="text-center px-2 py-2 font-bold" style={{ color: COLORS[i % COLORS.length] }}>{p.nombre.split(" ")[0].toUpperCase()}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Velocidad", key: "velocidad" },
                { label: "Técnica", key: "tecnica" },
                { label: "Físico", key: "fisico" },
                { label: "Actitud", key: "actitud" },
                { label: "Reflejos", key: "reflejo" },
                { label: "Overall", key: "_overall" },
              ].map(({ label, key }) => {
                const vals = selected.map(p => {
                  if (key === "_overall") return Math.round(((p.velocidad + p.tecnica + p.fisico + p.actitud) / 4) * 10) / 10;
                  const v = p[key as keyof LocalPlayer];
                  return typeof v === "number" ? v : null;
                });
                const max = Math.max(...vals.filter(v => v != null) as number[]);
                return (
                  <tr key={key} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 text-muted-foreground font-mono">{label}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="text-center px-2 py-2 font-mono font-bold" style={{ color: v === max && v != null ? COLORS[i % COLORS.length] : undefined }}>
                        {v ?? "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
