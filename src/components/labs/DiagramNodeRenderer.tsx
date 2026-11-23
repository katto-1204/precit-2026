import { Handle, NodeResizer, Position, type Node, type NodeProps } from '@xyflow/react';
import type { DiagramNodeData } from '@/domain/diagramSpecs';

export type PrepCitFlowNode = Node<DiagramNodeData, 'prepcitNode'>;

export function DiagramNodeRenderer({ data, selected }: NodeProps<PrepCitFlowNode>) {
  const {
    shapeType,
    label,
    details,
    fillColor,
    strokeColor,
    strokeWidth,
    fontSize,
    textAlign,
  } = data;

  const isDarkBg = fillColor === '#0f172a' || fillColor === '#c81e1e';
  const textColor = isDarkBg ? '#ffffff' : '#0f172a';
  const alignClass =
    textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center';

  const handles = (
    <>
      <Handle type="target" position={Position.Top} className="!h-2.5 !w-2.5 !bg-brand-600" />
      <Handle type="source" position={Position.Bottom} className="!h-2.5 !w-2.5 !bg-brand-600" />
      <Handle type="target" position={Position.Left} id="left" className="!h-2.5 !w-2.5 !bg-slate-600" />
      <Handle type="source" position={Position.Right} id="right" className="!h-2.5 !w-2.5 !bg-slate-600" />
    </>
  );

  // Initial / Final Activity Nodes
  if (shapeType === 'initial') {
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        {handles}
        <div
          className="h-9 w-9 rounded-full shadow-xs"
          style={{ backgroundColor: fillColor || '#0f172a' }}
          title={label}
        />
      </div>
    );
  }

  if (shapeType === 'final' || shapeType === 'flow_final') {
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        {handles}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white"
          style={{ borderColor: strokeColor || '#0f172a' }}
          title={label}
        >
          {shapeType === 'final' ? (
            <div className="h-5 w-5 rounded-full bg-slate-900" />
          ) : (
            <span className="font-mono text-sm font-bold text-slate-700">×</span>
          )}
        </div>
      </div>
    );
  }

  // Decision / Relationship Diamond
  if (shapeType === 'decision' || shapeType === 'relationship') {
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <NodeResizer isVisible={selected} minWidth={80} minHeight={56} color="#c81e1e" />
        {handles}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="50,3 97,50 50,97 3,50"
            fill={fillColor || '#fef2f2'}
            stroke={strokeColor || '#c81e1e'}
            strokeWidth={Math.max(2, strokeWidth)}
          />
        </svg>
        <span
          className="relative z-10 px-4 text-center font-semibold leading-tight"
          style={{ fontSize, color: textColor }}
        >
          {label}
        </span>
      </div>
    );
  }

  // Use Case Actor (Stick Figure)
  if (shapeType === 'actor' && data.diagramType === 'use_case') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center p-1">
        {handles}
        <svg width="42" height="54" viewBox="0 0 42 54" className="shrink-0">
          <circle cx="21" cy="10" r="7" fill="none" stroke={strokeColor || '#0f172a'} strokeWidth="2" />
          <line x1="21" y1="17" x2="21" y2="35" stroke={strokeColor || '#0f172a'} strokeWidth="2" />
          <line x1="8" y1="24" x2="34" y2="24" stroke={strokeColor || '#0f172a'} strokeWidth="2" />
          <line x1="21" y1="35" x2="10" y2="50" stroke={strokeColor || '#0f172a'} strokeWidth="2" />
          <line x1="21" y1="35" x2="32" y2="50" stroke={strokeColor || '#0f172a'} strokeWidth="2" />
        </svg>
        <span className="mt-1 text-center font-semibold text-slate-900" style={{ fontSize }}>
          {label}
        </span>
      </div>
    );
  }

  // Sequence Lifeline / Actor Lifeline
  if (data.diagramType === 'uml_sequence' && (shapeType === 'lifeline' || shapeType === 'actor')) {
    return (
      <div className="relative flex h-full w-full flex-col items-center">
        <NodeResizer isVisible={selected} minWidth={100} minHeight={160} color="#c81e1e" />
        {handles}
        <div
          className="w-full rounded border px-2 py-2 text-center font-semibold shadow-xs"
          style={{
            backgroundColor: fillColor || '#ffffff',
            borderColor: strokeColor || '#0f172a',
            borderWidth: strokeWidth,
            fontSize,
            color: textColor,
          }}
        >
          <div>{label}</div>
          {details ? <div className="text-[10px] font-normal text-slate-500">{details}</div> : null}
        </div>
        <div
          className="w-0 flex-1 border-l-2 border-dashed"
          style={{ borderColor: strokeColor || '#64748b' }}
        />
      </div>
    );
  }

  // Compartment boxes (Class, Abstract, Interface, Enum, ERD Entity/Associative/Weak, UI Table)
  const isCompartment =
    ['class', 'abstract_class', 'interface', 'enum', 'entity', 'associative_entity', 'weak_entity', 'ui_table', 'ui_modal'].includes(
      shapeType,
    ) && details.trim().length > 0;

  const borderRadius =
    shapeType === 'usecase' || shapeType === 'attribute'
      ? '9999px'
      : shapeType === 'action' || shapeType === 'terminator'
        ? '14px'
        : '6px';

  const isContainer = ['swimlane', 'package', 'subsystem', 'system_boundary', 'ui_window', 'fragment_alt', 'fragment_loop'].includes(
    shapeType,
  );

  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden shadow-xs ${
        selected ? 'ring-2 ring-brand-600/40' : ''
      }`}
      style={{
        backgroundColor: fillColor === 'transparent' ? 'transparent' : fillColor || '#ffffff',
        borderColor: strokeColor || '#0f172a',
        borderWidth: strokeWidth || 2,
        borderStyle: shapeType === 'system_boundary' || shapeType === 'fragment_alt' || shapeType === 'fragment_loop' ? 'dashed' : 'solid',
        borderRadius,
        color: textColor,
      }}
    >
      <NodeResizer isVisible={selected} minWidth={60} minHeight={32} color="#c81e1e" />
      {handles}

      <div
        className={`px-2.5 py-1.5 font-semibold leading-snug whitespace-pre-line ${alignClass} ${
          isCompartment || isContainer ? 'border-b border-slate-200 bg-slate-50/70 text-slate-900' : 'flex flex-1 items-center justify-center'
        }`}
        style={{
          fontSize,
          color: isCompartment || isContainer ? '#0f172a' : textColor,
        }}
      >
        {label}
      </div>

      {isCompartment ? (
        <div
          className="flex-1 whitespace-pre-wrap px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-slate-700"
          style={{ textAlign }}
        >
          {details}
        </div>
      ) : null}
    </div>
  );
}
