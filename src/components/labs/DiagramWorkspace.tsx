import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  AlignCenterHorizontal,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpToLine,
  CheckCircle2,
  ClipboardPaste,
  Clock,
  Copy,
  Download,
  Expand,
  FileJson,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  MousePointer,
  Move,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { DiagramNodeRenderer } from '@/components/labs/DiagramNodeRenderer';
import { PaletteShapeIcon } from '@/components/labs/PaletteShapeIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/db/database';
import {
  CONNECTOR_META,
  evaluateDiagramGraph,
  exportDiagramToSvg,
  getDiagramCategory,
  type ConnectorStyle,
  type DiagramEvaluationResult,
  type DiagramNodeData,
  type DiagramType,
  type PaletteShapeDef,
} from '@/domain/diagramSpecs';
import type { SavedDiagram } from '@/domain/schemas';

const NODE_TYPES = {
  prepcitNode: DiagramNodeRenderer,
};

const QUICK_FILL_SWATCHES = ['#ffffff', '#f8fafc', '#fef2f2', '#eff6ff', '#ecfdf5', '#fffbeb', '#0f172a', '#c81e1e'];
const QUICK_STROKE_SWATCHES = ['#0f172a', '#334155', '#c81e1e', '#0284c7', '#059669', '#d97706', '#64748b'];

interface DiagramWorkspaceProps {
  diagramType: DiagramType;
  mode: 'blank' | 'guided' | 'timed';
  initialSaved?: SavedDiagram | null;
  embedded?: boolean;
  onChangeGraphJson?: (json: string) => void;
  onBack?: () => void;
}

interface GraphSnapshot {
  nodes: Node<DiagramNodeData>[];
  edges: Edge[];
}

function buildEdgeStyle(connector: ConnectorStyle, customLabel?: string): Partial<Edge> {
  const meta = CONNECTOR_META[connector];
  return {
    label: customLabel ?? meta.defaultLabel ?? '',
    type: connector.includes('message') || connector === 'include' || connector === 'extend' ? 'straight' : 'smoothstep',
    style: {
      stroke: connector === 'include' || connector === 'extend' ? '#c81e1e' : '#334155',
      strokeWidth: 1.8,
      ...(meta.dashed ? { strokeDasharray: '6 4' } : {}),
    },
    ...(meta.markerEnd
      ? {
          markerEnd: {
            type: meta.markerEnd === 'arrowclosed' ? MarkerType.ArrowClosed : MarkerType.Arrow,
            color: connector === 'include' || connector === 'extend' ? '#c81e1e' : '#334155',
          },
        }
      : {}),
    data: { connectorStyle: connector },
  };
}

