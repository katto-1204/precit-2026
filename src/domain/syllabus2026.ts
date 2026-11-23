import type { DomainId } from './blueprint2026';

export type HistoricalAreaId =
  | 'software'
  | 'data'
  | 'system_architecture'
  | 'information_security'
  | 'it_business_ethics'
  | 'tech_comm_pm'
  | 'integrated_competencies';

export interface SyllabusTopic {
  readonly id: string;
  readonly domain: DomainId;
  readonly code: string;
  readonly title: string;
  readonly summary: string;
  readonly keySkills: readonly string[];
  readonly examWeightHint: 'high' | 'medium' | 'core';
  readonly supportsIntegratedPractice: boolean;
  readonly mappedHistoricalArea: HistoricalAreaId;
}

export const SYLLABUS_2026_TOPICS: readonly SyllabusTopic[] = [
  // M1 — Software Development (365 pts, 21 items)
  {
    id: 'M1-SE',
    domain: 'M1',
    code: 'M1.1',
    title: 'Software Engineering & Lifecycle',
    summary: 'SDLC models (Waterfall, Agile/Scrum), requirements engineering, configuration and change management.',
    keySkills: ['Requirements specification', 'Agile/Scrum ceremonies', 'Git/versioning workflows'],
    examWeightHint: 'core',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'software',
  },
  {
    id: 'M1-ALG',
    domain: 'M1',
    code: 'M1.2',
    title: 'Algorithms & Data Structures',
    summary: 'Linear/non-linear data structures, recursion, sorting, searching, graph traversal, and complexity analysis.',
    keySkills: ['Big-O analysis', 'Trees, graphs & hash maps', 'Dynamic programming & greedy'],
    examWeightHint: 'high',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'software',
  },
  {
    id: 'M1-AI-PROG',
    domain: 'M1',
    code: 'M1.3',
    title: 'AI & Programming Language Application',
    summary: 'Applied coding in Python/C/Java, OOP principles, API design, and AI/ML integration in software systems.',
    keySkills: ['Clean implementation', 'Debugging & edge cases', 'Applied ML/LLM integration'],
    examWeightHint: 'high',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'software',
  },
  {
    id: 'M1-UML',
    domain: 'M1',
    code: 'M1.4',
    title: 'Software Analysis, Design & UML Modeling',
    summary: 'Object-oriented design patterns, SOLID principles, and UML diagrams (Use Case, Class, Sequence, Activity, Component).',
    keySkills: ['UML diagramming', 'GoF design patterns', 'UI/UX wireframing'],
    examWeightHint: 'high',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'software',
  },
  {
    id: 'M1-TEST',
    domain: 'M1',
    code: 'M1.5',
    title: 'Implementation, Testing & Maintenance',
    summary: 'Unit/integration/system testing, boundary-value analysis, refactoring, and defect prevention.',
    keySkills: ['Black-box & white-box tests', 'Code coverage', 'Refactoring & technical debt'],
    examWeightHint: 'medium',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'software',
  },

  // M2 — Data Management (265 pts, 19 items)
  {
    id: 'M2-FUND',
    domain: 'M2',
    code: 'M2.1',
    title: 'Data & Database Fundamentals',
    summary: 'Relational model, keys, integrity constraints, DBMS architecture, and storage/file organization.',
    keySkills: ['Relational algebra', 'Referential integrity', 'Schema constraints'],
    examWeightHint: 'core',
    supportsIntegratedPractice: false,
    mappedHistoricalArea: 'data',
  },
  {
    id: 'M2-MODEL',
    domain: 'M2',
    code: 'M2.2',
    title: 'Database Design, ER Modeling & Normalization',
    summary: 'Conceptual/logical/physical design, Crow’s Foot ERD, functional dependencies, 1NF through BCNF.',
    keySkills: ['ER diagramming', 'Normalization & denormalization', 'Cardinality & keys'],
    examWeightHint: 'high',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'data',
  },
  {
    id: 'M2-SQL',
    domain: 'M2',
    code: 'M2.3',
    title: 'SQL Querying & Transaction Control',
    summary: 'Complex JOINs, subqueries, window functions, DDL/DML/DCL, ACID transactions, and isolation levels.',
    keySkills: ['Multi-table SQL joins', 'Aggregations & CTEs', 'Locking & concurrency'],
    examWeightHint: 'high',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'data',
  },
  {
    id: 'M2-OPS',
    domain: 'M2',
    code: 'M2.4',
    title: 'Database Operations, Tuning & Recovery',
    summary: 'B-Tree indexing, query execution plans, backup/recovery strategies, and database access control.',
    keySkills: ['Index optimization', 'EXPLAIN plans', 'WAL recovery & backups'],
    examWeightHint: 'medium',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'data',
  },
  {
    id: 'M2-DATA-AI',
    domain: 'M2',
    code: 'M2.5',
    title: 'Data Analysis & Data-Driven AI',
    summary: 'ETL/ELT pipelines, data preprocessing, exploratory metrics, NoSQL/big data, and ML data readiness.',
    keySkills: ['Data cleaning & feature prep', 'OLTP vs OLAP', 'Data quality governance'],
    examWeightHint: 'medium',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'data',
  },

  // M3 — Systems Architecture and Information Security (235 pts, 18 items)
  {
    id: 'M3-OS',
    domain: 'M3',
    code: 'M3.1',
    title: 'Computer Architecture & Operating Systems',
    summary: 'CPU/memory hierarchy, process & thread scheduling, deadlocks, synchronization, and virtual memory paging.',
    keySkills: ['Scheduling algorithms', 'Deadlock prevention', 'Paging & caching'],
    examWeightHint: 'core',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'system_architecture',
  },
  {
    id: 'M3-NET',
    domain: 'M3',
    code: 'M3.2',
    title: 'Networks & Communications',
    summary: 'OSI/TCP-IP stack, IPv4/CIDR subnetting, routing, DNS, HTTP/HTTPS, TLS handshakes, and load balancing.',
    keySkills: ['CIDR subnetting', 'TCP/UDP & HTTP', 'Routing & DNS troubleshooting'],
    examWeightHint: 'high',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'system_architecture',
  },
  {
    id: 'M3-ARCH',
    domain: 'M3',
    code: 'M3.3',
    title: 'Systems & Cloud Architecture Design',
    summary: 'Distributed systems, HA/failover, microservices vs monoliths, containers, and IaaS/PaaS/SaaS design.',
    keySkills: ['Fault tolerance & SLA', 'Scalability & caching', 'Cloud architecture diagrams'],
    examWeightHint: 'high',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'system_architecture',
  },
  {
    id: 'M3-SEC-FUND',
    domain: 'M3',
    code: 'M3.4',
    title: 'Information Security Fundamentals & Governance',
    summary: 'CIA triad, authentication/authorization (RBAC, OAuth2, JWT), risk assessment, and incident response.',
    keySkills: ['Threat modeling', 'Access control design', 'Security incident triage'],
    examWeightHint: 'high',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'information_security',
  },
  {
    id: 'M3-SEC-TECH',
    domain: 'M3',
    code: 'M3.5',
    title: 'Cryptography, Network & Application Security',
    summary: 'AES/RSA/SHA/PKI, digital signatures, firewalls/IDS/WAF, and OWASP secure coding (SQLi, XSS, CSRF).',
    keySkills: ['Crypto primitive selection', 'OWASP remediation', 'Defense-in-depth architecture'],
    examWeightHint: 'high',
    supportsIntegratedPractice: true,
    mappedHistoricalArea: 'information_security',
  },

  // M4 — IT Business (135 pts, 17 items)
  {
    id: 'M4-STRAT',
    domain: 'M4',
    code: 'M4.1',
    title: 'IT Business Strategy & Enterprise Solutions',
    summary: 'Value chain/SWOT/PESTEL, digital transformation, ERP/CRM/SCM selection, ROI and KPI evaluation.',
    keySkills: ['Business-IT alignment', 'ROI / TCO analysis', 'Enterprise system evaluation'],
    examWeightHint: 'core',
    supportsIntegratedPractice: false,
    mappedHistoricalArea: 'it_business_ethics',
  },
  {
    id: 'M4-PM',
    domain: 'M4',
    code: 'M4.2',
    title: 'IT Project Management',
    summary: 'Scope/WBS, critical path (CPM/PERT), effort estimation (FP, COCOMO), quality, and risk registers.',
    keySkills: ['Critical path calculation', 'Earned Value Management', 'Risk mitigation planning'],
    examWeightHint: 'high',
    supportsIntegratedPractice: false,
    mappedHistoricalArea: 'tech_comm_pm',
  },
  {
    id: 'M4-COMM',
    domain: 'M4',
    code: 'M4.3',
    title: 'Technical Communication & Documentation',
    summary: 'SRS/RFP specifications, executive summaries, stakeholder alignment, and structured technical proposals.',
    keySkills: ['Clear requirement writing', 'Proposal structuring', 'Stakeholder communication'],
    examWeightHint: 'medium',
    supportsIntegratedPractice: false,
    mappedHistoricalArea: 'tech_comm_pm',
  },
  {
    id: 'M4-ETHICS',
    domain: 'M4',
    code: 'M4.4',
    title: 'IT Law, Privacy & Professional Ethics',
    summary: 'Intellectual property, OSS licensing (MIT/GPL/Apache), personal data privacy, and AI/IT ethics.',
    keySkills: ['License compliance', 'Privacy-by-design', 'Ethical decision-making'],
    examWeightHint: 'high',
    supportsIntegratedPractice: false,
    mappedHistoricalArea: 'it_business_ethics',
  },
];

export function getTopicsByDomain(domain: DomainId): SyllabusTopic[] {
  return SYLLABUS_2026_TOPICS.filter((topic) => topic.domain === domain);
}

export function getTopicById(topicId: string): SyllabusTopic | undefined {
  return SYLLABUS_2026_TOPICS.find((topic) => topic.id === topicId);
}
