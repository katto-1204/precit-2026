import type { Question } from '@/domain/schemas';

const BASE_META = {
  domain: 'M4' as const,
  sourceClassification: 'original_practice' as const,
  contentVersion: '2026.1.0',
  reviewStatus: 'verified' as const,
  mockSetId: 'mock-2026-set-1',
};

/**
 * M4 — IT Business
 * Exact 2026 Blueprint Allocation:
 * - 15 MCQ x 5 = 75 pts
 * - 2 Descriptive x 30 = 60 pts
 * - 0 Standard Performance
 * - 0 Integrated Performance
 * Total: 17 questions, 135 points
 */
export const M4_QUESTIONS: Question[] = [
  // --- 15 MCQs (5 pts each = 75 pts) ---
  {
    ...BASE_META,
    id: 'M4-MCQ-01',
    title: 'SWOT Strategy Matrix (SO vs WT)',
    prompt:
      'A mid-size logistics firm combines its strong internal AI routing team (Strength) with rising regional e-commerce demand (Opportunity) to launch a premium same-day delivery platform. Which SWOT strategy quadrant is this?',
    topicId: 'M4-STRAT',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'SO Strategy (Maxi-Maxi: leverage strengths to capture opportunities)' },
      { id: 'B', text: 'WT Strategy (Mini-Mini: defensive retrenchment)' },
      { id: 'C', text: 'WO Strategy (turnaround weakness)' },
      { id: 'D', text: 'ST Strategy (mitigate external threats)' },
    ],
    correctOptionId: 'A',
    explanation:
      'Pairing an internal Strength with an external Opportunity represents an offensive SO (Maxi-Maxi) growth strategy.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.1 — IT Strategic Planning' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-02',
    title: 'Enterprise Systems: ERP vs CRM vs SCM',
    prompt:
      'Which enterprise system primarily integrates internal core business processes—finance, accounting, HR, procurement, and inventory—into a unified transactional data backbone?',
    topicId: 'M4-STRAT',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'CRM (Customer Relationship Management)' },
      { id: 'B', text: 'ERP (Enterprise Resource Planning)' },
      { id: 'C', text: 'CMS (Content Management System)' },
      { id: 'D', text: 'DNS (Domain Name System)' },
    ],
    correctOptionId: 'B',
    explanation:
      'ERP integrates internal enterprise resources across finance, HR, manufacturing, and procurement. CRM manages customer interactions/sales pipelines, and SCM coordinates external supplier/logistics flows.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.1 — Enterprise Solutions' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-03',
    title: 'Total Cost of Ownership (TCO) vs Upfront License Cost',
    prompt:
      'When evaluating an on-premises enterprise server against a SaaS alternative over 5 years, which cost components must be included for an accurate Total Cost of Ownership (TCO) comparison?',
    topicId: 'M4-STRAT',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Initial hardware purchase price only' },
      { id: 'B', text: 'Acquisition, implementation/migration, ongoing operations, maintenance, staffing, power/hosting, security compliance, and decommissioning costs' },
      { id: 'C', text: 'Marketing budget only' },
      { id: 'D', text: 'Annual subscription fee multiplied by 1 year' },
    ],
    correctOptionId: 'B',
    explanation:
      'TCO accounts for full lifecycle direct and indirect costs (acquisition, deployment, operations, support, downtime risk, upgrades, and retirement), not merely sticker price.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.1 — IT Investment Evaluation' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-04',
    title: 'Return on Investment (ROI) Calculation',
    prompt:
      'An IT automation project requires a total investment of $200,000 and generates $280,000 in verified cost savings and revenue gains over its evaluation period. What is the project’s ROI?',
    topicId: 'M4-STRAT',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: '28.6%' },
      { id: 'B', text: '40.0%' },
      { id: 'C', text: '140.0%' },
      { id: 'D', text: '80.0%' },
    ],
    correctOptionId: 'B',
    explanation:
      'ROI = ((Net Benefit) / Investment) × 100 = (($280,000 - $200,000) / $200,000) × 100 = ($80,000 / $200,000) × 100 = 40.0%.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.1 — Performance Metrics' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-05',
    title: 'Critical Path Method (CPM) Float Calculation',
    prompt:
      'In a project network diagram, Path 1 (A->B->D) takes 14 days and Path 2 (A->C->D) takes 11 days. What is the Critical Path duration and the Total Float (Slack) of Path 2?',
    topicId: 'M4-PM',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Critical Path: 11 days; Float of Path 2: 0 days' },
      { id: 'B', text: 'Critical Path: 14 days; Float of Path 2: 3 days' },
      { id: 'C', text: 'Critical Path: 25 days; Float of Path 2: 14 days' },
      { id: 'D', text: 'Critical Path: 14 days; Float of Path 2: 0 days' },
    ],
    correctOptionId: 'B',
    explanation:
      'The Critical Path is the longest duration path determining minimum project completion time (14 days, float = 0). Path 2 has `14 - 11 = 3` days of float.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.2 — Schedule Management' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-06',
    title: 'Earned Value Management (EVM) — CPI & SPI Interpretation',
    prompt:
      'Midway through an IT project: Planned Value (PV) = $100,000, Earned Value (EV) = $80,000, and Actual Cost (AC) = $100,000. What is the project’s status?',
    topicId: 'M4-PM',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Ahead of schedule and under budget' },
      { id: 'B', text: 'Behind schedule (SPI = 0.80) and over budget (CPI = 0.80)' },
      { id: 'C', text: 'On schedule (SPI = 1.00) and over budget (CPI = 0.80)' },
      { id: 'D', text: 'Behind schedule (SPI = 0.80) and on budget (CPI = 1.00)' },
    ],
    correctOptionId: 'B',
    explanation:
      'SPI = EV / PV = 80k / 100k = 0.80 (< 1.0 means behind schedule). CPI = EV / AC = 80k / 100k = 0.80 (< 1.0 means over budget — getting $0.80 of value per $1 spent).',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.2 — Earned Value Management' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-07',
    title: 'Schedule Compression: Crashing vs Fast Tracking',
    prompt:
      'A project manager overlaps the coding phase and integration-testing phase (normally sequential) without adding new engineers, accepting higher rework risk. Which schedule compression technique is this?',
    topicId: 'M4-PM',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Crashing' },
      { id: 'B', text: 'Fast Tracking' },
      { id: 'C', text: 'Resource Leveling' },
      { id: 'D', text: 'Scope Creep' },
    ],
    correctOptionId: 'B',
    explanation:
      'Fast Tracking runs previously sequential phases in parallel (increasing rework risk). Crashing adds resources/overtime to critical-path tasks (increasing cost).',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.2 — Schedule Compression' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-08',
    title: 'Work Breakdown Structure (WBS) 100% Rule',
    prompt:
      'What does the "100% Rule" mean when constructing a project Work Breakdown Structure (WBS)?',
    topicId: 'M4-PM',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: '100% of team members must work overtime.' },
      { id: 'B', text: 'The WBS must include 100% of the work defined by the project scope—no missing deliverables and no out-of-scope work—and child elements must sum to 100% of their parent.' },
      { id: 'C', text: 'Every task must last exactly 100 hours.' },
      { id: 'D', text: 'Budget reserves must equal 100% of labor costs.' },
    ],
    correctOptionId: 'B',
    explanation:
      'The WBS 100% Rule guarantees complete, mutually exclusive deliverable decomposition capturing all in-scope work and nothing outside scope.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.2 — Scope & WBS' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-09',
    title: 'Risk Response Strategies (Transfer vs Mitigate)',
    prompt:
      'Purchasing cyber-liability insurance or outsourcing payment card vaulting to a PCI-DSS certified gateway to shift financial/operational exposure to a third party is an example of which risk response?',
    topicId: 'M4-PM',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Risk Avoidance' },
      { id: 'B', text: 'Risk Transference' },
      { id: 'C', text: 'Passive Risk Acceptance' },
      { id: 'D', text: 'Risk Escalation' },
    ],
    correctOptionId: 'B',
    explanation:
      'Risk Transference shifts financial impact or ownership of a negative risk to a third party (via insurance, fixed-price vendor contracts, or specialized certified processors).',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.2 — Risk Management' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-10',
    title: 'Functional vs Non-Functional Requirements in SRS',
    prompt:
      'Which requirement statement is a verifiable Non-Functional Requirement (NFR) rather than a Functional Requirement?',
    topicId: 'M4-COMM',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'The system shall allow students to download an official PDF transcript.' },
      { id: 'B', text: 'The search API shall respond within 250ms at the 95th percentile under 1,000 concurrent users.' },
      { id: 'C', text: 'The system shall email a confirmation receipt after tuition payment.' },
      { id: 'D', text: 'Administrators shall be able to create new academic terms.' },
    ],
    correctOptionId: 'B',
    explanation:
      'Non-Functional Requirements specify quality attributes (latency, throughput, availability, security, accessibility) with measurable thresholds, whereas Functional Requirements define system behaviors/features.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.3 — Technical Documentation' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-11',
    title: 'RFP vs Proposal vs SLA Documents',
    prompt:
      'In IT procurement and service delivery, which document defines measurable post-launch operational commitments such as 99.9% uptime, maximum incident response time, and service credit penalties?',
    topicId: 'M4-COMM',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'RFP (Request for Proposal)' },
      { id: 'B', text: 'SLA (Service Level Agreement)' },
      { id: 'C', text: 'RFI (Request for Information)' },
      { id: 'D', text: 'Meeting Minutes' },
    ],
    correctOptionId: 'B',
    explanation:
      'An SLA contractually defines service quality targets (SLOs/SLIs such as uptime and response times) and remedies between provider and customer.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.3 — Technical Communication' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-12',
    title: 'Open-Source Software Licensing: GPL vs MIT/Apache',
    prompt:
      'A commercial software company wants to statically link a third-party open-source library into its proprietary closed-source desktop product WITHOUT being obligated to release its own proprietary source code under the same open-source license. Which license family allows this?',
    topicId: 'M4-ETHICS',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'GNU GPL v3 (strong copyleft)' },
      { id: 'B', text: 'GNU AGPL v3 (network copyleft)' },
      { id: 'C', text: 'Permissive licenses such as MIT or Apache 2.0 (with required attribution/notice)' },
      { id: 'D', text: 'Unlicensed code scraped from a blog (all rights reserved by default)' },
    ],
    correctOptionId: 'C',
    explanation:
      'Permissive licenses (MIT, BSD, Apache 2.0) allow proprietary derivative distribution provided copyright notices and license terms are preserved. Strong copyleft (GPL/AGPL) requires derivative works to be released under GPL. Unlicensed code defaults to full copyright restriction.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.4 — OSS Licensing & IP' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-13',
    title: 'Personal Data Privacy — Data Minimization & Purpose Limitation',
    prompt:
      'A campus attendance app collects students’ GPS location continuously 24/7 and sells movement profiles to third-party advertisers without explicit opt-in consent, even though it only needs classroom check-in verification. Which core privacy principles are violated?',
    topicId: 'M4-ETHICS',
    difficulty: 'easy',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Data Minimization, Purpose Limitation, and Informed Consent' },
      { id: 'B', text: 'High Availability and Load Balancing' },
      { id: 'C', text: 'Polymorphism and Encapsulation' },
      { id: 'D', text: 'Only copyright law' },
    ],
    correctOptionId: 'A',
    explanation:
      'Modern privacy laws (GDPR, Korean PIPA, Philippine Data Privacy Act) mandate Data Minimization (collect only what is necessary), Purpose Limitation (do not repurpose data unexpectedly), and valid Informed Consent.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.4 — Data Privacy Law' }],
    estimatedSeconds: 60,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-14',
    title: 'Algorithmic Bias & Responsible AI Ethics',
    prompt:
      'An automated hiring-screening AI trained on 10 years of historical hiring records consistently downgrades qualified applicants from underrepresented universities because historical hiring skewed heavily toward two elite schools. What is the root ethical issue and proper engineering response?',
    topicId: 'M4-ETHICS',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Hardware latency; upgrade GPU servers.' },
      { id: 'B', text: 'Historical training bias amplifying discrimination; audit disparate impact metrics, remove proxy variables, keep human-in-the-loop review, and retrain on fairer criteria.' },
      { id: 'C', text: 'No ethical issue because algorithms are always mathematically objective.' },
      { id: 'D', text: 'Hide the model’s behavior so candidates cannot question rejections.' },
    ],
    correctOptionId: 'B',
    explanation:
      'AI models inherit and amplify biases encoded in historical labels and proxy features. Responsible AI requires fairness audits, explainability, human oversight in high-stakes decisions, and data remediation.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.4 — AI & Professional Ethics' }],
    estimatedSeconds: 75,
  },
  {
    ...BASE_META,
    id: 'M4-MCQ-15',
    title: 'Software Copyright vs Patent Protection',
    prompt:
      'Under intellectual property principles, what does copyright protect in software, and what does it NOT protect?',
    topicId: 'M4-ETHICS',
    difficulty: 'medium',
    questionType: 'mcq',
    pointValue: 5,
    options: [
      { id: 'A', text: 'Copyright protects the specific expression (source code/object code/UI assets), NOT the underlying abstract idea or mathematical algorithm.' },
      { id: 'B', text: 'Copyright grants a monopoly on any abstract mathematical formula forever.' },
      { id: 'C', text: 'Copyright only applies if the code is printed on paper.' },
      { id: 'D', text: 'Copyright automatically transfers open-source code into public domain.' },
    ],
    correctOptionId: 'A',
    explanation:
      'Copyright protects concrete creative expression (specific code implementation, documentation, artwork), whereas novel technical inventions/processes require patent protection (and pure mathematical ideas are unpatentable).',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.4 — Intellectual Property' }],
    estimatedSeconds: 75,
  },

  // --- 2 Descriptive Questions (30 pts each = 60 pts) ---
  {
    ...BASE_META,
    id: 'M4-DESC-01',
    title: 'Project Recovery Plan Using EVM & Scope/Schedule Trade-Offs',
    prompt:
      'A 6-month hospital portal project is at Month 4 with PV = $400,000, EV = $320,000, and AC = $440,000. The client insists the go-live date at Month 6 is legally fixed due to regulatory compliance. (1) Compute CPI and SPI and diagnose the exact schedule/cost variance. (2) Propose two concrete recovery actions (comparing scope prioritization/MoSCoW, fast-tracking, or targeted crashing on the critical path) and explain one risk of each. (3) Outline how you would communicate this transparently to the executive sponsor.',
    topicId: 'M4-PM',
    difficulty: 'medium',
    questionType: 'descriptive',
    pointValue: 30,
    expectedResponse:
      '1) EVM Diagnosis: SPI = 320k/400k = 0.80 (SV = -$80k, behind schedule); CPI = 320k/440k = 0.73 (CV = -$120k, significantly over budget). 2) Recovery Options: (a) MoSCoW scope negotiation — defer non-mandatory "Could-Have" features to Phase 2 while delivering all legally mandated compliance features on time (risk: stakeholder pushback); (b) Fast-tracking or selective crashing of critical-path tasks only (risk: rework defects or extra cost). 3) Executive Communication: Present factual EVM metrics early with clear options matrix (Cost vs Scope vs Quality), explicit recommendation, and updated weekly burn-down checkpoints—never hide delays.',
    rubric: [
      { id: 'r1', label: 'Accurate EVM Calculations & Diagnosis', description: 'Computes SPI = 0.80 and CPI ≈ 0.73 (SV = -$80k, CV = -$120k) correctly.', maxPoints: 10 },
      { id: 'r2', label: 'Concrete Recovery Actions & Risks', description: 'Proposes 2 realistic PM interventions (scope negotiation/MVP, fast tracking, critical-path crashing) with clear trade-offs.', maxPoints: 12 },
      { id: 'r3', label: 'Structured Stakeholder Communication', description: 'Uses transparent, option-based executive reporting with measurable milestones.', maxPoints: 8 },
    ],
    explanation:
      'M4 descriptive items reward numeric rigor (exact EVM ratios) combined with mature project governance and transparent executive communication.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.2 & M4.3 — PM & Communication' }],
    estimatedSeconds: 480,
  },
  {
    ...BASE_META,
    id: 'M4-DESC-02',
    title: 'Software Compliance Audit: OSS License & Privacy Governance',
    prompt:
      'Before launching a commercial SaaS analytics platform, your pre-release audit discovers: (a) a developer bundled a GPL-v3 library inside the proprietary backend distributed to on-prem enterprise clients, and (b) customer support logs store unmasked personal ID numbers and email addresses indefinitely. Explain (1) the legal/business risk of each finding, (2) concrete technical and governance fixes prior to launch, and (3) one automated CI/CD check to prevent recurrence.',
    topicId: 'M4-ETHICS',
    difficulty: 'medium',
    questionType: 'descriptive',
    pointValue: 30,
    expectedResponse:
      '1) Risks: (a) Distributing proprietary code linked with GPL-v3 triggers strong copyleft obligations or copyright infringement/injunction risk; (b) Indefinite unmasked PII retention violates data minimization, storage limitation, and security obligations under privacy laws (PIPA/GDPR/DPA), amplifying breach fines. 2) Fixes: (a) Replace the GPL-v3 package with an MIT/Apache-2.0 equivalent or obtain a commercial dual license; (b) Implement structured log redaction/masking for PII, purge historical raw PII logs, and enforce a documented retention TTL (e.g., 30–90 days). 3) Prevention: Add automated SBOM & license-policy scanning (e.g., FOSSA/License-Checker) plus PII/secret regex scanners as blocking CI/CD gates.',
    rubric: [
      { id: 'r1', label: 'Legal & Business Risk Identification', description: 'Accurately explains GPL copyleft risk on distribution and privacy-law retention/breach liability.', maxPoints: 10 },
      { id: 'r2', label: 'Remediation Before Launch', description: 'Replaces/re-licenses GPL dependency and implements PII log masking + retention policy.', maxPoints: 12 },
      { id: 'r3', label: 'Automated Governance / CI Gate', description: 'Proposes automated license/SBOM scanning and log/PII lint gates in CI/CD.', maxPoints: 8 },
    ],
    explanation:
      'Linking IT law/ethics directly to concrete engineering governance (SBOM scanning, log redaction, TTL retention) distinguishes high-scoring Level 3+ TOPCIT responses.',
    references: [{ label: 'TOPCIT 2026 Syllabus M4.4 — Law, Privacy & Governance' }],
    estimatedSeconds: 480,
  },
];
