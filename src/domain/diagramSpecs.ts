import type { Edge, Node } from '@xyflow/react';

export type DiagramType =
  | 'uml_activity'
  | 'uml_class'
  | 'uml_component'
  | 'er_diagram'
  | 'flowchart'
  | 'uml_sequence'
  | 'ui_wireframe'
  | 'use_case';

export type ConnectorStyle =
  | 'control_flow'
  | 'association'
  | 'inheritance'
  | 'composition'
  | 'aggregation'
  | 'dependency'
  | 'include'
  | 'extend'
  | 'crows_foot_1n'
  | 'crows_foot_mn'
  | 'sync_message'
  | 'async_message'
  | 'return_message';

export interface PaletteShapeDef {
  shapeType: string;
  label: string;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultFill: string;
  defaultStroke: string;
  defaultText: string;
  /** Optional semantic fields for Class/ERD/Sequence/UI nodes */
  defaultDetails?: string;
}

export interface DiagramCategorySpec {
  id: DiagramType;
  name: string;
  shortName: string;
  domain: 'M1' | 'M2' | 'M3';
  description: string;
  defaultConnector: ConnectorStyle;
  availableConnectors: ConnectorStyle[];
  palette: PaletteShapeDef[];
  guidedPrompt: {
    title: string;
    prompt: string;
    requiredShapeTypes: string[];
    minNodes: number;
    minEdges: number;
    requiredKeywords: string[];
    starterNodes: Node<DiagramNodeData>[];
    starterEdges: Edge[];
  };
}

export interface DiagramNodeData extends Record<string, unknown> {
  shapeType: string;
  diagramType: DiagramType;
  label: string;
  details: string;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  width: number;
  height: number;
}

export const CONNECTOR_META: Readonly<
  Record<
    ConnectorStyle,
    { label: string; dashed?: boolean; markerEnd?: 'arrow' | 'arrowclosed'; defaultLabel?: string }
  >
> = {
  control_flow: { label: 'Control Flow →', markerEnd: 'arrowclosed' },
  association: { label: 'Association —' },
  inheritance: { label: 'Inheritance / Generalization ▷', markerEnd: 'arrow' },
  composition: { label: 'Composition ◆—', markerEnd: 'arrowclosed', defaultLabel: '1..*' },
  aggregation: { label: 'Aggregation ◇—', defaultLabel: '0..*' },
  dependency: { label: 'Dependency - - >', dashed: true, markerEnd: 'arrow' },
  include: { label: '<<include>> - - >', dashed: true, markerEnd: 'arrow', defaultLabel: '<<include>>' },
  extend: { label: '<<extend>> - - >', dashed: true, markerEnd: 'arrow', defaultLabel: '<<extend>>' },
  crows_foot_1n: { label: '1 : N Crow’s Foot', markerEnd: 'arrow', defaultLabel: '1 : N' },
  crows_foot_mn: { label: 'M : N Relationship', defaultLabel: 'M : N' },
  sync_message: { label: 'Sync Message →', markerEnd: 'arrowclosed' },
  async_message: { label: 'Async Message ⇢', markerEnd: 'arrow' },
  return_message: { label: 'Return Message - - >', dashed: true, markerEnd: 'arrow' },
};

