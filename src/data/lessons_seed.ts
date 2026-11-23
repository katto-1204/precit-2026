import type { Lesson } from '@/domain/schemas';

export const OFFICIAL_STUDY_REFERENCES = [
  {
    id: 'ref-topcit-syllabus',
    title: 'Official TOPCIT Syllabus (V4.0E / 2026)',
    url: 'https://www.topcit.or.kr/introduction/syllabus.do',
    domain: 'ALL',
    note: 'Official TOPCIT competency framework and domain structure.',
  },
  {
    id: 'ref-topcit-preview',
    title: 'Official TOPCIT Sample Question Preview',
    url: 'https://topcit.or.kr/board/preview.do',
    domain: 'ALL',
    note: 'Publicly released TOPCIT sample question formats.',
  },
  {
    id: 'ref-ched-sw',
    title: 'CHED PHLConnect — 01 Software TOPCIT Reviewer (Foundational)',
    url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/01-Software-TOPCIT.pdf',
    domain: 'M1',
    note: 'Foundational software engineering reference; mapped to 2026 M1 Software Development.',
  },
  {
    id: 'ref-ched-db',
    title: 'CHED PHLConnect — 02 Database TOPCIT Reviewer (Foundational)',
    url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/02-Database-TOPCIT.pdf',
    domain: 'M2',
    note: 'Foundational database & SQL reference; mapped to 2026 M2 Data Management.',
  },
  {
    id: 'ref-ched-sec',
    title: 'CHED PHLConnect — 04 Information Security TOPCIT Reviewer (Foundational)',
    url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/04-security-TOPCIT.pdf',
    domain: 'M3',
    note: 'Foundational security reference; mapped to 2026 M3 Systems Architecture & InfoSec.',
  },
  {
    id: 'ref-ched-biz',
    title: 'CHED PHLConnect — 05 IT Business TOPCIT Reviewer (Foundational)',
    url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/05-Business-TOPCIT.pdf',
    domain: 'M4',
    note: 'Foundational IT business & PM reference; mapped to 2026 M4 IT Business.',
  },
] as const;

