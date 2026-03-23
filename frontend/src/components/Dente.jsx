import React from 'react';
import { FaCheck, FaTimes, FaStethoscope } from 'react-icons/fa';

const statusConfig = {
  'vazio':           { crown: ['#f5f0e8','#e8ddd0'], root: ['#d4c5b0','#b8a898'], stroke: '#c4b49a', badge: null },
  'ausente':         { crown: ['#c8c8c8','#a8a8a8'], root: ['#b0b0b0','#909090'], stroke: '#808080', badge: 'ausente' },
  'tratado':         { crown: ['#d4edda','#a8d5b5'], root: ['#b8dfc4','#88c4a0'], stroke: '#3a9e5f', badge: 'ok' },
  'tratado-completo':{ crown: ['#d4edda','#a8d5b5'], root: ['#b8dfc4','#88c4a0'], stroke: '#3a9e5f', badge: 'ok' },
  'tratado-parcial': { crown: ['#fde8d0','#f5c89a'], root: ['#f0d0a8','#e0b880'], stroke: '#d4780a', badge: 'parcial' },
  'plano':           { crown: ['#fde8e8','#f5b8b8'], root: ['#f0c0c0','#e09898'], stroke: '#c0392b', badge: 'plano' },
  'plano-pendente':  { crown: ['#f5a0a0','#e06060'], root: ['#e08080','#c04040'], stroke: '#8b0000', badge: 'pend' },
};

function getToothType(fdi) {
  const n = fdi % 10;
  if (n === 1) return 'ic';
  if (n === 2) return 'il';
  if (n === 3) return 'canino';
  if (n === 4 || n === 5) return 'premolar';
  if (n === 6 || n === 7) return 'molar';
  return 'siso';
}

function isUpper(fdi) {
  const q = Math.floor(fdi / 10);
  return q === 1 || q === 2;
}