export const DIAGRAM_CATEGORIES: readonly DiagramCategorySpec[] = [
  {
    id: 'uml_activity',
    name: 'Activity Diagram',
    shortName: 'Activity',
    domain: 'M1',
    description: 'Model workflows, decision branches, parallel fork/join lanes, and start/final states.',
    defaultConnector: 'control_flow',
    availableConnectors: ['control_flow', 'dependency'],
    palette: [
      { shapeType: 'initial', label: 'Initial Node', category: 'Control', defaultWidth: 44, defaultHeight: 44, defaultFill: '#0f172a', defaultStroke: '#0f172a', defaultText: 'Start' },
      { shapeType: 'action', label: 'Action / Activity', category: 'Behavior', defaultWidth: 160, defaultHeight: 56, defaultFill: '#ffffff', defaultStroke: '#334155', defaultText: 'Process Step' },
      { shapeType: 'object', label: 'Object Node', category: 'Data', defaultWidth: 140, defaultHeight: 50, defaultFill: '#f8fafc', defaultStroke: '#475569', defaultText: 'OrderObject' },
      { shapeType: 'decision', label: 'Decision / Merge', category: 'Control', defaultWidth: 110, defaultHeight: 74, defaultFill: '#fef2f2', defaultStroke: '#c81e1e', defaultText: 'Condition?' },
      { shapeType: 'fork_join', label: 'Fork / Join Bar', category: 'Control', defaultWidth: 160, defaultHeight: 16, defaultFill: '#0f172a', defaultStroke: '#0f172a', defaultText: 'Fork/Join' },
      { shapeType: 'swimlane', label: 'Swimlane Partition', category: 'Container', defaultWidth: 240, defaultHeight: 220, defaultFill: '#f8fafc', defaultStroke: '#94a3b8', defaultText: 'Actor Swimlane' },
      { shapeType: 'final', label: 'Activity Final', category: 'Control', defaultWidth: 46, defaultHeight: 46, defaultFill: '#ffffff', defaultStroke: '#0f172a', defaultText: 'End' },
      { shapeType: 'flow_final', label: 'Flow Final', category: 'Control', defaultWidth: 44, defaultHeight: 44, defaultFill: '#ffffff', defaultStroke: '#475569', defaultText: 'Stop' },
    ],
    guidedPrompt: {
      title: 'Student Course Enrollment Workflow',
      prompt:
        'Model the university course enrollment process: Initial Node -> Submit Course Selection -> Decision [Prerequisites Met?] -> (No: Notify Error -> Final) / (Yes: Decision [Seat Available?] -> Reserve Seat -> Process Tuition Payment -> Confirm Enrollment -> Final).',
      requiredShapeTypes: ['initial', 'action', 'decision', 'final'],
      minNodes: 6,
      minEdges: 5,
      requiredKeywords: ['prerequisite', 'payment', 'confirm'],
      starterNodes: [
        {
          id: 'act-1',
          type: 'prepcitNode',
          position: { x: 260, y: 30 },
          data: {
            shapeType: 'initial',
            diagramType: 'uml_activity',
            label: 'Start',
            details: '',
            fillColor: '#0f172a',
            strokeColor: '#0f172a',
            strokeWidth: 2,
            fontSize: 11,
            textAlign: 'center',
            width: 44,
            height: 44,
          },
        },
        {
          id: 'act-2',
          type: 'prepcitNode',
          position: { x: 200, y: 120 },
          data: {
            shapeType: 'action',
            diagramType: 'uml_activity',
            label: 'Submit Course Selection',
            details: '',
            fillColor: '#ffffff',
            strokeColor: '#334155',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'center',
            width: 170,
            height: 54,
          },
        },
      ],
      starterEdges: [
        { id: 'e-act-1-2', source: 'act-1', target: 'act-2', label: '', type: 'smoothstep' },
      ],
    },
  },
  {
    id: 'uml_class',
    name: 'Class Diagram',
    shortName: 'Class',
    domain: 'M1',
    description: 'Design classes, interfaces, attributes/methods with visibility (+, -, #), and UML multiplicities.',
    defaultConnector: 'association',
    availableConnectors: ['association', 'composition', 'aggregation', 'inheritance', 'dependency'],
    palette: [
      { shapeType: 'class', label: 'Class', category: 'Classifier', defaultWidth: 190, defaultHeight: 120, defaultFill: '#ffffff', defaultStroke: '#0f172a', defaultText: 'Order', defaultDetails: '- id: String\n- total: Decimal\n---\n+ calculateTax(): Decimal' },
      { shapeType: 'abstract_class', label: 'Abstract Class', category: 'Classifier', defaultWidth: 190, defaultHeight: 115, defaultFill: '#f8fafc', defaultStroke: '#334155', defaultText: '<<abstract>>\nMember', defaultDetails: '# memberId: String\n---\n+ getFineRate(): Decimal' },
      { shapeType: 'interface', label: 'Interface', category: 'Classifier', defaultWidth: 190, defaultHeight: 105, defaultFill: '#fef2f2', defaultStroke: '#c81e1e', defaultText: '<<interface>>\nFinePolicy', defaultDetails: '+ computeFine(days: int): Decimal' },
      { shapeType: 'enum', label: 'Enumeration', category: 'Classifier', defaultWidth: 165, defaultHeight: 96, defaultFill: '#ffffff', defaultStroke: '#475569', defaultText: '<<enum>>\nOrderStatus', defaultDetails: 'PENDING\nPAID\nSHIPPED' },
      { shapeType: 'package', label: 'Package', category: 'Grouping', defaultWidth: 240, defaultHeight: 170, defaultFill: '#f8fafc', defaultStroke: '#94a3b8', defaultText: 'billing.domain' },
      { shapeType: 'note', label: 'Note', category: 'Annotation', defaultWidth: 160, defaultHeight: 72, defaultFill: '#fffbeb', defaultStroke: '#d97706', defaultText: 'Constraint note' },
    ],
    guidedPrompt: {
      title: 'Campus Library Fine Strategy Class Diagram',
      prompt:
        'Model Member, Loan, BookCopy, and a FinePolicy interface implemented by StudentFinePolicy and FacultyFinePolicy. Connect Member to Loan (1..*), Loan to BookCopy, and show interface realization/dependency.',
      requiredShapeTypes: ['class', 'interface'],
      minNodes: 4,
      minEdges: 3,
      requiredKeywords: ['member', 'loan', 'finepolicy'],
      starterNodes: [
        {
          id: 'cls-1',
          type: 'prepcitNode',
          position: { x: 80, y: 80 },
          data: {
            shapeType: 'class',
            diagramType: 'uml_class',
            label: 'Member',
            details: '- memberId: String\n- role: Role\n---\n+ borrowCopy(copy: BookCopy)',
            fillColor: '#ffffff',
            strokeColor: '#0f172a',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'left',
            width: 195,
            height: 118,
          },
        },
        {
          id: 'cls-2',
          type: 'prepcitNode',
          position: { x: 360, y: 80 },
          data: {
            shapeType: 'interface',
            diagramType: 'uml_class',
            label: '<<interface>> FinePolicy',
            details: '+ computeFine(overdueDays: int): float',
            fillColor: '#fef2f2',
            strokeColor: '#c81e1e',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'left',
            width: 215,
            height: 92,
          },
        },
      ],
      starterEdges: [],
    },
  },
  {
    id: 'uml_component',
    name: 'Component Diagram',
    shortName: 'Component',
    domain: 'M3',
    description: 'Architect microservices, gateways, DMZ firewalls, interfaces, ports, and subsystem boundaries.',
    defaultConnector: 'dependency',
    availableConnectors: ['dependency', 'association', 'control_flow'],
    palette: [
      { shapeType: 'component', label: 'Component', category: 'Structure', defaultWidth: 175, defaultHeight: 74, defaultFill: '#ffffff', defaultStroke: '#0f172a', defaultText: '<<component>>\nAPI Gateway' },
      { shapeType: 'subsystem', label: 'Subsystem / Zone', category: 'Container', defaultWidth: 260, defaultHeight: 180, defaultFill: '#f8fafc', defaultStroke: '#64748b', defaultText: 'DMZ Subnet' },
      { shapeType: 'interface', label: 'Provided / Required Interface', category: 'Ports', defaultWidth: 145, defaultHeight: 46, defaultFill: '#fef2f2', defaultStroke: '#c81e1e', defaultText: 'HTTPS :443' },
      { shapeType: 'database', label: 'Data Store / DB', category: 'Infrastructure', defaultWidth: 160, defaultHeight: 74, defaultFill: '#f0f9ff', defaultStroke: '#0284c7', defaultText: 'Primary DB' },
      { shapeType: 'port', label: 'Port', category: 'Ports', defaultWidth: 64, defaultHeight: 36, defaultFill: '#ffffff', defaultStroke: '#334155', defaultText: 'Port' },
      { shapeType: 'note', label: 'Security Note', category: 'Annotation', defaultWidth: 165, defaultHeight: 68, defaultFill: '#fffbeb', defaultStroke: '#d97706', defaultText: 'No direct Internet to DB' },
    ],
    guidedPrompt: {
      title: 'High-Availability 3-Tier DMZ Architecture',
      prompt:
        'Connect Client -> WAF/Firewall -> Redundant Load Balancer -> 2 Stateless App Servers -> Private Primary & Standby Database + Cache/Audit Service.',
      requiredShapeTypes: ['component', 'database'],
      minNodes: 5,
      minEdges: 4,
      requiredKeywords: ['waf', 'load balancer', 'app', 'db'],
      starterNodes: [
        {
          id: 'cmp-1',
          type: 'prepcitNode',
          position: { x: 60, y: 120 },
          data: {
            shapeType: 'component',
            diagramType: 'uml_component',
            label: 'WAF / Edge Firewall',
            details: 'TLS 1.3 Termination',
            fillColor: '#fef2f2',
            strokeColor: '#c81e1e',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'center',
            width: 175,
            height: 70,
          },
        },
        {
          id: 'cmp-2',
          type: 'prepcitNode',
          position: { x: 300, y: 120 },
          data: {
            shapeType: 'component',
            diagramType: 'uml_component',
            label: 'Redundant Load Balancer',
            details: 'Active-Active DMZ',
            fillColor: '#ffffff',
            strokeColor: '#0f172a',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'center',
            width: 190,
            height: 70,
          },
        },
      ],
      starterEdges: [
        { id: 'e-cmp-1-2', source: 'cmp-1', target: 'cmp-2', label: 'HTTPS 443', type: 'smoothstep' },
      ],
    },
  },
  {
    id: 'er_diagram',
    name: 'ER Diagram',
    shortName: 'ERD',
    domain: 'M2',
    description: 'Model normalized entities, PK/FK columns, associative tables, and Crow’s Foot cardinalities.',
    defaultConnector: 'crows_foot_1n',
    availableConnectors: ['crows_foot_1n', 'crows_foot_mn', 'association'],
    palette: [
      { shapeType: 'entity', label: 'Strong Entity', category: 'Table', defaultWidth: 195, defaultHeight: 118, defaultFill: '#ffffff', defaultStroke: '#0f172a', defaultText: 'STUDENT', defaultDetails: 'PK student_id INT\n   full_name VARCHAR\n   email VARCHAR UNIQUE' },
      { shapeType: 'associative_entity', label: 'Associative / Junction Entity', category: 'Table', defaultWidth: 210, defaultHeight: 118, defaultFill: '#fef2f2', defaultStroke: '#c81e1e', defaultText: 'ENROLLMENT', defaultDetails: 'PK enrollment_id INT\nFK student_id INT\nFK section_id INT\n   grade CHAR(2)' },
      { shapeType: 'weak_entity', label: 'Weak Entity', category: 'Table', defaultWidth: 185, defaultHeight: 100, defaultFill: '#f8fafc', defaultStroke: '#475569', defaultText: 'ORDER_ITEM', defaultDetails: 'PFK order_id\nPK  line_no\n    unit_price' },
      { shapeType: 'attribute', label: 'Attribute Bubble', category: 'Conceptual', defaultWidth: 130, defaultHeight: 46, defaultFill: '#ffffff', defaultStroke: '#64748b', defaultText: 'attribute_name' },
      { shapeType: 'relationship', label: 'Relationship Diamond', category: 'Conceptual', defaultWidth: 120, defaultHeight: 70, defaultFill: '#f8fafc', defaultStroke: '#334155', defaultText: 'enrolls_in' },
    ],
    guidedPrompt: {
      title: 'University Enrollment Normalized 3NF ERD',
      prompt:
        'Design the normalized ERD for a university enrollment system with STUDENT, COURSE, SECTION, INSTRUCTOR, and associative ENROLLMENT table resolving M:N with PK/FK keys and Crow’s Foot 1:N cardinalities.',
      requiredShapeTypes: ['entity', 'associative_entity'],
      minNodes: 4,
      minEdges: 3,
      requiredKeywords: ['student', 'course', 'enrollment'],
      starterNodes: [
        {
          id: 'erd-1',
          type: 'prepcitNode',
          position: { x: 60, y: 100 },
          data: {
            shapeType: 'entity',
            diagramType: 'er_diagram',
            label: 'STUDENT',
            details: 'PK student_id INT\n   full_name VARCHAR\n   dept_id INT',
            fillColor: '#ffffff',
            strokeColor: '#0f172a',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'left',
            width: 195,
            height: 110,
          },
        },
        {
          id: 'erd-2',
          type: 'prepcitNode',
          position: { x: 330, y: 100 },
          data: {
            shapeType: 'associative_entity',
            diagramType: 'er_diagram',
            label: 'ENROLLMENT',
            details: 'PK enrollment_id INT\nFK student_id INT\nFK section_id INT\n   status VARCHAR',
            fillColor: '#fef2f2',
            strokeColor: '#c81e1e',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'left',
            width: 205,
            height: 120,
          },
        },
      ],
      starterEdges: [
        { id: 'e-erd-1-2', source: 'erd-1', target: 'erd-2', label: '1 : N', type: 'smoothstep' },
      ],
    },
  },
  {
    id: 'flowchart',
    name: 'Flow Chart',
    shortName: 'Flowchart',
    domain: 'M1',
    description: 'Build algorithmic control flows with Start/End terminators, Processes, Decisions, and I/O blocks.',
    defaultConnector: 'control_flow',
    availableConnectors: ['control_flow'],
    palette: [
      { shapeType: 'terminator', label: 'Start / End Terminator', category: 'Control', defaultWidth: 140, defaultHeight: 48, defaultFill: '#0f172a', defaultStroke: '#0f172a', defaultText: 'START' },
      { shapeType: 'process', label: 'Process', category: 'Operation', defaultWidth: 165, defaultHeight: 54, defaultFill: '#ffffff', defaultStroke: '#334155', defaultText: 'Compute Value' },
      { shapeType: 'decision', label: 'Decision', category: 'Control', defaultWidth: 120, defaultHeight: 78, defaultFill: '#fef2f2', defaultStroke: '#c81e1e', defaultText: 'x > 0?' },
      { shapeType: 'io', label: 'Input / Output', category: 'Data', defaultWidth: 165, defaultHeight: 52, defaultFill: '#f0f9ff', defaultStroke: '#0284c7', defaultText: 'Read N' },
      { shapeType: 'predefined', label: 'Predefined Process', category: 'Operation', defaultWidth: 165, defaultHeight: 54, defaultFill: '#f8fafc', defaultStroke: '#475569', defaultText: 'ValidateInput()' },
      { shapeType: 'document', label: 'Document', category: 'Data', defaultWidth: 150, defaultHeight: 56, defaultFill: '#fffbeb', defaultStroke: '#d97706', defaultText: 'Print Receipt' },
      { shapeType: 'connector', label: 'On-Page Connector', category: 'Control', defaultWidth: 44, defaultHeight: 44, defaultFill: '#ffffff', defaultStroke: '#334155', defaultText: 'A' },
    ],
    guidedPrompt: {
      title: 'Binary Search Algorithm Flowchart',
      prompt:
        'Draw a flowchart for Binary Search: START -> Input sorted array & target -> Set low=0, high=n-1 -> Decision [low <= high?] -> Compute mid -> Decision [arr[mid] == target?] -> Output Found / Adjust bounds -> END.',
      requiredShapeTypes: ['terminator', 'io', 'process', 'decision'],
      minNodes: 6,
      minEdges: 5,
      requiredKeywords: ['start', 'mid', 'end'],
      starterNodes: [
        {
          id: 'fl-1',
          type: 'prepcitNode',
          position: { x: 240, y: 30 },
          data: {
            shapeType: 'terminator',
            diagramType: 'flowchart',
            label: 'START',
            details: '',
            fillColor: '#0f172a',
            strokeColor: '#0f172a',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'center',
            width: 130,
            height: 44,
          },
        },
      ],
      starterEdges: [],
    },
  },
  {
    id: 'uml_sequence',
    name: 'Sequence Diagram',
    shortName: 'Sequence',
    domain: 'M1',
    description: 'Visualize time-ordered interactions with participants, lifelines, activation bars, sync/async/return messages, and alt/loop frames.',
    defaultConnector: 'sync_message',
    availableConnectors: ['sync_message', 'async_message', 'return_message'],
    palette: [
      { shapeType: 'actor', label: 'Actor Lifeline', category: 'Participant', defaultWidth: 120, defaultHeight: 240, defaultFill: '#ffffff', defaultStroke: '#0f172a', defaultText: 'User' },
      { shapeType: 'lifeline', label: 'Object / Service Lifeline', category: 'Participant', defaultWidth: 145, defaultHeight: 240, defaultFill: '#ffffff', defaultStroke: '#334155', defaultText: ':AuthService' },
      { shapeType: 'activation', label: 'Activation Bar', category: 'Execution', defaultWidth: 24, defaultHeight: 84, defaultFill: '#fee2e2', defaultStroke: '#c81e1e', defaultText: '' },
      { shapeType: 'fragment_alt', label: 'Alt Fragment Frame', category: 'Combined Fragment', defaultWidth: 280, defaultHeight: 130, defaultFill: '#f8fafc', defaultStroke: '#64748b', defaultText: 'alt [valid token]' },
      { shapeType: 'fragment_loop', label: 'Loop Fragment Frame', category: 'Combined Fragment', defaultWidth: 260, defaultHeight: 120, defaultFill: '#f8fafc', defaultStroke: '#64748b', defaultText: 'loop [retry < 3]' },
      { shapeType: 'note', label: 'Timing / Guard Note', category: 'Annotation', defaultWidth: 155, defaultHeight: 62, defaultFill: '#fffbeb', defaultStroke: '#d97706', defaultText: 'JWT TTL = 15m' },
    ],
    guidedPrompt: {
      title: 'OAuth 2.0 + PKCE Login Sequence',
      prompt:
        'Model Client -> AuthServer -> ResourceAPI lifelines showing authorization request with code_challenge, token exchange with code_verifier, and authenticated API response.',
      requiredShapeTypes: ['actor', 'lifeline'],
      minNodes: 3,
      minEdges: 3,
      requiredKeywords: ['auth', 'token'],
      starterNodes: [
        {
          id: 'seq-1',
          type: 'prepcitNode',
          position: { x: 80, y: 40 },
          data: {
            shapeType: 'actor',
            diagramType: 'uml_sequence',
            label: 'Student Client',
            details: 'SPA Browser',
            fillColor: '#ffffff',
            strokeColor: '#0f172a',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'center',
            width: 130,
            height: 240,
          },
        },
        {
          id: 'seq-2',
          type: 'prepcitNode',
          position: { x: 310, y: 40 },
          data: {
            shapeType: 'lifeline',
            diagramType: 'uml_sequence',
            label: ':AuthServer',
            details: 'OAuth2 + PKCE',
            fillColor: '#ffffff',
            strokeColor: '#c81e1e',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'center',
            width: 145,
            height: 240,
          },
        },
      ],
      starterEdges: [
        { id: 'e-seq-1-2', source: 'seq-1', target: 'seq-2', label: '1. authorize(code_challenge)', type: 'straight' },
      ],
    },
  },
  {
    id: 'ui_wireframe',
    name: 'UI Design',
    shortName: 'UI Wireframe',
    domain: 'M1',
    description: 'Interactive wireframing workspace with frames, forms, inputs, buttons, tables, modals, and accessibility validation.',
    defaultConnector: 'control_flow',
    availableConnectors: ['control_flow', 'dependency'],
    palette: [
      { shapeType: 'ui_window', label: 'Window / Screen Frame', category: 'Layout', defaultWidth: 360, defaultHeight: 260, defaultFill: '#ffffff', defaultStroke: '#334155', defaultText: 'Course Registration Portal' },
      { shapeType: 'ui_nav', label: 'Navigation Bar', category: 'Layout', defaultWidth: 320, defaultHeight: 42, defaultFill: '#0f172a', defaultStroke: '#0f172a', defaultText: 'Home  |  Courses  |  Grades  |  Logout' },
      { shapeType: 'ui_heading', label: 'Heading Text', category: 'Typography', defaultWidth: 200, defaultHeight: 34, defaultFill: 'transparent', defaultStroke: '#cbd5e1', defaultText: 'Enroll in Course' },
      { shapeType: 'ui_input', label: 'Input Field', category: 'Form', defaultWidth: 220, defaultHeight: 44, defaultFill: '#ffffff', defaultStroke: '#94a3b8', defaultText: 'Course Code (e.g. CS301)' },
      { shapeType: 'ui_dropdown', label: 'Dropdown Select', category: 'Form', defaultWidth: 220, defaultHeight: 44, defaultFill: '#ffffff', defaultStroke: '#94a3b8', defaultText: 'Select Section ▾' },
      { shapeType: 'ui_checkbox', label: 'Checkbox / Consent', category: 'Form', defaultWidth: 220, defaultHeight: 34, defaultFill: '#ffffff', defaultStroke: '#cbd5e1', defaultText: '☑ Confirm prerequisites' },
      { shapeType: 'ui_button', label: 'Primary Button', category: 'Action', defaultWidth: 150, defaultHeight: 40, defaultFill: '#c81e1e', defaultStroke: '#9b1c1c', defaultText: 'Submit Enrollment' },
      { shapeType: 'ui_table', label: 'Data Table', category: 'Data', defaultWidth: 300, defaultHeight: 110, defaultFill: '#f8fafc', defaultStroke: '#94a3b8', defaultText: 'Course | Seats | Status', defaultDetails: 'CS301 | 4/40 | Open\nIT204 | 0/35 | Waitlist' },
      { shapeType: 'ui_modal', label: 'Confirmation Modal', category: 'Overlay', defaultWidth: 240, defaultHeight: 130, defaultFill: '#fffbeb', defaultStroke: '#d97706', defaultText: 'Confirm Enrollment?', defaultDetails: 'Verify schedule conflict before submitting.' },
    ],
    guidedPrompt: {
      title: 'Accessible Course Enrollment Form Wireframe',
      prompt:
        'Wireframe an accessible course registration screen containing a Navigation Bar, Course Search/Input Field, Section Dropdown, Prerequisite Checkbox, Available Sections Table, and Primary Submit Button linked to a Confirmation Modal.',
      requiredShapeTypes: ['ui_window', 'ui_input', 'ui_button'],
      minNodes: 5,
      minEdges: 1,
      requiredKeywords: ['course', 'submit'],
      starterNodes: [
        {
          id: 'ui-1',
          type: 'prepcitNode',
          position: { x: 80, y: 40 },
          data: {
            shapeType: 'ui_window',
            diagramType: 'ui_wireframe',
            label: 'Student Enrollment Screen',
            details: '1366x768 Desktop Wireframe',
            fillColor: '#ffffff',
            strokeColor: '#334155',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'left',
            width: 360,
            height: 250,
          },
        },
        {
          id: 'ui-2',
          type: 'prepcitNode',
          position: { x: 110, y: 110 },
          data: {
            shapeType: 'ui_input',
            diagramType: 'ui_wireframe',
            label: 'Course Code Input',
            details: 'aria-label="Course Code"',
            fillColor: '#ffffff',
            strokeColor: '#94a3b8',
            strokeWidth: 1,
            fontSize: 12,
            textAlign: 'left',
            width: 220,
            height: 44,
          },
        },
      ],
      starterEdges: [],
    },
  },
  {
    id: 'use_case',
    name: 'Use Case Diagram',
    shortName: 'Use Case',
    domain: 'M1',
    description: 'Capture functional scope with Actors, System Boundaries, Use Cases, <<include>>, and <<extend>> links.',
    defaultConnector: 'association',
    availableConnectors: ['association', 'include', 'extend', 'inheritance'],
    palette: [
      { shapeType: 'actor', label: 'Actor', category: 'External', defaultWidth: 88, defaultHeight: 96, defaultFill: '#ffffff', defaultStroke: '#0f172a', defaultText: 'Customer' },
      { shapeType: 'usecase', label: 'Use Case Oval', category: 'Behavior', defaultWidth: 165, defaultHeight: 62, defaultFill: '#ffffff', defaultStroke: '#334155', defaultText: 'Withdraw Cash' },
      { shapeType: 'system_boundary', label: 'System Boundary', category: 'Container', defaultWidth: 320, defaultHeight: 260, defaultFill: '#f8fafc', defaultStroke: '#64748b', defaultText: 'ATM Banking System' },
      { shapeType: 'note', label: 'Requirement Note', category: 'Annotation', defaultWidth: 160, defaultHeight: 64, defaultFill: '#fffbeb', defaultStroke: '#d97706', defaultText: 'Extension point: Receipt' },
    ],
    guidedPrompt: {
      title: 'ATM Banking System Use Case Diagram',
      prompt:
        'Model Customer and BankAdmin actors, System Boundary, Withdraw Cash, Transfer Funds, mandatory <<include>> Authenticate User, and optional <<extend>> Print Receipt.',
      requiredShapeTypes: ['actor', 'usecase', 'system_boundary'],
      minNodes: 5,
      minEdges: 4,
      requiredKeywords: ['authenticate', 'withdraw', 'receipt'],
      starterNodes: [
        {
          id: 'uc-1',
          type: 'prepcitNode',
          position: { x: 40, y: 120 },
          data: {
            shapeType: 'actor',
            diagramType: 'use_case',
            label: 'Customer',
            details: '',
            fillColor: '#ffffff',
            strokeColor: '#0f172a',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'center',
            width: 88,
            height: 92,
          },
        },
        {
          id: 'uc-2',
          type: 'prepcitNode',
          position: { x: 220, y: 90 },
          data: {
            shapeType: 'usecase',
            diagramType: 'use_case',
            label: 'Withdraw Cash',
            details: '',
            fillColor: '#ffffff',
            strokeColor: '#334155',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'center',
            width: 165,
            height: 58,
          },
        },
        {
          id: 'uc-3',
          type: 'prepcitNode',
          position: { x: 450, y: 90 },
          data: {
            shapeType: 'usecase',
            diagramType: 'use_case',
            label: 'Authenticate User',
            details: '',
            fillColor: '#fef2f2',
            strokeColor: '#c81e1e',
            strokeWidth: 2,
            fontSize: 12,
            textAlign: 'center',
            width: 170,
            height: 58,
          },
        },
      ],
      starterEdges: [
        { id: 'e-uc-1-2', source: 'uc-1', target: 'uc-2', label: '', type: 'straight' },
        { id: 'e-uc-2-3', source: 'uc-2', target: 'uc-3', label: '<<include>>', type: 'straight', style: { strokeDasharray: '5 4' } },
      ],
    },
  },
];

