import type { Question } from '@/domain/schemas';

const BASE_META = {
  domain: 'M3' as const,
  sourceClassification: 'original_practice' as const,
  contentVersion: '2026.1.0',
  reviewStatus: 'verified' as const,
  mockSetId: 'mock-2026-set-1',
};

/**
 * M3 — Systems Architecture and Information Security
 * Exact 2026 Blueprint Allocation:
 * - 15 MCQ x 5 = 75 pts
 * - 1 Descriptive x 30 = 30 pts
 * - 1 Standard Performance x 50 = 50 pts
 * - 1 Integrated Performance x 80 = 80 pts
 * Total: 18 questions, 235 points
 */
export const M3_QUESTIONS: Question[] = [
  // --- 15 MCQs (5 pts each = 75 pts) ---
  {
    ...BASE_META,
    id: 'M3-MCQ-01',
    title: 'Deadlock Necessary Conditions (Coffman Conditions)',
    prompt:
      'Which four conditions must ALL hold simultaneously for a resource deadlock to occur in an operating system?',
    topicId: 'M3-OS',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait' },
      { id: 'B', text: 'Mutual Exclusion, Preemption, Paging, Starvation' },
      { id: 'C', text: 'Concurrency, Multithreading, Caching, Thrashing' },
      { id: 'D', text: 'Hold and Wait, Time Slicing, Semaphores, Virtual Memory' },
    ],
    correctOptionId: 'A',
    explanation:
      'Coffman’s four necessary conditions for deadlock are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Breaking any one condition prevents deadlock.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.1 — Operating Systems' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-02',
    title: 'Virtual Memory Page Replacement & Thrashing',
    prompt:
      'A Linux application server suddenly spends 95% of CPU time swapping pages between RAM and disk while effective throughput collapses. What OS condition is occurring and what is the primary fix?',
    topicId: 'M3-OS',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Cache coherence failure; disable CPU L1 cache.' },
      { id: 'B', text: 'Thrashing because the combined working set exceeds physical RAM; reduce degree of multiprogramming or add physical memory.' },
      { id: 'C', text: 'Interrupt starvation; switch from preemptive to FCFS scheduling.' },
      { id: 'D', text: 'Pipeline hazard; increase virtual swap file size indefinitely.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Thrashing happens when active processes require more frames than physical RAM provides, causing continuous page faults. Expanding RAM or reducing concurrent working-set memory resolves it.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.1 — Virtual Memory' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-03',
    title: 'IPv4 CIDR Subnetting — Usable Hosts',
    prompt:
      'A branch office is allocated the IPv4 subnet `192.168.40.0/26`. How many total IP addresses and how many usable host addresses are available in this subnet?',
    topicId: 'M3-NET',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: '64 total addresses, 62 usable hosts' },
      { id: 'B', text: '32 total addresses, 30 usable hosts' },
      { id: 'C', text: '128 total addresses, 126 usable hosts' },
      { id: 'D', text: '64 total addresses, 64 usable hosts' },
    ],
    correctOptionId: 'A',
    explanation:
      'A `/26` prefix leaves `32 - 26 = 6` host bits: `2^6 = 64` total addresses. Subtracting the network address (.0) and broadcast address (.63) leaves 62 usable host addresses.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.2 — Networking & CIDR' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-04',
    title: 'TCP vs UDP Protocol Selection',
    prompt:
      'For real-time live video conferencing where low latency matters more than retransmitting an already-expired audio/video frame, which transport layer protocol is typically preferred alongside application-level RTP?',
    topicId: 'M3-NET',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'TCP because of strict in-order head-of-line retransmission' },
      { id: 'B', text: 'UDP because it avoids handshake/retransmission latency overhead' },
      { id: 'C', text: 'ARP because it resolves MAC addresses directly' },
      { id: 'D', text: 'ICMP because it carries streaming media' },
    ],
    correctOptionId: 'B',
    explanation:
      'UDP is connectionless and avoids TCP’s retransmission delays and head-of-line blocking, making it ideal for real-time VoIP/video (RTP/WebRTC) and DNS lookups.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.2 — Transport Protocols' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-05',
    title: 'Cloud Service Models (IaaS vs PaaS vs SaaS)',
    prompt:
      'Under the Cloud Shared Responsibility Model, which service model makes the cloud provider responsible for managing the underlying OS patching, runtime environment, and auto-scaling while the customer deploys only application code and data?',
    topicId: 'M3-ARCH',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'IaaS (Infrastructure as a Service)' },
      { id: 'B', text: 'PaaS (Platform as a Service)' },
      { id: 'C', text: 'On-Premises Bare Metal' },
      { id: 'D', text: 'Colocation Hosting' },
    ],
    correctOptionId: 'B',
    explanation:
      'In PaaS (e.g., Cloud Run, App Engine, Elastic Beanstalk), the provider manages hardware, virtualization, OS, and runtime, while the customer focuses on application code and data.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.3 — Cloud Architecture' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-06',
    title: 'CAP Theorem in Distributed Systems',
    prompt:
      'According to the CAP theorem, when a network partition (P) occurs between two geographically separated database replicas, what fundamental trade-off must a distributed datastore make?',
    topicId: 'M3-ARCH',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Choose between Encryption and Compression.' },
      { id: 'B', text: 'Choose between strong Consistency (rejecting or blocking writes on partitioned nodes) and Availability (serving potentially stale reads/writes).' },
      { id: 'C', text: 'Guarantee Consistency, Availability, and Partition Tolerance simultaneously.' },
      { id: 'D', text: 'Shut down all nodes permanently.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Because network partitions are unavoidable in distributed networks, systems must choose CP (preserve consistency by refusing/blocking operations during partition) or AP (remain available while tolerating temporary divergence).',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.3 — Distributed Systems' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-07',
    title: 'High Availability — Active-Active & SPOF Elimination',
    prompt:
      'A web platform runs 4 stateless application servers behind a SINGLE load balancer connected to a primary-replica database. Which component currently represents a Single Point of Failure (SPOF)?',
    topicId: 'M3-ARCH',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'The 4 stateless application servers' },
      { id: 'B', text: 'The single un-replicated load balancer' },
      { id: 'C', text: 'Static assets served via a global CDN' },
      { id: 'D', text: 'The read replica database' },
    ],
    correctOptionId: 'B',
    explanation:
      'Even with 4 redundant app servers, a single load balancer instance with no active-passive/active-active failover will take down all inbound traffic if it fails.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.3 — Reliability & HA' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-08',
    title: 'CIA Triad Mapping to Security Controls',
    prompt:
      'An attacker alters invoice dollar amounts stored in transit without authorization, even though the payload was readable. Which core property of the CIA triad was directly compromised, and which cryptographic control specifically detects tampering?',
    topicId: 'M3-SEC-FUND',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Availability; DDoS scrubbing' },
      { id: 'B', text: 'Integrity; HMAC or Digital Signature' },
      { id: 'C', text: 'Confidentiality; Base64 encoding' },
      { id: 'D', text: 'Availability; RAID-0 striping' },
    ],
    correctOptionId: 'B',
    explanation:
      'Unauthorized modification violates Integrity. HMAC (keyed cryptographic hash) or asymmetric Digital Signatures detect any bit-level tampering.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.4 — CIA Triad' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-09',
    title: 'Authentication vs Authorization & Principle of Least Privilege',
    prompt:
      'A logged-in student successfully changes the URL from `/api/grades/student-101` to `/api/grades/student-102` and views another student’s private grades. Which vulnerability class is this?',
    topicId: 'M3-SEC-FUND',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Broken Object Level Authorization (BOLA / IDOR)' },
      { id: 'B', text: 'Buffer Overflow' },
      { id: 'C', text: 'DNS Cache Poisoning' },
      { id: 'D', text: 'Man-in-the-Middle ARP Spoofing' },
    ],
    correctOptionId: 'A',
    explanation:
      'Authentication succeeded (the user logged in), but server-side Authorization failed to check whether the authenticated user owns resource `student-102` (OWASP API1 / Broken Access Control / IDOR).',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.4 & M3.5 — Access Control' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-10',
    title: 'Hybrid Cryptography in TLS 1.3',
    prompt:
      'Why does HTTPS (TLS) use asymmetric cryptography (e.g., ECDHE / RSA) during the handshake and then switch to symmetric cryptography (e.g., AES-256-GCM) for bulk data transfer?',
    topicId: 'M3-SEC-TECH',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Symmetric encryption cannot protect confidentiality.' },
      { id: 'B', text: 'Asymmetric cryptography solves key exchange and server authentication without a pre-shared secret, while symmetric AEAD encryption is orders of magnitude faster for bulk payload traffic.' },
      { id: 'C', text: 'Asymmetric encryption is faster than AES.' },
      { id: 'D', text: 'TLS does not use symmetric encryption.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Hybrid encryption combines the best of both worlds: asymmetric PKI/ECDHE securely establishes an ephemeral session key (with forward secrecy), and AES-GCM/ChaCha20-Poly1305 encrypts traffic at line speed.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.5 — Cryptography & TLS' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-11',
    title: 'Digital Signatures & Non-Repudiation',
    prompt:
      'Alice wants to send a signed contract to Bob so Bob can verify both Integrity and Non-Repudiation (proving Alice created it). Which keys are used to SIGN and to VERIFY the digital signature?',
    topicId: 'M3-SEC-TECH',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Alice signs the message hash with Bob’s public key; Bob verifies with Bob’s private key.' },
      { id: 'B', text: 'Alice signs the message hash with Alice’s private key; Bob verifies with Alice’s public key.' },
      { id: 'C', text: 'Alice signs with a shared AES key; Bob verifies with MD5.' },
      { id: 'D', text: 'Alice signs with Alice’s public key; Bob verifies with Alice’s private key.' },
    ],
    correctOptionId: 'B',
    explanation:
      'A digital signature encrypts/signs the cryptographic digest using the sender’s PRIVATE key. Anyone with the sender’s authentic PUBLIC key (via X.509 certificate) can verify it, establishing integrity and non-repudiation.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.5 — PKI & Digital Signatures' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-12',
    title: 'Secure Password Storage',
    prompt:
      'Which password storage approach provides strong protection against rainbow tables and offline GPU brute-force attacks if the user database is leaked?',
    topicId: 'M3-SEC-TECH',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Encrypting passwords with a single global AES key stored in source code' },
      { id: 'B', text: 'Plain SHA-256 hash without salt' },
      { id: 'C', text: 'Per-user cryptographic random salt + slow memory-hard KDF (Argon2id or bcrypt/scrypt)' },
      { id: 'D', text: 'MD5 hash reversed twice' },
    ],
    correctOptionId: 'C',
    explanation:
      'Unique per-user salts defeat rainbow tables and identical-password detection, while memory-hard slow KDFs (Argon2id, bcrypt, scrypt) drastically throttle offline GPU cracking compared to fast hashes like SHA-256 or MD5.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.5 — Password Security' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-13',
    title: 'Preventing SQL Injection (Primary Defense)',
    prompt:
      'Which coding practice is the PRIMARY, most reliable defense against SQL Injection in application database layers?',
    topicId: 'M3-SEC-TECH',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Blocking the keyword "SELECT" using a client-side JavaScript regex' },
      { id: 'B', text: 'Parameterized queries / Prepared Statements separating SQL syntax from bound user data' },
      { id: 'C', text: 'Hiding database error messages while still concatenating user strings into SQL' },
      { id: 'D', text: 'Encoding SQL statements with Base64 before concatenating' },
    ],
    correctOptionId: 'B',
    explanation:
      'Parameterized queries bind user input strictly as data values rather than executable SQL tokens, neutralizing injection payloads regardless of special characters.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.5 — Secure Coding (OWASP)' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-14',
    title: 'XSS vs CSRF Mitigation Controls',
    prompt:
      'Which pair of controls correctly defends against (1) Stored Cross-Site Scripting (XSS) and (2) Cross-Site Request Forgery (CSRF) respectively?',
    topicId: 'M3-SEC-TECH',
    difficulty: 'hard',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'XSS: Context-aware output encoding + Content-Security-Policy (CSP); CSRF: Anti-CSRF synchronizer token + SameSite cookies.' },
      { id: 'B', text: 'XSS: SameSite cookies only; CSRF: SQL prepared statements.' },
      { id: 'C', text: 'XSS: HTTPS/TLS encryption; CSRF: Password hashing.' },
      { id: 'D', text: 'Both are completely prevented by setting HTTP-Only cookies alone.' },
    ],
    correctOptionId: 'A',
    explanation:
      'XSS injects malicious script into the browser DOM (defended by context-aware output encoding and CSP). CSRF tricks an authenticated browser into issuing unwanted state-changing requests (defended by SameSite cookies and unpredictable anti-CSRF tokens).',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.5 — Web Application Security' }],
    estimatedSeconds: 90,
  },
  {
    ...BASE_META,
    id: 'M3-MCQ-15',
    title: 'Network Security: IDS vs IPS & DMZ Architecture',
    prompt:
      'Why are public-facing web servers placed inside a Demilitarized Zone (DMZ) rather than directly inside the internal corporate LAN, and how does an IPS differ from a passive IDS?',
    topicId: 'M3-SEC-FUND',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'DMZ disables all firewalls; IPS only logs alerts after the fact.' },
      { id: 'B', text: 'DMZ isolates externally exposed hosts so a compromised web server cannot directly reach internal databases; an IPS sits inline to actively block malicious traffic whereas a passive IDS only detects and alerts.' },
      { id: 'C', text: 'DMZ stores backup tapes; IDS encrypts database columns.' },
      { id: 'D', text: 'There is no functional difference between IDS and IPS.' },
    ],
    correctOptionId: 'B',
    explanation:
      'A DMZ provides network segmentation (defense-in-depth) between untrusted Internet traffic and sensitive internal subnets. An IPS operates inline and can drop/reset malicious packets in real time.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.4 & M3.5 — Network Security' }],
    estimatedSeconds: 75,
  },

  // --- 1 Descriptive Question (30 pts) ---
  {
    ...BASE_META,
    id: 'M3-DESC-01',
    title: 'Defense-in-Depth Hardening for a Compromised Student Portal API',
    prompt:
      'A security audit reveals three critical flaws in a campus web portal: (a) API endpoints build SQL strings via string concatenation, (b) session cookies lack `HttpOnly`, `Secure`, and `SameSite` flags, and (c) the application server runs as the database superuser (`root`) on the same public subnet as the database. For each flaw, explain the exact attack risk and the concrete architectural/coding remediation.',
    topicId: 'M3-SEC-TECH',
    difficulty: 'medium',
    questionType: 'descriptive',
    pointValue: 30,
    expectedResponse:
      '(a) SQL String Concatenation -> Risk: SQL Injection allowing full DB exfiltration/bypass. Fix: Parameterized queries / prepared statements + input validation. (b) Insecure Session Cookies -> Risk: Session hijacking via XSS (missing HttpOnly), plaintext sniffing (missing Secure), and CSRF (missing SameSite). Fix: Enforce TLS (Secure), HttpOnly, SameSite=Lax/Strict, plus CSP and CSRF tokens. (c) Root DB User & Flat Subnet -> Risk: Lateral movement and total DB takeover if web tier is breached. Fix: Principle of Least Privilege (dedicated DB role with minimal table permissions) and network segmentation placing DB in a private subnet accessible only from the app tier security group.',
    rubric: [
      { id: 'r1', label: 'SQL Injection Risk & Fix', description: 'Explains SQLi impact and specifies parameterized queries/prepared statements.', maxPoints: 10 },
      { id: 'r2', label: 'Cookie Flags & Session Security', description: 'Maps HttpOnly (XSS theft), Secure (TLS-only), and SameSite (CSRF) accurately.', maxPoints: 10 },
      { id: 'r3', label: 'Least Privilege & Network Segmentation', description: 'Applies least-privilege DB role and separates DB into private subnet/firewall zone.', maxPoints: 10 },
    ],
    explanation:
      'Security questions in M3 reward precise mapping between each vulnerability, its concrete exploit impact, and verifiable engineering controls across code, session, and network layers.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.4 & M3.5 — Application & Network Security' }],
    estimatedSeconds: 480,
  },

  // --- 1 Standard Performance Question (50 pts) ---
  {
    ...BASE_META,
    id: 'M3-PERF-01',
    title: 'Architecture Diagram Task: High-Availability 3-Tier Cloud & DMZ Component Diagram',
    prompt:
      'Design a Component/Systems Architecture Diagram for an online examination platform requiring 99.95% uptime and strict database isolation:\n1. External Users connect via HTTPS through a **WAF / Edge Firewall** into a **Redundant Load Balancer (DMZ)**.\n2. The Load Balancer distributes traffic across at least **2 Stateless App Server** components in an Application Subnet.\n3. App Servers connect to a **Redis Session/Cache** component and a **Primary + Standby Database** located strictly inside an isolated **Private Data Subnet** (zero direct Internet access).\n4. Include an **Auth/Audit Logging** component and label all protocols/ports (e.g., HTTPS 443, TLS DB 5432).',
    topicId: 'M3-ARCH',
    difficulty: 'hard',
    questionType: 'standard_performance',
    practicalSubtype: 'diagram',
    pointValue: 50,
    expectedResponse:
      'Component architecture diagram featuring Client -> WAF/Firewall -> Redundant Load Balancer (DMZ, HTTPS 443) -> 2x Stateless App Servers (App Tier) -> Private Data Tier (Primary DB <-> Standby Replica, Cache) + Audit/Auth Service, with explicit subnet boundaries and no direct Client->DB link.',
    rubric: [
      { id: 'r1', label: 'Perimeter & DMZ Controls', description: 'Includes WAF/Firewall and redundant Load Balancer with HTTPS.', maxPoints: 15 },
      { id: 'r2', label: 'Redundant Application Tier', description: 'Models multiple stateless app instances eliminating app-tier SPOF.', maxPoints: 10 },
      { id: 'r3', label: 'Private Data Tier & Replication', description: 'Isolates Primary + Standby DB and Cache with no direct public path.', maxPoints: 15 },
      { id: 'r4', label: 'Protocol Labels & Audit/Security Flows', description: 'Labels interfaces/protocols and includes Auth/Audit logging.', maxPoints: 10 },
    ],
    scenarioData: {
      diagramType: 'uml_component',
      requiredNodeTypes: ['component', 'subsystem', 'interface'],
      minNodes: 7,
      minEdges: 6,
      requiredKeywords: ['waf', 'load balancer', 'app', 'database'],
    },
    explanation:
      'High-availability security architectures combine redundancy (eliminating SPOFs) with strict zone isolation (DMZ vs private data subnet) and explicit interface protocols.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3.3 & M3.5 — Secure Cloud Architecture' }],
    estimatedSeconds: 900,
  },

  // --- 1 Integrated Performance Question (80 pts) ---
  {
    ...BASE_META,
    id: 'M3-INT-01',
    title: 'Integrated Scenario: Enterprise Credential Breach Incident Response & Zero-Trust Redesign',
    prompt:
      'At 02:14 UTC, SOC alerts fire: an attacker used a leaked developer API key found in a public Git repository to query a staging server, pivot laterally over an open internal SSH port (22), and exfiltrate a backup dump containing unsalted SHA-1 password hashes and student PII.\n\n**Deliverables (80 points total):**\n1. **Incident Response Containment & Recovery Plan (25 pts)**: Sequence immediate NIST/standard IR steps (Containment, Eradication, Recovery, Notification) addressing the leaked key, compromised host, and affected user credentials.\n2. **Cryptographic & Secrets Remediation (25 pts)**: Specify exact replacements for unsalted SHA-1 passwords, hardcoded Git secrets, and unencrypted DB backups (naming algorithms, key rotation, and secret vault workflow).\n3. **Zero-Trust Network & Access Redesign (30 pts)**: Propose concrete network/IAM controls (SSH bastion/MFA, VPC segmentation, RBAC least privilege, CI/CD secret scanning, immutable audit logs) that block every stage of this attack chain.',
    topicId: 'M3-SEC-FUND',
    difficulty: 'hard',
    questionType: 'integrated_performance',
    practicalSubtype: 'multi_artifact',
    pointValue: 80,
    expectedResponse:
      'Part 1: Immediately revoke/rotate leaked API key and all active tokens; isolate compromised staging host (preserve forensic memory/disk snapshot); force password reset for all affected users; audit egress logs for exfiltration scope; trigger legal/privacy breach notification within regulatory SLA. Part 2: Migrate password hashing to Argon2id/bcrypt with unique per-user salt; store secrets in KMS/Vault injected at runtime (never in Git) with automated pre-commit/CI secret scanning; encrypt backups at rest using AES-256-GCM with managed KMS keys. Part 3: Block direct SSH (port 22) via security groups; require VPN/Zero-Trust Bastion + short-lived certificates + hardware MFA; isolate staging from production VPCs; enforce least-privilege IAM roles and tamper-evident SIEM logging with anomaly alerts.',
    rubric: [
      { id: 'r1', label: 'Structured Incident Response & Containment', description: 'Revokes credentials, isolates host with forensic preservation, resets user accounts, and addresses breach notification.', maxPoints: 25 },
      { id: 'r2', label: 'Cryptographic & Secrets Management Fixes', description: 'Specifies Argon2id/bcrypt+salt, Vault/KMS secret injection, CI secret scanning, and AES-256 backup encryption.', maxPoints: 25 },
      { id: 'r3', label: 'Zero-Trust Architecture & Lateral-Movement Controls', description: 'Eliminates open SSH, segments staging/prod, enforces MFA + least-privilege IAM + SIEM monitoring.', maxPoints: 30 },
    ],
    scenarioData: {
      diagramType: 'uml_component',
    },
    explanation:
      'This 80-point M3 integrated scenario directly targets your #1 (Integrated) and #2 (Information Security) baseline weaknesses by requiring cohesive operational IR, cryptography, and architecture controls.',
    references: [{ label: 'TOPCIT 2026 Syllabus M3 — Integrated Architecture & Security' }],
    estimatedSeconds: 1500,
  },
];
