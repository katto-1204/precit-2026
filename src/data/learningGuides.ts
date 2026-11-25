import type { Edge, Node } from '@xyflow/react';
import { BLUEPRINT_2026 } from '@/domain/blueprint2026';
import type { DiagramNodeData, DiagramType } from '@/domain/diagramSpecs';
import type { Question } from '@/domain/schemas';
import { getTopicById } from '@/domain/syllabus2026';

export interface GlossaryChip {
  term: string;
  meaning: string;
}

export interface ProgressiveHint {
  level: 1 | 2 | 3;
  title: string;
  body: string;
}

export interface SqlTutorialRecipe {
  id: string;
  title: string;
  badge: string;
  plainEnglish: string;
  whatToWatchFor: string;
  sql: string;
  compatibleChallengeId: string;
}

export interface SqlChallengeCoach {
  situationPlainEnglish: string;
  outputExplained: string;
  glossary: GlossaryChip[];
  hints: ProgressiveHint[];
  guidedFillBlankSql: string;
  workedExampleSql: string;
}

export interface CodingTutorialRecipe {
  id: string;
  title: string;
  badge: string;
  plainEnglish: string;
  pythonCode: string;
  sampleStdin: string;
}

export interface CodingChallengeCoach {
  situationPlainEnglish: string;
  sampleWalkthrough: string;
  glossary: GlossaryChip[];
  hints: ProgressiveHint[];
  guidedFillBlankPython: string;
}

export interface DiagramCoach {
  whatIsItPlainEnglish: string;
  whenTopcitAsks: string;
  situationPlainEnglish: string;
  glossary: GlossaryChip[];
  hints: ProgressiveHint[];
  workedNodes: Node<DiagramNodeData>[];
  workedEdges: Edge[];
}

export interface IntegratedCoach {
  situationPlainEnglish: string;
  glossary: GlossaryChip[];
  hints: ProgressiveHint[];
  guidedOutlineTemplate: string;
}

// ============================================================================
// 1. SQL 101 INTERACTIVE SANDBOX RECIPES (1-CLICK TRY-IT MINI TUTORIALS)
// ============================================================================
export const SQL_TUTORIAL_RECIPES: readonly SqlTutorialRecipe[] = [
  {
    id: 'sql-tut-peek',
    title: '1. Peek Inside a Table (SELECT *)',
    badge: 'Beginner',
    plainEnglish:
      'Before solving any SQL question, look at what rows are actually inside the tables! SELECT * means "show me every column".',
    whatToWatchFor:
      'Look at dept_id in students — that number connects each student to their department in the departments table.',
    compatibleChallengeId: 'sql-dept-gpa',
    sql: `-- Step 1: Just inspect what is inside the students table!
SELECT * FROM students;`,
  },
  {
    id: 'sql-tut-join',
    title: '2. Connect Two Tables (JOIN ... ON)',
    badge: 'Core Skill',
    plainEnglish:
      'Tables are split apart so data is not duplicated. JOIN glues two tables together side-by-side wherever their IDs match.',
    whatToWatchFor:
      'We give departments the nickname "d" and students the nickname "s" so we can write d.dept_id = s.dept_id cleanly.',
    compatibleChallengeId: 'sql-dept-gpa',
    sql: `-- Step 2: Match each student to their department name
SELECT s.full_name, d.dept_name
FROM students s
JOIN departments d ON s.dept_id = d.dept_id
ORDER BY d.dept_name, s.full_name;`,
  },
  {
    id: 'sql-tut-groupby',
    title: '3. Group & Summarize (GROUP BY + COUNT)',
    badge: 'Core Skill',
    plainEnglish:
      'GROUP BY puts rows into buckets (one bucket per department). Then COUNT() or SUM() calculates one summary number per bucket.',
    whatToWatchFor:
      'Use COUNT(DISTINCT s.student_id) when joining enrollments so a student with 2 classes is still counted as 1 student, not 2!',
    compatibleChallengeId: 'sql-dept-gpa',
    sql: `-- Step 3: Count how many distinct students are in each department
SELECT
  d.dept_name,
  COUNT(DISTINCT s.student_id) AS student_count
FROM departments d
JOIN students s ON s.dept_id = d.dept_id
JOIN enrollments e ON e.student_id = s.student_id
GROUP BY d.dept_id, d.dept_name;`,
  },
  {
    id: 'sql-tut-having',
    title: '4. Filter After Grouping (WHERE vs HAVING)',
    badge: 'Exam Classic',
    plainEnglish:
      'WHERE filters individual rows BEFORE bucketing. HAVING filters whole buckets AFTER GROUP BY calculates SUM/AVG/COUNT.',
    whatToWatchFor:
      'Because weighted_gpa uses SUM(), SQL requires HAVING (not WHERE) to keep only departments with GPA >= 3.20.',
    compatibleChallengeId: 'sql-dept-gpa',
    sql: `-- Step 4: Calculate credit-weighted GPA and keep only >= 3.20
SELECT
  d.dept_name,
  ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) AS weighted_gpa
FROM departments d
JOIN students s ON s.dept_id = d.dept_id
JOIN enrollments e ON e.student_id = s.student_id
GROUP BY d.dept_id, d.dept_name
HAVING weighted_gpa >= 3.20
ORDER BY weighted_gpa DESC;`,
  },
  {
    id: 'sql-tut-leftjoin',
    title: '5. Keep Zero-Order Customers (LEFT JOIN Trap)',
    badge: 'TOPCIT Favorite',
    plainEnglish:
      'An inner JOIN drops customers who have 0 matching orders. LEFT JOIN keeps EVERY row on the left table, filling missing right columns with NULL.',
    whatToWatchFor:
      'Put "o.order_year = 2026" inside ON (not WHERE), and use COUNT(o.order_id) instead of COUNT(*) so NULL counts as 0, not 1!',
    compatibleChallengeId: 'sql-left-join-orders',
    sql: `-- Step 5: See how LEFT JOIN keeps Beacon Labs with NULL right columns
SELECT c.customer_name, o.order_id, o.order_year
FROM customers c
LEFT JOIN orders o
  ON c.customer_id = o.customer_id
  AND o.order_year = 2026;`,
  },
];

