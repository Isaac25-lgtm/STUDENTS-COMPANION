// Research Progress Tracker
// Ensures users complete sections in the correct order
// Flow: Proposal (Ch 1-3) → Results (Ch 4) → Discussion (Ch 5)

export interface ResearchProgress {
  // Chapter completion status
  proposalCompleted: boolean;     // Chapters 1-3 + References
  resultsCompleted: boolean;      // Chapter 4: Results
  discussionCompleted: boolean;   // Chapter 5: Discussion
  
  // Chapter content
  proposalData?: string;          // Chapters 1-3 content
  resultsData?: string;           // Chapter 4 content
  discussionData?: string;        // Chapter 5 content
  
  // Metadata
  topic?: string;
  lastUpdated?: number;
}

const STORAGE_KEY = 'research_progress';

export function getResearchProgress(): ResearchProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading research progress:', error);
  }
  
  return {
    proposalCompleted: false,
    resultsCompleted: false,
    discussionCompleted: false,
  };
}

export function saveResearchProgress(progress: Partial<ResearchProgress>): void {
  try {
    const current = getResearchProgress();
    const updated = {
      ...current,
      ...progress,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving research progress:', error);
  }
}

export function clearResearchProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing research progress:', error);
  }
}

export function canAccessSection(section: 'proposal' | 'results' | 'discussion'): {
  allowed: boolean;
  message?: string;
  requiredSection?: string;
} {
  const progress = getResearchProgress();
  
  switch (section) {
    case 'proposal':
      // Proposal is always accessible (starting point)
      return { allowed: true };
      
    case 'results':
      if (!progress.proposalCompleted) {
        return {
          allowed: false,
          message: 'Please complete Chapters 1-3 (Proposal) first before working on Chapter 4 (Results).',
          requiredSection: 'Proposal (Chapters 1-3)',
        };
      }
      return { allowed: true };
      
    case 'discussion':
      if (!progress.proposalCompleted) {
        return {
          allowed: false,
          message: 'Please complete Chapters 1-3 (Proposal) first.',
          requiredSection: 'Proposal (Chapters 1-3)',
        };
      }
      if (!progress.resultsCompleted) {
        return {
          allowed: false,
          message: 'Please complete Chapter 4 (Results) first before working on Chapter 5 (Discussion).',
          requiredSection: 'Results (Chapter 4)',
        };
      }
      return { allowed: true };
      
    default:
      return { allowed: false };
  }
}

export function isResearchComplete(): boolean {
  const progress = getResearchProgress();
  return progress.proposalCompleted && progress.resultsCompleted && progress.discussionCompleted;
}

export function getCompletedChapters(): string[] {
  const progress = getResearchProgress();
  const completed: string[] = [];
  
  if (progress.proposalCompleted) completed.push('Ch 1-3');
  if (progress.resultsCompleted) completed.push('Ch 4');
  if (progress.discussionCompleted) completed.push('Ch 5');
  
  return completed;
}
