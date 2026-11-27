import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  deleteHistoricalRecord,
  exportBackupBundle,
  importBackupBundle,
  resetLocalDatabase,
  updateUserProfile,
  upsertHistoricalRecord,
} from '@/db/backup';
import { db } from '@/db/database';
import { useLiveQuery } from '@/db/useLiveQuery';
import { BLUEPRINT_2026, getCompetencyLevel } from '@/domain/blueprint2026';
import { HistoricalScoreRecordSchema, type HistoricalAreaScore } from '@/domain/schemas';
import {
  buildLessonFromPdfPreview,
  extractPdfFileInBrowser,
  type PdfExtractionPreview,
} from '@/lib/pdfIngestor';
import { formatDateShort, formatPercent } from '@/lib/utils';

const LANGUAGES = [
  { id: 'python', label: 'Python 3 (Browser Pyodide)' },
  { id: 'sql', label: 'SQL (Browser SQLite WASM)' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
] as const;

type PracticeLang = (typeof LANGUAGES)[number]['id'];

const EMPTY_2025_AREAS: HistoricalAreaScore[] = [
  { areaId: 'software', label: 'Software', earnedPoints: 0, maxPoints: 260, correctItems: 0, totalItems: 17 },
  { areaId: 'data', label: 'Data', earnedPoints: 0, maxPoints: 145, correctItems: 0, totalItems: 9 },
  { areaId: 'system_architecture', label: 'System Architecture', earnedPoints: 0, maxPoints: 75, correctItems: 0, totalItems: 8 },
  { areaId: 'information_security', label: 'Information Security', earnedPoints: 0, maxPoints: 85, correctItems: 0, totalItems: 8 },
  { areaId: 'it_business_ethics', label: 'IT Business & Ethics', earnedPoints: 0, maxPoints: 95, correctItems: 0, totalItems: 11 },
  { areaId: 'tech_comm_pm', label: 'Technical Communication & PM', earnedPoints: 0, maxPoints: 80, correctItems: 0, totalItems: 9 },
  { areaId: 'integrated_competencies', label: 'Integrated Competencies', earnedPoints: 0, maxPoints: 260, correctItems: 0, totalItems: 3 },
];

export function SettingsPage() {
  const profile = useLiveQuery(() => db.profiles.get('primary'), []);
  const historicalRecords = useLiveQuery(() => db.historicalRecords.toArray(), []) ?? [];
  const studySources = useLiveQuery(() => db.studySources.toArray(), []) ?? [];
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pdfPreview, setPdfPreview] = useState<PdfExtractionPreview | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const storageStats = useLiveQuery(async () => {
    const [records, mastery, attempts, responses, activities, sources, diagrams] = await Promise.all([
      db.historicalRecords.count(),
      db.topicMastery.count(),
      db.examAttempts.count(),
      db.responses.count(),
      db.studyActivities.count(),
      db.studySources.count(),
      db.savedDiagrams.count(),
    ]);
    return { records, mastery, attempts, responses, activities, sources, diagrams };
  }, []);

  // Study Targets Form State
  const [displayName, setDisplayName] = useState('BSIT Candidate');
  const [targetScore, setTargetScore] = useState(450);
  const [targetExamDate, setTargetExamDate] = useState('');
  const [dailyGoal, setDailyGoal] = useState(60);
  const [descPreset, setDescPreset] = useState<'korean_450' | 'english_1500' | 'custom'>('english_1500');
  const [descCharLimit, setDescCharLimit] = useState(1500);
  const [preferredLanguages, setPreferredLanguages] = useState<PracticeLang[]>(['python', 'sql']);
  const [profileStatus, setProfileStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Historical Record Import State
  const [importOpen, setImportOpen] = useState(false);
  const [recLabel, setRecLabel] = useState('Additional 2025 Practice / Score Report');
  const [recDate, setRecDate] = useState('2025-10-18');
  const [recTotalScore, setRecTotalScore] = useState(0);
  const [recCorrectItems, setRecCorrectItems] = useState(0);
  const [recAreas, setRecAreas] = useState<HistoricalAreaScore[]>(EMPTY_2025_AREAS);
  const [recError, setRecError] = useState<string | null>(null);
  const [scoreImagePreviewUrl, setScoreImagePreviewUrl] = useState<string | null>(null);

  // Backup / Reset State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupFeedback, setBackupFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setTargetScore(profile.targetScore);
    setTargetExamDate(profile.targetExamDate);
    setDailyGoal(profile.dailyStudyMinutesGoal);
    setDescPreset(profile.descriptiveLimitPreset);
    setDescCharLimit(profile.descriptiveCharLimit);
    setPreferredLanguages(profile.preferredLanguages);
  }, [profile]);

  const targetLevel = getCompetencyLevel(targetScore);

  function handlePresetChange(preset: 'korean_450' | 'english_1500' | 'custom') {
    setDescPreset(preset);
    if (preset === 'korean_450') setDescCharLimit(BLUEPRINT_2026.descriptiveKoreanCharLimit);
    if (preset === 'english_1500') setDescCharLimit(BLUEPRINT_2026.descriptiveEnglishDefaultCharLimit);
  }

  function toggleLanguage(lang: PracticeLang) {
    setPreferredLanguages((prev) => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((l) => l !== lang);
      }
      return [...prev, lang];
    });
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus(null);
    try {
      await updateUserProfile({
        displayName: displayName.trim() || 'BSIT Candidate',
        targetScore: Number(targetScore),
        targetExamDate,
        dailyStudyMinutesGoal: Number(dailyGoal),
        descriptiveLimitPreset: descPreset,
        descriptiveCharLimit: Number(descCharLimit),
        preferredLanguages,
      });
      setProfileStatus({ type: 'ok', text: 'Study targets and preferences saved to IndexedDB.' });
    } catch (err) {
      setProfileStatus({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to save preferences.',
      });
    }
  }

  const areaEarnedSum = recAreas.reduce((acc, a) => acc + Number(a.earnedPoints || 0), 0);
  const areaMaxSum = recAreas.reduce((acc, a) => acc + Number(a.maxPoints || 0), 0);
  const areaCorrectSum = recAreas.reduce((acc, a) => acc + Number(a.correctItems || 0), 0);
  const areaItemsSum = recAreas.reduce((acc, a) => acc + Number(a.totalItems || 0), 0);

  function updateAreaField(
    index: number,
    field: 'earnedPoints' | 'correctItems',
    rawValue: string,
  ) {
    const val = Math.max(0, Number(rawValue) || 0);
    setRecAreas((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item)),
    );
  }

  function autoSyncTotalsFromAreas() {
    setRecTotalScore(areaEarnedSum);
    setRecCorrectItems(areaCorrectSum);
  }

  async function handleSaveHistoricalRecord(e: React.FormEvent) {
    e.preventDefault();
    setRecError(null);
    const candidate = {
      id: `hist-${recDate}-${Date.now()}`,
      formatYear: 2025 as const,
      label: recLabel.trim(),
      examDate: recDate,
      totalScore: Number(recTotalScore),
      maxScore: 1000 as const,
      correctItems: Number(recCorrectItems),
      totalItems: areaItemsSum,
      competencyLevel: getCompetencyLevel(Number(recTotalScore)).level,
      isVerifiedBaseline: false,
      sourceNote: 'Manually imported 2025 historical score record (reconciled via Zod).',
      areas: recAreas,
      importedAt: new Date().toISOString(),
    };

    const parsed = HistoricalScoreRecordSchema.safeParse(candidate);
    if (!parsed.success) {
      setRecError(parsed.error.issues.map((i) => i.message).join(' '));
      return;
    }

    await upsertHistoricalRecord(parsed.data);
    setImportOpen(false);
    setRecAreas(EMPTY_2025_AREAS);
    setRecTotalScore(0);
    setRecCorrectItems(0);
  }

  async function handleExportJson() {
    setBackupFeedback(null);
    try {
      const bundle = await exportBackupBundle();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prepcit-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupFeedback({
        type: 'ok',
        text: `Exported validated PrepCIT backup (${bundle.historicalRecords.length} historical record(s), ${bundle.topicMastery.length} mastery topics).`,
      });
    } catch (err) {
      setBackupFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Export failed.',
      });
    }
  }

  async function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupFeedback(null);
    try {
      const text = await file.text();
      const summary = await importBackupBundle(text);
      setBackupFeedback({
        type: 'ok',
        text: `Imported backup cleanly: ${summary.importedRecords} historical record(s), ${summary.importedMastery} topic mastery entries, ${summary.importedAttempts} attempt(s).`,
      });
    } catch (err) {
      setBackupFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Import failed.',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleResetAll() {
    await resetLocalDatabase();
    setResetDialogOpen(false);
    setBackupFeedback({
      type: 'ok',
      text: 'Local IndexedDB reset and re-seeded with your verified December 10, 2025 baseline.',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Settings, Historical Records &amp; Local Data
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure your 2026 TOPCIT target, manage verified historical records, and export/import offline progress.
        </p>
      </div>

      <Tabs defaultValue="targets">
        <TabsList>
          <TabsTrigger value="targets">Study Targets &amp; Languages</TabsTrigger>
          <TabsTrigger value="historical">Historical Records ({historicalRecords.length})</TabsTrigger>
          <TabsTrigger value="storage">Local Storage &amp; Backup</TabsTrigger>
          <TabsTrigger value="sources">PDF &amp; Source Library</TabsTrigger>
        </TabsList>

        {/* Tab 1: Targets & Languages */}
        <TabsContent value="targets">
          <Card>
            <CardHeader>
              <CardTitle>Study Targets &amp; Practice Preferences</CardTitle>
              <CardDescription>
                Changes persist immediately to local IndexedDB and update your Dashboard goals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="display-name" className="mb-1.5 block text-xs font-medium text-slate-700">
                      Candidate Display Name
                    </label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="target-exam-date" className="mb-1.5 block text-xs font-medium text-slate-700">
                      Target 2026 Exam Date
                    </label>
                    <Input
                      id="target-exam-date"
                      type="date"
                      value={targetExamDate}
                      onChange={(e) => setTargetExamDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="target-score" className="mb-1.5 block text-xs font-medium text-slate-700">
                      Target Score (150 – 1,000)
                    </label>
                    <Input
                      id="target-score"
                      type="number"
                      min={150}
                      max={1000}
                      value={targetScore}
                      onChange={(e) => setTargetScore(Number(e.target.value))}
                      required
                    />
                    <p className="mt-1.5 text-xs font-medium text-brand-700">
                      {targetLevel.label} ({targetLevel.minScore}–{targetLevel.maxScore} pts)
                    </p>
                  </div>
                  <div>
                    <label htmlFor="daily-goal" className="mb-1.5 block text-xs font-medium text-slate-700">
                      Daily Study Goal (Minutes)
                    </label>
                    <Input
                      id="daily-goal"
                      type="number"
                      min={15}
                      max={480}
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Number(e.target.value))}
                      required
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      Recommended: 60–90 minutes daily mixing practical &amp; concept drills.
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">
                      Descriptive Question Length Limit
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Official 2026 Korean TOPCIT descriptive items cap responses at 450 characters.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={descPreset === 'english_1500' ? 'primary' : 'outline'}
                      onClick={() => handlePresetChange('english_1500')}
                    >
                      English Default (1,500 chars)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={descPreset === 'korean_450' ? 'primary' : 'outline'}
                      onClick={() => handlePresetChange('korean_450')}
                    >
                      Official Korean Ref (450 chars)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={descPreset === 'custom' ? 'primary' : 'outline'}
                      onClick={() => handlePresetChange('custom')}
                    >
                      Custom
                    </Button>
                  </div>
                  <div className="max-w-xs">
                    <label htmlFor="desc-limit" className="mb-1 block text-[11px] font-medium text-slate-700">
                      Active Character Limit
                    </label>
                    <Input
                      id="desc-limit"
                      type="number"
                      min={200}
                      max={4000}
                      value={descCharLimit}
                      onChange={(e) => {
                        setDescPreset('custom');
                        setDescCharLimit(Number(e.target.value));
                      }}
                    />
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-medium text-slate-700">
                    Preferred Practice Languages
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => {
                      const active = preferredLanguages.includes(lang.id);
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => toggleLanguage(lang.id)}
                          aria-pressed={active}
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${active
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {profileStatus ? (
                  <div
                    role="status"
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${profileStatus.type === 'ok'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                  >
                    {profileStatus.type === 'ok' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{profileStatus.text}</span>
                  </div>
                ) : null}

                <Button type="submit">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Historical Records */}
        <TabsContent value="historical" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Imported 2025 Historical Score Records
              </h2>
              <p className="text-xs text-slate-500">
                Every record must reconcile mathematically: category points must sum to total score and items must sum to total items.
              </p>
            </div>

            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Import Historical Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Import 2025 Historical Score Record</DialogTitle>
                  <DialogDescription>
                    Enter category points and correct items. PrepCIT validates exact reconciliation before saving.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveHistoricalRecord} className="space-y-4">
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-700">
                        Optional: Attach Score Report Image for Side-by-Side Verification
                      </span>
                      <input
                        aria-label="Upload score report image"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = URL.createObjectURL(file);
                          setScoreImagePreviewUrl((prev) => {
                            if (prev) URL.revokeObjectURL(prev);
                            return url;
                          });
                        }}
                        className="text-[11px] text-slate-600"
                      />
                    </div>
                    {scoreImagePreviewUrl ? (
                      <img
                        src={scoreImagePreviewUrl}
                        alt="Uploaded TOPCIT score report reference"
                        className="max-h-48 w-full rounded border border-slate-200 object-contain bg-white"
                      />
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Preview your score sheet image here while entering exact values below. Zod verifies every category reconciles cleanly.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="rec-label" className="mb-1 block text-xs font-medium text-slate-700">
                        Record Label
                      </label>
                      <Input
                        id="rec-label"
                        value={recLabel}
                        onChange={(e) => setRecLabel(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="rec-date" className="mb-1 block text-xs font-medium text-slate-700">
                        Exam Date
                      </label>
                      <Input
                        id="rec-date"
                        type="date"
                        value={recDate}
                        onChange={(e) => setRecDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor="rec-total" className="mb-1 block text-xs font-medium text-slate-700">
                        Reported Total Score (/1000)
                      </label>
                      <Input
                        id="rec-total"
                        type="number"
                        min={0}
                        max={1000}
                        value={recTotalScore}
                        onChange={(e) => setRecTotalScore(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="rec-correct" className="mb-1 block text-xs font-medium text-slate-700">
                        Reported Correct Items (/65)
                      </label>
                      <Input
                        id="rec-correct"
                        type="number"
                        min={0}
                        max={65}
                        value={recCorrectItems}
                        onChange={(e) => setRecCorrectItems(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={autoSyncTotalsFromAreas}
                      >
                        Sync Totals from Areas
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 font-medium">2025 Area</th>
                          <th className="px-3 py-2 font-medium">Earned / Max</th>
                          <th className="px-3 py-2 font-medium">Correct / Items</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recAreas.map((area, idx) => (
                          <tr key={area.areaId}>
                            <td className="px-3 py-2 font-medium text-slate-800">{area.label}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <Input
                                  aria-label={`${area.label} earned points`}
                                  type="number"
                                  min={0}
                                  max={area.maxPoints}
                                  value={area.earnedPoints}
                                  onChange={(e) => updateAreaField(idx, 'earnedPoints', e.target.value)}
                                  className="h-8 w-20 font-mono text-xs"
                                />
                                <span className="font-mono text-slate-500">/ {area.maxPoints}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <Input
                                  aria-label={`${area.label} correct items`}
                                  type="number"
                                  min={0}
                                  max={area.totalItems}
                                  value={area.correctItems}
                                  onChange={(e) => updateAreaField(idx, 'correctItems', e.target.value)}
                                  className="h-8 w-16 font-mono text-xs"
                                />
                                <span className="font-mono text-slate-500">/ {area.totalItems}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-mono text-xs font-semibold">
                        <tr>
                          <td className="px-3 py-2">Category Sum</td>
                          <td className="px-3 py-2">
                            {areaEarnedSum} / {areaMaxSum}
                          </td>
                          <td className="px-3 py-2">
                            {areaCorrectSum} / {areaItemsSum}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {recError ? (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{recError}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Validate &amp; Save Record</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {historicalRecords.map((rec) => (
            <Card key={rec.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{rec.label}</CardTitle>
                      {rec.isVerifiedBaseline ? (
                        <Badge variant="brand">Verified Baseline</Badge>
                      ) : (
                        <Badge variant="neutral">Imported 2025</Badge>
                      )}
                      <Badge variant="info">Level {rec.competencyLevel}</Badge>
                    </div>
                    <CardDescription>
                      Exam Date: {formatDateShort(rec.examDate)} · Total:{' '}
                      <span className="font-mono font-semibold text-slate-800">
                        {rec.totalScore}/{rec.maxScore}
                      </span>{' '}
                      · Correct:{' '}
                      <span className="font-mono font-semibold text-slate-800">
                        {rec.correctItems}/{rec.totalItems}
                      </span>
                    </CardDescription>
                  </div>
                  {!rec.isVerifiedBaseline ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteHistoricalRecord(rec.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">2025 Area</th>
                      <th className="px-5 py-2.5 font-medium">Score</th>
                      <th className="px-5 py-2.5 font-medium">Weighted %</th>
                      <th className="px-5 py-2.5 font-medium">Items Correct</th>
                      <th className="px-5 py-2.5 font-medium">Item Accuracy %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rec.areas.map((a) => (
                      <tr key={a.areaId}>
                        <td className="px-5 py-2.5 font-medium text-slate-900">{a.label}</td>
                        <td className="px-5 py-2.5 font-mono tabular-nums">
                          {a.earnedPoints} / {a.maxPoints}
                        </td>
                        <td className="px-5 py-2.5 font-mono tabular-nums">
                          {formatPercent((a.earnedPoints / a.maxPoints) * 100)}
                        </td>
                        <td className="px-5 py-2.5 font-mono tabular-nums">
                          {a.correctItems} / {a.totalItems}
                        </td>
                        <td className="px-5 py-2.5 font-mono tabular-nums">
                          {formatPercent((a.correctItems / a.totalItems) * 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Tab 3: Local Storage & Backup */}
        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-brand-600" />
                <CardTitle>IndexedDB Local Persistence &amp; Backup</CardTitle>
              </div>
              <CardDescription>
                All study progress is stored offline in your browser via Dexie.js. Export JSON backups anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Historical Records</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                    {storageStats?.records ?? 0}
                  </p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Tracked Syllabus Topics</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                    {storageStats?.mastery ?? 0}
                  </p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Exam / Practice Attempts</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                    {storageStats?.attempts ?? 0}
                  </p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">Logged Study Sessions</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                    {storageStats?.activities ?? 0}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleExportJson}>
                  <Download className="h-4 w-4" />
                  Export Progress JSON
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportJson}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Import Progress JSON
                </Button>

                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="danger">
                      <RotateCcw className="h-4 w-4" />
                      Reset Local Data
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset Local PrepCIT Database?</DialogTitle>
                      <DialogDescription>
                        This clears your local attempts, custom targets, and logged study sessions, then restores the verified Dec 10, 2025 baseline. Export a JSON backup first if you want to keep your data.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="danger" onClick={handleResetAll}>
                        Confirm Reset
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {backupFeedback ? (
                <div
                  role="status"
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${backupFeedback.type === 'ok'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                >
                  {backupFeedback.type === 'ok' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{backupFeedback.text}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: PDF Sources */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <CardTitle>Local PDF Ingestion &amp; Page-Provenance Extractor</CardTitle>
                </div>
                <Badge variant="success">pdfjs-dist Local Engine</Badge>
              </div>
              <CardDescription>
                Upload your TOPCIT reviewer PDFs or study notes. Text is extracted locally in your browser with page numbers preserved, mapped to 2026 domains M1–M4, and previewed before saving.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPdfBusy(true);
                    setPdfMessage(null);
                    setPdfPreview(null);
                    try {
                      const preview = await extractPdfFileInBrowser(file);
                      setPdfPreview(preview);
                    } catch (err) {
                      setPdfMessage(
                        err instanceof Error ? err.message : 'PDF extraction failed.',
                      );
                    } finally {
                      setPdfBusy(false);
                      if (pdfInputRef.current) pdfInputRef.current.value = '';
                    }
                  }}
                />
                <Button
                  size="sm"
                  disabled={pdfBusy}
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {pdfBusy ? 'Extracting PDF Pages...' : 'Upload PDF Resource'}
                </Button>
                <span className="text-slate-500">
                  Zero external upload · Extracts locally with page provenance
                </span>
              </div>

              {pdfMessage ? (
                <div role="status" className="rounded border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                  {pdfMessage}
                </div>
              ) : null}

              {pdfPreview ? (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Preview &amp; Verify: {pdfPreview.fileName}
                      </h3>
                      <p className="text-[11px] text-slate-600">
                        {pdfPreview.pageCount} page(s) · Type:{' '}
                        <strong>{pdfPreview.documentType}</strong> · Version:{' '}
                        <strong>{pdfPreview.yearVersion}</strong> · Concepts:{' '}
                        <strong>{pdfPreview.concepts.length}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          const sourceId = `src-${Date.now()}`;
                          await db.studySources.put({
                            id: sourceId,
                            fileName: pdfPreview.fileName,
                            documentType: pdfPreview.documentType,
                            yearVersion: pdfPreview.yearVersion,
                            pageCount: pdfPreview.pageCount,
                            extractedConceptCount: pdfPreview.concepts.length,
                            mappedDomains: pdfPreview.mappedDomains.length
                              ? pdfPreview.mappedDomains
                              : ['M1'],
                            verified: true,
                            importedAt: new Date().toISOString(),
                          });
                          const lesson = buildLessonFromPdfPreview(pdfPreview, sourceId);
                          await db.lessons.put(lesson);
                          setPdfPreview(null);
                          setPdfMessage(
                            `Saved "${pdfPreview.fileName}" and added page-linked lesson "${lesson.title}" to Study Library.`,
                          );
                        }}
                      >
                        Verify &amp; Save to Study Library
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setPdfPreview(null)}>
                        Discard
                      </Button>
                    </div>
                  </div>

                  {pdfPreview.warnings.length > 0 ? (
                    <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-amber-900">
                      {pdfPreview.warnings.map((w) => (
                        <p key={w}>! {w}</p>
                      ))}
                    </div>
                  ) : null}

                  {pdfPreview.concepts.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {pdfPreview.concepts.slice(0, 10).map((c) => (
                        <div
                          key={`${c.mappedDomain}-${c.term}-${c.pageNumber}`}
                          className="rounded border border-slate-200 bg-white p-2"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="brand">{c.mappedDomain}</Badge>
                            <span className="font-semibold text-slate-900">{c.term}</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              Page {c.pageNumber}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-600">{c.snippet}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Stored PDF Sources Table */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="mb-2 font-semibold text-slate-900">
                  Imported Study Sources ({studySources.length})
                </h3>
                {studySources.length === 0 ? (
                  <p className="text-slate-500">
                    No user PDFs uploaded yet. Upload a reviewer PDF above to extract concepts with page provenance.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded border border-slate-200">
                    {studySources.map((src) => (
                      <div key={src.id} className="flex items-center justify-between px-3 py-2.5">
                        <div>
                          <p className="font-semibold text-slate-900">{src.fileName}</p>
                          <p className="text-[11px] text-slate-500">
                            {src.pageCount} pages · {src.extractedConceptCount} concepts ·{' '}
                            {src.mappedDomains.join(', ')} · {src.yearVersion}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => void db.studySources.delete(src.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