export function getDiagramCategory(type: DiagramType): DiagramCategorySpec {
  return DIAGRAM_CATEGORIES.find((c) => c.id === type) ?? DIAGRAM_CATEGORIES[0];
}

export interface DiagramEvaluationResult {
  scorePercent: number;
  earnedPoints: number;
  maxPoints: number;
  passedChecks: string[];
  missingChecks: string[];
  warnings: string[];
  requiresManualReview: boolean;
}

/**
 * Deterministic, layout-independent structural graph validator for all 8 diagram types.
 * Evaluates required object types, connectivity, reachability, scenario keywords, and diagram-specific rules.
 */
export function evaluateDiagramGraph(
  diagramType: DiagramType,
  nodes: readonly Node<DiagramNodeData>[],
  edges: readonly Edge[],
  maxPoints = 50,
): DiagramEvaluationResult {
  const spec = getDiagramCategory(diagramType);
  const { requiredShapeTypes, minNodes, minEdges, requiredKeywords } = spec.guidedPrompt;

  const passedChecks: string[] = [];
  const missingChecks: string[] = [];
  const warnings: string[] = [];

  if (nodes.length === 0) {
    return {
      scorePercent: 0,
      earnedPoints: 0,
      maxPoints,
      passedChecks: [],
      missingChecks: ['Canvas is empty. Add diagram shapes and connectors to earn structural credit.'],
      warnings: [],
      requiresManualReview: false,
    };
  }

  let totalWeight = 0;
  let earnedWeight = 0;

  // 1. Required shape types check (30%)
  totalWeight += 30;
  const presentTypes = new Set(nodes.map((n) => n.data.shapeType));
  const missingTypes = requiredShapeTypes.filter((t) => !presentTypes.has(t));
  if (missingTypes.length === 0) {
    earnedWeight += 30;
    passedChecks.push(`All required ${spec.shortName} notation types present (${requiredShapeTypes.join(', ')}).`);
  } else {
    const ratio = (requiredShapeTypes.length - missingTypes.length) / requiredShapeTypes.length;
    earnedWeight += Math.round(30 * ratio);
    missingChecks.push(`Missing required shape type(s): ${missingTypes.join(', ')}.`);
  }

  // 2. Minimum structural coverage (20%)
  totalWeight += 20;
  if (nodes.length >= minNodes && edges.length >= minEdges) {
    earnedWeight += 20;
    passedChecks.push(`Sufficient structural depth (${nodes.length} nodes, ${edges.length} connectors).`);
  } else {
    const nodeRatio = Math.min(1, nodes.length / Math.max(1, minNodes));
    const edgeRatio = Math.min(1, edges.length / Math.max(1, minEdges));
    earnedWeight += Math.round(20 * ((nodeRatio + edgeRatio) / 2));
    if (nodes.length < minNodes) {
      missingChecks.push(`Add more objects: ${nodes.length}/${minNodes} minimum expected nodes.`);
    }
    if (edges.length < minEdges) {
      missingChecks.push(`Add more connectors/relationships: ${edges.length}/${minEdges} minimum expected edges.`);
    }
  }

  // 3. Scenario concept keyword coverage (25%)
  totalWeight += 25;
  const fullText = [
    ...nodes.map((n) => `${n.data.label} ${n.data.details}`),
    ...edges.map((e) => String(e.label ?? '')),
  ]
    .join(' ')
    .toLowerCase();

  const missingKeywords = requiredKeywords.filter((kw) => !fullText.includes(kw.toLowerCase()));
  if (missingKeywords.length === 0) {
    earnedWeight += 25;
    passedChecks.push(`Covers all key scenario concepts (${requiredKeywords.join(', ')}).`);
  } else {
    const ratio = (requiredKeywords.length - missingKeywords.length) / requiredKeywords.length;
    earnedWeight += Math.round(25 * ratio);
    missingChecks.push(`Missing scenario concept labels: ${missingKeywords.join(', ')}.`);
  }

  // 4. Connectivity & Diagram-Specific Semantics (25%)
  totalWeight += 25;
  const connectedIds = new Set<string>();
  edges.forEach((e) => {
    connectedIds.add(e.source);
    connectedIds.add(e.target);
  });
  const nonContainerNodes = nodes.filter(
    (n) =>
      !['swimlane', 'package', 'subsystem', 'system_boundary', 'ui_window', 'note', 'fragment_alt', 'fragment_loop'].includes(
        n.data.shapeType,
      ),
  );
  const orphans = nonContainerNodes.filter((n) => !connectedIds.has(n.id));

  if (diagramType === 'ui_wireframe') {
    earnedWeight += 25;
    passedChecks.push('Wireframe layout elements placed on screen canvas.');
  } else if (orphans.length === 0 && nonContainerNodes.length > 0) {
    earnedWeight += 25;
    passedChecks.push('Graph connectivity clean: zero disconnected orphaned elements.');
  } else {
    const ratio =
      nonContainerNodes.length > 0
        ? (nonContainerNodes.length - orphans.length) / nonContainerNodes.length
        : 0;
    earnedWeight += Math.round(25 * ratio);
    warnings.push(
      `${orphans.length} disconnected object(s) detected: ${orphans.map((o) => o.data.label || o.id).slice(0, 3).join(', ')}.`,
    );
  }

  // Specific decision-branch check for Activity & Flowchart
  if (diagramType === 'uml_activity' || diagramType === 'flowchart') {
    const decisions = nodes.filter((n) => n.data.shapeType === 'decision');
    for (const dec of decisions) {
      const outgoing = edges.filter((e) => e.source === dec.id);
      if (outgoing.length < 2) {
        warnings.push(
          `Decision "${dec.data.label}" has only ${outgoing.length} outgoing branch(es); expected at least 2 (Yes/No).`,
        );
      }
    }
  }

  const scorePercent = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const earnedPoints = Math.round((scorePercent / 100) * maxPoints);

  return {
    scorePercent,
    earnedPoints,
    maxPoints,
    passedChecks,
    missingChecks,
    warnings,
    requiresManualReview: scorePercent > 0 && scorePercent < 100,
  };
}