// ============================================================================
// 2. SQL CHALLENGE COACHING (PLAIN ENGLISH + 3-TIER HINTS + FILL-IN-THE-BLANK)
// ============================================================================
export const SQL_CHALLENGE_COACHING: Record<string, SqlChallengeCoach> = {
  'sql-dept-gpa': {
    situationPlainEnglish:
      'Imagine you are the university registrar preparing an Honors Report. You have 3 tables: departments (CS, IT, IS), students (who belongs to which department), and enrollments (the classes, credits, and grades each student earned). You need one summary row per department showing how many students it has and its overall credit-weighted GPA — but ONLY for departments averaging 3.20 or higher.',
    outputExplained:
      'Your result table needs exactly 3 columns: dept_name, student_count, and weighted_gpa — sorted from highest GPA to lowest (ties broken alphabetically by dept_name).',
    glossary: [
      { term: 'JOIN ... ON', meaning: 'Connects two tables using a matching ID column (like Foreign Key = Primary Key).' },
      { term: 'COUNT(DISTINCT x)', meaning: 'Counts unique values only, preventing double-counting when a student takes multiple classes.' },
      { term: 'Weighted GPA', meaning: 'Multiply each class credits * grade_points first, add them up, then divide by total credits.' },
      { term: '* 1.0', meaning: 'Forces decimal division in SQLite so integers do not get truncated.' },
      { term: 'HAVING', meaning: 'Filters groups AFTER GROUP BY (unlike WHERE, which filters raw rows before grouping).' },
    ],
    hints: [
      {
        level: 1,
        title: 'Hint 1 — Trace the Table Chain',
        body: 'Start FROM departments d, then JOIN students s ON s.dept_id = d.dept_id, then JOIN enrollments e ON e.student_id = s.student_id. Now every enrollment row knows both its student and its department!',
      },
      {
        level: 2,
        title: 'Hint 2 — Avoid the Two Classic Traps',
        body: 'Trap A: COUNT(s.student_id) counts enrollment rows instead of unique students — use COUNT(DISTINCT s.student_id). Trap B: Do not use AVG(grade_points), because a 4-credit class weighs more than a 3-credit class. Use SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits).',
      },
      {
        level: 3,
        title: 'Hint 3 — Filtering & Sorting Order',
        body: 'Group by d.dept_id, d.dept_name, then add HAVING ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) >= 3.20, and finish with ORDER BY weighted_gpa DESC, d.dept_name ASC.',
      },
    ],
    guidedFillBlankSql: `-- GUIDED PRACTICE: Replace each /* ??? */ blank, then click Execute SQL or Grade Query!
SELECT
  d.dept_name,
  COUNT(DISTINCT /* ???: student primary key column */) AS student_count,
  ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(/* ???: credits column */), 2) AS weighted_gpa
FROM departments d
JOIN students s ON s.dept_id = d.dept_id
JOIN enrollments e ON e.student_id = /* ???: matching student id */
GROUP BY d.dept_id, d.dept_name
HAVING ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) >= /* ???: minimum GPA */
ORDER BY weighted_gpa DESC, d.dept_name ASC;`,
    workedExampleSql: `-- COMMENTED WORKED SOLUTION (100% Credit)
SELECT
  d.dept_name,
  -- DISTINCT avoids double-counting students who took multiple classes
  COUNT(DISTINCT s.student_id) AS student_count,
  -- Multiply by 1.0 for floating-point division, then round to 2 decimals
  ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) AS weighted_gpa
FROM departments d
JOIN students s ON s.dept_id = d.dept_id
JOIN enrollments e ON e.student_id = s.student_id
GROUP BY d.dept_id, d.dept_name
-- HAVING filters grouped aggregates (WHERE cannot use SUM)
HAVING ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) >= 3.20
ORDER BY weighted_gpa DESC, d.dept_name ASC;`,
  },
  'sql-left-join-orders': {
    situationPlainEnglish:
      'Imagine you are building a 2026 Sales Dashboard for all 3 company clients: Acme Corp, Beacon Labs, and Crest Edu. Beacon Labs only ordered in 2025 (zero orders in 2026). Your boss still wants Beacon Labs listed on the report with a 0 — NOT silently deleted!',
    outputExplained:
      'Return 2 columns (customer_name, orders_2026) with ALL 3 customers included. Beacon Labs MUST appear with orders_2026 = 0.',
    glossary: [
      { term: 'LEFT JOIN', meaning: 'Keeps 100% of rows from the left table (customers), even if the right table (orders) has no match.' },
      { term: 'ON vs WHERE', meaning: 'Putting o.order_year = 2026 in WHERE turns a LEFT JOIN back into an INNER JOIN and deletes NULL rows! Keep it inside ON.' },
      { term: 'COUNT(col) vs COUNT(*)', meaning: 'COUNT(o.order_id) ignores NULLs (giving 0). COUNT(*) counts the NULL placeholder row (wrongly giving 1!).' },
    ],
    hints: [
      {
        level: 1,
        title: 'Hint 1 — Why Did Beacon Labs Disappear?',
        body: 'If you write WHERE o.order_year = 2026, SQL throws away Beacon Labs because its matched order_year is NULL. Instead, move AND o.order_year = 2026 into the LEFT JOIN ... ON clause!',
      },
      {
        level: 2,
        title: 'Hint 2 — Why Did Beacon Labs Show 1 Instead of 0?',
        body: 'COUNT(*) counts every row in the group — even a customer row whose order columns are all NULL. Switch to COUNT(o.order_id) so SQL only counts real, non-NULL orders.',
      },
      {
        level: 3,
        title: 'Hint 3 — Final Grouping & Sort',
        body: 'Finish with GROUP BY c.customer_id, c.customer_name ORDER BY orders_2026 DESC, c.customer_name ASC;',
      },
    ],
    guidedFillBlankSql: `-- GUIDED PRACTICE: Fill in the 3 blanks to avoid the classic TOPCIT LEFT JOIN trap!
SELECT
  c.customer_name,
  COUNT(/* ???: order id column so NULL counts as 0 */) AS orders_2026
FROM customers c
/* ???: which JOIN keeps every customer? */ orders o
  ON c.customer_id = o.customer_id
  AND o.order_year = /* ???: target year */
GROUP BY c.customer_id, c.customer_name
ORDER BY orders_2026 DESC, c.customer_name ASC;`,
    workedExampleSql: `-- COMMENTED WORKED SOLUTION (100% Credit)
SELECT
  c.customer_name,
  -- COUNT(o.order_id) skips NULLs so Beacon Labs gets 0 (COUNT(*) would wrongly give 1)
  COUNT(o.order_id) AS orders_2026
FROM customers c
-- Putting o.order_year = 2026 in ON preserves customers who have no 2026 orders
LEFT JOIN orders o
  ON c.customer_id = o.customer_id
  AND o.order_year = 2026
GROUP BY c.customer_id, c.customer_name
ORDER BY orders_2026 DESC, c.customer_name ASC;`,
  },
};

// ============================================================================
// 3. PYTHON 101 WARM-UP RECIPES & CODING CHALLENGE COACHING
// ============================================================================
export const CODING_TUTORIAL_RECIPES: readonly CodingTutorialRecipe[] = [
  {
    id: 'py-tut-io',
    title: '1. Reading Input Lines (sys.stdin)',
    badge: 'Start Here',
    plainEnglish:
      'In TOPCIT coding tasks, test data arrives as plain text lines (stdin) instead of keyboard prompts. This 6-line pattern reads lines cleanly and prints output.',
    sampleStdin: '3\nAna\nBen\nCara',
    pythonCode: `import sys

# Read all non-empty lines from standard input
lines = [line.strip() for line in sys.stdin if line.strip()]
n = int(lines[0])

for i in range(1, 1 + n):
    name = lines[i]
    print(f"Hello, {name}!")
`,
  },
  {
    id: 'py-tut-deque',
    title: '2. Sliding Window Queue (deque)',
    badge: 'Rate Limiter Prep',
    plainEnglish:
      'A deque is a fast two-ended list. Append new timestamps to the right and pop expired old timestamps from the left with popleft()!',
    sampleStdin: '',
    pythonCode: `from collections import deque

window_sec = 10
timestamps = [1, 5, 8, 11]
q = deque()

for t in timestamps:
    # Remove timestamps older than [t - window_sec + 1, t]
    while q and q[0] < t - window_sec + 1:
        q.popleft()
    if len(q) < 2:
        q.append(t)
        print(f"t={t}: ALLOW (queue={list(q)})")
    else:
        print(f"t={t}: BLOCK (queue={list(q)})")
`,
  },
  {
    id: 'py-tut-graph',
    title: '3. 3-State Graph Cycle Check (DFS)',
    badge: 'Debugging Prep',
    plainEnglish:
      'Track each node with 3 states: 0 = never visited, 1 = currently exploring on this path (cycle if seen again!), 2 = completely safe and finished.',
    sampleStdin: '',
    pythonCode: `graph = {0: [1, 2], 1: [3], 2: [3], 3: []}
state = {0: 0, 1: 0, 2: 0, 3: 0}

def has_no_cycle(u):
    if state[u] == 1:
        return False  # Found a back-edge cycle!
    if state[u] == 2:
        return True   # Already proven safe (diamond DAG!)
    state[u] = 1
    for v in graph[u]:
        if not has_no_cycle(v):
            return False
    state[u] = 2
    return True

print("Acyclic?", all(has_no_cycle(node) for node in graph))
`,
  },
];

