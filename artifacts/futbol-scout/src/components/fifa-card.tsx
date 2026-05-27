import React from "react";
import logoPng from "../assets/logo_dinamo.png";
import fedPng from "@assets/federacion_alavesa_futbol_1778750911223.webp";
import totyBg from "@assets/toty1_1778757596366.jpg";

export interface FifaCardPlayer {
  nombre: string;
  alias?: string | null;
  posicion: string;
  velocidad: number;
  tecnica: number;
  fisico: number;
  actitud: number;
  reflejo?: number | null;
  foto?: string | null;
  fotoTarjeta?: string | null;
  ano?: number | null;
  pais?: string | null;
}

export const FLAG_EMOJI: Record<string, string> = {
  "España": "🇪🇸", "Portugal": "🇵🇹", "Francia": "🇫🇷",
  "Argentina": "🇦🇷", "Brasil": "🇧🇷", "Uruguay": "🇺🇾",
  "Colombia": "🇨🇴", "Venezuela": "🇻🇪", "México": "🇲🇽",
  "Alemania": "🇩🇪", "Italia": "🇮🇹", "Reino Unido": "🇬🇧",
  "Marruecos": "🇲🇦", "Senegal": "🇸🇳", "Nigeria": "🇳🇬",
  "Bélgica": "🇧🇪", "Países Bajos": "🇳🇱",
};

const COMMUNITY_CODE: Record<string, string> = {
  "Euskal Herria": "EUS", "Galiza": "GAL", "Catalunya": "CAT",
  "País Valenciano": "VAL", "Andalucía": "AND", "Aragón": "ARA",
  "Asturias": "AST", "Cantabria": "CNT", "Castilla y León": "CYL",
  "Castilla-La Mancha": "CLM", "Extremadura": "EXT", "Islas Baleares": "BAL",
  "Islas Canarias": "CAN", "La Rioja": "RIO", "Madrid": "MAD",
  "Murcia": "MUR", "Navarra": "NAV",
};

const FW = 38;
const FH = 25;
const FR = 3;

function FlagWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: FW, height: FH, borderRadius: FR,
      overflow: "hidden", flexShrink: 0, display: "inline-block",
      border: "0.8px solid rgba(255,255,255,0.32)",
      filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.6))",
    }}>
      {children}
    </div>
  );
}

