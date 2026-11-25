import { lazy, Suspense, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Bug,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  Eye,
  GraduationCap,
  Play,
  RotateCcw,
  Send,
  Terminal,
  XCircle,
} from 'lucide-react';
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
import {
  CODING_CHALLENGES,
  SQL_CHALLENGES,
  type CompilerLanguage,
} from '@/data/labChallenges';
import {
  CODING_CHALLENGE_COACHING,
  CODING_TUTORIAL_RECIPES,
  SQL_CHALLENGE_COACHING,
  SQL_TUTORIAL_RECIPES,
  type CodingTutorialRecipe,
  type SqlTutorialRecipe,
} from '@/data/learningGuides';
import { logStudySession } from '@/db/backup';
import { db } from '@/db/database';
import { updateTopicMastery } from '@/domain/learningEngine';
import {
  executeCode,
  gradeCodingSubmission,
  type CodingGradeSummary,
  type ExecutionResult,
} from '@/lib/codeRunner';
import {
  executeSqlQuery,
  gradeSqlSubmission,
  inspectSchema,
  type SqlGradeResult,
  type SqlQueryResult,
  type SqlTableSchema,
} from '@/lib/sqlRunner';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const LANG_OPTIONS: { id: CompilerLanguage; label: string; monacoLang: string; runtime: string }[] = [
  { id: 'python', label: 'Python 3', monacoLang: 'python', runtime: 'In-Browser Pyodide Worker' },
  { id: 'c', label: 'C (GCC)', monacoLang: 'c', runtime: 'Isolated Docker Sandbox' },
  { id: 'cpp', label: 'C++ 20', monacoLang: 'cpp', runtime: 'Isolated Docker Sandbox' },
  { id: 'java', label: 'Java 17', monacoLang: 'java', runtime: 'Isolated Docker Sandbox' },
];