function DiagramCanvasInner({
  diagramType,
  mode,
  initialSaved,
  embedded = false,
  onChangeGraphJson,
  onBack,
}: DiagramWorkspaceProps) {
  const spec = getDiagramCategory(diagramType);
  const reactFlow = useReactFlow();
  const rootContainerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  const initialGraph = useMemo<GraphSnapshot>(() => {
    if (initialSaved) {
      try {
        return {
          nodes: JSON.parse(initialSaved.nodesJson) as Node<DiagramNodeData>[],
          edges: JSON.parse(initialSaved.edgesJson) as Edge[],
        };
      } catch {
        // Fallback
      }
    }
    if (mode === 'guided' || mode === 'timed') {
      return {
        nodes: spec.guidedPrompt.starterNodes.map((n) => ({
          ...n,
          style: { width: n.data.width, height: n.data.height },
        })),
        edges: spec.guidedPrompt.starterEdges,
      };
    }
    return { nodes: [], edges: [] };
  }, [initialSaved, mode, spec]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<DiagramNodeData>>(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialGraph.edges);

  const [diagramId] = useState(() => initialSaved?.id ?? `diag-${diagramType}-${Date.now()}`);
  const [title, setTitle] = useState(
    initialSaved?.title ??
      (mode === 'blank' ? `Untitled ${spec.name}` : `${spec.guidedPrompt.title}`),
  );
  const [toolMode, setToolMode] = useState<'select' | 'pan'>('select');
  const [activeConnector, setActiveConnector] = useState<ConnectorStyle>(spec.defaultConnector);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false); // Collapsed by default like TOPCIT IBT editor
  const [inspectorTab, setInspectorTab] = useState<'text' | 'style' | 'arrange'>('text');
  const [paletteSearch, setPaletteSearch] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<DiagramEvaluationResult | null>(null);
  const [timedSeconds, setTimedSeconds] = useState<number | null>(mode === 'timed' ? 1200 : null);
  const [clipboardNodes, setClipboardNodes] = useState<Node<DiagramNodeData>[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  const [past, setPast] = useState<GraphSnapshot[]>([]);
  const [future, setFuture] = useState<GraphSnapshot[]>([]);

  const pushHistory = useCallback(
    (snapshotNodes: Node<DiagramNodeData>[], snapshotEdges: Edge[]) => {
      setPast((prev) => [...prev.slice(-29), { nodes: snapshotNodes, edges: snapshotEdges }]);
      setFuture([]);
    },
    [],
  );

  useEffect(() => {
    if (onChangeGraphJson) {
      onChangeGraphJson(JSON.stringify({ diagramType, nodes, edges }));
    }
  }, [diagramType, nodes, edges, onChangeGraphJson]);

  useEffect(() => {
    if (timedSeconds === null || timedSeconds <= 0) return;
    const t = window.setInterval(() => {
      setTimedSeconds((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    }, 1000);
    return () => window.clearInterval(t);
  }, [timedSeconds]);

  const selectedNode = useMemo(() => nodes.find((n) => n.selected) ?? null, [nodes]);
  const selectedEdge = useMemo(() => edges.find((e) => e.selected) ?? null, [edges]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      pushHistory(nodes, edges);
      const styled = buildEdgeStyle(activeConnector);
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            ...styled,
            id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          },
          eds,
        ),
      );
    },
    [activeConnector, edges, nodes, pushHistory, setEdges],
  );

  const insertShape = useCallback(
    (shape: PaletteShapeDef, position?: { x: number; y: number }) => {
      pushHistory(nodes, edges);
      const offset = (nodes.length % 6) * 28;
      const pos = position ?? { x: 160 + offset, y: 90 + offset };
      const newNode: Node<DiagramNodeData> = {
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type: 'prepcitNode',
        position: pos,
        style: { width: shape.defaultWidth, height: shape.defaultHeight },
        data: {
          shapeType: shape.shapeType,
          diagramType,
          label: shape.defaultText,
          details: shape.defaultDetails ?? '',
          fillColor: shape.defaultFill,
          strokeColor: shape.defaultStroke,
          strokeWidth: 2,
          fontSize: 12,
          textAlign: shape.defaultDetails ? 'left' : 'center',
          width: shape.defaultWidth,
          height: shape.defaultHeight,
        },
      };
      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), { ...newNode, selected: true }]);
    },
    [diagramType, edges, nodes, pushHistory, setNodes],
  );

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture((f) => [{ nodes, edges }, ...f]);
    setPast((p) => p.slice(0, -1));
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [edges, nodes, past, setEdges, setNodes]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast((p) => [...p, { nodes, edges }]);
    setFuture((f) => f.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [edges, future, nodes, setEdges, setNodes]);

  const handleDeleteSelected = useCallback(() => {
    const selectedNodeIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    const hasSelectedEdges = edges.some((e) => e.selected);
    if (selectedNodeIds.size === 0 && !hasSelectedEdges) return;
    pushHistory(nodes, edges);
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) =>
      eds.filter((e) => !e.selected && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)),
    );
  }, [edges, nodes, pushHistory, setEdges, setNodes]);

  const handleCopySelected = useCallback(() => {
    const sel = nodes.filter((n) => n.selected);
    if (sel.length === 0) return;
    setClipboardNodes(sel.map((n) => ({ ...n, data: { ...n.data } })));
  }, [nodes]);

  const handlePasteClipboard = useCallback(() => {
    if (clipboardNodes.length === 0) return;
    pushHistory(nodes, edges);
    const pasted: Node<DiagramNodeData>[] = clipboardNodes.map((n) => ({
      ...n,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      position: { x: n.position.x + 42, y: n.position.y + 42 },
      selected: true,
    }));
    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...pasted]);
  }, [clipboardNodes, edges, nodes, pushHistory, setNodes]);

  const handleDuplicateSelected = useCallback(() => {
    const selected = nodes.filter((n) => n.selected);
    if (selected.length === 0) return;
    pushHistory(nodes, edges);
    const clones: Node<DiagramNodeData>[] = selected.map((n) => ({
      ...n,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      position: { x: n.position.x + 36, y: n.position.y + 36 },
      selected: true,
    }));
    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...clones]);
  }, [edges, nodes, pushHistory, setNodes]);

  const handleLayerOrder = useCallback(
    (direction: 'front' | 'back') => {
      if (!selectedNode) return;
      pushHistory(nodes, edges);
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? { ...n, zIndex: direction === 'front' ? (n.zIndex ?? 0) + 10 : Math.max(-10, (n.zIndex ?? 0) - 10) }
            : n,
        ),
      );
    },
    [edges, nodes, pushHistory, selectedNode, setNodes],
  );

  const handleAlign = useCallback(
    (axis: 'left' | 'center') => {
      const sel = nodes.filter((n) => n.selected);
      const targets = sel.length >= 2 ? sel : nodes;
      if (targets.length < 2) return;
      pushHistory(nodes, edges);
      const targetX =
        axis === 'left'
          ? Math.min(...targets.map((n) => n.position.x))
          : Math.round(targets.reduce((acc, n) => acc + n.position.x, 0) / targets.length);
      const targetIds = new Set(targets.map((t) => t.id));
      setNodes((nds) =>
        nds.map((n) => (targetIds.has(n.id) ? { ...n, position: { ...n.position, x: targetX } } : n)),
      );
    },
    [edges, nodes, pushHistory, setNodes],
  );

  const handleDistributeHorizontal = useCallback(() => {
    const sel = nodes.filter((n) => n.selected);
    const targets = sel.length >= 3 ? sel : nodes;
    if (targets.length < 3) return;
    pushHistory(nodes, edges);
    const sorted = [...targets].sort((a, b) => a.position.x - b.position.x);
    const minX = sorted[0].position.x;
    const maxX = sorted[sorted.length - 1].position.x;
    const step = (maxX - minX) / (sorted.length - 1);
    const posMap = new Map(sorted.map((n, i) => [n.id, Math.round(minX + step * i)]));
    setNodes((nds) =>
      nds.map((n) =>
        posMap.has(n.id) ? { ...n, position: { ...n.position, x: posMap.get(n.id)! } } : n,
      ),
    );
  }, [edges, nodes, pushHistory, setNodes]);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;
    pushHistory(nodes, edges);
    const cols = Math.max(2, Math.ceil(Math.sqrt(nodes.length)));
    setNodes((nds) =>
      nds.map((n, idx) => ({
        ...n,
        position: {
          x: 60 + (idx % cols) * 240,
          y: 50 + Math.floor(idx / cols) * 165,
        },
      })),
    );
    window.setTimeout(() => reactFlow.fitView({ padding: 0.15 }), 50);
  }, [edges, nodes, pushHistory, reactFlow, setNodes]);

  const handleToggleFullscreen = useCallback(() => {
    const el = rootContainerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (el.requestFullscreen) {
      void el.requestFullscreen();
    }
  }, []);

  const updateSelectedNodeData = useCallback(
    (patch: Partial<DiagramNodeData>) => {
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== selectedNode.id) return n;
          const nextData = { ...n.data, ...patch };
          return {
            ...n,
            style: { ...n.style, width: nextData.width, height: nextData.height },
            data: nextData,
          };
        }),
      );
    },
    [selectedNode, setNodes],
  );

  const updateSelectedEdge = useCallback(
    (label: string, style?: ConnectorStyle) => {
      if (!selectedEdge) return;
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== selectedEdge.id) return e;
          const styled = style ? buildEdgeStyle(style, label) : { label };
          return { ...e, ...styled };
        }),
      );
    },
    [selectedEdge, setEdges],
  );

  async function handleSaveToDb() {
    const record: SavedDiagram = {
      id: diagramId,
      title: title.trim() || `Untitled ${spec.name}`,
      diagramType,
      nodesJson: JSON.stringify(nodes),
      edgesJson: JSON.stringify(edges),
      updatedAt: new Date().toISOString(),
    };
    await db.savedDiagrams.put(record);
    setSaveMessage(`Saved "${record.title}" to local IndexedDB.`);
    window.setTimeout(() => setSaveMessage(null), 3000);
  }

  function handleExportJson() {
    const payload = JSON.stringify({ title, diagramType, nodes, edges }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagramType}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportSvg() {
    const svg = exportDiagramToSvg(title, nodes, edges);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagramType}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportPng() {
    const svg = exportDiagramToSvg(title, nodes, edges);
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 900;
      canvas.height = img.height || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${diagramType}-${Date.now()}.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  const filteredPalette = spec.palette.filter((p) => {
    const q = paletteSearch.trim().toLowerCase();
    if (!q) return true;
    return p.label.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteClipboard();
      } else if (e.key === 'Delete') {
        handleDeleteSelected();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCopySelected, handleDeleteSelected, handlePasteClipboard, handleRedo, handleUndo]);

  return (
    <div
      ref={rootContainerRef}
      onClick={() => setContextMenu(null)}
      className={`prepcit-ibt-canvas flex flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xs ${
        embedded ? 'h-[580px]' : 'h-[calc(100vh-110px)] min-h-[640px]'
      }`}
    >
      {/* Row 1: Crisp Official TOPCIT IBT Document Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {onBack ? (
            <Button variant="ghost" size="sm" onClick={onBack} className="h-7 px-2 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Categories
            </Button>
          ) : null}
          <Badge variant="brand" className="shrink-0">
            IBT · {spec.shortName}
          </Badge>
          <Input
            aria-label="Diagram title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-7 w-44 text-xs font-semibold sm:w-64"
          />
          {timedSeconds !== null ? (
            <Badge variant={timedSeconds < 180 ? 'danger' : 'warning'} className="font-mono shrink-0">
              <Clock className="h-3 w-3" />
              {Math.floor(timedSeconds / 60)}:{String(timedSeconds % 60).padStart(2, '0')}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => setEvaluation(evaluateDiagramGraph(diagramType, nodes, edges, 50))}>
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
            Validate
          </Button>
          <Button size="sm" variant="primary" className="h-7 px-2.5 text-xs" onClick={() => void handleSaveToDb()}>
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" title="Export SVG" aria-label="Export SVG" onClick={handleExportSvg}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SVG</span>
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" title="Export PNG" aria-label="Export PNG" onClick={handleExportPng}>
            <ImageIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">PNG</span>
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" title="Export JSON" aria-label="Export JSON" onClick={handleExportJson}>
            <FileJson className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant={inspectorOpen ? 'secondary' : 'outline'}
            className="h-7 px-2.5 text-xs"
            title="Toggle Properties Inspector"
            aria-label="Toggle Properties Inspector"
            onClick={() => setInspectorOpen((o) => !o)}
          >
            {inspectorOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
            Inspector
          </Button>
        </div>
      </div>

      {/* Row 2: Compact Single-Row Horizontal IBT Editing Toolbar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-100/90 px-2.5 py-1.5">
        <div className="flex items-center rounded border border-slate-300 bg-white p-0.5">
          <button
            type="button"
            title="Select Tool"
            aria-label="Select Tool"
            onClick={() => setToolMode('select')}
            className={`rounded px-1.5 py-1 cursor-pointer ${toolMode === 'select' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <MousePointer className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Pan Tool"
            aria-label="Pan Tool"
            onClick={() => setToolMode('pan')}
            className={`rounded px-1.5 py-1 cursor-pointer ${toolMode === 'pan' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Move className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Zoom In" aria-label="Zoom In" onClick={() => reactFlow.zoomIn()}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Zoom Out" aria-label="Zoom Out" onClick={() => reactFlow.zoomOut()}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-1.5 font-mono text-[10px]" title="Reset Zoom (100%)" aria-label="Reset Zoom" onClick={() => reactFlow.zoomTo(1)}>
          100%
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Fit Diagram" aria-label="Fit Diagram" onClick={() => reactFlow.fitView({ padding: 0.15 })}>
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Undo (Ctrl+Z)" aria-label="Undo" disabled={past.length === 0} onClick={handleUndo}>
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Redo (Ctrl+Y)" aria-label="Redo" disabled={future.length === 0} onClick={handleRedo}>
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Copy (Ctrl+C)" aria-label="Copy" disabled={!selectedNode} onClick={handleCopySelected}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Paste (Ctrl+V)" aria-label="Paste" disabled={clipboardNodes.length === 0} onClick={handlePasteClipboard}>
          <ClipboardPaste className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Delete Selected" aria-label="Delete" disabled={!selectedNode && !selectedEdge} onClick={handleDeleteSelected}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Bring Forward" aria-label="Bring Forward" disabled={!selectedNode} onClick={() => handleLayerOrder('front')}>
          <ArrowUpToLine className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Send Backward" aria-label="Send Backward" disabled={!selectedNode} onClick={() => handleLayerOrder('back')}>
          <ArrowDownToLine className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Align Left" aria-label="Align Left" onClick={() => handleAlign('left')}>
          <AlignStartHorizontal className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Align Center" aria-label="Align Center" onClick={() => handleAlign('center')}>
          <AlignCenterHorizontal className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Distribute Horizontally" aria-label="Distribute Horizontally" onClick={handleDistributeHorizontal}>
          <AlignHorizontalDistributeCenter className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Auto Layout" aria-label="Auto Layout" onClick={handleAutoLayout}>
          <LayoutGrid className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Fullscreen" aria-label="Toggle Fullscreen" onClick={handleToggleFullscreen}>
          <Expand className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-0.5 h-5 w-px shrink-0 bg-slate-300" />

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-medium text-slate-600">Connector:</span>
          <select
            aria-label="Connector Type"
            value={activeConnector}
            onChange={(e) => setActiveConnector(e.target.value as ConnectorStyle)}
            className="h-7 rounded border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-800"
          >
            {spec.availableConnectors.map((c) => (
              <option key={c} value={c}>
                {CONNECTOR_META[c].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Prompt Banner */}
      {mode !== 'blank' && !embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-200 bg-brand-50/50 px-4 py-2 text-xs text-slate-800">
          <span>
            <strong className="font-semibold text-brand-700">IBT Task:</strong>{' '}
            {spec.guidedPrompt.prompt}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => {
              pushHistory(nodes, edges);
              setNodes(initialGraph.nodes);
              setEdges(initialGraph.edges);
            }}
          >
            <RotateCcw className="h-3 w-3" />
            Reset Starter
          </Button>
        </div>
      ) : null}

      {saveMessage ? (
        <div role="status" className="border-b border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-800">
          {saveMessage}
        </div>
      ) : null}

      {/* Main 3-Pane TOPCIT IBT Studio: Left Visual Shape Palette | Crisp White Graph Canvas | Collapsible Right Inspector */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Visual Shape Palette (2-column SVG symbol grid) */}
        <aside
          aria-label="Diagram Shape Palette"
          className={`flex shrink-0 flex-col border-r border-slate-300 bg-slate-50 transition-all ${
            paletteOpen ? 'w-60' : 'w-10'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/70 px-2.5 py-2">
            {paletteOpen ? (
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                <Layers className="h-3.5 w-3.5 text-brand-600" />
                {spec.shortName} Objects
              </span>
            ) : null}
            <button
              type="button"
              aria-label={paletteOpen ? 'Collapse shape palette' : 'Expand shape palette'}
              onClick={() => setPaletteOpen((o) => !o)}
              className="rounded p-1 text-slate-500 hover:bg-slate-200 cursor-pointer"
            >
              {paletteOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
            </button>
          </div>

          {paletteOpen ? (
            <>
              <div className="p-2 border-b border-slate-200 bg-white">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    aria-label="Search shapes"
                    placeholder="Search shapes..."
                    value={paletteSearch}
                    onChange={(e) => setPaletteSearch(e.target.value)}
                    className="h-7 pl-7 text-xs"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {filteredPalette.map((shape) => (
                    <button
                      key={shape.shapeType}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/prepcit-shape', JSON.stringify(shape));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onClick={() => insertShape(shape)}
                      title={`Click or drag to insert ${shape.label}`}
                      className="flex flex-col items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-2.5 text-center transition-all hover:border-brand-500 hover:bg-brand-50/40 hover:shadow-xs cursor-grab active:cursor-grabbing"
                    >
                      <PaletteShapeIcon shapeType={shape.shapeType} />
                      <span className="line-clamp-2 text-[10px] font-medium leading-tight text-slate-700">
                        {shape.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 rounded border border-slate-200 bg-white p-2 text-[10px] leading-relaxed text-slate-500">
                  <strong>Tip:</strong> Click or drag shapes onto the grid. Drag between red/slate handle dots to connect. Double-click any object to open Properties.
                </p>
              </div>
            </>
          ) : null}
        </aside>

        {/* Center Pure-White Engineering Graph-Paper Canvas (Forced Light Mode) */}
        <div
          ref={canvasWrapperRef}
          className="relative flex-1 min-w-0 bg-white"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            const raw = e.dataTransfer.getData('application/prepcit-shape');
            if (!raw) return;
            try {
              const shape = JSON.parse(raw) as PaletteShapeDef;
              const position = reactFlow.screenToFlowPosition({
                x: e.clientX,
                y: e.clientY,
              });
              insertShape(shape, position);
            } catch {
              // ignore
            }
          }}
        >
          <ReactFlow
            className="light"
            style={{ backgroundColor: '#ffffff' }}
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeDoubleClick={() => setInspectorOpen(true)}
            onNodeContextMenu={(e, node) => {
              e.preventDefault();
              setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
              setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
            }}
            onEdgeClick={() => setInspectorOpen(true)}
            snapToGrid
            snapGrid={[15, 15]}
            panOnDrag={toolMode === 'pan'}
            selectionOnDrag={toolMode === 'select'}
            fitView={initialGraph.nodes.length > 0}
            deleteKeyCode={null}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              id="minor-grid"
              variant={BackgroundVariant.Lines}
              gap={20}
              lineWidth={0.7}
              color="#eef2f6"
            />
            <Background
              id="major-grid"
              variant={BackgroundVariant.Lines}
              gap={100}
              lineWidth={1}
              color="#dce3ec"
            />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap
              position="bottom-right"
              nodeColor={(n) => (n.data as DiagramNodeData)?.strokeColor ?? '#334155'}
              className="!border !border-slate-300 !bg-white !shadow-xs"
            />
          </ReactFlow>

          {/* Subtle Empty-Canvas Helper Hint */}
          {nodes.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg border border-dashed border-slate-300 bg-white/90 px-5 py-3 text-center shadow-xs">
                <p className="text-xs font-semibold text-slate-700">
                  {spec.name} Canvas Ready
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Click or drag any shape from the left palette to begin modeling.
                </p>
              </div>
            </div>
          ) : null}

          {/* Right-Click Node Context Menu */}
          {contextMenu ? (
            <div
              role="menu"
              style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
              className="z-50 w-44 rounded-md border border-slate-200 bg-white py-1 text-xs shadow-lg"
            >
              <button
                type="button"
                onClick={() => {
                  setInspectorOpen(true);
                  setContextMenu(null);
                }}
                className="flex w-full px-3 py-1.5 text-left hover:bg-slate-100 cursor-pointer"
              >
                Edit Properties
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDuplicateSelected();
                  setContextMenu(null);
                }}
                className="flex w-full px-3 py-1.5 text-left hover:bg-slate-100 cursor-pointer"
              >
                Duplicate Node
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLayerOrder('front');
                  setContextMenu(null);
                }}
                className="flex w-full px-3 py-1.5 text-left hover:bg-slate-100 cursor-pointer"
              >
                Bring Forward
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLayerOrder('back');
                  setContextMenu(null);
                }}
                className="flex w-full px-3 py-1.5 text-left hover:bg-slate-100 cursor-pointer"
              >
                Send Backward
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteSelected();
                  setContextMenu(null);
                }}
                className="flex w-full px-3 py-1.5 text-left text-red-700 hover:bg-red-50 cursor-pointer"
              >
                Delete Node
              </button>
            </div>
          ) : null}

          {/* Structural Rubric Evaluation Overlay Card */}
          {evaluation ? (
            <div className="absolute right-3 top-3 z-20 w-80 rounded-lg border border-slate-300 bg-white p-3.5 shadow-lg text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Structural Rubric Evaluation</span>
                <button
                  type="button"
                  onClick={() => setEvaluation(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-mono text-lg font-bold text-brand-700">
                  {evaluation.earnedPoints} / {evaluation.maxPoints} pts
                </span>
                <Badge variant={evaluation.scorePercent >= 80 ? 'success' : 'warning'}>
                  {evaluation.scorePercent}% Match
                </Badge>
              </div>
              {evaluation.passedChecks.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[11px] text-emerald-700">
                  {evaluation.passedChecks.map((c) => (
                    <li key={c}>✓ {c}</li>
                  ))}
                </ul>
              ) : null}
              {evaluation.missingChecks.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[11px] text-red-700">
                  {evaluation.missingChecks.map((c) => (
                    <li key={c}>✗ {c}</li>
                  ))}
                </ul>
              ) : null}
              {evaluation.warnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[11px] text-amber-800">
                  {evaluation.warnings.map((w) => (
                    <li key={w}>! {w}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Collapsible Right Properties Inspector (TOPCIT/draw.io Text / Style / Arrange tabs) */}
        {inspectorOpen ? (
          <aside
            aria-label="Properties Inspector"
            className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-slate-300 bg-slate-50 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/70 px-3 py-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                Properties Inspector
              </span>
              <button
                type="button"
                aria-label="Close inspector"
                onClick={() => setInspectorOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedNode ? (
              <>
                <div className="grid grid-cols-3 border-b border-slate-200 bg-white">
                  {(['text', 'style', 'arrange'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setInspectorTab(tab)}
                      className={`py-2 text-[11px] font-semibold capitalize border-b-2 cursor-pointer ${
                        inspectorTab === tab
                          ? 'border-brand-600 text-brand-700 bg-brand-50/30'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="p-3.5 space-y-3">
                  {inspectorTab === 'text' ? (
                    <>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>ID: {selectedNode.id.slice(0, 10)}</span>
                        <Badge variant="neutral">{selectedNode.data.shapeType}</Badge>
                      </div>
                      <div>
                        <label htmlFor="prop-label" className="mb-1 block font-medium text-slate-700">
                          Label
                        </label>
                        <Input
                          id="prop-label"
                          value={selectedNode.data.label}
                          onChange={(e) => updateSelectedNodeData({ label: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="prop-details" className="mb-1 block font-medium text-slate-700">
                          Attributes / Methods / Columns
                        </label>
                        <textarea
                          id="prop-details"
                          rows={5}
                          value={selectedNode.data.details}
                          onChange={(e) => updateSelectedNodeData({ details: e.target.value })}
                          placeholder="e.g. PK id INT&#10;+ method(): void"
                          className="w-full rounded-md border border-slate-300 bg-white p-2 font-mono text-[11px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="prop-font" className="mb-1 block font-medium text-slate-700">
                            Font Size
                          </label>
                          <Input
                            id="prop-font"
                            type="number"
                            min={9}
                            max={22}
                            value={selectedNode.data.fontSize}
                            onChange={(e) =>
                              updateSelectedNodeData({ fontSize: Number(e.target.value) || 12 })
                            }
                            className="h-8 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label htmlFor="prop-align" className="mb-1 block font-medium text-slate-700">
                            Alignment
                          </label>
                          <select
                            id="prop-align"
                            value={selectedNode.data.textAlign}
                            onChange={(e) =>
                              updateSelectedNodeData({
                                textAlign: e.target.value as 'left' | 'center' | 'right',
                              })
                            }
                            className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>
                    </>
                  ) : inspectorTab === 'style' ? (
                    <>
                      <div>
                        <span className="mb-1.5 block font-medium text-slate-700">Fill Color</span>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_FILL_SWATCHES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              aria-label={`Fill ${c}`}
                              onClick={() => updateSelectedNodeData({ fillColor: c })}
                              style={{ backgroundColor: c }}
                              className={`h-6 w-6 rounded border cursor-pointer ${
                                selectedNode.data.fillColor === c
                                  ? 'ring-2 ring-brand-600 border-brand-600'
                                  : 'border-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="mb-1.5 block font-medium text-slate-700">Border Color</span>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_STROKE_SWATCHES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              aria-label={`Stroke ${c}`}
                              onClick={() => updateSelectedNodeData({ strokeColor: c })}
                              style={{ backgroundColor: c }}
                              className={`h-6 w-6 rounded border cursor-pointer ${
                                selectedNode.data.strokeColor === c
                                  ? 'ring-2 ring-brand-600 border-brand-600'
                                  : 'border-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="prop-stroke-w" className="mb-1 block font-medium text-slate-700">
                          Border Width ({selectedNode.data.strokeWidth}px)
                        </label>
                        <input
                          id="prop-stroke-w"
                          type="range"
                          min={1}
                          max={4}
                          value={selectedNode.data.strokeWidth}
                          onChange={(e) =>
                            updateSelectedNodeData({ strokeWidth: Number(e.target.value) })
                          }
                          className="w-full accent-brand-600"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="prop-w" className="mb-1 block font-medium text-slate-700">
                            Width (px)
                          </label>
                          <Input
                            id="prop-w"
                            type="number"
                            min={40}
                            max={600}
                            value={selectedNode.data.width}
                            onChange={(e) =>
                              updateSelectedNodeData({ width: Number(e.target.value) || 120 })
                            }
                            className="h-8 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label htmlFor="prop-h" className="mb-1 block font-medium text-slate-700">
                            Height (px)
                          </label>
                          <Input
                            id="prop-h"
                            type="number"
                            min={30}
                            max={500}
                            value={selectedNode.data.height}
                            onChange={(e) =>
                              updateSelectedNodeData({ height: Number(e.target.value) || 60 })
                            }
                            className="h-8 font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleLayerOrder('front')}>
                          To Front
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleLayerOrder('back')}>
                          To Back
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : selectedEdge ? (
              <div className="p-3.5 space-y-3">
                <p className="text-[11px] font-semibold text-slate-700">Selected Connector</p>
                <div>
                  <label htmlFor="edge-label" className="mb-1 block font-medium text-slate-700">
                    Label / Guard / Multiplicity
                  </label>
                  <Input
                    id="edge-label"
                    value={String(selectedEdge.label ?? '')}
                    onChange={(e) => updateSelectedEdge(e.target.value)}
                    placeholder="e.g. [Yes], 1..*, <<include>>"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="edge-style" className="mb-1 block font-medium text-slate-700">
                    Relationship Type
                  </label>
                  <select
                    id="edge-style"
                    value={(selectedEdge.data?.connectorStyle as ConnectorStyle) ?? activeConnector}
                    onChange={(e) =>
                      updateSelectedEdge(
                        String(selectedEdge.label ?? ''),
                        e.target.value as ConnectorStyle,
                      )
                    }
                    className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    {spec.availableConnectors.map((c) => (
                      <option key={c} value={c}>
                        {CONNECTOR_META[c].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-4 text-slate-500">
                Select any object or connector on the canvas to edit its label, UML attributes/columns, colors, or dimensions.
              </div>
            )}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export function DiagramWorkspace(props: DiagramWorkspaceProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