function CommunityFlagSvg({ pais }: { pais: string }) {
  const cx = FW / 2;
  const cy = FH / 2;

  switch (pais) {
    case "Euskal Herria":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#D52B1E" />
            {/* Green saltire (diagonal X) — thinner arms, ~1/5 of flag height */}
            <line x1={0} y1={0} x2={FW} y2={FH} stroke="#007A3D" strokeWidth={5} />
            <line x1={FW} y1={0} x2={0} y2={FH} stroke="#007A3D" strokeWidth={5} />
            {/* White Nordic cross (vertical + horizontal) — on top, same width */}
            <rect x={0} y={cy - 2.5} width={FW} height={5} fill="#FFFFFF" />
            <rect x={cx - 2.5} y={0} width={5} height={FH} fill="#FFFFFF" />
          </svg>
        </FlagWrapper>
      );

    case "Galiza":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#FFFFFF" />
            <line x1={0} y1={0} x2={FW} y2={FH} stroke="#1B4EA0" strokeWidth={5} />
            <line x1={FW} y1={0} x2={0} y2={FH} stroke="#1B4EA0" strokeWidth={5} />
          </svg>
        </FlagWrapper>
      );

    case "Catalunya":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#FCDD09" />
            {[1, 3, 5, 7].map((i) => (
              <rect key={i} x={0} y={(i * FH) / 9} width={FW} height={FH / 9} fill="#CC0001" />
            ))}
          </svg>
        </FlagWrapper>
      );

    case "País Valenciano":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#FCDD09" />
            {[0, 2, 4].map((i) => (
              <rect key={i} x={5} y={(i * FH) / 5 + FH / 10} width={FW - 5} height={FH / 5} fill="#CC0001" />
            ))}
            <rect x={0} y={0} width={5} height={FH} fill="#003DA5" />
          </svg>
        </FlagWrapper>
      );

    case "Andalucía":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#007A3D" />
            <rect x={0} y={FH / 3} width={FW} height={FH / 3} fill="#FFFFFF" />
          </svg>
        </FlagWrapper>
      );

    case "Aragón":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#CC0001" />
            <rect x={0} y={FH / 4} width={FW} height={FH / 2} fill="#FCDD09" />
          </svg>
        </FlagWrapper>
      );

    case "Asturias":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#003DA5" />
            <line x1={cx} y1={0} x2={cx} y2={FH} stroke="#FCDD09" strokeWidth={6} />
            <line x1={0} y1={cy} x2={FW} y2={cy} stroke="#FCDD09" strokeWidth={6} />
          </svg>
        </FlagWrapper>
      );

    case "Cantabria":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#FFFFFF" />
            <rect x={0} y={0} width={FW} height={FH * 0.18} fill="#CC0001" />
            <rect x={0} y={FH * 0.82} width={FW} height={FH * 0.18} fill="#CC0001" />
          </svg>
        </FlagWrapper>
      );

    case "Castilla y León":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect x={0} y={0} width={FW / 2} height={FH / 2} fill="#CC0001" />
            <rect x={FW / 2} y={0} width={FW / 2} height={FH / 2} fill="#FFFFFF" />
            <rect x={0} y={FH / 2} width={FW / 2} height={FH / 2} fill="#FFFFFF" />
            <rect x={FW / 2} y={FH / 2} width={FW / 2} height={FH / 2} fill="#CC0001" />
            {/* Simplified castle and lion */}
            <rect x={FW * 0.2} y={FH * 0.15} width={FW * 0.08} height={FH * 0.3} fill="#FCDD09" />
            <circle cx={FW * 0.75} cy={FH * 0.75} r={FH * 0.18} fill="#800060" />
          </svg>
        </FlagWrapper>
      );

    case "Castilla-La Mancha":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#FFFFFF" />
            <rect x={0} y={FH * 0.33} width={FW} height={FH * 0.1} fill="#007A3D" />
            <rect x={0} y={FH * 0.57} width={FW} height={FH * 0.1} fill="#007A3D" />
          </svg>
        </FlagWrapper>
      );

    case "Extremadura":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#007A3D" />
            <rect x={0} y={FH / 3} width={FW} height={FH / 3} fill="#FFFFFF" />
            <rect x={0} y={(FH * 2) / 3} width={FW} height={FH / 3} fill="#1C1C1C" />
          </svg>
        </FlagWrapper>
      );

    case "Islas Baleares":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#CC0001" />
            <rect x={0} y={FH / 4} width={FW} height={FH / 2} fill="#FCDD09" />
            <rect x={0} y={0} width={FW / 5} height={FH} fill="#FFFFFF" />
            <rect x={FW / 5} y={FH * 0.3} width={FW * 0.05} height={FH * 0.4} fill="#CC0001" />
          </svg>
        </FlagWrapper>
      );

    case "Islas Canarias":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#FFFFFF" />
            <rect x={FW / 3} y={0} width={FW / 3} height={FH} fill="#007A3D" />
            <rect x={(FW * 2) / 3} y={0} width={FW / 3} height={FH} fill="#FCDD09" />
          </svg>
        </FlagWrapper>
      );

    case "La Rioja":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#CC0001" />
            <rect x={0} y={FH * 0.3} width={FW} height={FH * 0.4} fill="#007A3D" />
            <rect x={0} y={FH * 0.48} width={FW} height={FH * 0.04} fill="#FCDD09" />
          </svg>
        </FlagWrapper>
      );

    case "Madrid":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#FFFFFF" />
            <rect x={0} y={0} width={FW} height={FH * 0.14} fill="#CC0001" />
            <rect x={0} y={FH * 0.86} width={FW} height={FH * 0.14} fill="#CC0001" />
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((x, i) => (
              <polygon key={i}
                points={`${FW * x},${FH * 0.28} ${FW * x + 2.5},${FH * 0.46} ${FW * x - 2.5},${FH * 0.46}`}
                fill="#CC0001"
              />
            ))}
          </svg>
        </FlagWrapper>
      );

    case "Murcia":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#CC0001" />
            <rect x={FW * 0.1} y={FH * 0.2} width={FW * 0.8} height={FH * 0.6} fill="#FCDD09" />
          </svg>
        </FlagWrapper>
      );

    case "Navarra":
      return (
        <FlagWrapper>
          <svg width={FW} height={FH} xmlns="http://www.w3.org/2000/svg">
            <rect width={FW} height={FH} fill="#AA0000" />
            <circle cx={cx} cy={cy} r={FH * 0.36} fill="none" stroke="#FFD700" strokeWidth={2.5} />
            <circle cx={cx} cy={cy} r={FH * 0.16} fill="#FFD700" />
          </svg>
        </FlagWrapper>
      );

    default: {
      const code = COMMUNITY_CODE[pais] ?? pais.slice(0, 3).toUpperCase();
      return (
        <div style={{
          width: FW, height: FH, borderRadius: FR,
          background: "linear-gradient(135deg, #1a3a8e, #2a5acf)",
          border: "1.5px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 7.5, fontWeight: 900, color: "#fff", letterSpacing: 0.5,
          flexShrink: 0,
        }}>
          {code}
        </div>
      );
    }
  }
}

