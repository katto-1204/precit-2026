import { useMemo, useState } from 'react';
import { CheckCircle2, Flame, Layers, Save, ShieldAlert } from 'lucide-react';
import { QuestionStemRenderer } from '@/components/exam/QuestionStemRenderer';
import { DiagramWorkspace } from '@/components/labs/DiagramWorkspace';
import { HintCoachDrawer } from '@/components/shared/HintCoachDrawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getIntegratedCoach } from '@/data/learningGuides';
import { logStudySession } from '@/db/backup';
import { db } from '@/db/database';
import { useLiveQuery } from '@/db/useLiveQuery';
import type { DiagramType } from '@/domain/diagramSpecs';
import { updateTopicMastery } from '@/domain/learningEngine';
import type { QuestionResponse } from '@/domain/schemas';

export function IntegratedChallengesPage() {
  const allQuestions = useLiveQuery(() => db.questions.toArray(), []) ?? [];
  const integratedQuestions = useMemo(
    () => allQuestions.filter((q) => q.questionType === 'integrated_performance'),
    [allQuestions],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeQuestion =
    integratedQuestions.find((q) => q.id === selectedId) ?? integratedQuestions[0] ?? null;

  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [codeScratchpad, setCodeScratchpad] = useState('');
  const [diagramJson, setDiagramJson] = useState('');
  const [rubricOpen, setRubricOpen] = useState(false);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  async function handleSaveIntegratedAttempt(selfGraded: boolean) {
    if (!activeQuestion) return;
    const hasWork =
      writtenAnswer.trim().length > 0 ||
      codeScratchpad.trim().length > 0 ||
      diagramJson.length > 20;

    const totalRubric = selfGraded
      ? Math.min(
          activeQuestion.pointValue,
          Object.values(rubricScores).reduce((s, v) => s + v, 0),
        )
      : 0;

    const res: QuestionResponse = {
      id: `integrated-${activeQuestion.id}-${Date.now()}`,
      attemptId: `integrated-workbench-${activeQuestion.domain}`,
      questionId: activeQuestion.id,
      textAnswer: writtenAnswer,
      codeAnswer: codeScratchpad,
      diagramJson,
      isFlagged: false,
      timeSpentSeconds: 900,
      evaluationStatus: !hasWork
        ? 'unanswered'
        : selfGraded
          ? 'self_graded'
          : 'pending_evaluation',
      earnedPoints: hasWork && selfGraded ? totalRubric : 0,
      rubricScores: selfGraded ? rubricScores : undefined,
      updatedAt: new Date().toISOString(),
    };

    await db.responses.put(res);
    if (hasWork && selfGraded) {
      const m = await db.topicMastery.get(activeQuestion.topicId);
      if (m) {
        await db.topicMastery.put(
          updateTopicMastery({
            current: m,
            earnedPoints: res.earnedPoints,
            maxPoints: activeQuestion.pointValue,
            difficulty: activeQuestion.difficulty,
            questionType: 'integrated_performance',
            responseTimeSeconds: 900,
            estimatedSeconds: activeQuestion.estimatedSeconds,
          }),
        );
      }
      await logStudySession(25, 1, `Integrated 80pt (${activeQuestion.domain})`);
      setSaveNotice(
        `Saved self-graded 80-pt integrated solution (${res.earnedPoints}/${activeQuestion.pointValue} pts) and updated ${activeQuestion.domain} mastery.`,
      );
    } else {
      setSaveNotice(
        hasWork
          ? 'Saved multi-artifact submission as Pending Evaluation (0 pts credited until rubric graded).'
          : 'Submission was blank — scored 0 pts per exam integrity policy.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Integrated Performance Challenges (80 Points Each)
          </h1>
          <Badge variant="danger">
            <ShieldAlert className="h-3 w-3" />
            #1 Weakness Target (2025: 15/260)
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Cross-domain 80-point workplace scenarios spanning M1 Software Dev, M2 Data Mgmt, and M3 Systems Architecture &amp; InfoSec — combining design writing, diagrams, and code/SQL artifacts.
        </p>
      </div>

      {/* Challenge Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        {integratedQuestions.map((q) => {
          const active = activeQuestion?.id === q.id;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setSelectedId(q.id);
                setRubricOpen(false);
                setRubricScores({});
                setSaveNotice(null);
              }}
              className={`rounded-lg border p-4 text-left transition-all cursor-pointer ${
                active
                  ? 'border-brand-600 bg-brand-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge variant="brand">{q.domain}</Badge>
                <span className="font-mono text-xs font-bold text-slate-800">{q.pointValue} pts</span>
              </div>
              <h2 className="mt-2 text-sm font-semibold text-slate-900">{q.title}</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Est. {Math.round(q.estimatedSeconds / 60)} min · Multi-Artifact Rubric
              </p>
            </button>
          );
        })}
      </div>

      {activeQuestion ? (
        <div className="grid gap-6 xl:grid-cols-12">
          {/* Scenario Specification */}
          <Card className="xl:col-span-5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-brand-600" />
                <CardTitle>{activeQuestion.title}</CardTitle>
              </div>
              <CardDescription>
                {activeQuestion.domain} · {activeQuestion.pointValue} Points · Partial-Credit Workplace Scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <QuestionStemRenderer
                  questionId={activeQuestion.id}
                  prompt={activeQuestion.prompt}
                />
              </div>

              {(() => {
                const intCoach = getIntegratedCoach(activeQuestion);
                return (
                  <HintCoachDrawer
                    itemKey={activeQuestion.id}
                    title="Overwhelmed by 80 Points? Open Plain-English Breakdown & Hints"
                    situationPlainEnglish={intCoach.situationPlainEnglish}
                    glossary={intCoach.glossary}
                    hints={intCoach.hints}
                    compact
                    actions={[
                      {
                        label: 'Load Guided Fill-in-the-Blank Outline',
                        onClick: () => setWrittenAnswer(intCoach.guidedOutlineTemplate),
                      },
                    ]}
                  />
                );
              })()}

              {saveNotice ? (
                <div role="status" className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{saveNotice}</span>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setRubricOpen((o) => !o)}>
                  <Layers className="h-3.5 w-3.5" />
                  {rubricOpen ? 'Hide 80-Pt Rubric' : 'Open Model Answer & 80-Pt Rubric'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => void handleSaveIntegratedAttempt(false)}>
                  <Save className="h-3.5 w-3.5" />
                  Save as Pending
                </Button>
              </div>

              {rubricOpen ? (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
                  {activeQuestion.expectedResponse ? (
                    <div className="rounded border border-emerald-200 bg-white p-3">
                      <p className="mb-1 font-semibold text-emerald-900">Reference Solution Checklist:</p>
                      <p className="whitespace-pre-line text-slate-700">{activeQuestion.expectedResponse}</p>
                    </div>
                  ) : null}

                  {(activeQuestion.rubric ?? []).map((crit) => {
                    const val = rubricScores[crit.id] ?? 0;
                    return (
                      <div key={crit.id} className="space-y-1 rounded border border-slate-200 bg-white p-2.5">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>{crit.label}</span>
                          <span className="font-mono">{val}/{crit.maxPoints} pts</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{crit.description}</p>
                        <input
                          aria-label={`Integrated rubric ${crit.label}`}
                          type="range"
                          min={0}
                          max={crit.maxPoints}
                          value={val}
                          onChange={(e) =>
                            setRubricScores((prev) => ({ ...prev, [crit.id]: Number(e.target.value) }))
                          }
                          className="w-full accent-brand-600"
                        />
                      </div>
                    );
                  })}

                  <Button size="sm" className="w-full" onClick={() => void handleSaveIntegratedAttempt(true)}>
                    Save Self-Graded Score (
                    {Object.values(rubricScores).reduce((s, v) => s + v, 0)} / {activeQuestion.pointValue} pts)
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Multi-Artifact Workspace */}
          <Card className="xl:col-span-7">
            <CardContent className="p-4">
              <Tabs defaultValue="written">
                <TabsList>
                  <TabsTrigger value="written">1. Written Architecture &amp; Plan</TabsTrigger>
                  <TabsTrigger value="diagram">2. Interactive Diagram Artifact</TabsTrigger>
                  <TabsTrigger value="code">3. Code / SQL Implementation</TabsTrigger>
                </TabsList>

                <TabsContent value="written">
                  <textarea
                    aria-label="Integrated scenario written deliverables"
                    rows={18}
                    value={writtenAnswer}
                    onChange={(e) => setWrittenAnswer(e.target.value)}
                    placeholder="Structure Deliverables 1, 2, and 3 clearly with concrete engineering decisions, formulas, security controls, and test cases..."
                    className="w-full rounded-md border border-slate-300 bg-white p-4 text-sm leading-relaxed"
                  />
                </TabsContent>

                <TabsContent value="diagram">
                  <DiagramWorkspace
                    key={activeQuestion.id}
                    diagramType={
                      (activeQuestion.scenarioData?.diagramType as DiagramType) ?? 'uml_class'
                    }
                    mode="guided"
                    embedded
                    onChangeGraphJson={setDiagramJson}
                  />
                </TabsContent>

                <TabsContent value="code">
                  <textarea
                    aria-label="Integrated scenario code or SQL scratchpad"
                    rows={18}
                    spellCheck={false}
                    value={codeScratchpad}
                    onChange={(e) => setCodeScratchpad(e.target.value)}
                    placeholder="-- Write SQL queries, transaction blocks, or Python/Java/C++ pseudocode here..."
                    className="w-full rounded-md border border-slate-300 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