export const CODING_CHALLENGE_COACHING: Record<string, CodingChallengeCoach> = {
  'code-rate-limiter': {
    situationPlainEnglish:
      'Think of a nightclub bouncer with a stopwatch! Each user is allowed at most `limit` entries inside the last `window_sec` seconds. If a user tries to enter and already hit their limit inside that time window, print BLOCK — and do NOT add the blocked attempt to their history.',
    sampleWalkthrough:
      'Sample: limit=2, window=10.\n• t=1 (u1): window is [-8..1]. 0 entries < 2 → ALLOW (keep [1])\n• t=5 (u1): window is [-4..5]. 1 entry < 2 → ALLOW (keep [1, 5])\n• t=8 (u1): window is [-1..8]. 2 entries == 2 → BLOCK (still [1, 5])\n• t=11 (u1): window is [2..11]. Timestamp 1 expired! Only [5] remains (1 < 2) → ALLOW!',
    glossary: [
      { term: 'Sliding Window', meaning: 'A moving time range [t - window_sec + 1, t] that shifts forward with each new timestamp t.' },
      { term: 'defaultdict(deque)', meaning: 'A dictionary that automatically gives each user_id their own fast queue of timestamps.' },
      { term: 'popleft()', meaning: 'Removes the oldest timestamp from the front of the queue in O(1) time.' },
    ],
    hints: [
      {
        level: 1,
        title: 'Hint 1 — Keep One Queue Per User',
        body: 'Store each user’s ALLOWED timestamps in `history = defaultdict(deque)` so User A’s requests never block User B.',
      },
      {
        level: 2,
        title: 'Hint 2 — Evict Expired Timestamps First',
        body: 'Before checking `len(q) < limit`, remove every timestamp older than `t - window_sec + 1` using `while q and q[0] < t - window_sec + 1: q.popleft()`.',
      },
      {
        level: 3,
        title: 'Hint 3 — Do Not Record BLOCKed Calls',
        body: 'Only call `q.append(t)` inside the `if len(q) < limit:` branch! Blocked requests must NOT count against future quota.',
      },
    ],
    guidedFillBlankPython: `from collections import defaultdict, deque
import sys

def solve():
    lines = [line.strip() for line in sys.stdin if line.strip()]
    if not lines:
        return
    limit, window_sec = map(int, lines[0].split())
    n = int(lines[1])
    history = defaultdict(deque)
    out = []

    for i in range(2, 2 + n):
        t_str, user = lines[i].split()
        t = int(t_str)
        q = history[user]

        # STEP 1: Evict timestamps strictly less than (t - window_sec + 1)
        while q and q[0] < (t - window_sec + 1):
            q.popleft()

        # STEP 2: Allow if len(q) < limit (and append t), else BLOCK
        if len(q) < limit:
            q.append(t)
            out.append("ALLOW")
        else:
            out.append("BLOCK")

    print("\\n".join(out))

if __name__ == "__main__":
    solve()
`,
  },
  'code-debug-prereqs': {
    situationPlainEnglish:
      'Imagine planning college classes where Course 3 needs BOTH Course 1 and Course 2 (a diamond shape: 0→1→3 and 0→2→3). That is totally valid — NOT a circular deadlock! The buggy starter code crashes on diamonds because it forgets whether Course 3 is "currently being checked" or "already checked and safe".',
    sampleWalkthrough:
      'Diamond DAG (0→1, 0→2, 1→3, 2→3): DFS visits 0→1→3 and finishes 3 (state=2). Later it visits 0→2→3. Seeing state[3]==2 means "already safe, return True!" — whereas seeing state==1 means "loop detected, return False!".',
    glossary: [
      { term: 'DAG', meaning: 'Directed Acyclic Graph — a dependency map with arrows and ZERO circular loops.' },
      { term: '3-State DFS', meaning: '0 = Unvisited, 1 = Visiting right now (on recursion stack), 2 = Completely verified safe.' },
      { term: 'Kahn’s Algorithm', meaning: 'Alternative BFS approach: repeatedly take courses with 0 remaining prerequisites.' },
    ],
    hints: [
      {
        level: 1,
        title: 'Hint 1 — Spot the Bug in the Starter Code',
        body: 'In the starter code, `visited` never removes nodes after DFS finishes. So visiting node 3 from branch 1 and then again from branch 2 falsely triggers `if node in visited: return False`!',
      },
      {
        level: 2,
        title: 'Hint 2 — Replace `visited = set()` with `state = [0] * num_courses`',
        body: 'At the top of `dfs(u)`: if `state[u] == 1`, return `False` (real cycle!). If `state[u] == 2`, return `True` (already safe!).',
      },
      {
        level: 3,
        title: 'Hint 3 — Mark Visiting Before Loop, Safe After Loop',
        body: 'Set `state[u] = 1` before exploring neighbors `for v in graph[u]:`, and set `state[u] = 2` right before returning `True`.',
      },
    ],
    guidedFillBlankPython: `import sys
from collections import defaultdict

def can_finish(num_courses, prerequisites):
    graph = defaultdict(list)
    for course, prereq in prerequisites:
        graph[prereq].append(course)

    # 0 = unvisited, 1 = visiting (on current path), 2 = verified safe
    state = [0] * num_courses

    def dfs(u):
        if state[u] == 1:
            return False  # Real circular dependency!
        if state[u] == 2:
            return True   # Already checked and safe (fixes diamond bug!)

        state[u] = 1
        for nxt in graph[u]:
            if not dfs(nxt):
                return False
        state[u] = 2
        return True

    for c in range(num_courses):
        if state[c] == 0:
            if not dfs(c):
                return False
    return True

def main():
    lines = [l.strip() for l in sys.stdin if l.strip()]
    if not lines:
        return
    num_courses = int(lines[0])
    m = int(lines[1])
    prereqs = [tuple(map(int, lines[2 + i].split())) for i in range(m)]
    print(can_finish(num_courses, prereqs))

if __name__ == "__main__":
    main()
`,
  },
  'code-sec-password-audit': {
    situationPlainEnglish:
      'You are writing a security gatekeeper for a login system. Every candidate password must pass 6 simple rules: at least 12 characters long, no word "password" (in any uppercase/lowercase spelling), plus at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol from `!@#$%^&*`.',
    sampleWalkthrough:
      '• "Topcit2026!Secure" → len=17 (>=12), has T, o, 2, !, no "password" → STRONG\n• "Password123!" → contains "password" (case-insensitive!) → WEAK\n• "short1!A" → len=8 (<12) → WEAK',
    glossary: [
      { term: 'Case-insensitive', meaning: 'Convert to lowercase first with `pw.lower()` so "PaSsWoRd" is caught too.' },
      { term: 'any(...)', meaning: 'Python shortcut that returns True if at least one character satisfies a check.' },
    ],
    hints: [
      {
        level: 1,
        title: 'Hint 1 — Check Length & Banned Word First',
        body: 'Reject early if `len(pw) < 12` or `"password" in pw.lower()`.',
      },
      {
        level: 2,
        title: 'Hint 2 — Check the 4 Character Classes',
        body: 'Use `any(c.isupper() for c in pw)`, `c.islower()`, `c.isdigit()`, and `c in "!@#$%^&*"`.',
      },
      {
        level: 3,
        title: 'Hint 3 — Print Exact Labels',
        body: 'Print `"STRONG"` if all 6 rules pass, otherwise `"WEAK"`, one per line for all N passwords.',
      },
    ],
    guidedFillBlankPython: `import sys

def is_strong(pw: str) -> bool:
    if len(pw) < 12:
        return False
    if "password" in pw.lower():
        return False
    has_upper = any(c.isupper() for c in pw)
    has_lower = any(c.islower() for c in pw)
    has_digit = any(c.isdigit() for c in pw)
    has_special = any(c in "!@#$%^&*" for c in pw)
    return has_upper and has_lower and has_digit and has_special

def main():
    lines = [l.strip() for l in sys.stdin if l.strip()]
    if not lines:
        return
    n = int(lines[0])
    for i in range(1, 1 + n):
        print("STRONG" if is_strong(lines[i]) else "WEAK")

if __name__ == "__main__":
    main()
`,
  },
};

// ============================================================================
// 4. DIAGRAM LAB COACHING + READY-MADE 100% WORKED EXAMPLES FOR ALL 8 TYPES
// ============================================================================
function mkWorkedNode(
  id: string,
  diagramType: DiagramType,
  shapeType: string,
  x: number,
  y: number,
  label: string,
  opts?: { width?: number; height?: number; fill?: string; stroke?: string; details?: string },
): Node<DiagramNodeData> {
  const width = opts?.width ?? 160;
  const height = opts?.height ?? 56;
  return {
    id,
    type: 'prepcitNode',
    position: { x, y },
    style: { width, height },
    data: {
      diagramType,
      shapeType,
      label,
      details: opts?.details ?? '',
      fillColor: opts?.fill ?? '#ffffff',
      strokeColor: opts?.stroke ?? '#334155',
      strokeWidth: 1.8,
      fontSize: 12,
      textAlign: 'center',
      width,
      height,
    },
  };
}

