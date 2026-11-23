export type CompilerLanguage = 'python' | 'c' | 'cpp' | 'java';

export interface CodingTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
  description: string;
}

export interface CodingChallenge {
  id: string;
  title: string;
  domain: 'M1' | 'M3';
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mode: 'implementation' | 'debugging';
  maxPoints: number;
  description: string;
  inputSpec: string;
  outputSpec: string;
  constraints: string;
  starterCode: Record<CompilerLanguage, string>;
  testCases: CodingTestCase[];
  referenceSolutionPython: string;
}

export interface SqlChallenge {
  id: string;
  title: string;
  domain: 'M2';
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  maxPoints: number;
  description: string;
  schemaSql: string;
  starterSql: string;
  expectedSql: string;
  orderSensitive: boolean;
  hint: string;
}

export const CODING_CHALLENGES: readonly CodingChallenge[] = [
  {
    id: 'code-rate-limiter',
    title: 'Sliding-Window API Rate Limiter',
    domain: 'M1',
    topicId: 'M1-ALG',
    difficulty: 'medium',
    mode: 'implementation',
    maxPoints: 50,
    description:
      'Implement a per-user sliding-window API rate limiter. Only ALLOWed requests count toward the user quota inside the inclusive window [t - window_sec + 1, t].',
    inputSpec:
      'Line 1: `limit window_sec`\nLine 2: `N` (number of requests)\nNext N lines: `<timestamp_int> <user_id>` (non-decreasing timestamps)',
    outputSpec: 'N lines, each either `ALLOW` or `BLOCK`.',
    constraints: '1 <= limit <= 1000, 1 <= window_sec <= 10^6, 1 <= N <= 10^5',
    testCases: [
      {
        id: 'rl-1',
        input: '2 10\n4\n1 u1\n5 u1\n8 u1\n11 u1',
        expectedOutput: 'ALLOW\nALLOW\nBLOCK\nALLOW',
        isHidden: false,
        points: 20,
        description: 'Basic single-user window eviction at t=11',
      },
      {
        id: 'rl-2',
        input: '2 5\n5\n1 a\n1 b\n2 a\n3 a\n6 a',
        expectedOutput: 'ALLOW\nALLOW\nALLOW\nBLOCK\nALLOW',
        isHidden: true,
        points: 15,
        description: 'Multi-user isolation & rejected calls do not consume quota',
      },
      {
        id: 'rl-3',
        input: '1 1\n3\n5 x\n5 x\n6 x',
        expectedOutput: 'ALLOW\nBLOCK\nALLOW',
        isHidden: true,
        points: 15,
        description: 'Window size 1 boundary',
      },
    ],
    starterCode: {
      python: `from collections import defaultdict, deque
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
        while q and q[0] < t - window_sec + 1:
            q.popleft()
        if len(q) < limit:
            q.append(t)
            out.append("ALLOW")
        else:
            out.append("BLOCK")
    print("\\n".join(out))

if __name__ == "__main__":
    solve()
`,
      c: `#include <stdio.h>
#include <string.h>

int main(void) {
    int limit, window_sec, n;
    if (scanf("%d %d", &limit, &window_sec) != 2) return 0;
    if (scanf("%d", &n) != 1) return 0;
    /* Implement sliding-window per-user rate limiter */
    for (int i = 0; i < n; i++) {
        int t; char user[64];
        scanf("%d %63s", &t, user);
        printf("ALLOW\\n");
    }
    return 0;
}
`,
      cpp: `#include <iostream>
#include <unordered_map>
#include <deque>
#include <string>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int limit, window_sec, n;
    if (!(cin >> limit >> window_sec >> n)) return 0;
    unordered_map<string, deque<int>> history;
    for (int i = 0; i < n; ++i) {
        int t; string user;
        cin >> t >> user;
        auto& q = history[user];
        while (!q.empty() && q.front() < t - window_sec + 1) q.pop_front();
        if ((int)q.size() < limit) {
            q.push_back(t);
            cout << "ALLOW\\n";
        } else {
            cout << "BLOCK\\n";
        }
    }
    return 0;
}
`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int limit = sc.nextInt();
        int windowSec = sc.nextInt();
        int n = sc.nextInt();
        Map<String, Deque<Integer>> history = new HashMap<>();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            int t = sc.nextInt();
            String user = sc.next();
            Deque<Integer> q = history.computeIfAbsent(user, k -> new ArrayDeque<>());
            while (!q.isEmpty() && q.peekFirst() < t - windowSec + 1) q.pollFirst();
            if (q.size() < limit) {
                q.addLast(t);
                sb.append("ALLOW\\n");
            } else {
                sb.append("BLOCK\\n");
            }
        }
        System.out.print(sb.toString());
    }
}
`,
    },
    referenceSolutionPython: `from collections import defaultdict, deque
