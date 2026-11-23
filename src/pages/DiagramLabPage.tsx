import { useRef, useState } from 'react';
import {
  Clock,
  FolderOpen,
  GitBranch,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { DiagramWorkspace } from '@/components/labs/DiagramWorkspace';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { db } from '@/db/database';
import { useLiveQuery } from '@/db/useLiveQuery';
import {
  DIAGRAM_CATEGORIES,
  type DiagramType,
} from '@/domain/diagramSpecs';
import type { SavedDiagram } from '@/domain/schemas';
import { formatDateShort } from '@/lib/utils';

export function DiagramLabPage() {
  const savedDiagrams = useLiveQuery(() => db.savedDiagrams.toArray(), []) ?? [];
  const importRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<{
    diagramType: DiagramType;
    mode: 'blank' | 'guided' | 'timed';
    saved?: SavedDiagram | null;
  } | null>(null);

  async function handleImportDiagramJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const parsed = JSON.parse(await file.text()) as {
        title?: string;
        diagramType?: DiagramType;
        nodes?: unknown[];
        edges?: unknown[];
      };
      if (!parsed.diagramType || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        throw new Error('Invalid diagram JSON: expected diagramType, nodes[], and edges[].');
      }
      const imported: SavedDiagram = {
        id: `diag-import-${Date.now()}`,
        title: parsed.title || file.name.replace(/\.json$/i, ''),
        diagramType: parsed.diagramType,
        nodesJson: JSON.stringify(parsed.nodes),
        edgesJson: JSON.stringify(parsed.edges),
        updatedAt: new Date().toISOString(),
      };
      await db.savedDiagrams.put(imported);
      setActiveEditor({ diagramType: imported.diagramType, mode: 'blank', saved: imported });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import diagram JSON.');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  }

  if (activeEditor) {
    return (
      <DiagramWorkspace
        diagramType={activeEditor.diagramType}
        mode={activeEditor.mode}
        initialSaved={activeEditor.saved}
        onBack={() => setActiveEditor(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Interactive Diagram Laboratory
            </h1>
            <Badge variant="brand">8 TOPCIT Editors</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Full drag-and-drop modeling workspaces with context-sensitive palettes, grid snapping, collapsible properties inspector, undo/redo, structural rubric evaluation, and JSON/SVG/PNG export.
          </p>
        </div>
        <div>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => void handleImportDiagramJson(e)}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Import Diagram JSON
          </Button>
        </div>
      </div>

      {importError ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {importError}
        </div>
      ) : null}

      {/* 8 Official Diagram Category Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DIAGRAM_CATEGORIES.map((cat) => {
          const savedForType = savedDiagrams.filter((d) => d.diagramType === cat.id);
          return (
            <Card key={cat.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="neutral">{cat.domain}</Badge>
                  <span className="font-mono text-[10px] text-slate-500">
                    {cat.palette.length} shapes
                  </span>
                </div>
                <CardTitle className="mt-1.5 flex items-center gap-1.5 text-sm">
                  <GitBranch className="h-4 w-4 text-brand-600" />
                  {cat.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {cat.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-between space-y-4 pt-3">
                <div className="flex flex-wrap gap-1">
                  {cat.palette.slice(0, 4).map((s) => (
                    <span
                      key={s.shapeType}
                      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600"
                    >
                      {s.label}
                    </span>
                  ))}
                  {cat.palette.length > 4 ? (
                    <span className="px-1 py-0.5 text-[10px] text-slate-400">
                      +{cat.palette.length - 4} more
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setActiveEditor({ diagramType: cat.id, mode: 'guided' })}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Guided
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveEditor({ diagramType: cat.id, mode: 'blank' })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Start Blank
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveEditor({ diagramType: cat.id, mode: 'timed' })}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Timed 20m
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={savedForType.length === 0}
                    onClick={() =>
                      setActiveEditor({
                        diagramType: cat.id,
                        mode: 'blank',
                        saved: savedForType[0],
                      })
                    }
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Saved ({savedForType.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Saved Diagrams Library */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Diagrams in Local IndexedDB ({savedDiagrams.length})</CardTitle>
          <CardDescription>
            Restore any saved diagram cleanly with all shapes, connectors, positions, and properties intact.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {savedDiagrams.length === 0 ? (
            <p className="p-5 text-xs text-slate-500">
              No saved diagrams yet. Open any of the 8 diagram editors above and click <strong>Save</strong> to persist your work offline.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {savedDiagrams
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">{item.diagramType.replace('_', ' ')}</Badge>
                        <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Updated {formatDateShort(item.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setActiveEditor({
                            diagramType: item.diagramType,
                            mode: 'blank',
                            saved: item,
                          })
                        }
                      >
                        <Play className="h-3.5 w-3.5" />
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        aria-label={`Delete ${item.title}`}
                        onClick={() => void db.savedDiagrams.delete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