const CW = 274;
const CH = 400;

const CHAMP = 24;
const G_BRIGHT = "#f2cc3a";
const G_PALE = "#faeea0";

export const FifaCard = React.forwardRef<HTMLDivElement, { player: FifaCardPlayer }>(
  ({ player }, ref) => {
    const posArr = player.posicion.split(",").filter(Boolean);
    const isPortero = posArr.includes("Portero");
    const isEntrenador = posArr.includes("Entrenador");
    const overall =
      Math.round(((player.velocidad + player.tecnica + player.fisico + player.actitud) / 4) * 10) / 10;
    const overallDisplay = overall % 1 === 0 ? String(Math.round(overall)) : overall.toFixed(1);
    const posDisplay =
      posArr[0]?.replace("Portero", "POR").replace("Cierre", "CIE").replace("Ala", "ALA").replace("Pivot", "PIV").replace("Entrenador", "COACH") ?? "—";

    const lastName = player.alias
      ? player.alias.toUpperCase()
      : player.nombre.trim().split(/\s+/).slice(-1)[0].toUpperCase();

    const stats = [
      { label: "VEL", value: player.velocidad },
      { label: "TEC", value: player.tecnica },
      { label: "FIS", value: player.fisico },
      { label: "ACT", value: player.actitud },
      ...(isPortero && player.reflejo != null ? [{ label: "REF", value: player.reflejo }] : []),
    ];

    const flag = player.pais ? (FLAG_EMOJI[player.pais] ?? null) : null;

    const clipShape = `polygon(${CHAMP}px 0%, calc(100% - ${CHAMP}px) 0%, 100% ${CHAMP}px, 100% calc(100% - 13px), calc(100% - 13px) 100%, 13px 100%, 0% calc(100% - 13px), 0% ${CHAMP}px)`;

    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: CW, height: CH,
          fontFamily: '"Arial Narrow", "Arial Black", Arial, sans-serif',
          flexShrink: 0,
          userSelect: "none",
          filter: "drop-shadow(0 12px 40px rgba(0,60,140,0.7))",
          clipPath: clipShape,
          backgroundImage: `url(${totyBg})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          overflow: "hidden",
        }}
      >
        {/* Top vignette so rating text stays readable */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 110,
          background: "linear-gradient(to bottom, rgba(0,5,20,0.55) 0%, transparent 100%)",
          pointerEvents: "none", zIndex: 1,
        }} />

        {/* ── PLAYER PHOTO */}
        {player.fotoTarjeta ? (
          /* Foto de carta (sin fondo): llena la zona superior de la carta */
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 88,
            overflow: "hidden",
            zIndex: 2,
          }}>
            <img
              src={player.fotoTarjeta}
              alt={player.nombre}
              crossOrigin="anonymous"
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                height: "100%",
                width: "auto",
                maxWidth: "100%",
                objectFit: "contain",
                objectPosition: "bottom center",
                display: "block",
              }}
            />
          </div>
        ) : player.foto ? (
          /* Foto de cara (con fondo): óvalo centrado dentro del marco */
          <div style={{
            position: "absolute",
            top: 68,
            left: "50%",
            transform: "translateX(-50%)",
            width: 148,
            height: 172,
            borderRadius: "50%",
            overflow: "hidden",
            border: `2.5px solid ${G_BRIGHT}`,
            boxShadow: `0 0 18px rgba(242,204,58,0.45), inset 0 0 8px rgba(0,0,0,0.4)`,
            zIndex: 2,
            flexShrink: 0,
          }}>
            <img
              src={player.foto}
              alt={player.nombre}
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
                display: "block",
              }}
            />
          </div>
        ) : null}

        {/* Bottom fade for stats readability */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 170,
          background: "linear-gradient(to bottom, transparent 0%, rgba(0,5,20,0.85) 40%, rgba(0,4,18,0.98) 100%)",
          pointerEvents: "none", zIndex: 3,
        }} />

        {/* ── RATING + POSITION — top left */}
        <div style={{
          position: "absolute", top: 20, left: 18,
          display: "flex", flexDirection: "column", alignItems: "center",
          zIndex: 10,
          filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.98))",
        }}>
          {!isEntrenador && <div style={{
            fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: -1,
            color: G_PALE,
            textShadow: `0 0 22px rgba(245,218,50,0.7), 0 2px 6px rgba(0,0,0,0.98)`,
          }}>{overallDisplay}</div>}
          <div style={{
            fontSize: 13, fontWeight: 900, letterSpacing: 3,
            color: G_BRIGHT,
            textShadow: "0 1px 6px rgba(0,0,0,0.98)",
          }}>{posDisplay}</div>
        </div>

        {/* ── LEFT-SIDE HEXAGONAL ICONS (como en toty2) — hidden for Entrenador */}
        {!isEntrenador && <div style={{
          position: "absolute", left: 8, top: "38%",
          display: "flex", flexDirection: "column", gap: 6,
          zIndex: 10,
        }}>
          {[
            { path: "M8,2 L14,5.5 L14,12.5 L8,16 L2,12.5 L2,5.5 Z", label: "VEL",
              icon: <path d="M9,3 L6,9 L8.5,9 L7,14 L12,7 L9.5,7 Z" fill={G_PALE} /> },
            { path: "", label: "TEC",
              icon: <><circle cx="8" cy="7" r="4" fill="none" stroke={G_PALE} strokeWidth="1.2"/><line x1="8" y1="11" x2="8" y2="14" stroke={G_PALE} strokeWidth="1.2"/><line x1="5" y1="13" x2="11" y2="13" stroke={G_PALE} strokeWidth="1.2"/></> },
            { path: "", label: "FIS",
              icon: <><circle cx="8" cy="5" r="2.5" fill="none" stroke={G_PALE} strokeWidth="1.2"/><path d="M4,8 Q8,6 12,8 L11,14 L8,12 L5,14 Z" fill="none" stroke={G_PALE} strokeWidth="1.2"/></> },
          ].map(({ label, icon }, i) => (
            <div key={i} style={{
              width: 30, height: 30, position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.8))",
            }}>
              <svg width={30} height={30} viewBox="0 0 16 16">
                <polygon
                  points="8,1 14.9,4.5 14.9,11.5 8,15 1.1,11.5 1.1,4.5"
                  fill="rgba(5,15,55,0.88)"
                  stroke={G_BRIGHT}
                  strokeWidth="0.8"
                />
                {icon}
              </svg>
              <div style={{
                position: "absolute", bottom: -9,
                fontSize: 5.5, fontWeight: 900, color: G_BRIGHT,
                letterSpacing: 0.3, textAlign: "center", width: "100%",
                textShadow: "0 1px 3px rgba(0,0,0,0.95)",
              }}>{label}</div>
            </div>
          ))}
        </div>}

        {/* ── BOTTOM SECTION: name + stats + badges */}
        <div style={{
          position: "absolute",
          bottom: 6, left: 6, right: 6,
          zIndex: 10,
          display: "flex", flexDirection: "column",
          padding: "0 6px 4px",
        }}>
          {/* Gold separator line */}
          <div style={{
            height: 1,
            background: `linear-gradient(to right, transparent, ${G_BRIGHT}88, transparent)`,
            marginBottom: 4,
          }} />

          {/* Player last name — grande como en toty2 */}
          <div style={{
            textAlign: "center",
            fontSize: 22, fontWeight: 900, letterSpacing: 2,
            fontStyle: "italic",
            color: G_PALE,
            textShadow: `0 0 16px rgba(245,218,50,0.5), 0 1px 5px rgba(0,0,0,0.98)`,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: 5,
          }}>{lastName}</div>

          {/* Stats row — hidden for Entrenador */}
          {!isEntrenador && <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
            {stats.map(({ label, value }, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center",
                borderRight: i < stats.length - 1
                  ? "1px solid rgba(200,150,20,0.3)" : "none",
              }}>
                <div style={{
                  fontSize: 7, fontWeight: 800, letterSpacing: 0.5,
                  color: "rgba(210,170,48,0.92)", textTransform: "uppercase",
                  lineHeight: 1, marginBottom: 1,
                }}>{label}</div>
                <div style={{
                  fontSize: 18, fontWeight: 900,
                  color: "#ffffff", lineHeight: 1,
                  textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                }}>{value}</div>
              </div>
            ))}
          </div>}

          {/* Badges: país | federación | club */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
            {player.pais && (
              flag ? (
                <FlagWrapper>
                  <div style={{
                    width: FW, height: FH,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, lineHeight: 1,
                  }}>{flag}</div>
                </FlagWrapper>
              ) : (
                <CommunityFlagSvg pais={player.pais} />
              )
            )}
            <img
              src={fedPng}
              alt="Fed. Alavesa"
              crossOrigin="anonymous"
              style={{ width: 26, height: 26, objectFit: "contain", display: "block" }}
            />
            <img
              src={logoPng}
              alt="Dinamo Ibaiondo"
              crossOrigin="anonymous"
              style={{
                width: 32, height: 32,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

FifaCard.displayName = "FifaCard";