import sys

def solve():
    lines = [line.strip() for line in sys.stdin if line.strip()]
    limit, window_sec = map(int, lines[0].split())
    n = int(lines[1])
    history = defaultdict(deque)
    for i in range(2, 2 + n):
        t_str, user = lines[i].split()
        t = int(t_str)
        q = history[user]
        while q and q[0] < t - window_sec + 1:
            q.popleft()
        if len(q) < limit:
            q.append(t)
            print("ALLOW")
        else:
            print("BLOCK")

solve()
`,
  },
  {
    id: 'code-debug-prereqs',
    title: '[Debugging] Fix Broken Course Prerequisite Cycle Detector',
    domain: 'M1',
    topicId: 'M1-TEST',
    difficulty: 'medium',
    mode: 'debugging',
    maxPoints: 50,
    description:
      'The starter code contains a classic directed-graph bug: it uses a single `visited` set, causing diamond DAGs (0->1, 0->2, 1->3, 2->3) to falsely return False. Fix the code using 3-state DFS (0=unvisited, 1=visiting, 2=done) or Kahn’s topological sort.',
    inputSpec: 'Line 1: `num_courses`\nLine 2: `M` (edges)\nNext M lines: `course prereq`',
    outputSpec: '`True` if all courses can be completed (acyclic), else `False`.',
    constraints: '1 <= num_courses <= 2000, 0 <= M <= 5000',
    testCases: [
      {
        id: 'dg-1',
        input: '4\n4\n0 1\n0 2\n1 3\n2 3',
        expectedOutput: 'True',
        isHidden: false,
        points: 20,
        description: 'Diamond DAG must return True (not a cycle)',
      },
      {
        id: 'dg-2',
        input: '3\n3\n0 1\n1 2\n2 0',
        expectedOutput: 'False',
        isHidden: false,
        points: 15,
        description: 'Direct 3-node cycle',
      },
      {
        id: 'dg-3',
        input: '5\n2\n3 4\n4 3',
        expectedOutput: 'False',
        isHidden: true,
        points: 15,
        description: 'Disconnected cycle component',
      },
    ],
    starterCode: {
      python: `import sys
from collections import defaultdict