function mkWorkedEdge(id: string, source: string, target: string, label = '', dashed = false): Edge {
  return {
    id,
    source,
    target,
    label,
    type: 'smoothstep',
    style: {
      stroke: dashed ? '#c81e1e' : '#334155',
      strokeWidth: 1.8,
      ...(dashed ? { strokeDasharray: '6 4' } : {}),
    },
  };
}

export const DIAGRAM_COACHING: Record<DiagramType, DiagramCoach> = {
  uml_activity: {
    whatIsItPlainEnglish:
      'An Activity Diagram is a step-by-step map of how a workflow moves from Start (solid black dot) through Actions (rounded boxes) and Decisions (diamonds) to Finish (bullseye dot).',
    whenTopcitAsks:
      'Look for words like "workflow", "approval flow", "parallel steps (fork/join)", or "swimlanes".',
    situationPlainEnglish:
      'A student wants to enroll in a class. First we check Prerequisites (Yes/No). If No, notify error and end. If Yes, check Seat availability, process Payment, Confirm Enrollment, and end!',
    glossary: [
      { term: 'Initial Node', meaning: 'Solid black circle — where the process begins.' },
      { term: 'Decision Diamond', meaning: 'A Yes/No fork in the road. Always label arrows like [Yes] and [No]!' },
      { term: 'Activity Final', meaning: 'Bullseye circle — the whole workflow stops here.' },
    ],
    hints: [
      { level: 1, title: 'Step 1 — Place the Core Shapes', body: 'Click shapes on the left palette to drop at least: 1 Initial Node, 3–4 Action boxes, 1–2 Decision diamonds, and 1 Activity Final.' },
      { level: 2, title: 'Step 2 — Connect the Arrows', body: 'Drag from the small handle dot on the edge of one shape to another shape. Double-click any arrow or shape to rename it!' },
      { level: 3, title: 'Step 3 — Check Keywords & Validate', body: 'Make sure your labels include "Prerequisites", "Seat", and "Payment", then click the Validate button in the top bar!' },
    ],
    workedNodes: [
      mkWorkedNode('wk-act-1', 'uml_activity', 'initial', 60, 120, 'Start', { width: 44, height: 44, fill: '#0f172a', stroke: '#0f172a' }),
      mkWorkedNode('wk-act-2', 'uml_activity', 'action', 160, 114, 'Submit Course Selection', { width: 170, height: 56 }),
      mkWorkedNode('wk-act-3', 'uml_activity', 'decision', 390, 105, 'Prerequisites Met?', { width: 130, height: 74, fill: '#fef2f2', stroke: '#c81e1e' }),
      mkWorkedNode('wk-act-4', 'uml_activity', 'action', 370, 240, 'Notify Prerequisite Error', { width: 170, height: 54 }),
      mkWorkedNode('wk-act-5', 'uml_activity', 'decision', 580, 105, 'Seat Available?', { width: 120, height: 74, fill: '#fef2f2', stroke: '#c81e1e' }),
      mkWorkedNode('wk-act-6', 'uml_activity', 'action', 760, 114, 'Process Tuition Payment', { width: 175, height: 56 }),
      mkWorkedNode('wk-act-7', 'uml_activity', 'action', 760, 220, 'Confirm Enrollment', { width: 175, height: 54 }),
      mkWorkedNode('wk-act-8', 'uml_activity', 'final', 620, 244, 'End', { width: 46, height: 46 }),
    ],
    workedEdges: [
      mkWorkedEdge('wk-ae-1', 'wk-act-1', 'wk-act-2'),
      mkWorkedEdge('wk-ae-2', 'wk-act-2', 'wk-act-3'),
      mkWorkedEdge('wk-ae-3', 'wk-act-3', 'wk-act-4', '[No]'),
      mkWorkedEdge('wk-ae-4', 'wk-act-4', 'wk-act-8'),
      mkWorkedEdge('wk-ae-5', 'wk-act-3', 'wk-act-5', '[Yes]'),
      mkWorkedEdge('wk-ae-6', 'wk-act-5', 'wk-act-6', '[Yes]'),
      mkWorkedEdge('wk-ae-7', 'wk-act-6', 'wk-act-7'),
      mkWorkedEdge('wk-ae-8', 'wk-act-7', 'wk-act-8'),
    ],
  },
  uml_class: {
    whatIsItPlainEnglish:
      'A Class Diagram shows the blueprints of your software objects: each box has a Class Name (top), Attributes/data (middle), and Methods/actions (bottom), linked by relationships.',
    whenTopcitAsks:
      'Look for OOP words like "class", "interface", "strategy pattern", "inheritance", or "multiplicity (1..*)".',
    situationPlainEnglish:
      'A Campus Library system tracks Members who borrow BookCopies through Loans. Because Students and Faculty pay different late fees, we use a FinePolicy interface implemented by StudentFinePolicy and FacultyFinePolicy!',
    glossary: [
      { term: 'Interface (<<interface>>)', meaning: 'A contract defining method signatures (computeFine) that multiple concrete classes implement.' },
      { term: 'Strategy Pattern', meaning: 'Plugging different policies (Student vs Faculty fine rules) into Loan without messy if/else chains.' },
      { term: 'Visibility (+ / -)', meaning: '- means private attribute; + means public method.' },
    ],
    hints: [
      { level: 1, title: 'Step 1 — Add the Core Classes & Interface', body: 'Drop Class boxes for Member, Loan, BookCopy, StudentFinePolicy, and FacultyFinePolicy, plus an Interface box for FinePolicy.' },
      { level: 2, title: 'Step 2 — Connect Relationships', body: 'Connect Member → Loan (1..*), Loan → BookCopy, Loan → FinePolicy (uses), and StudentFinePolicy / FacultyFinePolicy → FinePolicy (implements).' },
      { level: 3, title: 'Step 3 — Validate Required Labels', body: 'Make sure "Member", "Loan", and "FinePolicy" appear in your class/interface titles, then click Validate!' },
    ],
    workedNodes: [
      mkWorkedNode('wk-cls-1', 'uml_class', 'class', 40, 60, 'Member', { width: 185, height: 112, details: '- memberId: String\n- role: Role\n---\n+ borrowCopy()' }),
      mkWorkedNode('wk-cls-2', 'uml_class', 'class', 280, 60, 'Loan', { width: 185, height: 112, details: '- loanId: Long\n- dueDate: Date\n---\n+ calcFine(): float' }),
      mkWorkedNode('wk-cls-3', 'uml_class', 'class', 520, 60, 'BookCopy', { width: 175, height: 112, details: '- barcode: String\n- status: Status\n---\n+ markLoaned()' }),
      mkWorkedNode('wk-cls-4', 'uml_class', 'interface', 275, 225, '<<interface>> FinePolicy', { width: 200, height: 92, fill: '#fef2f2', stroke: '#c81e1e', details: '+ computeFine(days: int): float' }),
      mkWorkedNode('wk-cls-5', 'uml_class', 'class', 120, 360, 'StudentFinePolicy', { width: 185, height: 86, details: '+ computeFine(days): float' }),
      mkWorkedNode('wk-cls-6', 'uml_class', 'class', 410, 360, 'FacultyFinePolicy', { width: 185, height: 86, details: '+ computeFine(days): float' }),
    ],
    workedEdges: [
      mkWorkedEdge('wk-ce-1', 'wk-cls-1', 'wk-cls-2', '1 : 0..*'),
      mkWorkedEdge('wk-ce-2', 'wk-cls-2', 'wk-cls-3', '1 : 1'),
      mkWorkedEdge('wk-ce-3', 'wk-cls-2', 'wk-cls-4', 'uses', true),
      mkWorkedEdge('wk-ce-4', 'wk-cls-5', 'wk-cls-4', 'implements', true),
      mkWorkedEdge('wk-ce-5', 'wk-cls-6', 'wk-cls-4', 'implements', true),
    ],
  },
  uml_component: {
    whatIsItPlainEnglish:
      'A Component Diagram zooms out to show big deployable building blocks of a system (WAF, Load Balancer, App Servers, Database) and how traffic flows safely across network tiers.',
    whenTopcitAsks:
      'Look for "3-tier architecture", "DMZ", "WAF / firewall", "load balancer", or "high availability".',
    situationPlainEnglish:
      'User traffic hits a WAF/Firewall first (blocking attacks), then a Redundant Load Balancer splits traffic across 2 stateless App Servers, which talk privately to the Primary & Standby DB — never letting the Internet touch the DB directly!',
    glossary: [
      { term: 'WAF', meaning: 'Web Application Firewall — inspects HTTPS traffic at the edge to block SQLi/XSS attacks.' },
      { term: 'Load Balancer', meaning: 'Distributes incoming requests across multiple App Servers so one crash does not take the site down.' },
      { term: 'DMZ / Private Tier', meaning: 'Separates public-facing components from private databases so attackers cannot jump straight to data.' },
    ],
    hints: [
      { level: 1, title: 'Step 1 — Place Edge, App, and DB Tiers', body: 'Add Components for WAF / Edge Firewall, Redundant Load Balancer, App Server 1, and App Server 2, plus a Data Store / DB cylinder.' },
      { level: 2, title: 'Step 2 — Chain the Traffic Arrows', body: 'Connect WAF → Load Balancer → App Server 1 & App Server 2 → Primary DB.' },
      { level: 3, title: 'Step 3 — Validate Architecture Keywords', body: 'Ensure "WAF", "Load Balancer", "App", and "DB" appear in your labels, then click Validate!' },
    ],
    workedNodes: [
      mkWorkedNode('wk-cmp-1', 'uml_component', 'component', 40, 120, 'WAF / Edge Firewall', { width: 175, height: 70, fill: '#fef2f2', stroke: '#c81e1e', details: 'TLS 1.3 Termination' }),
      mkWorkedNode('wk-cmp-2', 'uml_component', 'component', 265, 120, 'Redundant Load Balancer', { width: 190, height: 70, details: 'Active-Active DMZ' }),
      mkWorkedNode('wk-cmp-3', 'uml_component', 'component', 510, 50, 'Stateless App Server 1', { width: 175, height: 68 }),
      mkWorkedNode('wk-cmp-4', 'uml_component', 'component', 510, 190, 'Stateless App Server 2', { width: 175, height: 68 }),
      mkWorkedNode('wk-cmp-5', 'uml_component', 'database', 745, 118, 'Primary & Standby DB', { width: 175, height: 78, fill: '#f0f9ff', stroke: '#0284c7' }),
    ],
    workedEdges: [
      mkWorkedEdge('wk-cme-1', 'wk-cmp-1', 'wk-cmp-2', 'HTTPS :443'),
      mkWorkedEdge('wk-cme-2', 'wk-cmp-2', 'wk-cmp-3', 'HTTP'),
      mkWorkedEdge('wk-cme-3', 'wk-cmp-2', 'wk-cmp-4', 'HTTP'),
      mkWorkedEdge('wk-cme-4', 'wk-cmp-3', 'wk-cmp-5', 'Private SQL', true),
      mkWorkedEdge('wk-cme-5', 'wk-cmp-4', 'wk-cmp-5', 'Private SQL', true),
    ],
  },
  er_diagram: {
    whatIsItPlainEnglish:
      'An ER Diagram (ERD) maps out database tables (Entities) and how they connect (1:N or M:N). Think of it as the visual sketch you draw BEFORE writing CREATE TABLE SQL!',
    whenTopcitAsks:
      'Look for "database schema", "3NF", "many-to-many resolution", "PK / FK", or "Crow’s Foot cardinality".',
    situationPlainEnglish:
      'Students can enroll in many Course Sections, and each Section holds many Students (M:N!). In real SQL databases, we resolve M:N by placing an ENROLLMENT associative/bridge table in the middle with clean 1:N links.',
    glossary: [
      { term: 'PK (Primary Key)', meaning: 'Unique ID for every row in a table (like student_id).' },
      { term: 'FK (Foreign Key)', meaning: 'A column pointing to another table’s Primary Key.' },
      { term: 'Associative Entity', meaning: 'A middle junction table (ENROLLMENT) that breaks an M:N link into two 1:N links.' },
    ],
    hints: [
      { level: 1, title: 'Step 1 — Place Entities & Associative Table', body: 'Add Strong Entities for STUDENT, SECTION, and COURSE, plus an Associative / Junction Entity for ENROLLMENT.' },
      { level: 2, title: 'Step 2 — Connect with 1:N Crow’s Foot', body: 'Connect STUDENT → ENROLLMENT (1:N), SECTION → ENROLLMENT (1:N), and COURSE → SECTION (1:N).' },
      { level: 3, title: 'Step 3 — Check Keywords & Validate', body: 'Make sure STUDENT, COURSE, and ENROLLMENT appear in entity titles with PK/FK details, then click Validate!' },
    ],
    workedNodes: [
      mkWorkedNode('wk-erd-1', 'er_diagram', 'entity', 40, 100, 'STUDENT', { width: 185, height: 112, details: 'PK student_id INT\n   full_name VARCHAR\n   email VARCHAR' }),
      mkWorkedNode('wk-erd-2', 'er_diagram', 'associative_entity', 280, 100, 'ENROLLMENT', { width: 200, height: 118, fill: '#fef2f2', stroke: '#c81e1e', details: 'PK enrollment_id INT\nFK student_id INT\nFK section_id INT\n   grade CHAR(2)' }),
      mkWorkedNode('wk-erd-3', 'er_diagram', 'entity', 535, 100, 'SECTION', { width: 180, height: 112, details: 'PK section_id INT\nFK course_id INT\n   term VARCHAR' }),
      mkWorkedNode('wk-erd-4', 'er_diagram', 'entity', 765, 100, 'COURSE', { width: 180, height: 112, details: 'PK course_id INT\n   title VARCHAR\n   credits INT' }),
    ],
    workedEdges: [
      mkWorkedEdge('wk-ee-1', 'wk-erd-1', 'wk-erd-2', '1 : N'),
      mkWorkedEdge('wk-ee-2', 'wk-erd-3', 'wk-erd-2', '1 : N'),
      mkWorkedEdge('wk-ee-3', 'wk-erd-4', 'wk-erd-3', '1 : N'),
    ],
  },
  flowchart: {
    whatIsItPlainEnglish:
      'A classic Flowchart traces an algorithm step-by-step using Ovals (Start/End), Parallelograms (Input/Output), Rectangles (Process), and Diamonds (If/Else decisions).',
    whenTopcitAsks:
      'Look for "algorithm logic", "Binary Search", "loop condition", or "input/output blocks".',
    situationPlainEnglish:
      'Binary Search looks for a target in a sorted array by checking the middle element (`mid`). If `arr[mid] == target`, we found it! Otherwise we cut the search range in half (`low` or `high`) until `low <= high` becomes false.',
    glossary: [
      { term: 'Terminator (Oval)', meaning: 'Marks START and END of the flowchart.' },
      { term: 'I/O (Parallelogram)', meaning: 'Reading input (array & target) or printing output (Found / Not Found).' },
      { term: 'Decision (Diamond)', meaning: 'A Yes/No condition — always draw TWO outgoing arrows (Yes & No)!' },
    ],
    hints: [
      { level: 1, title: 'Step 1 — Start, Input, and Init', body: 'Place START (Terminator), Input array & target (I/O), and Set low=0, high=n-1 (Process).' },
      { level: 2, title: 'Step 2 — Add the Loop & Mid Check', body: 'Add Decision "low <= high?" → Process "mid = (low + high) // 2" → Decision "arr[mid] == target?" with Yes/No branches.' },
      { level: 3, title: 'Step 3 — Close Every Branch to END', body: 'Make sure both Decision diamonds have 2 outgoing arrows and labels include START, mid, and END, then click Validate!' },
    ],
    workedNodes: [
      mkWorkedNode('wk-fl-1', 'flowchart', 'terminator', 40, 120, 'START', { width: 120, height: 46, fill: '#0f172a', stroke: '#0f172a' }),
      mkWorkedNode('wk-fl-2', 'flowchart', 'io', 200, 118, 'Input arr & target', { width: 160, height: 50, fill: '#f0f9ff', stroke: '#0284c7' }),
      mkWorkedNode('wk-fl-3', 'flowchart', 'process', 400, 118, 'low = 0, high = n - 1', { width: 165, height: 50 }),
      mkWorkedNode('wk-fl-4', 'flowchart', 'decision', 610, 105, 'low <= high?', { width: 125, height: 76, fill: '#fef2f2', stroke: '#c81e1e' }),
      mkWorkedNode('wk-fl-5', 'flowchart', 'process', 785, 118, 'mid = (low + high) // 2', { width: 175, height: 50 }),
      mkWorkedNode('wk-fl-6', 'flowchart', 'decision', 795, 225, 'arr[mid] == target?', { width: 155, height: 76, fill: '#fef2f2', stroke: '#c81e1e' }),
      mkWorkedNode('wk-fl-7', 'flowchart', 'io', 580, 238, 'Output Found at mid', { width: 165, height: 50, fill: '#ecfdf5', stroke: '#059669' }),
      mkWorkedNode('wk-fl-8', 'flowchart', 'process', 790, 345, 'Adjust low / high', { width: 165, height: 50 }),
      mkWorkedNode('wk-fl-9', 'flowchart', 'terminator', 400, 240, 'END', { width: 120, height: 46, fill: '#0f172a', stroke: '#0f172a' }),
    ],
    workedEdges: [
      mkWorkedEdge('wk-fe-1', 'wk-fl-1', 'wk-fl-2'),
      mkWorkedEdge('wk-fe-2', 'wk-fl-2', 'wk-fl-3'),
      mkWorkedEdge('wk-fe-3', 'wk-fl-3', 'wk-fl-4'),
      mkWorkedEdge('wk-fe-4', 'wk-fl-4', 'wk-fl-5', 'Yes'),
      mkWorkedEdge('wk-fe-5', 'wk-fl-4', 'wk-fl-9', 'No (Not Found)'),
      mkWorkedEdge('wk-fe-6', 'wk-fl-5', 'wk-fl-6'),
      mkWorkedEdge('wk-fe-7', 'wk-fl-6', 'wk-fl-7', 'Yes'),
      mkWorkedEdge('wk-fe-8', 'wk-fl-7', 'wk-fl-9'),
      mkWorkedEdge('wk-fe-9', 'wk-fl-6', 'wk-fl-8', 'No'),
      mkWorkedEdge('wk-fe-10', 'wk-fl-8', 'wk-fl-4', 'Loop'),
    ],
  },
  uml_sequence: {
    whatIsItPlainEnglish:
      'A Sequence Diagram shows WHO talks to WHOM in time order (top to bottom). Lifelines are the participants; solid arrows are calls/requests; dashed arrows are return replies.',
    whenTopcitAsks:
      'Look for "order of messages", "OAuth 2.0 + PKCE login", "API call flow", or "synchronous vs return message".',
    situationPlainEnglish:
      'A Student Browser (Client) sends a login request with a PKCE `code_challenge` to AuthServer, exchanges the authorization code + `code_verifier` for a signed Access Token, and uses that token to call ResourceAPI!',
    glossary: [
      { term: 'Lifeline', meaning: 'A vertical participant column (Student Client, :AuthServer, :ResourceAPI).' },
      { term: 'PKCE', meaning: 'Proof Key for Code Exchange — prevents attackers from hijacking OAuth login codes.' },
      { term: 'Return Message (- ->)', meaning: 'Dashed arrow showing the response/token coming back.' },
    ],
    hints: [
      { level: 1, title: 'Step 1 — Place the 3 Participants', body: 'Drop an Actor Lifeline (Student Client) and Object Lifelines for :AuthServer and :ResourceAPI side-by-side.' },
      { level: 2, title: 'Step 2 — Draw Request & Token Arrows', body: 'Connect Client → :AuthServer ("1. authorize(code_challenge)"), :AuthServer → Client ("2. return Access Token"), and Client → :ResourceAPI ("3. GET /api with Bearer Token").' },
      { level: 3, title: 'Step 3 — Validate', body: 'Ensure "Auth" and "Token" appear in your labels with at least 3 connected messages, then click Validate!' },
    ],
    workedNodes: [
      mkWorkedNode('wk-seq-1', 'uml_sequence', 'actor', 60, 40, 'Student Client', { width: 130, height: 220 }),
      mkWorkedNode('wk-seq-2', 'uml_sequence', 'lifeline', 290, 40, ':AuthServer', { width: 145, height: 220, stroke: '#c81e1e', details: 'OAuth2 + PKCE' }),
      mkWorkedNode('wk-seq-3', 'uml_sequence', 'lifeline', 530, 40, ':ResourceAPI', { width: 145, height: 220, details: 'Protected API' }),
      mkWorkedNode('wk-seq-4', 'uml_sequence', 'fragment_alt', 230, 285, 'alt [valid token]', { width: 460, height: 68, fill: '#f8fafc', stroke: '#64748b', details: '200 OK JSON / else 401 Unauthorized' }),
    ],
    workedEdges: [
      mkWorkedEdge('wk-se-1', 'wk-seq-1', 'wk-seq-2', '1. authorize(code_challenge)'),
      mkWorkedEdge('wk-se-2', 'wk-seq-2', 'wk-seq-1', '2. Return Access Token', true),
      mkWorkedEdge('wk-se-3', 'wk-seq-1', 'wk-seq-3', '3. GET /profile (Bearer Token)'),
      mkWorkedEdge('wk-se-4', 'wk-seq-3', 'wk-seq-1', '4. 200 OK Profile JSON', true),
    ],
  },
  ui_wireframe: {
    whatIsItPlainEnglish:
      'A UI Wireframe is a clean low-fidelity blueprint of a screen layout (window frame, navbar, inputs, table, submit button, modal) focusing on usability & accessibility.',
    whenTopcitAsks:
      'Look for "screen design", "UX layout", "usability / accessibility wireframe", or "enrollment form".',
    situationPlainEnglish:
      'Sketch an accessible Course Registration Screen inside a Window Frame with a Navigation Bar, Course Code Input Field, Section Dropdown, Prerequisite Checkbox, Available Sections Table, and a Primary Submit Button opening a Confirmation Modal.',
    glossary: [
      { term: 'Window Frame', meaning: 'Outer browser/screen container holding the layout.' },
      { term: 'Primary Button (CTA)', meaning: 'The main action button (Submit Enrollment).' },
      { term: 'Confirmation Modal', meaning: 'A safety popup asking the user to confirm before finalizing.' },
    ],
    hints: [
      { level: 1, title: 'Step 1 — Place the Window & Navbar', body: 'Drop a Window / Screen Frame and a Navigation Bar at the top.' },
      { level: 2, title: 'Step 2 — Add Form Controls & Table', body: 'Add an Input Field ("Course Code"), Dropdown ("Select Section"), Data Table ("Available Sections"), and Primary Button ("Submit Enrollment").' },
      { level: 3, title: 'Step 3 — Link Submit to Modal & Validate', body: 'Draw an arrow from "Submit Enrollment" to a Confirmation Modal and click Validate!' },
    ],
    workedNodes: [
      mkWorkedNode('wk-ui-1', 'ui_wireframe', 'ui_window', 40, 30, 'Course Registration Portal', { width: 420, height: 300 }),
      mkWorkedNode('wk-ui-2', 'ui_wireframe', 'ui_nav', 60, 75, 'Home | Courses | Grades | Logout', { width: 380, height: 38, fill: '#0f172a', stroke: '#0f172a' }),
      mkWorkedNode('wk-ui-3', 'ui_wireframe', 'ui_input', 60, 128, 'Course Code Input (CS301)', { width: 220, height: 42 }),
      mkWorkedNode('wk-ui-4', 'ui_wireframe', 'ui_table', 60, 185, 'Course | Seats | Status', { width: 380, height: 84, fill: '#f8fafc', details: 'CS301 | 4/40 | Open' }),
      mkWorkedNode('wk-ui-5', 'ui_wireframe', 'ui_button', 295, 128, 'Submit Enrollment', { width: 145, height: 42, fill: '#c81e1e', stroke: '#9b1c1c' }),
      mkWorkedNode('wk-ui-6', 'ui_wireframe', 'ui_modal', 500, 110, 'Confirm Enrollment?', { width: 210, height: 115, fill: '#fffbeb', stroke: '#d97706', details: 'Verify schedule conflict before submit.' }),
    ],
    workedEdges: [
      mkWorkedEdge('wk-ue-1', 'wk-ui-5', 'wk-ui-6', 'onClick'),
    ],
  },
  use_case: {
    whatIsItPlainEnglish:
      'A Use Case Diagram shows WHAT users (Actors, stick figures) can DO inside the system (Use Case Ovals inside a System Boundary box) — without getting into code details.',
    whenTopcitAsks:
      'Look for "functional scope", "ATM / banking actors", "<<include>> (mandatory sub-step)", or "<<extend>> (optional add-on)".',
    situationPlainEnglish:
      'In an ATM Banking System, a Customer can "Withdraw Cash" and "Transfer Funds". Withdrawing cash ALWAYS requires "Authenticate User" (<<include>>), and OPTIONALLY offers "Print Receipt" (<<extend>>).',
    glossary: [
      { term: '<<include>>', meaning: 'Mandatory! Withdraw Cash ALWAYS runs Authenticate User (arrow points FROM Withdraw TO Authenticate).' },
      { term: '<<extend>>', meaning: 'Optional! Print Receipt runs only if requested (arrow points FROM Print Receipt TO Withdraw!).' },
      { term: 'System Boundary', meaning: 'Container box separating external Actors from internal System Use Cases.' },
    ],
    hints: [
      { level: 1, title: 'Step 1 — Place Actors & System Boundary', body: 'Drop an Actor ("Customer") outside, a System Boundary ("ATM Banking System"), and Use Case Ovals inside.' },
      { level: 2, title: 'Step 2 — Watch <<include>> vs <<extend>> Direction!', body: 'Withdraw Cash --<<include>>--> Authenticate User. Print Receipt --<<extend>>--> Withdraw Cash!' },
      { level: 3, title: 'Step 3 — Validate', body: 'Make sure "Authenticate", "Withdraw", and "Receipt" appear in your Use Case ovals with at least 4 edges, then click Validate!' },
    ],
    workedNodes: [
      mkWorkedNode('wk-uc-1', 'use_case', 'actor', 40, 140, 'Customer', { width: 88, height: 96 }),
      mkWorkedNode('wk-uc-2', 'use_case', 'system_boundary', 175, 30, 'ATM Banking System', { width: 470, height: 295, fill: '#f8fafc', stroke: '#64748b' }),
      mkWorkedNode('wk-uc-3', 'use_case', 'usecase', 205, 85, 'Withdraw Cash', { width: 165, height: 58 }),
      mkWorkedNode('wk-uc-4', 'use_case', 'usecase', 205, 200, 'Transfer Funds', { width: 165, height: 58 }),
      mkWorkedNode('wk-uc-5', 'use_case', 'usecase', 435, 85, 'Authenticate User', { width: 175, height: 58, fill: '#fef2f2', stroke: '#c81e1e' }),
      mkWorkedNode('wk-uc-6', 'use_case', 'usecase', 435, 200, 'Print Receipt', { width: 175, height: 58, fill: '#fffbeb', stroke: '#d97706' }),
    ],
    workedEdges: [
      mkWorkedEdge('wk-uce-1', 'wk-uc-1', 'wk-uc-3'),
      mkWorkedEdge('wk-uce-2', 'wk-uc-1', 'wk-uc-4'),
      mkWorkedEdge('wk-uce-3', 'wk-uc-3', 'wk-uc-5', '<<include>>', true),
      mkWorkedEdge('wk-uce-4', 'wk-uc-4', 'wk-uc-5', '<<include>>', true),
      mkWorkedEdge('wk-uce-5', 'wk-uc-6', 'wk-uc-3', '<<extend>>', true),
    ],
  },
};