/**
 * Deterministic vector SVG serializer from React Flow graph state (works offline & in tests).
 */
export function exportDiagramToSvg(
  title: string,
  nodes: readonly Node<DiagramNodeData>[],
  edges: readonly Edge[],
): string {
  if (nodes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="100%" height="100%" fill="#ffffff"/><text x="30" y="40" font-family="Inter, sans-serif" font-size="14" fill="#64748b">${title} (Empty)</text></svg>`;
  }

  const pad = 40;
  const minX = Math.min(...nodes.map((n) => n.position.x)) - pad;
  const minY = Math.min(...nodes.map((n) => n.position.y)) - pad;
  const maxX = Math.max(...nodes.map((n) => n.position.x + (n.data.width || 160))) + pad;
  const maxY = Math.max(...nodes.map((n) => n.position.y + (n.data.height || 70))) + pad;
  const width = Math.max(400, Math.round(maxX - minX));
  const height = Math.max(260, Math.round(maxY - minY));

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const edgeSvg = edges
    .map((e) => {
      const src = nodeById.get(e.source);
      const tgt = nodeById.get(e.target);
      if (!src || !tgt) return '';
      const x1 = src.position.x + (src.data.width || 160) / 2 - minX;
      const y1 = src.position.y + (src.data.height || 60) / 2 - minY;
      const x2 = tgt.position.x + (tgt.data.width || 160) / 2 - minX;
      const y2 = tgt.position.y + (tgt.data.height || 60) / 2 - minY;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2 - 6;
      const dash = e.style?.strokeDasharray ? ` stroke-dasharray="${e.style.strokeDasharray}"` : '';
      const lbl = e.label
        ? `<text x="${mx}" y="${my}" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#334155">${esc(String(e.label))}</text>`
        : '';
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#475569" stroke-width="1.8"${dash} marker-end="url(#arrow)" />${lbl}`;
    })
    .join('\n  ');

  const nodeSvg = nodes
    .map((n) => {
      const x = n.position.x - minX;
      const y = n.position.y - minY;
      const w = n.data.width || 160;
      const h = n.data.height || 64;
      const fill = n.data.fillColor === 'transparent' ? 'none' : n.data.fillColor || '#ffffff';
      const stroke = n.data.strokeColor || '#0f172a';
      const textColor = fill === '#0f172a' || fill === '#c81e1e' ? '#ffffff' : '#0f172a';
      const rx =
        n.data.shapeType === 'usecase' || n.data.shapeType === 'initial' || n.data.shapeType === 'final'
          ? Math.min(w, h) / 2
          : n.data.shapeType === 'action' || n.data.shapeType === 'terminator'
            ? 14
            : 4;
      return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${n.data.strokeWidth || 2}" />
    <text x="${x + w / 2}" y="${y + Math.min(24, h / 2 + 4)}" text-anchor="middle" font-family="Inter, sans-serif" font-size="${n.data.fontSize || 12}" font-weight="600" fill="${textColor}">${esc(n.data.label)}</text>
  </g>`;
    })
    .join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff" />
  ${edgeSvg}
  ${nodeSvg}
</svg>`;
}
