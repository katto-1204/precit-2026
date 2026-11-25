import type { DiagramType } from '@/domain/diagramSpecs';

/**
 * Crisp visual SVG symbol icons for the TOPCIT IBT left shape palette
 * so every diagram object looks unmistakably like its real UML/ERD/Flowchart/UI notation.
 */
export function PaletteShapeIcon({ shapeType }: { shapeType: string }) {
  switch (shapeType) {
    case 'initial':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <circle cx="20" cy="14" r="8" fill="#0f172a" />
        </svg>
      );
    case 'final':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <circle cx="20" cy="14" r="9" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <circle cx="20" cy="14" r="5" fill="#0f172a" />
        </svg>
      );
    case 'flow_final':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <circle cx="20" cy="14" r="8.5" fill="#ffffff" stroke="#334155" strokeWidth="1.8" />
          <line x1="14" y1="8" x2="26" y2="20" stroke="#334155" strokeWidth="1.8" />
          <line x1="26" y1="8" x2="14" y2="20" stroke="#334155" strokeWidth="1.8" />
        </svg>
      );
    case 'action':
    case 'terminator':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <rect
            x="4"
            y="5"
            width="32"
            height="18"
            rx="9"
            fill={shapeType === 'terminator' ? '#0f172a' : '#ffffff'}
            stroke="#334155"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'decision':
    case 'relationship':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <polygon
            points="20,2 36,14 20,26 4,14"
            fill="#fef2f2"
            stroke="#c81e1e"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'fork_join':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <rect x="4" y="11" width="32" height="6" rx="1" fill="#0f172a" />
        </svg>
      );
    case 'swimlane':
    case 'package':
    case 'subsystem':
    case 'system_boundary':
    case 'fragment_alt':
    case 'fragment_loop':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <rect
            x="4"
            y="3"
            width="32"
            height="22"
            rx="2"
            fill="#f8fafc"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray={shapeType === 'system_boundary' || shapeType.startsWith('fragment') ? '3 2' : undefined}
          />
          <line x1="4" y1="10" x2="36" y2="10" stroke="#94a3b8" strokeWidth="1.2" />
        </svg>
      );
    case 'class':
    case 'abstract_class':
    case 'interface':
    case 'enum':
    case 'entity':
    case 'associative_entity':
    case 'weak_entity':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <rect
            x="4"
            y="3"
            width="32"
            height="22"
            rx="2"
            fill={shapeType === 'interface' || shapeType === 'associative_entity' ? '#fef2f2' : '#ffffff'}
            stroke={shapeType === 'interface' || shapeType === 'associative_entity' ? '#c81e1e' : '#0f172a'}
            strokeWidth="1.6"
          />
          <line x1="4" y1="10" x2="36" y2="10" stroke="#94a3b8" strokeWidth="1.2" />
          <line x1="4" y1="18" x2="36" y2="18" stroke="#cbd5e1" strokeWidth="1" />
        </svg>
      );
    case 'actor':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <circle cx="20" cy="6" r="3.5" fill="none" stroke="#0f172a" strokeWidth="1.6" />
          <line x1="20" y1="9.5" x2="20" y2="19" stroke="#0f172a" strokeWidth="1.6" />
          <line x1="12" y1="13" x2="28" y2="13" stroke="#0f172a" strokeWidth="1.6" />
          <line x1="20" y1="19" x2="14" y2="26" stroke="#0f172a" strokeWidth="1.6" />
          <line x1="20" y1="19" x2="26" y2="26" stroke="#0f172a" strokeWidth="1.6" />
        </svg>
      );
    case 'usecase':
    case 'attribute':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <ellipse cx="20" cy="14" rx="16" ry="9" fill="#ffffff" stroke="#334155" strokeWidth="1.7" />
        </svg>
      );
    case 'lifeline':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <rect x="8" y="2" width="24" height="9" rx="1.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="20" y1="11" x2="20" y2="27" stroke="#64748b" strokeWidth="1.6" strokeDasharray="3 2" />
        </svg>
      );
    case 'activation':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <rect x="16" y="3" width="8" height="22" rx="1" fill="#fee2e2" stroke="#c81e1e" strokeWidth="1.5" />
        </svg>
      );
    case 'database':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <ellipse cx="20" cy="7" rx="12" ry="4" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.5" />
          <path d="M8 7 v14 a12 4 0 0 0 24 0 v-14" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.5" />
        </svg>
      );
    case 'component':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <rect x="8" y="4" width="26" height="20" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.6" />
          <rect x="4" y="8" width="7" height="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.3" />
          <rect x="4" y="16" width="7" height="4" fill="#ffffff" stroke="#0f172a" strokeWidth="1.3" />
        </svg>
      );
    case 'io':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <polygon points="9,5 36,5 31,23 4,23" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.6" />
        </svg>
      );
    case 'ui_button':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <rect x="5" y="7" width="30" height="14" rx="4" fill="#c81e1e" />
          <line x1="12" y1="14" x2="28" y2="14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'ui_window':
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <rect x="3" y="3" width="34" height="22" rx="3" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
          <line x1="3" y1="9" x2="37" y2="9" stroke="#cbd5e1" strokeWidth="1.2" />
          <circle cx="7" cy="6" r="1.2" fill="#ef4444" />
          <circle cx="11" cy="6" r="1.2" fill="#f59e0b" />
          <circle cx="15" cy="6" r="1.2" fill="#10b981" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 40 28" className="h-7 w-10">
          <rect x="5" y="5" width="30" height="18" rx="3" fill="#ffffff" stroke="#334155" strokeWidth="1.6" />
        </svg>
      );
  }
}