// ============================================================================
// 5. INTEGRATED 80-POINT SCENARIO COACHING
// ============================================================================
export const INTEGRATED_COACHING: Record<string, IntegratedCoach> = {
  'M1-INT-01': {
    situationPlainEnglish:
      'Don’t get intimidated by "80 points"! It is really just 3 smaller 25–30 pt mini-questions bundled into one story. Even writing bullet points for all 3 deliverables earns solid partial credit — leaving one blank scores 0.',
    glossary: [
      { term: 'Partial Credit', meaning: 'Graders check each deliverable independently — always write something structured for #1, #2, and #3!' },
      { term: 'Idempotency', meaning: 'Running the same payment request twice safely charges the user only once.' },
    ],
    hints: [
      { level: 1, title: 'Deliverable 1 Hint (Architecture / Design)', body: 'Name the core components/classes clearly, state how they separate concerns (SRP/Strategy/Repository), and mention error handling.' },
      { level: 2, title: 'Deliverable 2 Hint (Implementation / Data Flow)', body: 'Write concrete steps or pseudocode/SQL showing validation, state transitions, and edge-case handling (duplicates, invalid input, concurrency).' },
      { level: 3, title: 'Deliverable 3 Hint (Testing & Verification)', body: 'List at least 3 explicit test cases: Happy Path, Boundary/Edge Case, and Failure/Rollback Case with expected outputs.' },
    ],
    guidedOutlineTemplate: `1. Deliverable 1 — Architecture & Core Design
- Key Components / Classes: [List main modules and their responsibilities]
- Design Pattern / Rationale: [Explain why this pattern prevents tight coupling]
- Key Interface / Data Contract: [Describe inputs & outputs]

2. Deliverable 2 — Concrete Implementation & Edge Cases
- Main Step-by-Step Flow: [Step 1 -> Step 2 -> Step 3]
- Failure / Concurrency Safeguard: [How duplicates, timeouts, or invalid states are prevented]

3. Deliverable 3 — Verification & Test Cases
- Test Case 1 (Normal Path): Input = [...] -> Expected = [...]
- Test Case 2 (Boundary Case): Input = [...] -> Expected = [...]
- Test Case 3 (Failure / Rollback): Input = [...] -> Expected = [...]`,
  },
  'M2-INT-01': {
    situationPlainEnglish:
      'This M2 Data scenario asks you to wear a Database Engineer hat: (1) normalize messy tables into clean 3NF, (2) write accurate SQL/transactions, and (3) fix slow query performance with the right index.',
    glossary: [
      { term: '3NF', meaning: 'Every non-key column depends ONLY on the primary key — no repeating groups or transitive dependencies.' },
      { term: 'ACID Transaction', meaning: 'BEGIN ... COMMIT / ROLLBACK ensures money or inventory updates never finish halfway.' },
      { term: 'Composite Index', meaning: 'An index on (colA, colB) — put equality filter columns first, range/sort columns next!' },
    ],
    hints: [
      { level: 1, title: 'Deliverable 1 Hint (Schema & 3NF)', body: 'Split repeating or non-key dependent fields into separate tables linked by PK/FK, and state the cardinality (1:N or M:N bridge).' },
      { level: 2, title: 'Deliverable 2 Hint (SQL & Concurrency)', body: 'Use parameterized SQL, explicit transactions (BEGIN / SELECT ... FOR UPDATE / COMMIT), and avoid SELECT *.' },
      { level: 3, title: 'Deliverable 3 Hint (Indexing & EXPLAIN)', body: 'Create a composite index matching WHERE equality columns first, then ORDER BY/range columns, and verify with EXPLAIN.' },
    ],
    guidedOutlineTemplate: `1. Deliverable 1 — Normalized Relational Schema (3NF)
- Tables & Keys (PK/FK): [TableA(id PK, ...), TableB(id PK, tableA_id FK, ...)]
- Why this eliminates anomalies: [Explain insert/update/delete anomaly fixes]

2. Deliverable 2 — SQL Query & ACID Transaction Safety
- Transaction Steps: BEGIN -> [Check/Lock row] -> [UPDATE/INSERT] -> COMMIT (or ROLLBACK on error)
- Isolation / Locking Choice: [e.g., READ COMMITTED + SELECT ... FOR UPDATE]

3. Deliverable 3 — Query Tuning & Index Plan
- Recommended Index: CREATE INDEX idx_... ON table(equality_col, sort_or_range_col);
- Verification: Run EXPLAIN / EXPLAIN ANALYZE to confirm Index Scan instead of Full Table Scan.`,
  },
  'M3-INT-01': {
    situationPlainEnglish:
      'A classic cybersecurity incident story! A developer accidentally leaked an API key on GitHub, an attacker got into staging, hopped over SSH port 22, and stole weak SHA-1 password hashes. Break your answer into: (1) Stop the bleeding (IR steps), (2) Fix the weak crypto/secrets, and (3) Lock down the network with Zero-Trust.',
    glossary: [
      { term: 'NIST IR Phases', meaning: 'Containment (stop spread) → Eradication (remove cause) → Recovery (restore safely) → Post-Incident.' },
      { term: 'Argon2id / bcrypt', meaning: 'Slow, salted password-hashing algorithms that replace broken unsalted SHA-1.' },
      { term: 'Zero-Trust', meaning: '"Never trust, always verify" — least privilege, MFA, segmented private subnets, no open SSH 22.' },
    ],
    hints: [
      { level: 1, title: 'Deliverable 1 Hint (Incident Response Sequence)', body: 'Order matters! Containment first (revoke leaked key, isolate host, block egress), then Eradication (rotate all creds/SSH keys, scrub Git history), Recovery (rebuild clean image), and Notification (force password resets + breach notice).' },
      { level: 2, title: 'Deliverable 2 Hint (Crypto & Secrets Fixes)', body: 'Replace unsalted SHA-1 with Argon2id or bcrypt (per-user random salt); move Git secrets into a Secret Manager/Vault with short-lived tokens; encrypt DB backups at rest with AES-256-GCM + KMS.' },
      { level: 3, title: 'Deliverable 3 Hint (Zero-Trust Network Controls)', body: 'Map controls to each attack step: CI/CD secret scanning (pre-commit) → private VPC segmentation + remove open port 22 (use MFA bastion/SSM) → RBAC least privilege → immutable WORM audit logs.' },
    ],
    guidedOutlineTemplate: `1. Deliverable 1 — Incident Response Plan (25 pts)
- Containment (Immediate): [Revoke leaked API key, isolate staging host, block port 22 / outbound exfil]
- Eradication: [Rotate all DB/API credentials, remove secret from Git history, patch entry point]
- Recovery: [Rebuild staging from clean golden image, restore verified backups]
- Notification: [Force reset for exposed users, notify DPO/affected students per policy]

2. Deliverable 2 — Cryptographic & Secrets Remediation (25 pts)
- Passwords: Replace unsalted SHA-1 with [Argon2id / bcrypt + unique per-user salt]
- Secrets in Git: Move keys into [KMS / Secrets Manager / Vault] with automated rotation
- DB Backups: Encrypt at rest using [AES-256-GCM] with separated KMS keys & TLS 1.3 in transit

3. Deliverable 3 — Zero-Trust Network & Access Redesign (30 pts)
- Prevent Leak: [Pre-commit & CI/CD secret scanning]
- Block Lateral Movement: [VPC subnet segmentation, disable public SSH 22, require Bastion/SSM + MFA]
- Limit Blast Radius: [RBAC least-privilege IAM roles, immutable centralized SIEM audit logs]`,
  },
};

