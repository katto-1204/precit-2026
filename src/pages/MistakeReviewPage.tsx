import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';
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
import { QUESTION_TYPE_LABELS } from '@/domain/blueprint2026';
import { ERROR_CATEGORY_REMEDIATION } from '@/domain/learningEngine';
import type { ErrorCategory, QuestionResponse } from '@/domain/schemas';

export function MistakeReviewPage() {
  const questions = useLiveQuery(() => db.questions.toArray(), []) ?? [];
  const responses = useLiveQuery(() => db.responses.toArray(), []) ?? [];

  const missedEntries = useMemo(() => {
    const qMap = new Map(questions.map((q) => [q.id, q]));
    const latestByQid = new Map<string, QuestionResponse>();
    for (const r of responses) {
      const prev = latestByQid.get(r.questionId);
      if (!prev || r.updatedAt > prev.updatedAt) {
        latestByQid.set(r.questionId, r);
      }
    }

    return Array.from(latestByQid.values())
      .map((r) => ({ response: r, question: qMap.get(r.questionId) }))
      .filter(
        (entry): entry is { response: QuestionResponse; question: NonNullable<typeof entry.question> } =>
          entry.question !== undefined &&
          entry.response.evaluationStatus !== 'pending_evaluation' &&
          entry.response.earnedPoints < entry.question.pointValue * 0.6,
      )
      .sort((a, b) => b.response.updatedAt.localeCompare(a.response.updatedAt));
  }, [questions, responses]);

  const errorCounts = useMemo(() => {
    const counts = new Map<ErrorCategory, number>();
    for (const entry of missedEntries) {
      if (entry.response.errorCategory) {
        counts.set(
          entry.response.errorCategory,
          (counts.get(entry.response.errorCategory) ?? 0) + 1,
        );
      }
    }
    return counts;
  }, [missedEntries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Mistake Review &amp; Error Diagnostics
            </h1>
            <Badge variant={missedEntries.length > 0 ? 'danger' : 'success'}>
              {missedEntries.length} Item(s) in Queue
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Spaced-repetition review of previously missed questions categorized by root cause with concrete remediation exercises.
          </p>
        </div>

        <Button asChild size="sm" disabled={missedEntries.length === 0}>
          <Link to="/practice?mode=mistakes">
            <RotateCcw className="h-4 w-4" />
            Launch Mistake Review Drill
          </Link>
        </Button>
      </div>

      {/* Error Category Remediation Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(ERROR_CATEGORY_REMEDIATION) as ErrorCategory[]).map((cat) => {
          const meta = ERROR_CATEGORY_REMEDIATION[cat];
          const count = errorCounts.get(cat) ?? 0;
          return (
            <Card key={cat}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">{meta.label}</span>
                  <Badge variant={count > 0 ? 'danger' : 'neutral'}>{count}</Badge>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-600">{meta.nextExercisePrescription}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Missed Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Questions Requiring Spaced Review</CardTitle>
          <CardDescription>
            Every missed question from Practice Hub or Full Mock Exams automatically appears here until mastered.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {missedEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-900">No Unresolved Mistakes Yet</p>
              <p className="max-w-md text-xs text-slate-500">
                Complete a Practice Hub drill or Full 2026 Mock Exam — any incorrect or low-scoring items will be queued here for spaced repetition.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link to="/practice?mode=weakness">
                  Start Weakness Training
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {missedEntries.map(({ question, response }) => (
                <div key={question.id} className="p-5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="brand">{question.domain}</Badge>
                      <Badge variant="neutral">
                        {QUESTION_TYPE_LABELS[question.questionType]}
                      </Badge>
                      <h3 className="text-sm font-semibold text-slate-900">{question.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {response.errorCategory ? (
                        <Badge variant="danger">
                          <ShieldAlert className="h-3 w-3" />
                          {ERROR_CATEGORY_REMEDIATION[response.errorCategory].label}
                        </Badge>
                      ) : null}
                      <Badge variant="warning" className="font-mono">
                        {response.earnedPoints}/{question.pointValue} pts
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{question.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
