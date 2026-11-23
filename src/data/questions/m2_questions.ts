import type { Question } from '@/domain/schemas';

const BASE_META = {
  domain: 'M2' as const,
  sourceClassification: 'original_practice' as const,
  contentVersion: '2026.1.0',
  reviewStatus: 'verified' as const,
  mockSetId: 'mock-2026-set-1',
};

/**
 * M2 — Data Management
 * Exact 2026 Blueprint Allocation:
 * - 15 MCQ x 5 = 75 pts
 * - 2 Descriptive x 30 = 60 pts
 * - 1 Standard Performance x 50 = 50 pts
 * - 1 Integrated Performance x 80 = 80 pts
 * Total: 19 questions, 265 points
 */
export const M2_QUESTIONS: Question[] = [
  // --- 15 MCQs (5 pts each = 75 pts) ---
  {
    ...BASE_META,
    id: 'M2-MCQ-01',
    title: 'Entity Integrity vs Referential Integrity',
    prompt:
      'Which database integrity rule forbids any attribute of a Primary Key from containing a NULL value, and which rule ensures every non-null Foreign Key matches an existing parent Primary Key?',
    topicId: 'M2-FUND',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Domain Integrity and Check Integrity' },
      { id: 'B', text: 'Entity Integrity and Referential Integrity' },
      { id: 'C', text: 'Referential Integrity and Entity Integrity' },
      { id: 'D', text: 'Trigger Integrity and Atomicity' },
    ],
    correctOptionId: 'B',
    explanation:
      'Entity Integrity requires Primary Keys to be unique and NOT NULL. Referential Integrity requires Foreign Key values to either be NULL (if optional) or reference an existing parent key.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.1 — Relational Integrity' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-02',
    title: 'Candidate Key vs Superkey',
    prompt:
      'In a relational table `Student(student_id, email, full_name, dept_id)` where both `student_id` and `email` uniquely identify a student, which statement is TRUE?',
    topicId: 'M2-FUND',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: '{student_id, full_name} is a Candidate Key.' },
      { id: 'B', text: '{student_id, full_name} is a Superkey, whereas {student_id} and {email} are Candidate Keys.' },
      { id: 'C', text: 'A table may have at most one Candidate Key.' },
      { id: 'D', text: 'Foreign keys must always be Candidate Keys.' },
    ],
    correctOptionId: 'B',
    explanation:
      'A Candidate Key is a minimal superkey (no proper subset uniquely identifies a tuple). `{student_id, full_name}` is a superkey, not minimal, so it is not a candidate key.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.1 — Relational Keys' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-03',
    title: 'Second Normal Form (2NF) Violation',
    prompt:
      'Consider `Enrollment(student_id, course_id, grade, course_title)` with composite primary key `(student_id, course_id)` and functional dependency `course_id -> course_title`. Which normal form is violated?',
    topicId: 'M2-MODEL',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: '1NF (non-atomic values)' },
      { id: 'B', text: '2NF (partial functional dependency on part of a composite key)' },
      { id: 'C', text: 'Only 4NF (multi-valued dependency)' },
      { id: 'D', text: 'No normalization violation exists.' },
    ],
    correctOptionId: 'B',
    explanation:
      '`course_title` depends only on `course_id` (a proper subset of the composite PK `(student_id, course_id)`). Partial dependencies violate 2NF and cause update/insertion anomalies.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.2 — Normalization' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-04',
    title: 'Third Normal Form (3NF) vs BCNF',
    prompt:
      'A relation R(A, B, C) is in 3NF and has candidate keys `{A, B}` and `{A, C}`. It also has the functional dependency `C -> B`. Why does R violate Boyce-Codd Normal Form (BCNF)?',
    topicId: 'M2-MODEL',
    difficulty: 'hard',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Because B is a non-prime attribute.' },
      { id: 'B', text: 'Because the determinant C in the non-trivial FD C -> B is not a superkey of R.' },
      { id: 'C', text: 'Because R has more than one candidate key.' },
      { id: 'D', text: 'Because BCNF prohibits composite keys.' },
    ],
    correctOptionId: 'B',
    explanation:
      'BCNF requires that for every non-trivial functional dependency X -> Y, X MUST be a superkey. Here `C` is not a superkey even though `B` is prime (satisfying 3NF).',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.2 — BCNF Theory' }],
    estimatedSeconds: 90,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-05',
    title: 'Resolving Many-to-Many Relationships in ERD',
    prompt:
      'In a logical ER model, a `Student` can enroll in many `Courses`, and a `Course` can have many `Students`, and each enrollment records a `semester` and `final_grade`. How must this M:N relationship be physically implemented in an RDBMS?',
    topicId: 'M2-MODEL',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Store a comma-separated list of course_ids inside the Student table.' },
      { id: 'B', text: 'Introduce an associative (junction) table with foreign keys to both Student and Course plus the relationship attributes.' },
      { id: 'C', text: 'Add 10 nullable course_id columns to Student.' },
      { id: 'D', text: 'Merge Student and Course into a single table.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Relational databases decompose M:N relationships into two 1:N relationships using an associative (junction) table containing FKs to both parent tables and any relationship attributes.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.2 — ER Modeling' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-06',
    title: 'SQL Execution Order: WHERE vs HAVING',
    prompt:
      'Why does the query `SELECT dept_id, AVG(salary) FROM employees WHERE AVG(salary) > 50000 GROUP BY dept_id;` fail in standard SQL?',
    topicId: 'M2-SQL',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'AVG() cannot be used with GROUP BY.' },
      { id: 'B', text: 'WHERE filters individual rows before grouping; aggregate conditions must be placed in HAVING.' },
      { id: 'C', text: 'dept_id must appear in ORDER BY.' },
      { id: 'D', text: 'SQL requires SELECT * when using AVG().' },
    ],
    correctOptionId: 'B',
    explanation:
      'Logical SQL evaluation order is FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY. Because WHERE executes before GROUP BY, aggregate predicates belong in HAVING.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.3 — SQL Aggregation' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-07',
    title: 'LEFT JOIN Filter Trap',
    prompt:
      'You want to list ALL customers and the count of their orders placed in 2026 (showing 0 for customers with no 2026 orders). Which query produces the correct result?',
    topicId: 'M2-SQL',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'SELECT c.id, COUNT(o.id) FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.order_year = 2026 GROUP BY c.id;' },
      { id: 'B', text: 'SELECT c.id, COUNT(o.id) FROM customers c LEFT JOIN orders o ON c.id = o.customer_id AND o.order_year = 2026 GROUP BY c.id;' },
      { id: 'C', text: 'SELECT c.id, COUNT(*) FROM customers c LEFT JOIN orders o ON c.id = o.customer_id AND o.order_year = 2026 GROUP BY c.id;' },
      { id: 'D', text: 'SELECT c.id, COUNT(o.id) FROM customers c INNER JOIN orders o ON c.id = o.customer_id AND o.order_year = 2026 GROUP BY c.id;' },
    ],
    correctOptionId: 'B',
    explanation:
      'Putting `o.order_year = 2026` in WHERE turns the LEFT JOIN into an INNER JOIN (dropping NULL rows). Putting it in ON preserves customers with 0 orders, and `COUNT(o.id)` counts only non-null order IDs (whereas `COUNT(*)` would return 1 for customers with no orders).',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.3 — Outer Joins' }],
    estimatedSeconds: 90,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-08',
    title: 'SQL Window Functions: RANK vs DENSE_RANK',
    prompt:
      'Given student exam scores `[95, 95, 88, 80]` ordered descending, what values do `RANK()` and `DENSE_RANK()` produce respectively?',
    topicId: 'M2-SQL',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'RANK: 1, 1, 2, 3 | DENSE_RANK: 1, 2, 3, 4' },
      { id: 'B', text: 'RANK: 1, 1, 3, 4 | DENSE_RANK: 1, 1, 2, 3' },
      { id: 'C', text: 'RANK: 1, 2, 3, 4 | DENSE_RANK: 1, 1, 3, 4' },
      { id: 'D', text: 'Both produce 1, 1, 3, 4' },
    ],
    correctOptionId: 'B',
    explanation:
      'RANK() leaves gaps after ties (1, 1, 3, 4), while DENSE_RANK() assigns consecutive rank numbers without gaps (1, 1, 2, 3).',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.3 — Analytical SQL' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-09',
    title: 'ACID Transaction Isolation Anomalies',
    prompt:
      'Transaction T1 reads a balance of 100. Transaction T2 updates it to 200 and commits. When T1 re-reads the exact same row before committing, it now sees 200. Which concurrency anomaly occurred?',
    topicId: 'M2-SQL',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Dirty Read' },
      { id: 'B', text: 'Non-Repeatable Read' },
      { id: 'C', text: 'Phantom Read' },
      { id: 'D', text: 'Deadlock' },
    ],
    correctOptionId: 'B',
    explanation:
      'Because T2 committed before T1’s second read, it is a Non-Repeatable Read (not a Dirty Read, which reads uncommitted data). Phantom Read involves newly inserted/deleted rows matching a range predicate.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.3 — Transaction Isolation' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-10',
    title: 'Composite B-Tree Index Leftmost Prefix Rule',
    prompt:
      'A table `orders` has a composite B-Tree index on `(customer_id, status, created_at)`. Which query CANNOT effectively use this index for a fast index range seek?',
    topicId: 'M2-OPS',
    difficulty: 'hard',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'WHERE customer_id = 42' },
      { id: 'B', text: 'WHERE customer_id = 42 AND status = \'PAID\'' },
      { id: 'C', text: 'WHERE status = \'PAID\' AND created_at >= \'2026-01-01\'' },
      { id: 'D', text: 'WHERE customer_id = 42 AND status = \'PAID\' AND created_at >= \'2026-01-01\'' },
    ],
    correctOptionId: 'C',
    explanation:
      'B-Tree composite indexes are sorted left-to-right. Omitting the leading column (`customer_id`) prevents a standard leftmost-prefix index seek.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.4 — Indexing & Query Tuning' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-11',
    title: 'Write-Ahead Logging (WAL) & Crash Recovery',
    prompt:
      'During database crash recovery under Write-Ahead Logging (WAL), what are the roles of REDO and UNDO operations?',
    topicId: 'M2-OPS',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'REDO rolls back uncommitted transactions; UNDO replays committed transactions.' },
      { id: 'B', text: 'REDO reapplies committed transactions whose dirty pages were not flushed to disk; UNDO rolls back uncommitted transactions.' },
      { id: 'C', text: 'WAL eliminates the need for checkpoints and backups.' },
      { id: 'D', text: 'UNDO only applies to SELECT queries.' },
    ],
    correctOptionId: 'B',
    explanation:
      'WAL ensures durability (REDO committed changes missing from data files) and atomicity (UNDO uncommitted changes written to disk before the crash).',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.4 — Backup & Recovery' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-12',
    title: 'Index Trade-Off on Write-Heavy Tables',
    prompt:
      'An IoT telemetry table receives 50,000 INSERTs per second and is rarely queried directly. A junior engineer creates 12 secondary B-Tree indexes on every column. What is the most immediate operational impact?',
    topicId: 'M2-OPS',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'INSERT throughput drops sharply and storage/WAL overhead spikes due to maintaining all 12 indexes on every write.' },
      { id: 'B', text: 'INSERT throughput increases because indexes speed up writes.' },
      { id: 'C', text: 'The table automatically converts to NoSQL.' },
      { id: 'D', text: 'Foreign key constraints are disabled.' },
    ],
    correctOptionId: 'A',
    explanation:
      'Every INSERT/UPDATE/DELETE must update every relevant secondary index, consuming CPU, I/O, and storage. Over-indexing severely hurts write-heavy workloads.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.4 — Performance Tuning' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-13',
    title: 'OLTP vs OLAP & Star Schema',
    prompt:
      'Which combination best characterizes an analytical Data Warehouse (OLAP) compared to a transactional production database (OLTP)?',
    topicId: 'M2-DATA-AI',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Highly normalized 3NF schema optimized for short single-row updates' },
      { id: 'B', text: 'Denormalized Star/Snowflake schema (Fact + Dimension tables) optimized for complex historical aggregations' },
      { id: 'C', text: 'No historical records stored beyond 24 hours' },
      { id: 'D', text: 'Row-level locking for thousands of concurrent point writes per second' },
    ],
    correctOptionId: 'B',
    explanation:
      'OLAP data warehouses use dimensional modeling (Star/Snowflake schemas with central Fact tables and surrounding Dimension tables) and columnar storage for high-speed analytical scans.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.5 — Data Warehousing' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-14',
    title: 'Data Leakage in ML Preprocessing Pipelines',
    prompt:
      'A data scientist computes feature scaling (mean and standard deviation) on the ENTIRE dataset before splitting into train and test sets. What flaw does this introduce?',
    topicId: 'M2-DATA-AI',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Underfitting caused by too few features' },
      { id: 'B', text: 'Data leakage: test set distribution statistics leak into training, producing overly optimistic evaluation scores.' },
      { id: 'C', text: 'SQL injection vulnerability' },
      { id: 'D', text: 'No flaw; scaling must always be fit on the entire dataset.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Scalers, imputers, and encoders must be fit ONLY on the training split and then applied (`transform`) to validation/test splits to avoid data leakage.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.5 — Data-Driven AI Pipelines' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M2-MCQ-15',
    title: 'NoSQL Database Family Selection',
    prompt:
      'Which NoSQL store type is best suited for modeling multi-hop social recommendations and fraud rings where traversing variable-depth relationships is the primary query pattern?',
    topicId: 'M2-DATA-AI',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Key-Value Store (e.g., Redis)' },
      { id: 'B', text: 'Graph Database (e.g., Neo4j)' },
      { id: 'C', text: 'Wide-Column Store (e.g., Cassandra)' },
      { id: 'D', text: 'Flat CSV archive' },
    ],
    correctOptionId: 'B',
    explanation:
      'Graph databases store nodes and edges natively with index-free adjacency, enabling fast multi-hop relationship traversals for fraud rings and recommendation networks.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.5 — NoSQL & Modern Data' }],
    estimatedSeconds: 60,
  },

  // --- 2 Descriptive Questions (30 pts each = 60 pts) ---
  {
    ...BASE_META,
    id: 'M2-DESC-01',
    title: 'Normalizing a Denormalized Order Sheet to 3NF',
    prompt:
      'A spreadsheet table `OrderSheet(order_id, order_date, cust_id, cust_name, cust_city, product_id, product_name, unit_price, qty)` uses composite PK `(order_id, product_id)`. Explain (1) one insertion anomaly and one update anomaly present in this design, (2) the exact decomposed 3NF tables with primary keys and foreign keys, and (3) one valid reason an architect might selectively denormalize `unit_price` on the order line.',
    topicId: 'M2-MODEL',
    difficulty: 'medium',
    questionType: 'descriptive',
    pointValue: 30,
    expectedResponse:
      '1) Anomalies: Insertion anomaly — cannot register a new customer or product until an order exists. Update anomaly — changing a customer’s city requires updating every historical order row or causes inconsistent data. 2) 3NF Tables: Customer(cust_id PK, cust_name, cust_city); Product(product_id PK, product_name, current_unit_price); Orders(order_id PK, order_date, cust_id FK); OrderItem(order_id PK/FK, product_id PK/FK, qty, unit_price_at_sale). 3) Historical price immutability: storing unit_price_at_sale in OrderItem preserves the exact invoiced price even when catalog product prices change later.',
    rubric: [
      { id: 'r1', label: 'Insertion & Update Anomalies', description: 'Accurately explains both concrete anomalies caused by partial/transitive dependencies.', maxPoints: 10 },
      { id: 'r2', label: '3NF Decomposition & Keys', description: 'Produces Customer, Product, Orders, and OrderItem with proper PKs and FKs.', maxPoints: 12 },
      { id: 'r3', label: 'Historical Price Snapshot Justification', description: 'Explains why storing unit_price at purchase time prevents retroactive invoice corruption.', maxPoints: 8 },
    ],
    explanation:
      'Strong TOPCIT database responses balance theoretical normalization (eliminating partial and transitive dependencies) with practical business semantics like immutable historical invoice prices.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.2 — Normalization & Design' }],
    estimatedSeconds: 480,
  },
  {
    ...BASE_META,
    id: 'M2-DESC-02',
    title: 'Diagnosing a Slow Production SQL Query & Safe Optimization',
    prompt:
      'An e-commerce query `SELECT * FROM orders WHERE YEAR(created_at) = 2026 AND status = \'SHIPPED\' ORDER BY total_amount DESC LIMIT 20;` takes 8.4 seconds on a 15-million-row table even though an index exists on `created_at`. Explain (1) why the existing index on `created_at` is NOT used, (2) how to rewrite the query to be SARGable, and (3) what composite index you would create and how to verify improvement.',
    topicId: 'M2-OPS',
    difficulty: 'hard',
    questionType: 'descriptive',
    pointValue: 30,
    expectedResponse:
      '1) Non-SARGable predicate: wrapping the indexed column in `YEAR(created_at)` prevents B-Tree range seeks, forcing a full table scan. 2) Rewrite: replace `YEAR(created_at) = 2026` with `created_at >= \'2026-01-01\' AND created_at < \'2027-01-01\'` and project only required columns instead of `SELECT *`. 3) Index & Verification: create composite index `(status, created_at)` (equality column first, range column second) or `(status, total_amount DESC, created_at)` depending on selectivity; verify with `EXPLAIN ANALYZE` confirming index range scan and drastic reduction in scanned rows and execution time.',
    rubric: [
      { id: 'r1', label: 'Root Cause (Non-SARGable Function)', description: 'Identifies that applying YEAR() on an indexed column disables B-Tree seek.', maxPoints: 10 },
      { id: 'r2', label: 'SARGable Query Rewrite', description: 'Uses half-open date range predicate and avoids SELECT *.', maxPoints: 10 },
      { id: 'r3', label: 'Composite Index & EXPLAIN Verification', description: 'Proposes equality-first composite index and verifies via EXPLAIN / execution plan.', maxPoints: 10 },
    ],
    explanation:
      'Making predicates SARGable (Search ARGument-able) and placing equality columns before range columns in B-Tree composite indexes are core TOPCIT M2 tuning competencies.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.4 — SQL Tuning' }],
    estimatedSeconds: 480,
  },

  // --- 1 Standard Performance Question (50 pts) ---
  {
    ...BASE_META,
    id: 'M2-PERF-01',
    title: 'SQL Lab Task: Department Honors & GPA Aggregation Report',
    prompt:
      'Given tables `departments(dept_id, dept_name)`, `students(student_id, full_name, dept_id)`, and `enrollments(enroll_id, student_id, credits, grade_points)`, write a single SQL query that returns each department’s `dept_name`, `student_count` (distinct enrolled students), and weighted GPA `weighted_gpa` rounded to 2 decimal places (`ROUND(SUM(credits * grade_points) * 1.0 / SUM(credits), 2)`), **only for departments with `weighted_gpa >= 3.20`**, ordered by `weighted_gpa DESC, dept_name ASC`.',
    topicId: 'M2-SQL',
    difficulty: 'medium',
    questionType: 'standard_performance',
    practicalSubtype: 'sql',
    pointValue: 50,
    expectedResponse: `SELECT
  d.dept_name,
  COUNT(DISTINCT s.student_id) AS student_count,
  ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) AS weighted_gpa
FROM departments d
JOIN students s ON s.dept_id = d.dept_id
JOIN enrollments e ON e.student_id = s.student_id
GROUP BY d.dept_id, d.dept_name
HAVING ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) >= 3.20
ORDER BY weighted_gpa DESC, d.dept_name ASC;`,
    rubric: [
      { id: 'r1', label: 'Multi-Table Joins & Grouping', description: 'Joins departments, students, and enrollments accurately and groups by department.', maxPoints: 15 },
      { id: 'r2', label: 'Weighted GPA Formula & Distinct Count', description: 'Computes credit-weighted GPA (not unweighted average) and COUNT(DISTINCT student_id).', maxPoints: 20 },
      { id: 'r3', label: 'HAVING Filter & Deterministic Ordering', description: 'Filters >= 3.20 via HAVING and orders by weighted_gpa DESC, dept_name ASC.', maxPoints: 15 },
    ],
    scenarioData: {
      language: 'sql',
      schemaSql: `
CREATE TABLE departments (dept_id INTEGER PRIMARY KEY, dept_name TEXT NOT NULL);
CREATE TABLE students (student_id INTEGER PRIMARY KEY, full_name TEXT NOT NULL, dept_id INTEGER NOT NULL REFERENCES departments(dept_id));
CREATE TABLE enrollments (enroll_id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students(student_id), credits INTEGER NOT NULL, grade_points REAL NOT NULL);

INSERT INTO departments VALUES (1, 'Computer Science'), (2, 'Information Technology'), (3, 'Information Systems');
INSERT INTO students VALUES (101, 'Ana Cruz', 1), (102, 'Ben Lim', 1), (103, 'Cara Uy', 2), (104, 'Dan Tan', 2), (105, 'Eli Go', 3);
INSERT INTO enrollments VALUES
  (1, 101, 3, 4.0), (2, 101, 3, 3.5),
  (3, 102, 4, 3.5),
  (4, 103, 3, 3.5), (5, 104, 3, 3.0),
  (6, 105, 3, 2.5), (7, 105, 3, 3.0);
`,
      expectedRows: [
        { dept_name: 'Computer Science', student_count: 2, weighted_gpa: 3.65 },
        { dept_name: 'Information Technology', student_count: 2, weighted_gpa: 3.25 },
      ],
    },
    explanation:
      'Credit-weighted GPA must weight each course’s grade points by its credits (`SUM(credits * grade_points) / SUM(credits)`), and `COUNT(DISTINCT s.student_id)` prevents double-counting students enrolled in multiple courses.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2.3 — Complex SQL Reporting' }],
    estimatedSeconds: 900,
  },

  // --- 1 Integrated Performance Question (80 pts) ---
  {
    ...BASE_META,
    id: 'M2-INT-01',
    title: 'Integrated Scenario: University Enrollment Database Design, SQL Analytics & Deadlock Prevention',
    prompt:
      'A university’s registration portal suffers from duplicate enrollments, missing audit trails, and occasional deadlocks during peak enrollment windows.\n\n**Deliverables (80 points total):**\n1. **ER Diagram / Normalized Logical Schema (30 pts)**: Design entities (`Student`, `Course`, `Section`, `Enrollment`, `Instructor`) with Primary Keys, Foreign Keys, Crow’s Foot cardinalities, and a UNIQUE constraint preventing a student from enrolling twice in the same section.\n2. **SQL Capacity & Waitlist Query (25 pts)**: Write SQL to list all sections in `2026-S1` that have reached >= 90% seat capacity (`enrolled_count / max_capacity >= 0.90`), showing section code, course title, enrolled count, and remaining seats.\n3. **Transaction & Concurrency Design (25 pts)**: Design the atomic enrollment transaction (decrement/verify seats + insert enrollment) specifying the SQL isolation level, locking order to prevent deadlocks, and rollback behavior when capacity reaches 0.',
    topicId: 'M2-MODEL',
    difficulty: 'hard',
    questionType: 'integrated_performance',
    practicalSubtype: 'multi_artifact',
    pointValue: 80,
    expectedResponse:
      'Part 1: Student(student_id PK), Course(course_id PK), Instructor(instructor_id PK), Section(section_id PK, course_id FK, instructor_id FK, term, max_capacity), Enrollment(enrollment_id PK, student_id FK, section_id FK, status, UNIQUE(student_id, section_id)). Part 2: LEFT JOIN Enrollment with status=\'ENROLLED\', GROUP BY section_id HAVING COUNT(e.enrollment_id) * 1.0 / s.max_capacity >= 0.90. Part 3: Begin transaction; lock Section row (`SELECT max_capacity, enrolled_count FROM Section WHERE section_id = ? FOR UPDATE`), check capacity and duplicate, INSERT Enrollment, UPDATE enrolled_count, COMMIT (or ROLLBACK if full). Enforce consistent lock ordering (e.g., always lock Student then Section by ascending ID) to prevent circular wait deadlocks.',
    rubric: [
      { id: 'r1', label: 'Normalized ERD & Constraints', description: 'All 5 entities, correct 1:N / M:N resolution, PK/FK, and UNIQUE(student_id, section_id).', maxPoints: 30 },
      { id: 'r2', label: 'Capacity Analytics SQL', description: 'Accurate JOIN, GROUP BY, floating-point division >= 0.90, and remaining seats calculation.', maxPoints: 25 },
      { id: 'r3', label: 'Transaction Atomicity & Deadlock Prevention', description: 'Uses row-level locking/serializable guard, rollback on full capacity, and lock ordering.', maxPoints: 25 },
    ],
    scenarioData: {
      diagramType: 'er_diagram',
      language: 'sql',
    },
    explanation:
      'Integrated M2 tasks test end-to-end data engineering: structural schema integrity, accurate analytical SQL, and safe concurrent transaction execution under real traffic.',
    references: [{ label: 'TOPCIT 2026 Syllabus M2 — Integrated Data Management' }],
    estimatedSeconds: 1500,
  },
];