export function getIntegratedCoach(question: Question): IntegratedCoach {
  const exact = INTEGRATED_COACHING[question.id];
  if (exact) return exact;
  return {
    situationPlainEnglish:
      'Break this 80-point scenario into its numbered deliverables. Address each deliverable with concrete technical names, formulas, or diagrams so you earn partial credit on every section.',
    glossary: [
      { term: 'Partial Credit', meaning: 'Every numbered deliverable is scored separately — never leave a deliverable blank.' },
    ],
    hints: [
      { level: 1, title: 'Hint 1 — Map Each Deliverable', body: 'Read the numbered deliverables and create matching headings (1, 2, 3) in your answer box before writing details.' },
      { level: 2, title: 'Hint 2 — Be Specific', body: 'Use exact TOPCIT technical terms (algorithm names, SQL clauses, security controls, or UML relationships) rather than vague statements.' },
      { level: 3, title: 'Hint 3 — Check All Rubric Areas', body: `Target criteria: ${(question.rubric ?? []).map((r) => `${r.label} (${r.maxPoints}p)`).join(' · ') || 'Cover architecture, implementation, and verification.'}` },
    ],
    guidedOutlineTemplate: `1. Deliverable 1\n- Core design / decision: [...]\n- Justification: [...]\n\n2. Deliverable 2\n- Technical implementation / SQL / control: [...]\n\n3. Deliverable 3\n- Verification, trade-offs, and test plan: [...]`,
  };
}