// Retorna { crownPath, rootPaths, highlights, sulcos, cuspids }
function getToothGeometry(fdi) {
  const type = getToothType(fdi);
  const upper = isUpper(fdi);
  const id = `t${fdi}`;

  if (type === 'ic') {
    return upper ? {
      // Incisivo central superior: coroa trapezoidal larga, raiz cônica longa
      crown: "M14,2 C10,2 6,4 5,8 L4,28 C4,32 7,35 14,35 L30,35 C37,35 40,32 39,28 L38,8 C37,4 33,2 30,2 Z",
      crownHighlight: "M15,4 C12,4 9,5 8,8 L7,20 C9,18 14,17 22,17 L36,19 L37,8 C36,5 33,4 29,4 Z",
      roots: [
        { path: "M18,35 C16,38 14,44 13,52 C12,60 13,70 16,76 C18,80 22,82 24,82 C26,82 30,80 32,76 C35,70 36,60 35,52 C34,44 32,38 30,35 Z", highlight: "M20,37 C18,41 16,50 16,58 C18,55 22,52 24,52 C22,48 21,42 20,37 Z" }
      ],
      sulcos: [],
      width: 44, height: 84,
    } : {
      crown: "M14,50 C10,50 6,47 5,43 L4,22 C4,18 7,15 14,15 L30,15 C37,15 40,18 39,22 L38,43 C37,47 33,50 30,50 Z",
      crownHighlight: "M15,48 C12,48 9,47 8,44 L7,30 C9,32 14,33 22,33 L36,31 L37,43 C36,47 33,48 29,48 Z",
      roots: [
        { path: "M18,15 C16,12 14,6 13,0 C12,-8 13,-16 16,-20 C18,-23 22,-24 24,-24 C26,-24 30,-23 32,-20 C35,-16 36,-8 35,0 C34,6 32,12 30,15 Z", highlight: "M20,13 C18,9 16,2 16,-6 C18,-3 22,0 24,0 C22,-4 21,-10 20,-14 Z" }
      ],
      sulcos: [],
      width: 44, height: 84, rootUp: true,
    };
  }

  if (type === 'il') {
    return upper ? {
      crown: "M15,3 C11,3 7,5 6,9 L5,27 C5,31 8,34 15,34 L28,34 C35,34 38,31 37,27 L36,9 C35,5 31,3 28,3 Z",
      crownHighlight: "M16,5 C13,5 10,6 9,9 L8,19 C10,17 15,16 21,16 L34,18 L35,9 C34,6 31,5 27,5 Z",
      roots: [
        { path: "M17,34 C15,38 14,45 13,53 C12,61 13,69 15,74 C17,78 21,80 22,80 C23,80 27,78 29,74 C31,69 32,61 31,53 C30,45 29,38 27,34 Z", highlight: "M19,36 C18,41 17,50 17,57 C19,54 22,52 22,52 C20,48 20,42 19,36 Z" }
      ],
      sulcos: [], width: 43, height: 82,
    } : {
      crown: "M15,49 C11,49 7,46 6,42 L5,22 C5,18 8,16 15,16 L28,16 C35,16 38,18 37,22 L36,42 C35,46 31,49 28,49 Z",
      crownHighlight: "M16,47 C13,47 10,46 9,43 L8,30 C10,32 15,33 21,33 L34,31 L35,42 C34,46 31,47 27,47 Z",
      roots: [
        { path: "M17,16 C15,12 14,5 13,-1 C12,-9 13,-17 15,-21 C17,-24 21,-26 22,-26 C23,-26 27,-24 29,-21 C31,-17 32,-9 31,-1 C30,5 29,12 27,16 Z", highlight: "M19,14 C18,9 17,2 17,-5 C19,-2 22,0 22,0 C20,-4 20,-10 19,-14 Z" }
      ],
      sulcos: [], width: 43, height: 82, rootUp: true,
    };
  }

  if (type === 'canino') {
    return upper ? {
      crown: "M8,4 C8,4 10,2 22,2 C34,2 36,4 36,4 L34,28 C33,33 28,36 22,36 C16,36 11,33 10,28 Z",
      crownHighlight: "M10,5 C10,5 14,3 22,3 C30,3 34,5 34,5 L32,18 C28,16 22,15 16,17 L10,5 Z",
      roots: [
        { path: "M17,36 C15,40 13,48 12,57 C11,66 12,76 15,82 C17,86 22,88 22,88 C22,88 27,86 29,82 C32,76 33,66 32,57 C31,48 29,40 27,36 Z", highlight: "M19,38 C18,44 17,54 17,62 C19,58 22,56 22,56 C20,52 20,44 19,38 Z" }
      ],
      sulcos: [], width: 44, height: 90,
    } : {
      crown: "M8,56 C8,56 10,58 22,58 C34,58 36,56 36,56 L34,32 C33,27 28,24 22,24 C16,24 11,27 10,32 Z",
      crownHighlight: "M10,55 C10,55 14,57 22,57 C30,57 34,55 34,55 L32,42 C28,44 22,45 16,43 L10,55 Z",
      roots: [
        { path: "M17,24 C15,20 13,12 12,3 C11,-6 12,-16 15,-22 C17,-26 22,-28 22,-28 C22,-28 27,-26 29,-22 C32,-16 33,-6 32,3 C31,12 29,20 27,24 Z", highlight: "M19,22 C18,16 17,6 17,-2 C19,2 22,4 22,4 C20,0 20,-8 19,-12 Z" }
      ],
      sulcos: [], width: 44, height: 90, rootUp: true,
    };
  }

  if (type === 'premolar') {
    return upper ? {
      crown: "M6,8 C6,4 10,2 22,2 C34,2 38,4 38,8 L38,30 C38,34 34,37 22,37 C10,37 6,34 6,30 Z",
      crownHighlight: "M8,9 C8,5 12,4 22,4 C32,4 36,6 36,9 L36,20 C30,18 22,17 14,19 L8,9 Z",
      cuspids: [
        { path: "M12,2 C11,0 10,-4 11,-8 C12,-11 14,-12 15,-10 C16,-8 15,-4 14,2 Z", hi: "M12,1 C12,-1 12,-5 13,-7 C13,-5 13,-2 12,1 Z" },
        { path: "M26,2 C25,0 25,-4 26,-8 C27,-11 30,-12 31,-10 C32,-8 31,-4 30,2 Z", hi: "M27,1 C27,-1 27,-5 28,-7 C28,-5 28,-2 27,1 Z" },
      ],
      roots: [
        { path: "M13,37 C11,42 10,50 10,58 C10,66 11,74 14,79 C16,83 19,85 22,85 C25,85 28,83 30,79 C33,74 34,66 34,58 C34,50 33,42 31,37 Z", highlight: "M15,39 C14,45 13,54 13,62 C15,58 19,56 22,56 C20,52 16,44 15,39 Z" }
      ],
      sulcos: [{ x1:22, y1:8, x2:22, y2:35 }],
      width: 44, height: 90,
    } : {
      crown: "M6,32 C6,28 10,25 22,25 C34,25 38,28 38,32 L38,54 C38,58 34,61 22,61 C10,61 6,58 6,54 Z",
      crownHighlight: "M8,54 C8,58 12,60 22,60 C32,60 36,58 36,55 L36,44 C30,46 22,47 14,45 L8,54 Z",
      cuspids: [
        { path: "M12,61 C11,63 10,67 11,71 C12,74 14,75 15,73 C16,71 15,67 14,61 Z", hi: "M12,62 C12,64 12,68 13,70 C13,68 13,65 12,62 Z" },
        { path: "M26,61 C25,63 25,67 26,71 C27,74 30,75 31,73 C32,71 31,67 30,61 Z", hi: "M27,62 C27,64 27,68 28,70 C28,68 28,65 27,62 Z" },
      ],
      roots: [
        { path: "M13,25 C11,20 10,12 10,4 C10,-4 11,-12 14,-17 C16,-21 19,-23 22,-23 C25,-23 28,-21 30,-17 C33,-12 34,-4 34,4 C34,12 33,20 31,25 Z", highlight: "M15,23 C14,17 13,8 13,0 C15,4 19,6 22,6 C20,2 16,-6 15,-11 Z" }
      ],
      sulcos: [{ x1:22, y1:28, x2:22, y2:59 }],
      width: 44, height: 90, rootUp: true,
    };
  }

  if (type === 'molar' || type === 'siso') {
    const isSiso = type === 'siso';
    return upper ? {
      crown: isSiso
        ? "M5,10 C5,5 10,2 22,2 C34,2 39,5 39,10 L39,33 C39,38 34,42 22,42 C10,42 5,38 5,33 Z"
        : "M4,9 C4,4 9,2 22,2 C35,2 40,4 40,9 L40,34 C40,39 35,43 22,43 C9,43 4,39 4,34 Z",
      crownHighlight: "M6,10 C6,6 11,4 22,4 C33,4 38,7 38,10 L38,22 C32,20 22,19 12,21 L6,10 Z",
      cuspids: [
        { path: "M10,2 C9,0 8,-5 9,-9 C10,-12 12,-13 13,-11 C14,-9 13,-4 12,2 Z", hi: "M10,1 C10,-1 10,-6 11,-8 Z" },
        { path: "M20,2 C19,0 19,-5 20,-9 C21,-12 23,-13 24,-11 C25,-9 24,-4 23,2 Z", hi: "M20,1 C20,-1 21,-6 22,-8 Z" },
        { path: "M30,2 C29,0 29,-5 30,-9 C31,-12 33,-13 34,-11 C35,-9 34,-4 33,2 Z", hi: "M30,1 C30,-1 31,-6 32,-8 Z" },
      ],
      roots: [
        { path: "M8,43 C7,48 6,55 6,63 C6,72 7,80 10,85 C12,88 15,90 18,89 C20,88 21,86 21,83 L21,43 Z", highlight: "M10,45 C9,51 9,60 9,67 C11,63 14,61 16,61 L10,45 Z" },
        { path: "M23,43 L23,83 C23,86 24,88 26,89 C29,90 32,88 34,85 C37,80 38,72 38,63 C38,55 37,48 36,43 Z", highlight: "M28,45 C30,52 31,62 31,68 C29,64 26,62 24,62 L28,45 Z" },
      ],
      sulcos: [
        { x1:22, y1:5, x2:22, y2:41 },
        { x1:5, y1:22, x2:39, y2:22 },
      ],
      width: 44, height: 92,
    } : {
      crown: isSiso
        ? "M5,30 C5,25 10,21 22,21 C34,21 39,25 39,30 L39,53 C39,58 34,61 22,61 C10,61 5,58 5,53 Z"
        : "M4,29 C4,24 9,20 22,20 C35,20 40,24 40,29 L40,54 C40,59 35,62 22,62 C9,62 4,59 4,54 Z",
      crownHighlight: "M6,54 C6,58 11,60 22,60 C33,60 38,57 38,54 L38,42 C32,44 22,45 12,43 L6,54 Z",
      cuspids: [
        { path: "M10,62 C9,64 8,69 9,73 C10,76 12,77 13,75 C14,73 13,68 12,62 Z", hi: "M10,63 C10,65 10,70 11,72 Z" },
        { path: "M20,62 C19,64 19,69 20,73 C21,76 23,77 24,75 C25,73 24,68 23,62 Z", hi: "M20,63 C20,65 21,70 22,72 Z" },
        { path: "M30,62 C29,64 29,69 30,73 C31,76 33,77 34,75 C35,73 34,68 33,62 Z", hi: "M30,63 C30,65 31,70 32,72 Z" },
      ],
      roots: [
        { path: "M8,20 C7,15 6,8 6,0 C6,-9 7,-17 10,-22 C12,-25 15,-27 18,-26 C20,-25 21,-23 21,-20 L21,20 Z", highlight: "M10,18 C9,12 9,3 9,-4 C11,0 14,2 16,2 L10,18 Z" },
        { path: "M23,20 L23,-20 C23,-23 24,-25 26,-26 C29,-27 32,-25 34,-22 C37,-17 38,-9 38,0 C38,8 37,15 36,20 Z", highlight: "M28,18 C30,11 31,1 31,-5 C29,-1 26,1 24,1 L28,18 Z" },
      ],
      sulcos: [
        { x1:22, y1:22, x2:22, y2:60 },
        { x1:5, y1:41, x2:39, y2:41 },
      ],
      width: 44, height: 92, rootUp: true,
    };
  }

  return { crown: "M5,5 L39,5 L39,45 L5,45 Z", crownHighlight: "", roots: [], sulcos: [], width: 44, height: 92 };
}