def can_finish(num_courses, prerequisites):
    graph = defaultdict(list)
    for course, prereq in prerequisites:
        graph[prereq].append(course)

    # BUG: Fix this single-set visited logic!
    visited = set()

    def dfs(node):
        if node in visited:
            return False
        visited.add(node)
        for nxt in graph[node]:
            if not dfs(nxt):
                return False
        return True

    for c in range(num_courses):
        if c not in visited:
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
      c: `#include <stdio.h>
int main(void) {
    /* Implement 3-state cycle detection for course prerequisites */
    printf("True\\n");
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<vector<int>> g(n);
    for (int i = 0; i < m; ++i) { int a, b; cin >> a >> b; g[b].push_back(a); }
    vector<int> state(n, 0);
    auto dfs = [&](auto&& self, int u) -> bool {
        if (state[u] == 1) return false;
        if (state[u] == 2) return true;
        state[u] = 1;
        for (int v : g[u]) if (!self(self, v)) return false;
        state[u] = 2;
        return true;
    };
    bool ok = true;
    for (int i = 0; i < n; ++i) if (state[i] == 0 && !dfs(dfs, i)) { ok = false; break; }
    cout << (ok ? "True" : "False") << "\\n";
    return 0;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt(), m = sc.nextInt();
        List<List<Integer>> g = new ArrayList<>();
        int[] indeg = new int[n];
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int i = 0; i < m; i++) {
            int course = sc.nextInt(), prereq = sc.nextInt();
            g.get(prereq).add(course);
            indeg[course]++;
        }
        Queue<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) if (indeg[i] == 0) q.add(i);
        int seen = 0;
        while (!q.isEmpty()) {
            int u = q.poll(); seen++;
            for (int v : g.get(u)) if (--indeg[v] == 0) q.add(v);
        }
        System.out.println(seen == n ? "True" : "False");
    }
}
`,
    },
    referenceSolutionPython: `import sys
from collections import defaultdict

def can_finish(num_courses, prerequisites):
    graph = defaultdict(list)
    for course, prereq in prerequisites:
        graph[prereq].append(course)
    state = [0] * num_courses
    def dfs(u):
        if state[u] == 1:
            return False
        if state[u] == 2:
            return True
        state[u] = 1
        for v in graph[u]:
            if not dfs(v):
                return False
        state[u] = 2
        return True
    return all(dfs(c) for c in range(num_courses) if state[c] == 0)

lines = [l.strip() for l in sys.stdin if l.strip()]
num_courses = int(lines[0])
m = int(lines[1])
prereqs = [tuple(map(int, lines[2 + i].split())) for i in range(m)]
print(can_finish(num_courses, prereqs))
`,
  },
  {
    id: 'code-sec-password-audit',
    title: 'Security Policy: Password Strength & Exposure Auditor',
    domain: 'M3',
    topicId: 'M3-SEC-TECH',
    difficulty: 'easy',
    mode: 'implementation',
    maxPoints: 50,
    description:
      'Given N candidate passwords, print `STRONG` if a password has length >= 12, contains at least one uppercase letter, one lowercase letter, one digit, one special character from `!@#$%^&*`, and does NOT contain `"password"` (case-insensitive); otherwise print `WEAK`.',
    inputSpec: 'Line 1: `N`\nNext N lines: candidate password string',
    outputSpec: 'N lines of `STRONG` or `WEAK`.',
    constraints: '1 <= N <= 100',
    testCases: [
      {
        id: 'pw-1',
        input: '3\nTopcit2026!Secure\nPassword123!\nshort1!A',
        expectedOutput: 'STRONG\nWEAK\nWEAK',
        isHidden: false,
        points: 25,
        description: 'Valid strong password vs dictionary word vs too short',
      },
      {
        id: 'pw-2',
        input: '2\nAbcdefgh1234@\nNoSpecialChar123',
        expectedOutput: 'STRONG\nWEAK',
        isHidden: true,
        points: 25,
        description: 'Exact length 12 boundary & missing special char',
      },
    ],
    starterCode: {
      python: `import sys

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
      c: `#include <stdio.h>
int main(void) {
    /* Implement password audit in C */
    return 0;
}
`,
      cpp: `#include <iostream>
#include <string>
using namespace std;
int main() {
    /* Implement password audit in C++ */
    return 0;
}
`,
      java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        /* Implement password audit in Java */
    }
}
`,
    },
    referenceSolutionPython: `import sys
lines = [l.strip() for l in sys.stdin if l.strip()]
n = int(lines[0])
for i in range(1, 1 + n):
    pw = lines[i]
    ok = (len(pw) >= 12 and "password" not in pw.lower()
          and any(c.isupper() for c in pw) and any(c.islower() for c in pw)
          and any(c.isdigit() for c in pw) and any(c in "!@#$%^&*" for c in pw))
    print("STRONG" if ok else "WEAK")
`,
  },
];