export const SEED_LESSONS: readonly Lesson[] = [
  // --- M3 SECURITY FIRST (User #2 Weakness: 5/85) ---
  {
    id: 'lesson-m3-sec-fundamentals',
    domain: 'M3',
    topicId: 'M3-SEC-FUND',
    title: 'Information Security Core: CIA Triad, Access Control & Threat Modeling',
    summary:
      'High-priority remediation for your 2025 Security baseline (5/85). Master Confidentiality, Integrity, Availability, AuthN vs AuthZ, RBAC/IDOR, and Incident Response.',
    estimatedMinutes: 25,
    contentMarkdown: `### 1. The CIA Triad & Security Controls
- **Confidentiality** (prevent unauthorized reading): Encryption at rest (AES-256) & in transit (TLS 1.3), strict access control.
- **Integrity** (prevent unauthorized modification): Cryptographic hashes (SHA-256), HMAC, Digital Signatures, audit logs.
- **Availability** (ensure authorized access on demand): Redundancy, Load Balancing, DDoS protection, tested backups.

### 2. Authentication (AuthN) vs Authorization (AuthZ)
- **AuthN** verifies *who* you are (passwords + MFA, OAuth2/OIDC, WebAuthn).
- **AuthZ** verifies *what* you may access (RBAC, ABAC, Object-Level ownership checks).
- **Common Exam Trap — IDOR / BOLA**: Checking only \`isLoggedIn\` without verifying \`record.ownerId === session.userId\` lets any logged-in user access other users' data by changing an ID parameter.

### 3. Defense-in-Depth & Network Zones
- Place public web servers in a **DMZ**, never directly beside internal databases.
- **IDS** detects and alerts passively; **IPS** sits inline and actively blocks malicious traffic.
- **Incident Response Lifecycle (NIST)**: Preparation → Detection & Analysis → Containment → Eradication → Recovery → Post-Incident Lessons Learned.`,
    workedExample: `**TOPCIT Worked Example:**
A student portal leaks private grade records when a logged-in user requests \`GET /api/grades/2025-9999\`.
1. **Vulnerability**: Broken Object Level Authorization (BOLA / IDOR) — failure of Authorization, not Authentication.
2. **Immediate Fix**: Derive the allowed student ID strictly from the server-side verified session/JWT \`sub\` claim (or verify \`role === 'ADVISOR' && advises(user, studentId)\`) before querying the DB.
3. **Defense-in-Depth**: Add centralized authorization middleware, least-privilege DB roles, and anomaly logging for sequential ID enumeration.`,
    glossary: [
      { term: 'CIA Triad', definition: 'Confidentiality, Integrity, and Availability — the three foundational pillars of information security.' },
      { term: 'BOLA / IDOR', definition: 'Broken Object Level Authorization / Insecure Direct Object Reference: accessing another user’s resource by manipulating an object identifier without server-side ownership checks.' },
      { term: 'DMZ (Demilitarized Zone)', definition: 'A segmented perimeter subnet hosting externally exposed services so a compromised public server cannot directly reach internal databases.' },
      { term: 'Principle of Least Privilege', definition: 'Granting every user, service, and database account strictly the minimum permissions needed to perform its function.' },
    ],
    references: [
      { label: 'Official TOPCIT Syllabus M3.4', url: 'https://www.topcit.or.kr/introduction/syllabus.do' },
      { label: 'CHED 04 Information Security Reviewer (Foundational)', url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/04-security-TOPCIT.pdf' },
    ],
  },
  {
    id: 'lesson-m3-crypto-owasp',
    domain: 'M3',
    topicId: 'M3-SEC-TECH',
    title: 'Applied Cryptography (TLS, PKI, Hashing) & OWASP Secure Coding',
    summary:
      'Distinguish symmetric vs asymmetric crypto, digital signatures, password KDFs, and primary defenses against SQLi, XSS, and CSRF.',
    estimatedMinutes: 30,
    contentMarkdown: `### 1. Cryptographic Primitives Cheatsheet
- **Symmetric Encryption (AES-256-GCM, ChaCha20-Poly1305)**: Same secret key encrypts & decrypts; ultra-fast for bulk data. Never use **ECB** mode (leaks patterns).
- **Asymmetric Encryption (RSA, ECC/ECDHE)**: Public/Private key pair.
  - *Confidentiality*: Encrypt with **Recipient’s Public Key** → decrypt with **Recipient’s Private Key**.
  - *Digital Signature (Integrity + Non-Repudiation)*: Sign hash with **Sender’s Private Key** → verify with **Sender’s Public Key**.
- **TLS 1.3 Hybrid Flow**: Asymmetric handshake (certificate verification + ECDHE key exchange for forward secrecy) → switches to fast symmetric AEAD (AES-GCM) for session data.
- **Password Storage**: NEVER use plain MD5/SHA-256. Always use a **unique per-user cryptographic salt + slow memory-hard KDF (Argon2id, bcrypt, or scrypt)**.

### 2. OWASP Big Three (Memorize Exact Primary Defenses)
- **SQL Injection (SQLi)** → **Parameterized Queries / Prepared Statements** (separates SQL grammar from user data).
- **Cross-Site Scripting (XSS)** → **Context-Aware Output Encoding** + **Content-Security-Policy (CSP)** + \`HttpOnly\` session cookies.
- **Cross-Site Request Forgery (CSRF)** → **SameSite=Lax/Strict cookies** + unpredictable **Anti-CSRF synchronizer token**.`,
    workedExample: `**TOPCIT Worked Example:**
Why is \`SHA256(password)\` insecure even though SHA-256 is cryptographically collision-resistant?
- **Reason 1 (No Salt)**: Identical passwords produce identical hashes and are instantly cracked via precomputed rainbow tables.
- **Reason 2 (Too Fast)**: SHA-256 is engineered for speed (billions of hashes/sec on modern GPUs), making offline brute force trivial.
- **Correct Solution**: Use **Argon2id** (or bcrypt) with a unique 128-bit random salt per user.`,
    glossary: [
      { term: 'AEAD (Authenticated Encryption)', definition: 'Encryption mode (e.g., AES-GCM) that simultaneously guarantees confidentiality and ciphertext integrity/authenticity.' },
      { term: 'Digital Signature', definition: 'Signing a message hash with the sender’s private key to prove integrity and non-repudiation.' },
      { term: 'Parameterized Query', definition: 'Database query mechanism where user inputs are bound strictly as typed values, preventing SQL Injection.' },
      { term: 'Argon2id', definition: 'Modern memory-hard Key Derivation Function recommended for secure password hashing.' },
    ],
    references: [
      { label: 'Official TOPCIT Syllabus M3.5', url: 'https://www.topcit.or.kr/introduction/syllabus.do' },
      { label: 'CHED 04 Information Security Reviewer (Foundational)', url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/04-security-TOPCIT.pdf' },
    ],
  },
  {
    id: 'lesson-m3-os-net-arch',
    domain: 'M3',
    topicId: 'M3-ARCH',
    title: 'Operating Systems, CIDR Networking & High-Availability Cloud Architecture',
    summary:
      'Master deadlock conditions, virtual memory thrashing, IPv4 CIDR subnet math, CAP theorem, and eliminating Single Points of Failure (SPOF).',
    estimatedMinutes: 25,
    contentMarkdown: `### 1. Operating Systems Essentials
- **Deadlock (4 Coffman Conditions)**: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait. Breaking *any one* prevents deadlock (e.g., global lock ordering breaks Circular Wait).
- **Thrashing**: Occurs when active processes’ working sets exceed physical RAM, causing constant page faults. Fix by adding RAM or lowering multiprogramming degree.

### 2. Fast CIDR Subnetting Formula
- Host bits: \`h = 32 - prefix\`
- Total IP addresses: \`2^h\`
- Usable host addresses (for prefix <= /30): \`2^h - 2\` (subtract network address and broadcast address).
- Example: \`/26\` → \`h = 6\` → \`64\` total, \`62\` usable hosts.

### 3. Distributed Systems & Cloud HA
- **CAP Theorem**: During a Network Partition (**P**), distributed stores must trade off **Consistency (CP)** vs **Availability (AP)**.
- **Eliminating SPOFs**: Use redundant active-passive/active-active Load Balancers, stateless horizontally scaled app servers, and Primary + Standby multi-AZ databases.`,
    workedExample: `**TOPCIT Worked Example:**
An organization needs 45 usable host IPs for a secure database subnet. What is the tightest IPv4 CIDR prefix?
- Check \`/27\`: \`h = 5\` → \`2^5 - 2 = 30\` usable hosts (too small).
- Check \`/26\`: \`h = 6\` → \`2^6 - 2 = 62\` usable hosts (sufficient).
- **Answer**: \`/26\` (subnet mask \`255.255.255.192\`).`,
    glossary: [
      { term: 'Coffman Conditions', definition: 'The four simultaneous conditions required for deadlock: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.' },
      { term: 'CIDR', definition: 'Classless Inter-Domain Routing: variable-length subnet prefix notation like /24 or /26.' },
      { term: 'CAP Theorem', definition: 'Under network partition (P), a distributed system can guarantee either Consistency (C) or Availability (A), not both.' },
      { term: 'SPOF', definition: 'Single Point of Failure: any un-replicated component whose failure brings down the entire system.' },
    ],
    references: [
      { label: 'Official TOPCIT Syllabus M3.1–M3.3', url: 'https://www.topcit.or.kr/introduction/syllabus.do' },
    ],
  },

  // --- M1 SOFTWARE DEVELOPMENT (365 pts — Highest 2026 Weight!) ---
  {
    id: 'lesson-m1-algorithms-complexity',
    domain: 'M1',
    topicId: 'M1-ALG',
    title: 'Algorithms, Complexity, Graph Traversal & Sliding Windows',
    summary:
      'M1 carries 365/1,000 points. Master Big-O analysis, sorting trade-offs, BFS/DFS/Dijkstra, cycle detection, and O(N) sliding-window queues.',
    estimatedMinutes: 30,
    contentMarkdown: `### 1. Sorting & Data Structure Trade-Offs
- **Merge Sort**: Guaranteed \`O(n log n)\` worst-case, **stable**, requires \`O(n)\` auxiliary space.
- **Quick Sort**: \`O(n log n)\` average in-place, \`O(n^2)\` worst-case on bad pivots, unstable.
- **Hash Tables**: \`O(1)\` average lookup; linear probing suffers **primary clustering** as load factor rises past ~0.75.

### 2. Graph Algorithms Selection Guide
- **Unweighted shortest path** → **BFS** (\`O(V + E)\`)
- **Non-negative weighted shortest path** → **Dijkstra** with min-heap (\`O((V+E) log V)\`)
- **Directed Cycle Detection / Prerequisites** → **3-State DFS** (0=unvisited, 1=visiting, 2=visited) OR **Kahn’s Topological Sort** (in-degree queue). Never use a 1-set \`visited\` check on directed graphs — it misclassifies diamond DAGs as cycles!

### 3. Sliding-Window Rate Limiting Pattern
- Maintain a per-key \`deque\` of valid timestamps.
- Evict timestamps strictly older than \`t - window + 1\` from the left.
- Each event enters and leaves the deque at most once → **O(N) total time**.`,
    workedExample: `**TOPCIT Worked Example:**
Why does a single \`visited\` set fail on DAG edges \`0->1, 0->2, 1->3, 2->3\`?
- DFS explores \`0 -> 1 -> 3\` and marks \`3\` visited.
- When DFS later explores \`0 -> 2 -> 3\`, seeing \`3 in visited\` falsely reports a cycle!
- **Fix**: Mark \`3\` as \`state = 1 (visiting)\` on entry and \`state = 2 (done)\` on exit. Only an edge to \`state == 1\` is a real cycle.`,
    glossary: [
      { term: 'Primary Clustering', definition: 'Contiguous runs of occupied slots formed by linear probing in open-addressed hash tables.' },
      { term: 'Topological Sort', definition: 'Linear ordering of vertices in a Directed Acyclic Graph (DAG) such that every edge u->v puts u before v.' },
      { term: 'Optimal Substructure', definition: 'Property where an optimal solution can be constructed from optimal solutions of subproblems.' },
    ],
    references: [
      { label: 'Official TOPCIT Syllabus M1.2', url: 'https://www.topcit.or.kr/introduction/syllabus.do' },
      { label: 'CHED 01 Software Reviewer (Foundational)', url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/01-Software-TOPCIT.pdf' },
    ],
  },
  {
    id: 'lesson-m1-uml-solid-patterns',
    domain: 'M1',
    topicId: 'M1-UML',
    title: 'UML Modeling (Class, Activity, Use Case, Sequence) & SOLID Patterns',
    summary:
      'Essential for M1 practical diagram tasks (50–80 pts): exact UML arrow semantics, multiplicities, SOLID refactoring, and Strategy/DI patterns.',
    estimatedMinutes: 30,
    contentMarkdown: `### 1. UML Relationship Cheatsheet (High-Frequency Exam Traps)
- **Composition (Filled Diamond ◆)**: Strong lifecycle ownership (deleting \`Order\` destroys \`OrderLine\`).
- **Aggregation (Hollow Diamond ◇)**: Weak containment (\`Professor\` outlives \`Department\`).
- **Inheritance / Generalization (Solid line + Hollow Triangle)**: \`Dog\` extends \`Animal\`.
- **Realization (Dashed line + Hollow Triangle)**: \`StripeGateway\` implements \`PaymentGateway\`.
- **Use Case \`<<include>>\`**: Base ──▶ Mandatory sub-use-case (always runs).
- **Use Case \`<<extend>>\`**: Optional extension ──▶ Base (runs conditionally).

### 2. SOLID Principles in Practice
- **S (Single Responsibility)**: One cohesive reason to change per class/module.
- **O (Open/Closed)**: Open for extension, closed for modification (solve growing \`if/else\` chains with **Strategy Pattern**).
- **D (Dependency Inversion)**: Depend on interfaces/abstractions injected via constructor so modules are unit-testable with mocks/stubs.`,
    workedExample: `**TOPCIT Worked Example:**
In a UML Activity Diagram for Course Enrollment:
1. Always begin with a single **Initial Node** (filled black circle).
2. Every **Decision Diamond** must have mutually exclusive guarded branches (e.g., \`[Prerequisites Met]\` / \`[Missing Prereqs]\`).
3. Ensure every branch reaches an **Activity Final** (bullseye) or **Flow Final** node — never leave dangling dead-end actions.`,
    glossary: [
      { term: 'Composition', definition: 'Strong UML whole-part relationship (filled diamond) where parts cannot exist independently of the whole.' },
      { term: 'Dependency Inversion (DIP)', definition: 'High-level modules depend on abstractions/interfaces rather than concrete low-level implementations.' },
      { term: 'Strategy Pattern', definition: 'Behavioral pattern encapsulating interchangeable algorithms behind a shared interface.' },
    ],
    references: [
      { label: 'Official TOPCIT Syllabus M1.4', url: 'https://www.topcit.or.kr/introduction/syllabus.do' },
      { label: 'CHED 01 Software Reviewer (Foundational)', url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/01-Software-TOPCIT.pdf' },
    ],
  },
  {
    id: 'lesson-m1-testing-ai',
    domain: 'M1',
    topicId: 'M1-TEST',
    title: 'Software Testing (BVA, Cyclomatic Complexity) & Applied AI Engineering',
    summary:
      'Master black-box Boundary Value Analysis, white-box McCabe Complexity V(G), Precision vs Recall, overfitting controls, and RAG vs Fine-Tuning.',
    estimatedMinutes: 25,
    contentMarkdown: `### 1. Black-Box & White-Box Testing Formulas
- **2-Value Boundary Value Analysis (BVA)**: For valid range \`[min, max]\`, test \`{min-1, min, max, max+1}\`.
- **McCabe Cyclomatic Complexity**: \`V(G) = P + 1\` (where \`P\` = number of binary decision predicates like \`if\`, \`while\`, \`for\`, \`&&\`, \`||\`), giving the minimum number of linearly independent paths for 100% branch coverage.
- **Verification vs Validation**: Verification = *"building the product right"* (matches SRS); Validation = *"building the right product"* (satisfies user needs).

### 2. Applied AI in 2026 Software Engineering
- **Recall** = \`TP / (TP + FN)\` — prioritize when False Negatives are costly (medical/fraud/security alerts).
- **Precision** = \`TP / (TP + FP)\` — prioritize when False Positives are costly (spam blocking).
- **RAG vs Fine-Tuning**: Use **RAG** for frequently updated knowledge requiring verifiable page citations; use fine-tuning primarily for domain style/format adaptation.`,
    workedExample: `**TOPCIT Worked Example:**
A discount rule applies for order quantities \`10 <= qty <= 500\`.
- **2-Value BVA Inputs**: \`{9, 10, 500, 501}\`.
- **Equivalence Partitions**: Invalid low (\`<= 9\`), Valid (\`10..500\`), Invalid high (\`>= 501\`).`,
    glossary: [
      { term: 'Cyclomatic Complexity', definition: 'Metric V(G) = P + 1 counting linearly independent execution paths through a control-flow graph.' },
      { term: 'RAG', definition: 'Retrieval-Augmented Generation: grounding LLM responses in dynamically retrieved, citable source chunks.' },
      { term: 'Recall (Sensitivity)', definition: 'Fraction of actual positive instances correctly identified: TP / (TP + FN).' },
    ],
    references: [
      { label: 'Official TOPCIT Syllabus M1.3 & M1.5', url: 'https://www.topcit.or.kr/introduction/syllabus.do' },
    ],
  },

  // --- M2 DATA MANAGEMENT (265 pts) ---
  {
    id: 'lesson-m2-normalization-erd',
    domain: 'M2',
    topicId: 'M2-MODEL',
    title: 'ER Modeling, Functional Dependencies & Normalization (1NF to BCNF)',
    summary:
      'Turn your solid 2025 Data foundation (52/145) into top M2 scores by mastering Crow’s Foot ERDs, anomalies, 2NF/3NF/BCNF decomposition, and safe denormalization.',
    estimatedMinutes: 25,
    contentMarkdown: `### 1. Normal Forms Progression
- **1NF**: Atomic scalar values in every column, no repeating groups.
- **2NF**: In 1NF + no **partial dependency** (no non-key attribute depends on only *part* of a composite primary key).
- **3NF**: In 2NF + no **transitive dependency** (\`PK -> A -> B\` where \`A\` is non-key).
- **BCNF**: For EVERY non-trivial functional dependency \`X -> Y\`, determinant \`X\` MUST be a superkey.

### 2. M:N Decomposition & Practical Denormalization
- Always resolve **M:N** relationships via an **associative (junction) table** with FKs to both parent tables + unique composite constraint when duplicates are forbidden.
- **Controlled Denormalization**: Storing \`unit_price_at_sale\` inside \`OrderItem\` is intentional and correct so historical invoices never mutate when catalog prices change.`,
    workedExample: `**TOPCIT Worked Example:**
Given \`Enrollment(student_id, course_id, course_title, dept_id, dept_name)\` with PK \`(student_id, course_id)\`:
1. \`course_id -> course_title, dept_id\` is a **partial dependency** (violates 2NF).
2. \`dept_id -> dept_name\` is a **transitive dependency** (violates 3NF).
3. **3NF Schema**: \`Department(dept_id PK, dept_name)\`, \`Course(course_id PK, course_title, dept_id FK)\`, \`Enrollment(student_id PK/FK, course_id PK/FK)\`.`,
    glossary: [
      { term: 'Partial Dependency', definition: 'A non-prime attribute depending on a proper subset of a composite candidate key (violates 2NF).' },
      { term: 'BCNF', definition: 'Boyce-Codd Normal Form: every determinant of a non-trivial functional dependency must be a superkey.' },
      { term: 'Associative Entity', definition: 'Junction table decomposing a Many-to-Many relationship into two One-to-Many relationships.' },
    ],
    references: [
      { label: 'Official TOPCIT Syllabus M2.2', url: 'https://www.topcit.or.kr/introduction/syllabus.do' },
      { label: 'CHED 02 Database Reviewer (Foundational)', url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/02-Database-TOPCIT.pdf' },
    ],
  },
  {
    id: 'lesson-m2-sql-indexing-tx',
    domain: 'M2',
    topicId: 'M2-SQL',
    title: 'Complex SQL, ACID Isolation, WAL Recovery & B-Tree Indexing',
    summary:
      'Avoid classic SQL exam traps (LEFT JOIN + WHERE, COUNT(*) vs COUNT(col), non-SARGable functions) and master transaction isolation & composite indexes.',
    estimatedMinutes: 30,
    contentMarkdown: `### 1. Logical SQL Execution Order
\`FROM / JOIN\` → \`WHERE\` → \`GROUP BY\` → \`HAVING\` → \`SELECT\` → \`DISTINCT\` → \`ORDER BY\` → \`LIMIT\`.
- Filter individual rows in **WHERE**; filter grouped aggregates in **HAVING**.
- In a **LEFT JOIN**, conditions on the right table MUST go in \`ON\`, not \`WHERE\`, or NULL rows vanish!
- Use \`COUNT(right.id)\` (ignores NULLs), not \`COUNT(*)\`, when counting matched child rows in a LEFT JOIN.

### 2. B-Tree Composite Indexes & SARGability
- Composite index \`(a, b, c)\` follows the **Leftmost Prefix Rule**: usable for \`(a)\`, \`(a, b)\`, \`(a, b, c)\`, NOT \`(b, c)\` alone.
- Put **equality columns before range columns** in composite indexes.
- Never wrap an indexed column in a function (\`YEAR(created_at) = 2026\`) — rewrite as a SARGable range (\`created_at >= '2026-01-01' AND created_at < '2027-01-01'\`).

### 3. ACID Isolation Levels
- **Dirty Read**: Reading uncommitted data (prevented by \`READ COMMITTED\`).
- **Non-Repeatable Read**: Row changes between two reads in same TX (prevented by \`REPEATABLE READ\`).
- **Phantom Read**: New rows appear in a range query (prevented by \`SERIALIZABLE\`).`,
    workedExample: `**TOPCIT Worked Example:**
Compute credit-weighted GPA per department with at least 3.20 GPA:
\`\`\`sql
SELECT d.dept_name,
       COUNT(DISTINCT s.student_id) AS student_count,
       ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) AS weighted_gpa
FROM departments d
JOIN students s ON s.dept_id = d.dept_id
JOIN enrollments e ON e.student_id = s.student_id
GROUP BY d.dept_id, d.dept_name
HAVING ROUND(SUM(e.credits * e.grade_points) * 1.0 / SUM(e.credits), 2) >= 3.20
ORDER BY weighted_gpa DESC, d.dept_name ASC;
\`\`\``,
    glossary: [
      { term: 'SARGable', definition: 'Search ARGument-able: a SQL predicate written so the query optimizer can perform a fast index seek.' },
      { term: 'Leftmost Prefix Rule', definition: 'B-Tree composite index lookup rule requiring predicates to match leading index columns from left to right.' },
      { term: 'WAL (Write-Ahead Logging)', definition: 'Durability/atomicity mechanism writing redo/undo log entries to disk before modifying data pages.' },
    ],
    references: [
      { label: 'Official TOPCIT Syllabus M2.3 & M2.4', url: 'https://www.topcit.or.kr/introduction/syllabus.do' },
      { label: 'CHED 02 Database Reviewer (Foundational)', url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/02-Database-TOPCIT.pdf' },
    ],
  },

  // --- M4 IT BUSINESS (135 pts) ---
  {
    id: 'lesson-m4-strategy-ethics',
    domain: 'M4',
    topicId: 'M4-ETHICS',
    title: 'IT Business Strategy, OSS Licensing & Data Privacy Law',
    summary:
      'High-priority remediation for your 2025 IT Business & Ethics score (20/95). Master SWOT, ERP/CRM, ROI/TCO, GPL vs MIT/Apache, and privacy principles.',
    estimatedMinutes: 25,
    contentMarkdown: `### 1. Strategy & Enterprise Systems
- **SWOT**: SO (offensive growth), ST (use strength to counter threat), WO (fix weakness via opportunity), WT (defensive).
- **ERP** (internal backbone: finance/HR/inventory) vs **CRM** (customer lifecycle/sales) vs **SCM** (external suppliers/logistics).
- **ROI** = \`((Total Benefit - Total Cost) / Total Cost) × 100%\`.
- **TCO**: Lifecycle cost = acquisition + migration + operations + staffing + security/compliance + retirement.

### 2. Software IP, OSS Licenses & Privacy Law
- **Copyright** protects concrete expression (source code/docs), NOT abstract ideas/algorithms.
- **Permissive OSS (MIT, BSD, Apache 2.0)**: Allows commercial closed-source distribution with attribution notices.
- **Strong Copyleft (GNU GPL / AGPL)**: Distributing derivative works requires releasing derivative source code under GPL.
- **Data Privacy Core Principles**: Data Minimization, Purpose Limitation, Storage Limitation (TTL retention), Informed Consent, and Breach Notification.`,
    workedExample: `**TOPCIT Worked Example:**
A SaaS team bundles a GPL-v3 library inside an on-premises enterprise binary distributed to paying customers.
- **Risk**: Violates GPL-v3 copyleft terms unless the company discloses its proprietary backend source code.
- **Fix**: Replace with an MIT/Apache-2.0 library (or purchase a commercial license) and enforce automated SBOM/license scanning in CI/CD.`,
    glossary: [
      { term: 'Strong Copyleft (GPL)', definition: 'Open-source license requiring distributed derivative works to be licensed under the same open-source terms.' },
      { term: 'Data Minimization', definition: 'Privacy principle restricting personal data collection strictly to what is necessary for the declared purpose.' },
      { term: 'TCO', definition: 'Total Cost of Ownership: complete lifecycle direct and indirect expenses of owning and operating an IT system.' },
    ],
    references: [
      { label: 'Official TOPCIT Syllabus M4.1 & M4.4', url: 'https://www.topcit.or.kr/introduction/syllabus.do' },
      { label: 'CHED 05 IT Business Reviewer (Foundational)', url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/05-Business-TOPCIT.pdf' },
    ],
  },
  {
    id: 'lesson-m4-pm-evm-comm',
    domain: 'M4',
    topicId: 'M4-PM',
    title: 'IT Project Management (WBS, CPM, EVM) & Technical Communication',
    summary:
      'Consolidate your strongest 2025 area (35/80) with exact EVM formulas (CPI/SPI), Critical Path float, Crashing vs Fast Tracking, and crisp SRS/SLA writing.',
    estimatedMinutes: 20,
    contentMarkdown: `### 1. Earned Value Management (EVM) Formulas
- **SPI (Schedule Performance Index)** = \`EV / PV\` (\`< 1.0\` behind schedule; \`> 1.0\` ahead).
- **CPI (Cost Performance Index)** = \`EV / AC\` (\`< 1.0\` over budget; \`> 1.0\` under budget).
- **SV** = \`EV - PV\`; **CV** = \`EV - AC\`.

### 2. Schedule & Scope Control
- **WBS 100% Rule**: Captures 100% of in-scope deliverables and zero out-of-scope work.
- **Critical Path**: Longest duration path (Total Float = \`0\`). Any delay on the critical path delays the whole project.
- **Crashing** = add resources/cost to critical-path tasks; **Fast Tracking** = overlap sequential tasks (adds rework risk).

### 3. Technical Communication & Procurement Docs
- **Functional Requirement**: What the system does. **Non-Functional Requirement (NFR)**: Measurable quality threshold (e.g., \`p95 <= 250ms\`, \`99.9% uptime\`).
- **RFP** (solicit vendor proposals) vs **SLA** (contractual uptime/response targets and penalties).`,
    workedExample: `**TOPCIT Worked Example:**
Given \`PV = $400k\`, \`EV = $320k\`, \`AC = $440k\`:
- \`SPI = 320 / 400 = 0.80\` (20% behind schedule, \`SV = -$80k\`).
- \`CPI = 320 / 440 = 0.73\` (over budget, \`CV = -$120k\`).
- Recovery with fixed legal deadline: apply MoSCoW scope triage (defer non-mandatory features to Phase 2) and selectively fast-track/crash critical-path compliance tasks with executive sign-off.`,
    glossary: [
      { term: 'CPI (Cost Performance Index)', definition: 'EV / AC: value earned per dollar spent (< 1.0 means over budget).' },
      { term: 'SPI (Schedule Performance Index)', definition: 'EV / PV: schedule efficiency (< 1.0 means behind schedule).' },
      { term: 'SLA', definition: 'Service Level Agreement specifying measurable availability, latency, and incident response commitments.' },
    ],
    references: [
      { label: 'Official TOPCIT Syllabus M4.2 & M4.3', url: 'https://www.topcit.or.kr/introduction/syllabus.do' },
      { label: 'CHED 05 IT Business Reviewer (Foundational)', url: 'https://phlconnect.ched.gov.ph/admin/uploads/add217938e07bb1fd8796e0315b88c10/05-Business-TOPCIT.pdf' },
    ],
  },
];