// ============================================================================
// 6. DYNAMIC NON-SPOILER PROGRESSIVE HINTS FOR ANY PRACTICE HUB QUESTION
// ============================================================================
export function generateQuestionHints(question: Question): {
  situationPlainEnglish: string;
  hints: ProgressiveHint[];
  outlineStarter?: string;
} {
  const topic = getTopicById(question.topicId);
  const domainMeta = BLUEPRINT_2026.domains[question.domain];

  const situationPlainEnglish =
    question.questionType === 'mcq'
      ? `This ${question.pointValue}-point ${domainMeta.code} (${domainMeta.name}) question tests "${topic?.title ?? question.topicId}". Take a breath, read what the scenario is actually asking for, and eliminate options that break the core rule.`
      : `This ${question.pointValue}-point written/practical task tests "${topic?.title ?? question.topicId}". Graders look for clear, numbered points matching each requirement — even a structured partial answer earns points!`;

  const hints: ProgressiveHint[] = [];

  // Hint 1: Plain-English concept focus
  const refLabels = (question.references ?? []).map((r) => r.label);
  hints.push({
    level: 1,
    title: 'Hint 1 — What Concept Is This Testing?',
    body: topic
      ? `Focus on "${topic.title}": ${topic.summary}. Ask yourself which engineering principle or rule from this topic directly solves the problem in the prompt.`
      : `Focus on core ${domainMeta.name} principles${refLabels.length > 0 ? ` (${refLabels.slice(0, 2).join(', ')})` : ''}.`,
  });

  // Hint 2: Elimination or Rubric Structure (without spoiling exact answer!)
  if (question.questionType === 'mcq' && question.options && question.correctOptionId) {
    const wrongOptions = question.options.filter((o) => o.id !== question.correctOptionId);
    const eliminated = wrongOptions[0];
    hints.push({
      level: 2,
      title: 'Hint 2 — Eliminate a Distractor',
      body: eliminated
        ? `You can safely rule out Option ${eliminated.id} ("${eliminated.text.slice(0, 72)}${eliminated.text.length > 72 ? '...' : ''}"). Compare the remaining choices carefully against the exact requirement in the question.`
        : 'Compare the remaining options closely — watch out for choices that sound plausible but miss one key constraint.',
    });
  } else if (question.rubric && question.rubric.length > 0) {
    hints.push({
      level: 2,
      title: 'Hint 2 — Exact Sections Graders Check',
      body: `Structure your response around these ${question.rubric.length} rubric targets: ${question.rubric.map((r, i) => `(${i + 1}) ${r.label} [${r.maxPoints} pts]`).join(', ')}.`,
    });
  } else {
    hints.push({
      level: 2,
      title: 'Hint 2 — How to Structure Your Answer',
      body: 'Break your answer into numbered points matching each question part: (1) Diagnose root cause, (2) Concrete technical fix, (3) Verification method.',
    });
  }

  // Hint 3: Gentle final nudge from syllabus references/topic without revealing the exact MCQ letter
  if (question.questionType === 'mcq') {
    const tagHint = refLabels.length > 0 ? refLabels.slice(0, 2).join(' · ') : topic?.title ?? domainMeta.shortName;
    hints.push({
      level: 3,
      title: 'Hint 3 — Key Clue Before You Guess',
      body: `Look for the option that aligns directly with: ${tagHint}. Once you pick an option and click "Check Answer", you’ll get the full explanation right away!`,
    });
  } else {
    const rubricDetails = (question.rubric ?? [])
      .map((r) => `• ${r.label}: ${r.description}`)
      .join('\n');
    hints.push({
      level: 3,
      title: 'Hint 3 — Detailed Checklist (No Spoilers)',
      body: rubricDetails || 'Include concrete technical names, formulas, or SQL/code snippets rather than generic statements.',
    });
  }

  const outlineStarter =
    question.questionType !== 'mcq' && question.rubric && question.rubric.length > 0
      ? question.rubric
          .map((r, idx) => `${idx + 1}. ${r.label} (${r.maxPoints} pts):\n- [Explain your answer here]\n`)
          .join('\n')
      : undefined;

  return { situationPlainEnglish, hints, outlineStarter };
}
