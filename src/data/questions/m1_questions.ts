import type { Question } from '@/domain/schemas';

const BASE_META = {
  domain: 'M1' as const,
  sourceClassification: 'original_practice' as const,
  contentVersion: '2026.1.0',
  reviewStatus: 'verified' as const,
  mockSetId: 'mock-2026-set-1',
};

/**
 * M1 — Software Development
 * Exact 2026 Blueprint Allocation:
 * - 15 MCQ x 5 = 75 pts
 * - 2 Descriptive x 30 = 60 pts
 * - 3 Standard Performance x 50 = 150 pts
 * - 1 Integrated Performance x 80 = 80 pts
 * Total: 21 questions, 365 points
 */
export const M1_QUESTIONS: Question[] = [
  // --- 15 MCQs (5 pts each = 75 pts) ---
  {
    ...BASE_META,
    id: 'M1-MCQ-01',
    title: 'Agile Sprint Backlog Ownership',
    prompt:
      'In Scrum, who holds sole authority to order the Product Backlog to maximize product value, and who decides how much work to pull into the Sprint Backlog during Sprint Planning?',
    topicId: 'M1-SE',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Scrum Master orders the Product Backlog; Product Owner assigns Sprint Backlog tasks.' },
      { id: 'B', text: 'Product Owner orders the Product Backlog; Developers select items for the Sprint Backlog.' },
      { id: 'C', text: 'Project Manager orders both backlogs based on stakeholder sign-off.' },
      { id: 'D', text: 'Developers order the Product Backlog; Scrum Master approves the Sprint Backlog.' },
    ],
    correctOptionId: 'B',
    explanation:
      'In Scrum, the Product Owner is accountable for ordering the Product Backlog to maximize value, while the Developers forecast capacity and pull items into the Sprint Backlog.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.1 — Agile & Scrum' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-02',
    title: 'Software Requirements Verification vs Validation',
    prompt:
      'A QA team checks that every functional requirement in the Software Requirements Specification (SRS) maps to a design component and unit test, without yet confirming with end users that the workflow solves their business problem. Which activity is the team performing?',
    topicId: 'M1-SE',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Validation ("building the right product")' },
      { id: 'B', text: 'Verification ("building the product right")' },
      { id: 'C', text: 'User Acceptance Testing (UAT)' },
      { id: 'D', text: 'Exploratory beta release' },
    ],
    correctOptionId: 'B',
    explanation:
      'Verification checks conformance against specifications (traceability, design reviews, unit tests). Validation confirms the product satisfies actual stakeholder needs.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.1 — Requirements & QA' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-03',
    title: 'Time Complexity of Merge Sort vs Quick Sort',
    prompt:
      'Which statement accurately compares Merge Sort and Quick Sort for sorting an array of n elements?',
    topicId: 'M1-ALG',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Both guarantee O(n log n) worst-case time and O(1) auxiliary space.' },
      { id: 'B', text: 'Merge Sort guarantees O(n log n) worst-case time with O(n) auxiliary space; Quick Sort has O(n^2) worst-case time.' },
      { id: 'C', text: 'Quick Sort is always stable while Merge Sort is inherently unstable.' },
      { id: 'D', text: 'Merge Sort runs in O(n) on already-sorted input without modification.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Merge Sort always splits evenly, guaranteeing O(n log n) worst-case time and stability at the cost of O(n) extra memory. Quick Sort averages O(n log n) in-place but degrades to O(n^2) with poor pivot choices.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.2 — Algorithms & Complexity' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-04',
    title: 'Shortest Path with Non-Negative Edge Weights',
    prompt:
      'An unweighted social graph requires shortest hop count between two users, while a road network with positive travel times requires fastest route. Which pair of algorithms is most appropriate?',
    topicId: 'M1-ALG',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'DFS for unweighted; Prim’s algorithm for weighted' },
      { id: 'B', text: 'BFS for unweighted; Dijkstra’s algorithm for positive-weighted' },
      { id: 'C', text: 'Kruskal’s for unweighted; DFS for weighted' },
      { id: 'D', text: 'Topological sort for unweighted; Binary Search for weighted' },
    ],
    correctOptionId: 'B',
    explanation:
      'Breadth-First Search (BFS) explores level by level to find shortest paths in unweighted graphs in O(V+E). Dijkstra’s algorithm finds single-source shortest paths when all edge weights are non-negative.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.2 — Graph Algorithms' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-05',
    title: 'Hash Table Collision Resolution',
    prompt:
      'A hash table using open addressing with linear probing experiences severe performance degradation as the load factor approaches 0.85, even when keys hash uniformly. What phenomenon primarily causes this?',
    topicId: 'M1-ALG',
    difficulty: 'hard',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Primary clustering of contiguous occupied slots' },
      { id: 'B', text: 'Stack overflow from recursive pointer traversal' },
      { id: 'C', text: 'Memory fragmentation across linked list nodes' },
      { id: 'D', text: 'Binary tree imbalance' },
    ],
    correctOptionId: 'A',
    explanation:
      'Linear probing inspects consecutive indices (h(k)+i), forming long contiguous runs of occupied slots (primary clustering) that increase probe lengths rapidly at high load factors.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.2 — Data Structures' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-06',
    title: 'Dynamic Programming vs Greedy Choice',
    prompt:
      'For the 0/1 Knapsack problem (each item can be taken at most once and cannot be split), why does a greedy strategy sorting by highest value-to-weight ratio fail to guarantee an optimal solution?',
    topicId: 'M1-ALG',
    difficulty: 'hard',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: '0/1 Knapsack lacks optimal substructure.' },
      { id: 'B', text: '0/1 Knapsack lacks the greedy-choice property; picking the densest item can leave unusable capacity.' },
      { id: 'C', text: 'Greedy algorithms cannot run on integer weights.' },
      { id: 'D', text: 'Sorting takes O(n log n) which exceeds DP complexity.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Fractional Knapsack satisfies the greedy-choice property, whereas 0/1 Knapsack cannot take fractions of items, so a locally optimal pick can block a globally better combination. Dynamic programming evaluates subproblems systematically.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.2 — Optimization Algorithms' }],
    estimatedSeconds: 90,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-07',
    title: 'SOLID — Dependency Inversion Principle',
    prompt:
      'An OrderService class directly instantiates `new SmtpEmailClient()` inside its `checkout()` method, making unit testing without a live mail server impossible. Which SOLID principle is violated and what is the proper fix?',
    topicId: 'M1-UML',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Single Responsibility Principle; move checkout() into SmtpEmailClient.' },
      { id: 'B', text: 'Dependency Inversion Principle; depend on a NotificationSender interface injected via constructor.' },
      { id: 'C', text: 'Liskov Substitution Principle; make SmtpEmailClient a static singleton.' },
      { id: 'D', text: 'Interface Segregation Principle; remove email notification from checkout().' },
    ],
    correctOptionId: 'B',
    explanation:
      'DIP states high-level modules (OrderService) should not depend on low-level concrete implementations (SmtpEmailClient); both should depend on abstractions (e.g., NotificationSender) supplied via dependency injection.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.4 — SOLID & Clean Design' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-08',
    title: 'UML Class Diagram: Composition vs Aggregation',
    prompt:
      'In a UML Class Diagram for an e-commerce system, an `Order` owns `OrderLine` items that cannot exist independently if the `Order` is deleted, while a `Department` contains `Professor` objects that continue to exist if the department closes. Which relationships represent these two cases?',
    topicId: 'M1-UML',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Order–OrderLine: Aggregation (hollow diamond); Department–Professor: Composition (filled diamond).' },
      { id: 'B', text: 'Order–OrderLine: Composition (filled diamond); Department–Professor: Aggregation (hollow diamond).' },
      { id: 'C', text: 'Both use Generalization (hollow triangle arrow).' },
      { id: 'D', text: 'Order–OrderLine: Dependency (dashed arrow); Department–Professor: Realization.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Composition (filled diamond on the whole) denotes strong lifecycle ownership (deleting Order deletes OrderLine). Aggregation (hollow diamond) denotes a weak whole-part relationship where parts can outlive the container.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.4 — UML Class Modeling' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-09',
    title: 'UML Use Case Include vs Extend',
    prompt:
      'In a banking Use Case Diagram, every `Withdraw Cash` and `Transfer Funds` execution ALWAYS requires `Authenticate User`, whereas `Print Receipt` only runs if the user opts in. How should these relationships be modeled?',
    topicId: 'M1-UML',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Withdraw Cash --<<include>>--> Authenticate User; Print Receipt --<<extend>>--> Withdraw Cash.' },
      { id: 'B', text: 'Authenticate User --<<include>>--> Withdraw Cash; Withdraw Cash --<<extend>>--> Print Receipt.' },
      { id: 'C', text: 'Both use <<extend>> pointing from base use case to sub-use case.' },
      { id: 'D', text: 'Both use Generalization arrows.' },
    ],
    correctOptionId: 'A',
    explanation:
      'In UML Use Case diagrams, `<<include>>` points from the base use case to the mandatory included behavior. `<<extend>>` points from the optional extension use case toward the base use case.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.4 — UML Use Case Modeling' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-10',
    title: 'Design Pattern Selection — Strategy Pattern',
    prompt:
      'A shipping calculator currently has a 120-line `if/else` block switching between Standard, Express, Overnight, and Drone pricing formulas, and new carrier formulas are added every quarter. Which GoF design pattern eliminates the conditional chain cleanly?',
    topicId: 'M1-UML',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Singleton Pattern' },
      { id: 'B', text: 'Strategy Pattern' },
      { id: 'C', text: 'Flyweight Pattern' },
      { id: 'D', text: 'Memento Pattern' },
    ],
    correctOptionId: 'B',
    explanation:
      'The Strategy pattern encapsulates a family of interchangeable algorithms behind a common interface, satisfying the Open/Closed Principle when new pricing policies are introduced.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.4 — Design Patterns' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-11',
    title: 'AI Model Evaluation — Precision vs Recall',
    prompt:
      'A hospital deploys an ML classifier to screen medical scans for a life-threatening condition where missing a true positive (False Negative) is far more dangerous than flagging a healthy scan for follow-up. Which metric should the engineering team prioritize when tuning the decision threshold?',
    topicId: 'M1-AI-PROG',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Recall (Sensitivity): TP / (TP + FN)' },
      { id: 'B', text: 'Precision: TP / (TP + FP)' },
      { id: 'C', text: 'Raw Accuracy: (TP + TN) / Total' },
      { id: 'D', text: 'R-squared (Coefficient of Determination)' },
    ],
    correctOptionId: 'A',
    explanation:
      'Recall measures the proportion of actual positives correctly identified: TP / (TP + FN). Maximizing recall minimizes dangerous False Negatives.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.3 — Applied AI in Software' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-12',
    title: 'Preventing Overfitting in Neural Networks & ML',
    prompt:
      'A supervised classification model achieves 99.4% accuracy on the training set but only 68.2% on the held-out validation set. Which intervention directly addresses this issue?',
    topicId: 'M1-AI-PROG',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Increase model depth and remove all regularization.' },
      { id: 'B', text: 'Apply L2 regularization / dropout, gather more diverse training data, or use early stopping.' },
      { id: 'C', text: 'Train on the validation set until validation accuracy reaches 99%.' },
      { id: 'D', text: 'Decrease the test split size to 1%.' },
    ],
    correctOptionId: 'B',
    explanation:
      'A large gap between training and validation performance indicates high variance (overfitting). Regularization, dropout, early stopping, cross-validation, and data augmentation improve generalization.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.3 — AI Fundamentals' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-13',
    title: 'REST API Idempotency',
    prompt:
      'In a payment microservice API, retrying a timed-out HTTP request must NOT accidentally create duplicate resources. Which HTTP methods are defined as idempotent by RFC 9110?',
    topicId: 'M1-AI-PROG',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'POST and PATCH only' },
      { id: 'B', text: 'GET, PUT, and DELETE' },
      { id: 'C', text: 'POST, PUT, and DELETE' },
      { id: 'D', text: 'Only GET' },
    ],
    correctOptionId: 'B',
    explanation:
      'GET, HEAD, OPTIONS, PUT, and DELETE are idempotent: repeating the identical request leaves the server in the same state as a single execution. POST is non-idempotent unless protected by an idempotency key.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.3 — Web APIs & Programming' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-14',
    title: 'Boundary Value Analysis (Black-Box Testing)',
    prompt:
      'A registration field accepts student ages from 18 to 65 inclusive (`18 <= age <= 65`). Applying standard 2-value Boundary Value Analysis (BVA), which set of test inputs should be selected?',
    topicId: 'M1-TEST',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: '{17, 18, 65, 66}' },
      { id: 'B', text: '{18, 40, 65}' },
      { id: 'C', text: '{0, 18, 65, 100}' },
      { id: 'D', text: '{17, 19, 64, 66}' },
    ],
    correctOptionId: 'A',
    explanation:
      'Two-value Boundary Value Analysis tests each valid boundary and its immediate invalid neighbor: min-1 (17), min (18), max (65), and max+1 (66).',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.5 — Software Testing' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M1-MCQ-15',
    title: 'Cyclomatic Complexity & Branch Coverage',
    prompt:
      'A function contains 2 independent `if` statements (no `elif`/`else`, no boolean short-circuit operators) and 1 `while` loop, forming a single connected control-flow graph. What is its McCabe Cyclomatic Complexity V(G)?',
    topicId: 'M1-TEST',
    difficulty: 'hard',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: '3' },
      { id: 'B', text: '4' },
      { id: 'C', text: '5' },
      { id: 'D', text: '6' },
    ],
    correctOptionId: 'B',
    explanation:
      'For a single function with P predicate (decision) nodes, McCabe Cyclomatic Complexity is V(G) = P + 1. Here P = 3 (two if statements + one while loop), so V(G) = 3 + 1 = 4 linearly independent paths.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.5 — White-Box Testing' }],
    estimatedSeconds: 90,
  },

  // --- 2 Descriptive Questions (30 pts each = 60 pts) ---
  {
    ...BASE_META,
    id: 'M1-DESC-01',
    title: 'Refactoring High-Coupling Legacy Code & Unit Test Strategy',
    prompt:
      'A legacy billing module has a single 400-line `processInvoice()` function that parses CSV files, computes tax rules for 5 regions, calls an external payment gateway directly, and writes directly to MySQL. Explain (1) two specific software engineering maintainability risks in this design, (2) how you would refactor it using SOLID principles and one named design pattern, and (3) how you would test it deterministically without hitting live external payment APIs.',
    topicId: 'M1-UML',
    difficulty: 'medium',
    questionType: 'descriptive',
    pointValue: 30,
    expectedResponse:
      '1) Risks: Violates Single Responsibility Principle (high coupling, low cohesion) and causes ripple-effect regressions whenever tax rules or storage change; untestable in isolation due to hard-coded DB/gateway dependencies. 2) Refactoring: Split into InvoiceParser, TaxCalculator (Strategy Pattern per region), PaymentGateway interface, and InvoiceRepository, injecting interfaces via constructor (Dependency Inversion). 3) Testing: Use test doubles (mocks/stubs) for PaymentGateway and in-memory repository for unit tests, plus boundary-value tests for tax brackets and integration tests on a staging container.',
    rubric: [
      {
        id: 'r1',
        label: 'Maintainability & Coupling Risks',
        description: 'Identifies at least 2 concrete risks (low cohesion/SRP violation, tight coupling, regression risk, untestability).',
        maxPoints: 10,
      },
      {
        id: 'r2',
        label: 'SOLID Refactoring & Design Pattern',
        description: 'Proposes clear separation of responsibilities, Dependency Inversion/DI, and an appropriate pattern (e.g., Strategy/Factory/Repository).',
        maxPoints: 10,
      },
      {
        id: 'r3',
        label: 'Deterministic Testing Strategy',
        description: 'Explains mocking/stubbing external dependencies, unit test isolation, and boundary/edge-case coverage.',
        maxPoints: 10,
      },
    ],
    explanation:
      'High-scoring TOPCIT descriptive answers structure responses directly against each numbered prompt requirement, naming concrete engineering concepts (SRP, DIP, Strategy, test doubles) rather than vague statements.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.4 & M1.5 — Design & Maintenance' }],
    estimatedSeconds: 480,
  },
  {
    ...BASE_META,
    id: 'M1-DESC-02',
    title: 'Evaluating RAG vs Fine-Tuning for Enterprise AI Helpdesk',
    prompt:
      'A university wants an AI assistant that answers student questions based on campus enrollment policies that change every semester, and every answer must cite the exact policy page to prevent hallucinations. Compare Retrieval-Augmented Generation (RAG) and full model fine-tuning across (1) knowledge freshness, (2) citation traceability/hallucination control, and (3) recommended architecture with evaluation metrics.',
    topicId: 'M1-AI-PROG',
    difficulty: 'hard',
    questionType: 'descriptive',
    pointValue: 30,
    expectedResponse:
      '1) Knowledge freshness: RAG updates immediately by re-indexing policy PDFs each semester without retraining weights, whereas fine-tuning becomes stale and costly to retrain frequently. 2) Traceability: RAG retrieves exact source chunks with document/page metadata and grounds generation on those chunks, reducing hallucinations and enabling verifiable citations; fine-tuning encodes knowledge implicitly in weights without reliable citations. 3) Architecture & Metrics: Document chunking + embeddings + vector/hybrid retrieval + reranker + grounded prompt; evaluate retrieval Recall@k, groundedness/faithfulness, citation accuracy, and latency.',
    rubric: [
      {
        id: 'r1',
        label: 'Knowledge Freshness Comparison',
        description: 'Contrasts RAG re-indexing agility vs fine-tuning retraining cost and staleness.',
        maxPoints: 10,
      },
      {
        id: 'r2',
        label: 'Citation Traceability & Hallucination Mitigation',
        description: 'Explains chunk provenance and grounded generation vs implicit weight storage.',
        maxPoints: 10,
      },
      {
        id: 'r3',
        label: 'Recommended Pipeline & Evaluation Metrics',
        description: 'Specifies RAG pipeline components and concrete metrics (e.g., Recall@k, faithfulness/groundedness, latency).',
        maxPoints: 10,
      },
    ],
    explanation:
      'The 2026 TOPCIT revision places strong weight on practical AI engineering decisions. For frequently changing, citation-sensitive corpora, RAG is strongly preferred over fine-tuning.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.3 — Applied AI Architecture' }],
    estimatedSeconds: 480,
  },

  // --- 3 Standard Performance Questions (50 pts each = 150 pts) ---
  {
    ...BASE_META,
    id: 'M1-PERF-01',
    title: 'Coding Task: Sliding-Window API Rate Limiter',
    prompt:
      'Write a Python program that reads `limit` and `window_sec` on the first line, followed by `N` on the second line, and `N` lines of `<timestamp_int> <user_id>` (sorted by non-decreasing timestamp). For each request, output `ALLOW` if the user has strictly fewer than `limit` allowed requests in the inclusive window `[t - window_sec + 1, t]`, otherwise output `BLOCK`. Only `ALLOW`ed requests count toward the user’s quota.',
    topicId: 'M1-ALG',
    difficulty: 'medium',
    questionType: 'standard_performance',
    practicalSubtype: 'coding',
    pointValue: 50,
    expectedResponse:
      'Maintain a per-user deque of allowed timestamps. For each request (t, user), pop timestamps from the left while deque[0] < t - window_sec + 1. If len(deque) < limit, append t and print ALLOW; else print BLOCK. Time complexity O(N).',
    rubric: [
      { id: 'r1', label: 'Visible Test Cases', description: 'Passes basic rate-limit allow/block transitions.', maxPoints: 20 },
      { id: 'r2', label: 'Hidden Edge Cases', description: 'Handles exact window boundaries, multiple users, and rejected requests not consuming quota.', maxPoints: 20 },
      { id: 'r3', label: 'Algorithmic Efficiency', description: 'Uses O(1) amortized queue eviction (deque) avoiding O(N^2) rescanning.', maxPoints: 10 },
    ],
    sampleTestCases: [
      {
        id: 'tc-1',
        input: '2 10\n4\n1 u1\n5 u1\n8 u1\n11 u1',
        expectedOutput: 'ALLOW\nALLOW\nBLOCK\nALLOW',
        isHidden: false,
        points: 20,
        description: 'Single user crossing window boundary at t=11',
      },
      {
        id: 'tc-2',
        input: '2 5\n5\n1 a\n1 b\n2 a\n3 a\n6 a',
        expectedOutput: 'ALLOW\nALLOW\nALLOW\nBLOCK\nALLOW',
        isHidden: true,
        points: 15,
        description: 'Multi-user isolation and blocked requests do not count',
      },
      {
        id: 'tc-3',
        input: '1 1\n3\n5 x\n5 x\n6 x',
        expectedOutput: 'ALLOW\nBLOCK\nALLOW',
        isHidden: true,
        points: 15,
        description: 'Window size 1 boundary check',
      },
    ],
    scenarioData: {
      language: 'python',
      starterCode: `from collections import defaultdict, deque
import sys

def solve():
    lines = [line.strip() for line in sys.stdin if line.strip()]
    if not lines:
        return
    limit, window_sec = map(int, lines[0].split())
    n = int(lines[1])
    # TODO: Implement per-user sliding-window rate limiter
    for i in range(2, 2 + n):
        t_str, user = lines[i].split()
        t = int(t_str)
        print("ALLOW")

if __name__ == "__main__":
    solve()
`,
    },
    explanation:
      'Using `collections.deque` per user ensures each timestamp is pushed and popped at most once (O(N) total). Crucially, blocked requests must NOT be added to the deque.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.2 & M1.3 — Queue/Sliding Window' }],
    estimatedSeconds: 900,
  },
  {
    ...BASE_META,
    id: 'M1-PERF-02',
    title: 'Debugging Task: Fix Broken Course Prerequisite Cycle Detector',
    prompt:
      'The provided Python function `can_finish(num_courses, prerequisites)` is supposed to return `True` if all courses can be completed (no cyclic dependency) and `False` if a cycle exists. However, it fails on disconnected graphs and shared DAG dependencies (diamond graphs) because it uses a single `visited` set instead of 3-state cycle detection (unvisited / visiting / visited). Fix the implementation so all test cases pass.',
    topicId: 'M1-TEST',
    difficulty: 'medium',
    questionType: 'standard_performance',
    practicalSubtype: 'coding',
    pointValue: 50,
    expectedResponse:
      'Track 3 states (0=unvisited, 1=visiting on recursion stack, 2=fully explored) or use Kahn’s BFS topological sort with in-degree counts. A diamond DAG (0->1, 0->2, 1->3, 2->3) is valid (True), while a back-edge to state 1 indicates a cycle (False).',
    rubric: [
      { id: 'r1', label: 'Cycle Detection Correctness', description: 'Returns False on direct and indirect directed cycles.', maxPoints: 20 },
      { id: 'r2', label: 'Diamond DAG & Disconnected Components', description: 'Returns True on shared nodes without cycles and handles isolated vertices.', maxPoints: 20 },
      { id: 'r3', label: 'Clean Fix Without Mutation Bugs', description: 'Passes all automated tests cleanly in O(V+E).', maxPoints: 10 },
    ],
    sampleTestCases: [
      {
        id: 'tc-1',
        input: '4\n4\n0 1\n0 2\n1 3\n2 3',
        expectedOutput: 'True',
        isHidden: false,
        points: 20,
        description: 'Diamond DAG (must return True)',
      },
      {
        id: 'tc-2',
        input: '3\n3\n0 1\n1 2\n2 0',
        expectedOutput: 'False',
        isHidden: false,
        points: 15,
        description: '3-node directed cycle',
      },
      {
        id: 'tc-3',
        input: '5\n2\n3 4\n4 3',
        expectedOutput: 'False',
        isHidden: true,
        points: 15,
        description: 'Cycle inside disconnected component',
      },
    ],
    scenarioData: {
      language: 'python',
      mode: 'debugging',
      starterCode: `import sys
from collections import defaultdict

def can_finish(num_courses, prerequisites):
    graph = defaultdict(list)
    for course, prereq in prerequisites:
        graph[prereq].append(course)

    # BUG: single visited set treats diamond DAGs as cycles!
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
    },
    explanation:
      'In directed graphs, encountering an already-finished node (state 2) is NOT a cycle — only encountering a node currently on the active DFS stack (state 1) proves a cycle.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.2 & M1.5 — Graph Debugging' }],
    estimatedSeconds: 900,
  },
  {
    ...BASE_META,
    id: 'M1-PERF-03',
    title: 'UML Modeling: Student Course Enrollment Activity Diagram',
    prompt:
      'Design a UML Activity Diagram for a University Course Enrollment workflow:\n1. Start at an Initial Node.\n2. Student submits Course Selection.\n3. Decision: Check Prerequisites met? If No -> Notify Prerequisite Error -> Flow/Activity Final.\n4. If Yes -> Decision: Seat Available? If No -> Add to Waitlist -> Activity Final.\n5. If Yes -> Reserve Seat -> Process Tuition Payment -> Confirm Enrollment -> Activity Final.',
    topicId: 'M1-UML',
    difficulty: 'medium',
    questionType: 'standard_performance',
    practicalSubtype: 'diagram',
    pointValue: 50,
    expectedResponse:
      'Activity diagram containing Initial node, Actions (Submit Course Selection, Notify Error, Add to Waitlist, Reserve Seat, Process Payment, Confirm Enrollment), 2 Decision diamonds with labeled Yes/No guard flows, and valid Final node(s) with full reachability.',
    rubric: [
      { id: 'r1', label: 'Start & End Nodes', description: 'Includes Initial node and appropriate Activity Final node(s).', maxPoints: 10 },
      { id: 'r2', label: 'Core Action Nodes', description: 'Includes Submit Selection, Reserve Seat, Process Payment, Confirm Enrollment, Waitlist/Error actions.', maxPoints: 15 },
      { id: 'r3', label: 'Decision Branching & Guards', description: 'Models Prerequisite Check and Seat Availability decisions with labeled Yes/No transitions.', maxPoints: 15 },
      { id: 'r4', label: 'Connectivity & Flow Integrity', description: 'No disconnected nodes; every path terminates cleanly.', maxPoints: 10 },
    ],
    scenarioData: {
      diagramType: 'uml_activity',
      requiredNodeTypes: ['initial', 'action', 'decision', 'final'],
      minNodes: 8,
      minEdges: 8,
      requiredKeywords: ['prerequisite', 'seat', 'payment', 'confirm'],
    },
    explanation:
      'UML Activity Diagrams evaluate control flow completeness: every decision diamond must have at least two guarded outgoing flows, and all branches must terminate cleanly without orphaned nodes.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1.4 — UML Activity Modeling' }],
    estimatedSeconds: 900,
  },

  // --- 1 Integrated Performance Question (80 pts) ---
  {
    ...BASE_META,
    id: 'M1-INT-01',
    title: 'Integrated Scenario: Campus Library Microservice Redesign & Overdue Fine Engine',
    prompt:
      'You are the lead developer modernizing a university library system experiencing checkout race conditions and inflexible fine rules.\n\n**Requirements:**\n- Borrowers have roles (`Student`: max 5 books, $0.50/day fine; `Faculty`: max 15 books, $0.25/day fine; `Guest`: max 2 books, $1.00/day fine).\n- Reservations must be prevented when available copies == 0, and double-checkout concurrency must be prevented.\n\n**Deliverables (80 points total):**\n1. **Class Architecture Design (25 pts)**: Specify core classes (`Member`, `BookCopy`, `Loan`, `FinePolicy` strategy), attributes, key methods, and UML relationships with multiplicities.\n2. **Fine Calculation & Concurrency Logic (30 pts)**: Provide clean implementation/pseudocode for calculating overdue fines with grace period (2 days) and a cap ($25 max) plus handling concurrent last-copy checkout.\n3. **Verification & Edge-Case Test Plan (25 pts)**: Define at least 5 concrete test cases covering boundary values (day 0, day 2, day 3, cap reached), role polymorphism, and concurrent checkout contention.',
    topicId: 'M1-SE',
    difficulty: 'hard',
    questionType: 'integrated_performance',
    practicalSubtype: 'multi_artifact',
    pointValue: 80,
    expectedResponse:
      'Part 1: Member (1) -- (0..*) Loan (0..*) -- (1) BookCopy; Strategy interface FinePolicy implemented by StudentFinePolicy, FacultyFinePolicy, GuestFinePolicy. Part 2: billable_days = max(0, overdue_days - 2); fine = min(25.0, billable_days * rate); use optimistic locking (version column) or DB row-level SELECT FOR UPDATE to prevent double checkout. Part 3: Concrete tests for exact grace boundary (2 days -> $0, 3 days -> $0.50), fine cap ($25), max-loan limit per role, and two threads borrowing the last copy (exactly one succeeds).',
    rubric: [
      { id: 'r1', label: 'Object-Oriented & UML Class Structure', description: 'Correct entities, multiplicities, and extensible Strategy/polymorphic fine policy.', maxPoints: 25 },
      { id: 'r2', label: 'Fine Algorithm & Boundary Accuracy', description: 'Correct grace-period subtraction, per-role rate, and $25 cap logic.', maxPoints: 15 },
      { id: 'r3', label: 'Concurrency Control Mechanism', description: 'Addresses last-copy race condition via locking/atomic compare-and-swap/DB transaction.', maxPoints: 15 },
      { id: 'r4', label: 'Test Plan & Edge Cases', description: 'Includes boundary tests (day 2/3, cap), role limits, and concurrency test scenario.', maxPoints: 25 },
    ],
    scenarioData: {
      diagramType: 'uml_class',
      language: 'python',
    },
    explanation:
      '80-point TOPCIT Integrated Performance tasks reward holistic engineering: connecting clean OO design, exact business logic, concurrency safety, and verifiable test cases across one coherent workplace scenario.',
    references: [{ label: 'TOPCIT 2026 Syllabus M1 — Integrated Software Problem Solving' }],
    estimatedSeconds: 1500,
  },
];