/**
 * Miniature diagram preview thumbnails for the 8 TOPCIT Diagram Lab category cards.
 */
export function DiagramCategoryPreview({ type }: { type: DiagramType }) {
  return (
    <div className="flex h-24 w-full items-center justify-center rounded-md border border-slate-200 bg-slate-50/70 bg-[radial-gradient(#cbd5e1_0.8px,transparent_0.8px)] [background-size:10px_10px] p-2">
      {type === 'uml_activity' ? (
        <svg viewBox="0 0 180 76" className="h-full w-full">
          <circle cx="22" cy="38" r="6" fill="#0f172a" />
          <line x1="28" y1="38" x2="46" y2="38" stroke="#475569" strokeWidth="1.5" />
          <rect x="46" y="25" width="46" height="26" rx="8" fill="#fff" stroke="#334155" strokeWidth="1.5" />
          <text x="69" y="41" textAnchor="middle" fontSize="8" fill="#0f172a">Enroll</text>
          <line x1="92" y1="38" x2="108" y2="38" stroke="#475569" strokeWidth="1.5" />
          <polygon points="122,22 136,38 122,54 108,38" fill="#fef2f2" stroke="#c81e1e" strokeWidth="1.5" />
          <line x1="136" y1="38" x2="152" y2="38" stroke="#475569" strokeWidth="1.5" />
          <circle cx="160" cy="38" r="7" fill="#fff" stroke="#0f172a" strokeWidth="1.6" />
          <circle cx="160" cy="38" r="3.5" fill="#0f172a" />
        </svg>
      ) : type === 'uml_class' ? (
        <svg viewBox="0 0 180 76" className="h-full w-full">
          <rect x="12" y="14" width="60" height="48" rx="3" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="12" y1="28" x2="72" y2="28" stroke="#cbd5e1" />
          <line x1="12" y1="45" x2="72" y2="45" stroke="#cbd5e1" />
          <text x="42" y="23" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0f172a">Order</text>
          <line x1="72" y1="38" x2="108" y2="38" stroke="#c81e1e" strokeWidth="1.5" />
          <rect x="108" y="14" width="60" height="48" rx="3" fill="#fef2f2" stroke="#c81e1e" strokeWidth="1.5" />
          <line x1="108" y1="28" x2="168" y2="28" stroke="#fecaca" />
          <text x="138" y="23" textAnchor="middle" fontSize="8" fontWeight="700" fill="#9b1c1c">Item</text>
        </svg>
      ) : type === 'uml_component' ? (
        <svg viewBox="0 0 180 76" className="h-full w-full">
          <rect x="14" y="18" width="54" height="38" rx="3" fill="#fef2f2" stroke="#c81e1e" strokeWidth="1.5" />
          <text x="41" y="40" textAnchor="middle" fontSize="8" fontWeight="700" fill="#9b1c1c">WAF/LB</text>
          <line x1="68" y1="37" x2="108" y2="37" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />
          <rect x="108" y="18" width="58" height="38" rx="3" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
          <text x="137" y="40" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0f172a">App API</text>
        </svg>
      ) : type === 'er_diagram' ? (
        <svg viewBox="0 0 180 76" className="h-full w-full">
          <rect x="10" y="14" width="58" height="48" rx="3" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="10" y="14" width="58" height="14" fill="#f1f5f9" stroke="#0f172a" strokeWidth="1.2" />
          <text x="39" y="24" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#0f172a">STUDENT</text>
          <text x="16" y="39" fontSize="7" fill="#c81e1e">PK id</text>
          <line x1="68" y1="38" x2="108" y2="38" stroke="#334155" strokeWidth="1.5" />
          <text x="88" y="33" textAnchor="middle" fontSize="7" fill="#475569">1 : N</text>
          <rect x="108" y="14" width="62" height="48" rx="3" fill="#fef2f2" stroke="#c81e1e" strokeWidth="1.5" />
          <text x="139" y="24" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#9b1c1c">ENROLL</text>
          <text x="114" y="39" fontSize="7" fill="#475569">FK student_id</text>
        </svg>
      ) : type === 'flowchart' ? (
        <svg viewBox="0 0 180 76" className="h-full w-full">
          <rect x="10" y="26" width="38" height="22" rx="11" fill="#0f172a" />
          <text x="29" y="40" textAnchor="middle" fontSize="7.5" fill="#fff">START</text>
          <line x1="48" y1="37" x2="64" y2="37" stroke="#334155" strokeWidth="1.5" />
          <polygon points="84,18 104,37 84,56 64,37" fill="#fef2f2" stroke="#c81e1e" strokeWidth="1.5" />
          <text x="84" y="39" textAnchor="middle" fontSize="7" fill="#9b1c1c">x&gt;0?</text>
          <line x1="104" y1="37" x2="122" y2="37" stroke="#334155" strokeWidth="1.5" />
          <rect x="122" y="25" width="46" height="24" rx="2" fill="#fff" stroke="#334155" strokeWidth="1.5" />
          <text x="145" y="40" textAnchor="middle" fontSize="7.5" fill="#0f172a">Compute</text>
        </svg>
      ) : type === 'uml_sequence' ? (
        <svg viewBox="0 0 180 76" className="h-full w-full">
          <rect x="24" y="8" width="44" height="16" rx="2" fill="#fff" stroke="#0f172a" strokeWidth="1.4" />
          <text x="46" y="19" textAnchor="middle" fontSize="7.5" fill="#0f172a">Client</text>
          <line x1="46" y1="24" x2="46" y2="68" stroke="#94a3b8" strokeDasharray="3 2" />
          <rect x="112" y="8" width="48" height="16" rx="2" fill="#fef2f2" stroke="#c81e1e" strokeWidth="1.4" />
          <text x="136" y="19" textAnchor="middle" fontSize="7.5" fill="#9b1c1c">:Auth</text>
          <line x1="136" y1="24" x2="136" y2="68" stroke="#94a3b8" strokeDasharray="3 2" />
          <line x1="46" y1="38" x2="134" y2="38" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="134" y1="54" x2="48" y2="54" stroke="#c81e1e" strokeWidth="1.4" strokeDasharray="3 2" />
        </svg>
      ) : type === 'ui_wireframe' ? (
        <svg viewBox="0 0 180 76" className="h-full w-full">
          <rect x="26" y="8" width="128" height="60" rx="4" fill="#fff" stroke="#334155" strokeWidth="1.4" />
          <rect x="26" y="8" width="128" height="12" rx="3" fill="#0f172a" />
          <rect x="36" y="28" width="70" height="12" rx="2" fill="#f8fafc" stroke="#94a3b8" />
          <rect x="36" y="46" width="46" height="14" rx="3" fill="#c81e1e" />
          <rect x="114" y="28" width="32" height="32" rx="2" fill="#f1f5f9" stroke="#cbd5e1" />
        </svg>
      ) : (
        <svg viewBox="0 0 180 76" className="h-full w-full">
          <circle cx="28" cy="24" r="5" fill="none" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="28" y1="29" x2="28" y2="48" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="18" y1="36" x2="38" y2="36" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="28" y1="48" x2="20" y2="60" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="28" y1="48" x2="36" y2="60" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="58" y="8" width="110" height="60" rx="3" fill="#fff" stroke="#94a3b8" strokeDasharray="3 2" />
          <ellipse cx="113" cy="38" rx="40" ry="15" fill="#fef2f2" stroke="#c81e1e" strokeWidth="1.5" />
          <text x="113" y="41" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="#9b1c1c">Withdraw</text>
          <line x1="38" y1="38" x2="73" y2="38" stroke="#334155" strokeWidth="1.4" />
        </svg>
      )}
    </div>
  );
}