export function CodingLabPage() {
  // --- Compiler Lab State ---
  const [selectedChallengeId, setSelectedChallengeId] = useState(CODING_CHALLENGES[0].id);
  const [language, setLanguage] = useState<CompilerLanguage>('python');
  const activeChallenge =
    CODING_CHALLENGES.find((c) => c.id === selectedChallengeId) ?? CODING_CHALLENGES[0];

  const [code, setCode] = useState(activeChallenge.starterCode.python);
  const [customStdin, setCustomStdin] = useState(activeChallenge.testCases[0]?.input ?? '');
  const [runningCode, setRunningCode] = useState(false);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [gradeSummary, setGradeSummary] = useState<CodingGradeSummary | null>(null);

  // --- SQL Lab State ---
  const [selectedSqlId, setSelectedSqlId] = useState(SQL_CHALLENGES[0].id);
  const activeSqlChallenge =
    SQL_CHALLENGES.find((c) => c.id === selectedSqlId) ?? SQL_CHALLENGES[0];
  const [sqlCode, setSqlCode] = useState(activeSqlChallenge.starterSql);
  const [sqlTables, setSqlTables] = useState<SqlTableSchema[]>([]);
  const [sqlRunResult, setSqlRunResult] = useState<SqlQueryResult | null>(null);
  const [sqlGrade, setSqlGrade] = useState<SqlGradeResult | null>(null);
  const [sqlHistory, setSqlHistory] = useState<string[]>([]);
  const [runningSql, setRunningSql] = useState(false);
  const [showPythonTutorial, setShowPythonTutorial] = useState(false);
  const [activePyRecipe, setActivePyRecipe] = useState<CodingTutorialRecipe | null>(null);
  const [showSqlTutorial, setShowSqlTutorial] = useState(true);
  const [activeSqlRecipe, setActiveSqlRecipe] = useState<SqlTutorialRecipe | null>(null);

  const codingCoach = CODING_CHALLENGE_COACHING[activeChallenge.id];
  const sqlCoach = SQL_CHALLENGE_COACHING[activeSqlChallenge.id];

  useEffect(() => {
    setCode(activeChallenge.starterCode[language]);
    setCustomStdin(activeChallenge.testCases[0]?.input ?? '');
    setExecResult(null);
    setGradeSummary(null);
  }, [activeChallenge, language]);

  useEffect(() => {
    setSqlCode(activeSqlChallenge.starterSql);
    setSqlRunResult(null);
    setSqlGrade(null);
    void inspectSchema(activeSqlChallenge.schemaSql)
      .then(setSqlTables)
      .catch(() => setSqlTables([]));
  }, [activeSqlChallenge]);

  async function handleRunCode() {
    setRunningCode(true);
    setGradeSummary(null);
    try {
      const res = await executeCode(language, code, customStdin);
      setExecResult(res);
    } finally {
      setRunningCode(false);
    }
  }

  async function handleSubmitCode() {
    setRunningCode(true);
    setExecResult(null);
    try {
      const summary = await gradeCodingSubmission(
        language,
        code,
        activeChallenge.testCases,
      );
      setGradeSummary(summary);
      if (!summary.runtimeUnavailable) {
        const m = await db.topicMastery.get(activeChallenge.topicId);
        if (m) {
          await db.topicMastery.put(
            updateTopicMastery({
              current: m,
              earnedPoints: summary.earnedPoints,
              maxPoints: summary.maxPoints,
              difficulty: activeChallenge.difficulty,
              questionType: 'standard_performance',
              responseTimeSeconds: 300,
              estimatedSeconds: 900,
            }),
          );
        }
        await logStudySession(10, 1, `Coding Lab (${language.toUpperCase()})`);
      }
    } finally {
      setRunningCode(false);
    }
  }

  async function handleRunSql(overrideQuery?: string) {
    const queryToRun = overrideQuery ?? sqlCode;
    setRunningSql(true);
    setSqlGrade(null);
    try {
      const res = await executeSqlQuery(activeSqlChallenge.schemaSql, queryToRun);
      setSqlRunResult(res);
      setSqlHistory((prev) => [queryToRun.trim(), ...prev.slice(0, 4)]);
    } finally {
      setRunningSql(false);
    }
  }

  async function handleLoadSqlRecipe(recipe: SqlTutorialRecipe) {
    setActiveSqlRecipe(recipe);
    if (recipe.compatibleChallengeId !== selectedSqlId) {
      setSelectedSqlId(recipe.compatibleChallengeId);
    }
    const targetChallenge =
      SQL_CHALLENGES.find((c) => c.id === recipe.compatibleChallengeId) ?? activeSqlChallenge;
    setSqlCode(recipe.sql);
    setSqlGrade(null);
    setRunningSql(true);
    try {
      const res = await executeSqlQuery(targetChallenge.schemaSql, recipe.sql);
      setSqlRunResult(res);
    } finally {
      setRunningSql(false);
    }
  }

  async function handlePeekTable(tableName: string) {
    const peekQuery = `-- Peeking inside "${tableName}" so you can see the actual rows!\nSELECT * FROM ${tableName} LIMIT 10;`;
    setSqlCode(peekQuery);
    setActiveSqlRecipe(null);
    await handleRunSql(peekQuery);
  }

  function handleLoadPythonRecipe(recipe: CodingTutorialRecipe) {
    setLanguage('python');
    setActivePyRecipe(recipe);
    setCode(recipe.pythonCode);
    setCustomStdin(recipe.sampleStdin);
    setExecResult(null);
    setGradeSummary(null);
  }

  async function handleSubmitSql() {
    setRunningSql(true);
    try {
      const grade = await gradeSqlSubmission(
        activeSqlChallenge.schemaSql,
        sqlCode,
        activeSqlChallenge.expectedSql,
        activeSqlChallenge.orderSensitive,
        activeSqlChallenge.maxPoints,
      );
      setSqlGrade(grade);
      setSqlRunResult(grade.userResult);
      const m = await db.topicMastery.get(activeSqlChallenge.topicId);
      if (m) {
        await db.topicMastery.put(
          updateTopicMastery({
            current: m,
            earnedPoints: grade.earnedPoints,
            maxPoints: grade.maxPoints,
            difficulty: activeSqlChallenge.difficulty,
            questionType: 'standard_performance',
            responseTimeSeconds: 240,
            estimatedSeconds: 600,
          }),
        );
      }
      await logStudySession(8, 1, 'SQL Laboratory (sql.js)');
    } finally {
      setRunningSql(false);
    }
  }

  const currentLangMeta = LANG_OPTIONS.find((l) => l.id === language) ?? LANG_OPTIONS[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Coding &amp; SQL Compiler Laboratory
            </h1>
            <Badge variant="brand">Pyodide · sql.js · Docker C/C++/Java</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Execute real Python 3 in isolated Web Workers, run deterministic SQLite queries via <code className="font-mono text-xs">sql.js</code>, and test C/C++/Java against the optional Docker sandbox.
          </p>
        </div>
      </div>

      <Tabs defaultValue="compiler">
        <TabsList>
          <TabsTrigger value="compiler">
            <Code2 className="mr-1.5 h-3.5 w-3.5" />
            Compiler Lab (Python / C / C++ / Java)
          </TabsTrigger>
          <TabsTrigger value="sql">
            <Database className="mr-1.5 h-3.5 w-3.5" />
            SQL &amp; Database Lab (SQLite WASM)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: COMPILER LAB */}
        <TabsContent value="compiler" className="space-y-4">
          {/* Language & Challenge Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguage(opt.id)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    language === opt.id
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <Badge variant={language === 'python' ? 'success' : 'neutral'}>
                {currentLangMeta.runtime}
              </Badge>
            </div>

            <select
              aria-label="Select coding challenge"
              value={selectedChallengeId}
              onChange={(e) => {
                setSelectedChallengeId(e.target.value);
                setActivePyRecipe(null);
              }}
              className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800"
            >
              {CODING_CHALLENGES.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  [{ch.domain}] {ch.title} ({ch.maxPoints} pts)
                </option>
              ))}
            </select>
          </div>

          {/* Ready-Made Python 101 Warm-Up Tutorial Strip */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950">
                  New to Python Coding Tasks? Try a 1-Click Warm-Up Lesson
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-emerald-800"
                onClick={() => setShowPythonTutorial((v) => !v)}
              >
                {showPythonTutorial ? 'Hide Warm-Ups' : 'Open Python 101 Warm-Ups (3)'}
              </Button>
            </div>
            {showPythonTutorial ? (
              <div className="mt-3 space-y-2.5">
                <div className="grid gap-2 md:grid-cols-3">
                  {CODING_TUTORIAL_RECIPES.map((rec) => {
                    const active = activePyRecipe?.id === rec.id;
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => handleLoadPythonRecipe(rec)}
                        className={`rounded-md border p-2.5 text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-emerald-600 bg-white shadow-2xs'
                            : 'border-emerald-200 bg-white/80 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-slate-900">{rec.title}</span>
                          <Badge variant="success" className="text-[10px]">
                            {rec.badge}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-slate-600">
                          {rec.plainEnglish}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {activePyRecipe ? (
                  <p className="text-[11px] text-emerald-900">
                    Loaded <strong>{activePyRecipe.title}</strong> into the Python editor — click{' '}
                    <strong>Run Code</strong> to see it execute, or click <strong>Reset Starter</strong>{' '}
                    to jump back to the graded challenge!
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Plain-English Situation Coach & Progressive Hints for Active Coding Challenge */}
          {codingCoach ? (
            <HintCoachDrawer
              itemKey={activeChallenge.id}
              title="What Does This Coding Problem Mean? & 3-Step Hints"
              situationPlainEnglish={codingCoach.situationPlainEnglish}
              extraNote={`Walkthrough of Sample #1:\n${codingCoach.sampleWalkthrough}`}
              glossary={codingCoach.glossary}
              hints={codingCoach.hints}
              actions={[
                {
                  label: 'Load Guided Python Scaffold',
                  onClick: () => {
                    setLanguage('python');
                    setCode(codingCoach.guidedFillBlankPython);
                  },
                },
                {
                  label: 'Load Reference Solution (Python)',
                  onClick: () => {
                    setLanguage('python');
                    setCode(activeChallenge.referenceSolutionPython);
                  },
                },
              ]}
            />
          ) : null}

          {/* IDE Split Grid */}
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Left Problem Instructions */}
            <Card className="lg:col-span-5 flex flex-col">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand">{activeChallenge.domain}</Badge>
                  <Badge variant={activeChallenge.mode === 'debugging' ? 'warning' : 'info'}>
                    {activeChallenge.mode === 'debugging' ? (
                      <>
                        <Bug className="h-3 w-3" /> Debugging
                      </>
                    ) : (
                      'Implementation'
                    )}
                  </Badge>
                  <Badge variant="neutral">{activeChallenge.maxPoints} pts</Badge>
                </div>
                <CardTitle className="mt-2 text-base">{activeChallenge.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-slate-700">
                <p className="leading-relaxed">{activeChallenge.description}</p>
                <div className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-900">Input Specification</p>
                  <p className="whitespace-pre-line font-mono text-[11px]">{activeChallenge.inputSpec}</p>
                  <p className="mt-2 font-semibold text-slate-900">Output Specification</p>
                  <p className="font-mono text-[11px]">{activeChallenge.outputSpec}</p>
                  <p className="mt-2 font-semibold text-slate-900">Constraints</p>
                  <p className="font-mono text-[11px] text-slate-600">{activeChallenge.constraints}</p>
                </div>

                <div>
                  <p className="mb-2 font-semibold text-slate-900">
                    Visible Sample Cases ({activeChallenge.testCases.filter((t) => !t.isHidden).length}{' '}
                    visible · {activeChallenge.testCases.filter((t) => t.isHidden).length} hidden)
                  </p>
                  <div className="space-y-2">
                    {activeChallenge.testCases
                      .filter((t) => !t.isHidden)
                      .map((tc) => (
                        <div
                          key={tc.id}
                          className="rounded border border-slate-200 bg-white p-2.5 font-mono text-[11px]"
                        >
                          <p className="font-sans text-[11px] font-medium text-slate-600">
                            {tc.description} ({tc.points} pts)
                          </p>
                          <div className="mt-1.5 grid grid-cols-2 gap-2">
                            <pre className="rounded bg-slate-50 p-1.5 whitespace-pre-wrap">{tc.input}</pre>
                            <pre className="rounded bg-slate-50 p-1.5 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Monaco Code Editor + Console */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    solution.{language === 'python' ? 'py' : language === 'java' ? 'java' : language}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCode(activeChallenge.starterCode[language])}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Starter
                    </Button>
                    <Button size="sm" variant="outline" disabled={runningCode} onClick={() => void handleRunCode()}>
                      <Play className="h-3.5 w-3.5" />
                      {runningCode ? 'Running...' : 'Run Code'}
                    </Button>
                    <Button size="sm" disabled={runningCode} onClick={() => void handleSubmitCode()}>
                      <Send className="h-3.5 w-3.5" />
                      Run All Tests &amp; Grade
                    </Button>
                  </div>
                </div>

                <div className="h-[340px] w-full bg-[#1e1e1e]">
                  <Suspense
                    fallback={
                      <textarea
                        aria-label="Fallback code editor"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="h-full w-full bg-slate-900 p-4 font-mono text-xs text-slate-100"
                      />
                    }
                  >
                    <MonacoEditor
                      height="340px"
                      language={currentLangMeta.monacoLang}
                      theme="vs-dark"
                      value={code}
                      onChange={(val) => setCode(val ?? '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'JetBrains Mono, monospace',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </Suspense>
                </div>
              </Card>

              {/* Standard Input & Output / Test Results */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="py-2.5">
                    <CardTitle className="text-xs">Standard Input (stdin)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <textarea
                      aria-label="Standard input"
                      rows={5}
                      value={customStdin}
                      onChange={(e) => setCustomStdin(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 p-2 font-mono text-xs"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2.5 flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-1.5 text-xs">
                      <Terminal className="h-3.5 w-3.5 text-brand-600" />
                      Console Output
                    </CardTitle>
                    {execResult ? (
                      <span className="font-mono text-[10px] text-slate-500">
                        <Clock className="inline h-3 w-3 mr-0.5" />
                        {execResult.elapsedMs}ms
                      </span>
                    ) : null}
                  </CardHeader>
                  <CardContent className="p-3">
                    {execResult ? (
                      <div className="space-y-2 font-mono text-xs">
                        {execResult.stdout ? (
                          <pre className="max-h-28 overflow-auto rounded bg-slate-900 p-2 text-emerald-300 whitespace-pre-wrap">
                            {execResult.stdout}
                          </pre>
                        ) : null}
                        {execResult.stderr ? (
                          <pre className="max-h-28 overflow-auto rounded border border-red-200 bg-red-50 p-2 text-red-700 whitespace-pre-wrap">
                            {execResult.stderr}
                          </pre>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Click <strong>Run Code</strong> to execute with custom stdin, or <strong>Run All Tests &amp; Grade</strong> for partial-credit evaluation.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Automated Test Grade Card */}
              {gradeSummary ? (
                <Card>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Automated Test Suite Results</CardTitle>
                      {gradeSummary.runtimeUnavailable ? (
                        <Badge variant="warning">Runtime Unavailable</Badge>
                      ) : (
                        <Badge
                          variant={
                            gradeSummary.earnedPoints === gradeSummary.maxPoints
                              ? 'success'
                              : 'warning'
                          }
                        >
                          {gradeSummary.earnedPoints} / {gradeSummary.maxPoints} pts (
                          {gradeSummary.passedCount}/{gradeSummary.totalCount} passed)
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 text-xs">
                    {gradeSummary.runtimeUnavailable ? (
                      <div className="flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{gradeSummary.errorMessage}</span>
                      </div>
                    ) : (
                      gradeSummary.results.map((r, idx) => (
                        <div
                          key={r.testCaseId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-slate-50/70 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            {r.passed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="font-medium text-slate-900">
                              Test #{idx + 1}: {r.description}
                            </span>
                            {r.isHidden ? <Badge variant="neutral">Hidden</Badge> : null}
                          </div>
                          <span className="font-mono font-semibold text-slate-700">
                            {r.pointsEarned}/{r.maxPoints} pts · {r.elapsedMs}ms
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: SQL & DATABASE LAB */}
        <TabsContent value="sql" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3.5">
            <div className="flex items-center gap-2">
              <Badge variant="brand">M2 Data Management</Badge>
              <span className="text-xs text-slate-600">
                Fresh isolated SQLite WASM instance per execution · Result-set equivalence grading
              </span>
            </div>

            <select
              aria-label="Select SQL challenge"
              value={selectedSqlId}
              onChange={(e) => {
                setSelectedSqlId(e.target.value);
                setActiveSqlRecipe(null);
              }}
              className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800"
            >
              {SQL_CHALLENGES.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.title} ({ch.maxPoints} pts)
                </option>
              ))}
            </select>
          </div>

          {/* Ready-Made SQL 101 Interactive Tutorial Sandbox */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950">
                  SQL 101 Interactive Practice Sandbox — Click Any Step to Run Live!
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-emerald-800"
                onClick={() => setShowSqlTutorial((v) => !v)}
              >
                {showSqlTutorial ? 'Hide SQL 101' : 'Show SQL 101 (5 Lessons)'}
              </Button>
            </div>
            {showSqlTutorial ? (
              <div className="mt-3 space-y-2.5">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {SQL_TUTORIAL_RECIPES.map((rec) => {
                    const active = activeSqlRecipe?.id === rec.id;
                    return (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => void handleLoadSqlRecipe(rec)}
                        className={`rounded-md border p-2.5 text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-emerald-600 bg-white shadow-2xs'
                            : 'border-emerald-200 bg-white/85 hover:bg-white'
                        }`}
                      >
                        <Badge variant="success" className="text-[9px]">
                          {rec.badge}
                        </Badge>
                        <p className="mt-1 text-xs font-semibold text-slate-900">{rec.title}</p>
                        <p className="mt-1 text-[11px] leading-snug text-slate-600">
                          {rec.plainEnglish}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {activeSqlRecipe ? (
                  <div className="rounded-md border border-emerald-300 bg-white px-3 py-2 text-xs text-slate-800">
                    <span className="font-bold text-emerald-800">What to watch for: </span>
                    {activeSqlRecipe.whatToWatchFor}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Plain-English SQL Situation Coach & Progressive Hints */}
          {sqlCoach ? (
            <HintCoachDrawer
              itemKey={activeSqlChallenge.id}
              title="What Does This SQL Situation Mean? & 3-Step Hints"
              situationPlainEnglish={sqlCoach.situationPlainEnglish}
              extraNote={`What your output table needs to look like:\n${sqlCoach.outputExplained}`}
              glossary={sqlCoach.glossary}
              hints={sqlCoach.hints}
              actions={[
                {
                  label: 'Load Fill-in-the-Blank Practice',
                  onClick: () => {
                    setActiveSqlRecipe(null);
                    setSqlCode(sqlCoach.guidedFillBlankSql);
                    setSqlGrade(null);
                  },
                },
                {
                  label: 'Load Commented Worked Example',
                  onClick: () => {
                    setActiveSqlRecipe(null);
                    setSqlCode(sqlCoach.workedExampleSql);
                    setSqlGrade(null);
                  },
                },
              ]}
            />
          ) : null}

          <div className="grid gap-4 lg:grid-cols-12">
            {/* Left Schema Explorer & Task */}
            <Card className="lg:col-span-5">
              <CardHeader>
                <CardTitle className="text-base">{activeSqlChallenge.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {activeSqlChallenge.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Live Table Schema Explorer</h3>
                    <span className="text-[10px] text-slate-500">Click Peek to inspect live rows</span>
                  </div>
                  <div className="space-y-2">
                    {sqlTables.map((t) => (
                      <div key={t.tableName} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                        <div className="flex items-center justify-between gap-2 font-mono font-bold text-slate-900">
                          <span>{t.tableName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-normal text-slate-500">
                              {t.rowCount} rows
                            </span>
                            <button
                              type="button"
                              onClick={() => void handlePeekTable(t.tableName)}
                              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <Eye className="h-3 w-3 text-sky-600" />
                              Peek Rows
                            </button>
                          </div>
                        </div>
                        <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-slate-600">
                          {t.columns.map((c) => (
                            <li key={c.name}>
                              {c.pk ? <span className="font-bold text-brand-700">PK </span> : '   '}
                              {c.name} <span className="text-slate-400">({c.type})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="rounded border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                  <strong>Quick Tip:</strong> {activeSqlChallenge.hint}
                </p>
              </CardContent>
            </Card>

            {/* Right SQL Editor & Result Grid */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="font-mono text-xs font-semibold text-slate-700">query.sql</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSqlCode(activeSqlChallenge.starterSql)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </Button>
                    <Button size="sm" variant="outline" disabled={runningSql} onClick={() => void handleRunSql()}>
                      <Play className="h-3.5 w-3.5" />
                      Execute SQL
                    </Button>
                    <Button size="sm" disabled={runningSql} onClick={() => void handleSubmitSql()}>
                      <Send className="h-3.5 w-3.5" />
                      Grade Query
                    </Button>
                  </div>
                </div>
                <div className="h-[240px] w-full bg-[#1e1e1e]">
                  <Suspense
                    fallback={
                      <textarea
                        aria-label="Fallback SQL editor"
                        value={sqlCode}
                        onChange={(e) => setSqlCode(e.target.value)}
                        className="h-full w-full bg-slate-900 p-4 font-mono text-xs text-slate-100"
                      />
                    }
                  >
                    <MonacoEditor
                      height="240px"
                      language="sql"
                      theme="vs-dark"
                      value={sqlCode}
                      onChange={(val) => setSqlCode(val ?? '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'JetBrains Mono, monospace',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </Suspense>
                </div>
              </Card>

              {sqlGrade ? (
                <div
                  role="status"
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-xs ${
                    sqlGrade.passed
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {sqlGrade.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <span>{sqlGrade.feedback}</span>
                  </div>
                  <Badge variant={sqlGrade.passed ? 'success' : 'warning'} className="shrink-0 font-mono">
                    {sqlGrade.earnedPoints} / {sqlGrade.maxPoints} pts
                  </Badge>
                </div>
              ) : null}

              <Card>
                <CardHeader className="py-2.5 flex-row items-center justify-between">
                  <CardTitle className="text-xs">SQL Output Grid</CardTitle>
                  {sqlRunResult ? (
                    <span className="font-mono text-[10px] text-slate-500">
                      {sqlRunResult.rows.length} row(s) · {sqlRunResult.elapsedMs}ms
                    </span>
                  ) : null}
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {sqlRunResult?.error ? (
                    <div className="p-4 font-mono text-xs text-red-700 bg-red-50">
                      {sqlRunResult.error}
                    </div>
                  ) : sqlRunResult && sqlRunResult.columns.length > 0 ? (
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <tr>
                          {sqlRunResult.columns.map((col) => (
                            <th key={col} className="px-3 py-2 font-semibold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sqlRunResult.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-3 py-2 text-slate-800">
                                {cell === null ? <span className="text-slate-400">NULL</span> : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="p-4 text-xs text-slate-400">
                      Run a SQL query to inspect live SQLite WASM table rows here.
                    </p>
                  )}
                </CardContent>
              </Card>

              {sqlHistory.length > 0 ? (
                <div className="text-[11px] text-slate-500">
                  Recent queries executed: {sqlHistory.length}
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
