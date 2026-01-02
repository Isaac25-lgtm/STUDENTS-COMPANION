// Research Module Type Definitions

export interface ResearchFormData {
  // Step 1: Basic Information
  studentName: string;
  regNo: string;
  program: string;
  department: string;
  university: string;
  supervisor: string;
  monthYear: string;

  // Step 2: Research Topic & Design
  topic: string;
  design: 'quantitative' | 'mixed';
  studyArea: string;

  // Step 3: Document Specifications
  wordCount: number;
  timelineWeeks: number;
  includeBudget: 'YES' | 'SUMMARY_ONLY' | 'NO';
  currency: 'UGX' | 'USD' | 'KES' | 'TZS' | 'RWF';

  // Step 4: University Format
  hasUniversityFormat: boolean;
  universityFormatInstructions: string;

  // Step 5: Additional Preferences
  preferredTheories: string[];
  additionalInstructions: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  type: string;
  progress: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  formData: ResearchFormData;
  proposal: string;
  chatHistory: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const RESEARCH_DESIGNS = [
  { value: 'quantitative', label: 'Quantitative cross-sectional' },
  { value: 'mixed', label: 'Mixed methods' },
] as const;

export const WORD_COUNT_OPTIONS = [4000, 5000, 6000, 7000, 8000, 10000];

export const TIMELINE_OPTIONS = [8, 12, 16, 20, 24];

export const BUDGET_OPTIONS = [
  { value: 'YES', label: 'Yes - Detailed budget with line items' },
  { value: 'SUMMARY_ONLY', label: 'Summary Only - Categories and totals' },
  { value: 'NO', label: 'No - Omit budget section' },
] as const;

export const CURRENCY_OPTIONS = ['UGX', 'USD', 'KES', 'TZS', 'RWF'] as const;

export const THEORY_OPTIONS = [
  'Technology Acceptance Model (TAM)',
  'Diffusion of Innovations',
  'Transaction Cost Economics',
  'Financial Inclusion Theory',
  'Resource-Based View',
  'Institutional Theory',
  'Social Exchange Theory',
];

export const DEFAULT_FORM_DATA: ResearchFormData = {
  studentName: '',
  regNo: '',
  program: '',
  department: '',
  university: '',
  supervisor: '',
  monthYear: '',
  topic: '',
  design: 'quantitative',
  studyArea: '',
  wordCount: 6000,
  timelineWeeks: 16,
  includeBudget: 'YES',
  currency: 'UGX',
  hasUniversityFormat: false,
  universityFormatInstructions: '',
  preferredTheories: [],
  additionalInstructions: '',
};

