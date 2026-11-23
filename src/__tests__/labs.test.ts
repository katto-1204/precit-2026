import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { CODING_CHALLENGES, SQL_CHALLENGES } from '@/data/labChallenges';
import {
  DIAGRAM_CATEGORIES,
  evaluateDiagramGraph,
  exportDiagramToSvg,
  type DiagramNodeData,
} from '@/domain/diagramSpecs';
import { gradeCodingSubmission } from '@/lib/codeRunner';

describe('Phase 4 — 8-Type Diagram Laboratory & Coding/SQL Grading Engines', () => {
  it('provides all 8 official TOPCIT diagram categories with palettes and guided scenarios', () => {
    expect(DIAGRAM_CATEGORIES.map((c) => c.id)).toEqual([
      'uml_activity',
      'uml_class',
      'uml_component',
      'er_diagram',
      'flowchart',
      'uml_sequence',
      'ui_wireframe',
      'use_case',
    ]);
    expect(DIAGRAM_CATEGORIES.every((c) => c.palette.length >= 4)).toBe(true);
  });

  it('evaluates diagrams structurally (layout-independent) and detects missing elements', () => {
    const emptyEval = evaluateDiagramGraph('uml_activity', [], [], 50);
    expect(emptyEval.earnedPoints).toBe(0);
    expect(emptyEval.missingChecks.length).toBeGreaterThan(0);

    const makeNode = (id: string, shapeType: string, label: string, x: number): Node<DiagramNodeData> => ({
      id,
      type: 'prepcitNode',
      position: { x, y: 100 },
      data: {
        shapeType,
        diagramType: 'uml_activity',
        label,
        details: '',
        fillColor: '#ffffff',
        strokeColor: '#0f172a',
        strokeWidth: 2,
        fontSize: 12,
        textAlign: 'center',
        width: 140,
        height: 50,
      },
    });

    const nodes = [
      makeNode('n1', 'initial', 'Start', 0),
      makeNode('n2', 'action', 'Submit Course', 150),
      makeNode('n3', 'decision', 'Prerequisite Met?', 300),
      makeNode('n4', 'action', 'Process Payment', 450),
      makeNode('n5', 'action', 'Confirm Enrollment', 600),
      makeNode('n6', 'final', 'End', 750),
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4', label: '[Yes]' },
      { id: 'e4', source: 'n3', target: 'n6', label: '[No]' },
      { id: 'e5', source: 'n4', target: 'n5' },
      { id: 'e6', source: 'n5', target: 'n6' },
    ];

    const fullEval = evaluateDiagramGraph('uml_activity', nodes, edges, 50);
    expect(fullEval.scorePercent).toBe(100);
    expect(fullEval.earnedPoints).toBe(50);
    expect(fullEval.missingChecks).toEqual([]);

    const svg = exportDiagramToSvg('Enrollment Flow', nodes, edges);
    expect(svg).toContain('<svg');
    expect(svg).toContain('Process Payment');
    expect(svg).toContain('[Yes]');
  });

  it('grades coding test cases with partial credit while keeping hidden test inputs/outputs private', async () => {
    const challenge = CODING_CHALLENGES[0];
    expect(Object.keys(challenge.starterCode).sort()).toEqual(['c', 'cpp', 'java', 'python']);
    expect(SQL_CHALLENGES.length).toBeGreaterThanOrEqual(2);

    // Mock deterministic executor: passes first visible test, fails hidden tests
    const summary = await gradeCodingSubmission(
      'python',
      'print("mock")',
      challenge.testCases,
      async (_lang, _src, stdin) => ({
        ok: true,
        stdout: stdin.includes('u1') ? 'ALLOW\nALLOW\nBLOCK\nALLOW\n' : 'WRONG',
        stderr: '',
        elapsedMs: 12,
      }),
    );

    expect(summary.passedCount).toBe(1);
    expect(summary.earnedPoints).toBe(20);
    expect(summary.maxPoints).toBe(50);

    const hiddenResults = summary.results.filter((r) => r.isHidden);
    expect(hiddenResults.length).toBe(2);
    expect(hiddenResults.every((r) => r.expectedOutput === undefined && r.actualOutput === undefined)).toBe(true);
  });
});
