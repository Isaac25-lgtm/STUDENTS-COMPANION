// Coursework Module Type Definitions

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