function ToothSVG({ fdi, crownColors, rootColors, strokeColor, isAusente }) {
  const geo = getToothGeometry(fdi);
  const id = `g${fdi}`;
  const rootUp = geo.rootUp;

  // Calcular viewBox e dimensões
  const vbX = 0;
  let vbY = rootUp ? -30 : 0;
  const vbW = geo.width;
  const vbH = geo.height;

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      width="100%"
      height="100%"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Crown gradient - 3D effect */}
        <linearGradient id={`cg_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={crownColors[0]} />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor={crownColors[1]} />
        </linearGradient>
        {/* Root gradient */}
        <linearGradient id={`rg_${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={rootColors[1]} />
          <stop offset="30%" stopColor={rootColors[0]} />
          <stop offset="70%" stopColor={rootColors[0]} />
          <stop offset="100%" stopColor={rootColors[1]} />
        </linearGradient>
        {/* Enamel shine */}
        <linearGradient id={`sh_${id}`} x1="10%" y1="0%" x2="60%" y2="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Gum line gradient */}
        <linearGradient id={`gu_${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e8a0a0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#e8a0a0" stopOpacity="0" />
        </linearGradient>
        <filter id={`ds_${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Roots */}
      {geo.roots && geo.roots.map((r, i) => (
        <g key={i}>
          <path d={r.path} fill={`url(#rg_${id})`} stroke={strokeColor} strokeWidth="0.8" opacity={isAusente ? 0.3 : 0.85} />
          {r.highlight && <path d={r.highlight} fill="#fff" opacity="0.25" />}
        </g>
      ))}

      {/* Gum line visual overlay near crown/root junction */}
      <rect
        x="2" y={rootUp ? (geo.height - 55) : 30}
        width={geo.width - 4} height="10"
        fill={`url(#gu_${id})`}
        rx="3"
        opacity="0.6"
      />

      {/* Crown body */}
      <g filter={`url(#ds_${id})`} opacity={isAusente ? 0.4 : 1}>
        <path d={geo.crown} fill={`url(#cg_${id})`} stroke={strokeColor} strokeWidth="1.2" strokeLinejoin="round" />
      </g>

      {/* Cúspides */}
      {geo.cuspids && geo.cuspids.map((c, i) => (
        <g key={i}>
          <path d={c.path} fill={`url(#cg_${id})`} stroke={strokeColor} strokeWidth="0.9" />
          {c.hi && <path d={c.hi} fill="#fff" opacity="0.35" />}
        </g>
      ))}

      {/* Sulcos anatômicos */}
      {geo.sulcos && geo.sulcos.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={strokeColor} strokeWidth="0.6" opacity="0.35" strokeLinecap="round" />
      ))}

      {/* Enamel shine highlight */}
      <path d={geo.crownHighlight} fill={`url(#sh_${id})`} />

      {/* Ausente X */}
      {isAusente && (
        <g>
          <line x1="8" y1="10" x2="36" y2="38" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="36" y1="10" x2="8" y2="38" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export default function Dente({ fdi, onClick, status }) {
  const displayKey = String(status || 'vazio');
  const cfg = statusConfig[displayKey] || statusConfig['vazio'];
  const isAusente = displayKey === 'ausente';
  const isPlano = displayKey.includes('plano');
  const isTratado = displayKey.includes('tratado');

  const BadgeIcon = isPlano ? FaStethoscope : isTratado ? FaCheck : null;
  const badgeColor = isPlano ? '#dc2626' : '#16a34a';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 40,
        cursor: isAusente ? 'default' : 'pointer',
        userSelect: 'none',
        flexShrink: 0,
      }}
      onClick={() => !isAusente && onClick && onClick(fdi)}
      title={`Dente ${fdi} – ${displayKey}`}
    >
      {/* Tooth container */}
      <div
        style={{
          position: 'relative',
          width: 36,
          height: 72,
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => { if (!isAusente) e.currentTarget.style.transform = 'scale(1.12) translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <ToothSVG
          fdi={fdi}
          crownColors={cfg.crown}
          rootColors={cfg.root}
          strokeColor={cfg.stroke}
          isAusente={isAusente}
        />

        {/* Status badge */}
        {BadgeIcon && (
          <div style={{
            position: 'absolute',
            top: -2,
            right: -4,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 0 4px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <BadgeIcon style={{ fontSize: 7, color: badgeColor }} />
          </div>
        )}
      </div>

      {/* FDI label */}
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        color: '#4b5563',
        fontFamily: 'monospace',
        marginTop: 2,
        letterSpacing: '0.02em',
      }}>
        {fdi}
      </span>
    </div>
  );
}