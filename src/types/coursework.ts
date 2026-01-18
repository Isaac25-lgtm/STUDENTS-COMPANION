// Coursework Module Type Definitions

// Re-export parsed coursework types from parser utility
export type {
  ParsedCoursework,
  ParsedSection,
  ParsedSubsection,
  ParsedTitlePage,
  ParsedAbstract,
} from '../utils/courseworkParser';

export interface CourseworkProject {
  id: string;
  assignmentText: string;
  assignmentType: string;
  wordCount: number;
  analyzedRequirements: string[];
  selectedApproach: 'quick' | 'guided' | 'outline';
  masterAnswers?: MasterPromptAnswers;
  sections: CourseworkSection[];
  totalWords: number;
  status: 'draft' | 'analyzing' | 'collecting-details' | 'writing' | 'complete';
  createdAt: number;
  lastUpdated: number;
  fullContent?: string; // For Quick Draft
  outline?: string[]; // For Outline Only
}

export interface CourseworkSection {
  id: number;
  name: string;
  content: string;
  words: number;
  targetWords: number;
  status: 'empty' | 'writing' | 'complete';
  chatHistory?: ChatMessage[];
}

export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp?: number;
}

// Master prompt answers (required for generation)
export interface MasterPromptAnswers {
  topic: string;
  courseUnit: string;
  level: 'Postgraduate Diploma' | 'MSc' | 'MPhil';
  institution: string;
  totalLength: string; // e.g., "2500 words" or "10 pages"
  assignmentType: 'essay' | 'technical report' | 'IMRaD paper' | 'literature review' | 'mini-dissertation chapter';
  dataset: 'real' | 'synthetic' | 'none';
  datasetDetails?: string;
  tools: string[]; // e.g., ['Python', 'R', 'SPSS']
  citationStyle: 'APA 7' | 'Harvard' | 'IEEE';
  rubric?: string;
  requiredSections?: string[];
  localContext?: string;
  deadline?: string;
}

export interface AnalysisResult {
  type: string;
  wordCount: number;
  requirements: string[];
  suggestedSections: string[];
}

// ============================================================================
// NEW COMPREHENSIVE COURSEWORK GENERATOR TYPES
// ============================================================================

export interface CourseworkGeneratorInputs {
  // REQUIRED FIELDS
  assignmentQuestion: string;
  wordCount: number | 'custom';
  customWordCount?: number;
  courseworkType: CourseworkType;
  academicLevel: AcademicLevel;
  citationStyle: CitationStyle;
  
  // OPTIONAL FIELDS
  geographicFocus?: GeographicFocus;
  discipline?: Discipline;
  requiredTheorists?: string;
  requiredSources?: string;
  universityName?: string;
  studentName?: string;
  courseCodeName?: string;
  submissionDate?: string;
  lecturerName?: string;
  additionalInstructions?: string;
}

export type CourseworkType = 
  | 'Critical Essay (Argue a position with evidence)'
  | 'Analytical Essay (Examine and interpret)'
  | 'Comparative Essay (Compare two or more concepts)'
  | 'Case Study Analysis'
  | 'Literature Review'
  | 'Research Report'
  | 'Reflective Essay'
  | 'Policy Brief'
  | 'Technical Report';

export type AcademicLevel = 
  | 'Undergraduate (Year 1-2)'
  | 'Undergraduate (Year 3-4)'
  | "Master's/Postgraduate"
  | 'PhD/Doctoral';

export type CitationStyle = 
  | 'APA 7th Edition'
  | 'Harvard'
  | 'Chicago (Author-Date)'
  | 'Chicago (Notes-Bibliography)'
  | 'MLA 9th Edition'
  | 'IEEE'
  | 'Vancouver'
  | 'Oxford/OSCOLA (Law)';

export type GeographicFocus = 
  | 'Global'
  | 'Uganda'
  | 'Kenya'
  | 'East Africa'
  | 'Sub-Saharan Africa'
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Latin America'
  | 'Middle East'
  | 'Other';

export type Discipline = 
  | 'Economics/Finance'
  | 'Business/Management'
  | 'Public Health'
  | 'Medicine'
  | 'Engineering'
  | 'Computer Science'
  | 'Law'
  | 'Political Science'
  | 'Sociology'
  | 'Psychology'
  | 'Education'
  | 'Environmental Science'
  | 'Agriculture'
  | 'Development Studies'
  | 'Public Policy'
  | 'Other';

export const WORD_COUNT_OPTIONS = [
  { value: 1500, label: '1,500 words (Short essay)' },
  { value: 2500, label: '2,500 words (Standard essay)' },
  { value: 4000, label: '4,000 words (Extended essay)', default: true },
  { value: 5000, label: '5,000 words (Research paper)' },
  { value: 'custom' as const, label: 'Custom' },
];

export const COURSEWORK_TYPES: CourseworkType[] = [
  'Critical Essay (Argue a position with evidence)',
  'Analytical Essay (Examine and interpret)',
  'Comparative Essay (Compare two or more concepts)',
  'Case Study Analysis',
  'Literature Review',
  'Research Report',
  'Reflective Essay',
  'Policy Brief',
  'Technical Report',
];

export const ACADEMIC_LEVELS: AcademicLevel[] = [
  'Undergraduate (Year 1-2)',
  'Undergraduate (Year 3-4)',
  "Master's/Postgraduate",
  'PhD/Doctoral',
];

export const CITATION_STYLES: CitationStyle[] = [
  'APA 7th Edition',
  'Harvard',
  'Chicago (Author-Date)',
  'Chicago (Notes-Bibliography)',
  'MLA 9th Edition',
  'IEEE',
  'Vancouver',
  'Oxford/OSCOLA (Law)',
];

export const GEOGRAPHIC_FOCUSES: GeographicFocus[] = [
  'Global',
  'Uganda',
  'Kenya',
  'East Africa',
  'Sub-Saharan Africa',
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'Latin America',
  'Middle East',
  'Other',
];

export const DISCIPLINES: Discipline[] = [
  'Economics/Finance',
  'Business/Management',
  'Public Health',
  'Medicine',
  'Engineering',
  'Computer Science',
  'Law',
  'Political Science',
  'Sociology',
  'Psychology',
  'Education',
  'Environmental Science',
  'Agriculture',
  'Development Studies',
  'Public Policy',
  'Other',
];

export const UNIVERSITY_OPTIONS = [
  'Makerere University',
  'Uganda Christian University',
  'Kyambogo University',
  'Mbarara University',
  'Uganda Martyrs University',
  'University of Nairobi',
  'Kenyatta University',
  'Strathmore University',
  'Other',
];

// Credit calculation
export function calculateCredits(wordCount: number): number {
  return Math.ceil((wordCount / 1000) * 10 + 5);
}

// Timeout calculation
export function getTimeoutSeconds(wordCount: number): number {
  return Math.ceil(30 + (wordCount / 1000) * 15);
}

// Source requirements
export function getMinSources(wordCount: number): { min: number; max: number } {
  if (wordCount <= 1500) return { min: 8, max: 12 };
  if (wordCount <= 2500) return { min: 12, max: 18 };
  if (wordCount <= 4000) return { min: 15, max: 25 };
  return { min: 20, max: 30 };
}