export const SQL_CHALLENGES: readonly SqlChallenge[] = [
  {
    id: 'sql-dept-gpa',
    title: 'Department Honors & Credit-Weighted GPA Report',
    domain: 'M2',
    topicId: 'M2-SQL',
    difficulty: 'medium',
    maxPoints: 50,
    description:
      'Return each department’s `dept_name`, `student_count` (distinct enrolled students), and credit-weighted GPA `weighted_gpa` rounded to 2 decimal places (`ROUND(SUM(credits * grade_points) * 1.0 / SUM(credits), 2)`) for departments with `weighted_gpa >= 3.20`, ordered by `weighted_gpa DESC, dept_name ASC`.',
    schemaSql: `
CREATE TABLE departments (dept_id INTEGER PRIMARY KEY, dept_name TEXT NOT NULL);
CREATE TABLE students (student_id INTEGER PRIMARY KEY, full_name TEXT NOT NULL, dept_id INTEGER NOT NULL);
CREATE TABLE enrollments (enroll_id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL, credits INTEGER NOT NULL, grade_points REAL NOT NULL);

INSERT INTO departments VALUES (1, 'Computer Science'), (2, 'Information Technology'), (3, 'Information Systems');
INSERT INTO students VALUES (101, 'Ana Cruz', 1), (102, 'Ben Lim', 1), (103, 'Cara Uy', 2), (104, 'Dan Tan', 2), (105, 'Eli Go', 3);
INSERT INTO enrollments VALUES
  (1, 101, 3, 4.0), (2, 101, 3, 3.5),
  (3, 102, 4, 3.5),
  (4, 103, 3, 3.5), (5, 104, 3, 3.0),
  (6, 105, 3, 2.5), (7, 105, 3, 3.0);
`,
    starterSql: `SELECT
  d.dept_name,
  COUNT(DISTINCT s.student_id) AS student_count,
  ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) AS weighted_gpa
FROM departments d
JOIN students s ON s.dept_id = d.dept_id
JOIN enrollments e ON e.student_id = s.student_id
GROUP BY d.dept_id, d.dept_name
HAVING ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) >= 3.20
ORDER BY weighted_gpa DESC, d.dept_name ASC;`,
    expectedSql: `SELECT
  d.dept_name,
  COUNT(DISTINCT s.student_id) AS student_count,
  ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) AS weighted_gpa
FROM departments d
JOIN students s ON s.dept_id = d.dept_id
JOIN enrollments e ON e.student_id = s.student_id
GROUP BY d.dept_id, d.dept_name
HAVING ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) >= 3.20
ORDER BY weighted_gpa DESC, d.dept_name ASC;`,
    orderSensitive: true,
    hint: 'Use COUNT(DISTINCT s.student_id), multiply credits * grade_points before summing, and filter aggregates with HAVING.',
  },
  {
    id: 'sql-left-join-orders',
    title: 'LEFT JOIN Filter Trap: All Customers & 2026 Order Counts',
    domain: 'M2',
    topicId: 'M2-SQL',
    difficulty: 'medium',
    maxPoints: 50,
    description:
      'List EVERY customer (`customer_name`) along with `orders_2026` (the count of their orders placed in 2026, showing 0 if none), ordered by `orders_2026 DESC, customer_name ASC`. Avoid the WHERE clause trap that drops 0-order customers!',
    schemaSql: `
CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, customer_name TEXT NOT NULL);
CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, order_year INTEGER NOT NULL, amount REAL NOT NULL);

INSERT INTO customers VALUES (1, 'Acme Corp'), (2, 'Beacon Labs'), (3, 'Crest Edu');
INSERT INTO orders VALUES (10, 1, 2026, 500), (11, 1, 2026, 300), (12, 2, 2025, 250), (13, 3, 2026, 900);
`,
    starterSql: `-- Fix or write the LEFT JOIN query so Beacon Labs appears with 0 orders_2026
SELECT c.customer_name, COUNT(o.order_id) AS orders_2026
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.order_year = 2026
GROUP BY c.customer_id, c.customer_name
ORDER BY orders_2026 DESC, c.customer_name ASC;`,
    expectedSql: `SELECT c.customer_name, COUNT(o.order_id) AS orders_2026
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.order_year = 2026
GROUP BY c.customer_id, c.customer_name
ORDER BY orders_2026 DESC, c.customer_name ASC;`,
    orderSensitive: true,
    hint: 'Put `o.order_year = 2026` inside the LEFT JOIN ON clause and use `COUNT(o.order_id)`, not `COUNT(*)`.',
  },
];
