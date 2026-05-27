import { useLocation } from "wouter";
import { useListPlayers } from "@workspace/api-client-react";
import logoPng from "@assets/Dinamo_ibaiondo_1778680484632.png";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const COLORS = [
  "hsl(82 100% 50%)",   // volt green
  "hsl(190 90% 50%)",   // cyan
  "hsl(310 90% 60%)",   // purple
  "hsl(45 100% 50%)",   // yellow
  "hsl(160 80% 50%)",   // teal
];

const RATING_LABELS: Record<string, string> = {
  velocidad: "VEL",
  tecnica: "TEC",
  fisico: "FIS",
  actitud: "ACT",
  reflejo: "REFLEJOS",
};

function PlayerCard({ player, color }: { player: ReturnType<typeof useListPlayers>["data"] extends (infer T)[] | undefined ? T : never; color: string }) {
  const overall = Math.round(((player.velocidad + player.tecnica + player.fisico + player.actitud) / 4) * 10) / 10;
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex-1 min-w-0" data-testid={`compare-card-${player.id}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
          {player.foto
            ? <img src={player.foto} alt={player.nombre} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">{player.nombre[0]}</div>
          }
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm truncate" style={{ color }}>{player.nombre}</div>
          <div className="text-xs text-muted-foreground">{player.posicion} · {player.pierna}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {(["velocidad", "tecnica", "fisico", "actitud"] as const).map((key) => (
          <div key={key} className="bg-muted/40 rounded p-2 text-center">
            <div className="text-lg font-bold font-mono" style={{ color }}>{player[key]}</div>
            <div className="text-xs text-muted-foreground">{RATING_LABELS[key]}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-2">
        <span>{player.edad} años</span>
        {player.altura && <span>{player.altura} cm</span>}
        {player.peso && <span>{player.peso} kg</span>}
        <span className="font-mono font-bold" style={{ color }}>OVR {overall}</span>
      </div>
    </div>
  );
}

export default function Compare() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const ids = (params.get("ids") ?? "").split(",").map(Number).filter(Boolean);

  const { data: allPlayers, isLoading } = useListPlayers();
  const players = allPlayers?.filter((p) => ids.includes(p.id)) ?? [];

  const anyPortero = players.some((p) => p.posicion.split(",").includes("Portero"));

  const radarData = [
    { stat: "Velocidad", ...Object.fromEntries(players.map((p) => [p.nombre, p.velocidad])) },
    { stat: "Técnica", ...Object.fromEntries(players.map((p) => [p.nombre, p.tecnica])) },
    { stat: "Físico", ...Object.fromEntries(players.map((p) => [p.nombre, p.fisico])) },
    { stat: "Actitud", ...Object.fromEntries(players.map((p) => [p.nombre, p.actitud])) },
    ...(anyPortero ? [{ stat: "Reflejos", ...Object.fromEntries(players.map((p) => [p.nombre, p.posicion.split(",").includes("Portero") ? (p.reflejo ?? 0) : 0])) }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img src={logoPng} alt="Dinamo Ibaiondo" className="w-8 h-8 rounded-full object-cover" />
          <span className="text-sm font-bold tracking-tight">COMPARATIVA DE JUGADORES</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : players.length < 2 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg" data-testid="compare-empty">
            <p className="text-muted-foreground text-sm">Selecciona al menos 2 jugadores para comparar</p>
            <Button variant="ghost" className="mt-3" onClick={() => setLocation("/")}>Volver a la lista</Button>
          </div>
        ) : (
          <>
            {/* Player cards */}
            <div className="flex gap-3 flex-wrap" data-testid="compare-cards">
              {players.map((p, i) => (
                <PlayerCard key={p.id} player={p} color={COLORS[i % COLORS.length]} />
              ))}
            </div>

            {/* Radar chart */}
            <div className="bg-card border border-border rounded-lg p-4" data-testid="compare-chart">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Comparativa de valoraciones</h2>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="hsl(220 8% 30%)" />
                  <PolarAngleAxis
                    dataKey="stat"
                    tick={{ fill: "hsl(220 8% 65%)", fontSize: 12, fontFamily: "Space Mono, monospace" }}
                  />
                  {players.map((p, i) => (
                    <Radar
                      key={p.id}
                      name={p.nombre}
                      dataKey={p.nombre}
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "hsl(210 20% 80%)", fontSize: 12 }}>{value}</span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220 8% 22%)",
                      border: "1px solid hsl(220 8% 28%)",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(210 20% 98%)", fontWeight: "bold" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar comparison */}
            <div className="bg-card border border-border rounded-lg p-4" data-testid="compare-bars">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Detalle por atributo</h2>
              <div className="space-y-4">
                {([
                  "velocidad", "tecnica", "fisico", "actitud",
                  ...(anyPortero ? ["reflejo" as const] : []),
                ] as const).map((key) => (
                  <div key={key}>
                    <div className="text-xs text-muted-foreground font-mono uppercase mb-1.5">{RATING_LABELS[key]}</div>
                    <div className="space-y-1.5">
                      {players.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="text-xs w-28 truncate" style={{ color: COLORS[i % COLORS.length] }}>{p.nombre}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(p[key] / 10) * 100}%`,
                                backgroundColor: COLORS[i % COLORS.length],
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono w-4 text-right" style={{ color: COLORS[i % COLORS.length] }}>{p[key]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
