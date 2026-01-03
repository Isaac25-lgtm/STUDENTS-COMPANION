// Gemini API Service for Research Proposal Generation
// Uses chapter-by-chapter generation to produce genuinely long proposals

import type { ResearchFormData } from '../types/research';

// API Key is loaded from environment variable (.env.local)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Models in order of preference (fallback chain)
const FALLBACK_MODELS = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash'
];

// Sections to generate separately for a complete proposal
const PROPOSAL_SECTIONS = [
  { id: 'titleAbstract', name: 'Title Page & Abstract', targetWords: 400 },
  { id: 'chapter1', name: 'Chapter 1: Introduction', targetWords: 2000 },
  { id: 'chapter2a', name: 'Chapter 2: Theoretical Review', targetWords: 1500 },
  { id: 'chapter2b', name: 'Chapter 2: Empirical Review & Gap', targetWords: 2000 },
  { id: 'chapter3a', name: 'Chapter 3: Methodology (Design & Sampling)', targetWords: 1500 },
  { id: 'chapter3b', name: 'Chapter 3: Methodology (Data & Ethics)', targetWords: 1200 },
  { id: 'chapter4', name: 'Chapter 4: Work Plan & Budget', targetWords: 600 },
  { id: 'chapter5', name: 'Chapter 5: Expected Findings', targetWords: 500 },
  { id: 'references', name: 'References', targetWords: 800 },
  { id: 'appendices', name: 'Appendices', targetWords: 1000 },
];

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// Progress callback type
export type ProgressCallback = (progress: number, currentSection: string) => void;

// Helper function to try models in sequence
async function generateContentWithFallback(prompt: string, maxTokens: number = 16000): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  let lastError: Error | null = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Model ${model} failed with status ${response.status}: ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || '';

    } catch (error) {
      console.warn(`Attempt with ${model} failed:`, error);
      lastError = error as Error;
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
}

// Main proposal generation - chapter by chapter
export async function generateProposal(
  formData: ResearchFormData,
  onProgress?: ProgressCallback
): Promise<string> {
  const sections: string[] = [];
  const totalSections = PROPOSAL_SECTIONS.length;

  for (let i = 0; i < PROPOSAL_SECTIONS.length; i++) {
    const section = PROPOSAL_SECTIONS[i];
    const progressPercent = Math.round((i / totalSections) * 100);
    
    onProgress?.(progressPercent, section.name);

    // Build context from previous sections (truncated to avoid token overflow)
    const previousContent = sections.join('\n\n');
    const contextSummary = previousContent.length > 8000 
      ? previousContent.substring(previousContent.length - 8000)
      : previousContent;

    const prompt = buildSectionPrompt(formData, section.id, section.targetWords, contextSummary);
    const content = await generateContentWithFallback(prompt, 8000);
    sections.push(content);
  }

  onProgress?.(100, 'Complete!');
  return sections.join('\n\n');
}

// Build prompt for a specific section
function buildSectionPrompt(
  data: ResearchFormData,
  sectionId: string,
  targetWords: number,
  previousContent: string
): string {
  const baseContext = getBaseContext(data);
  const writingRules = getWritingRules();
  
  const sectionInstructions = getSectionInstructions(sectionId, data, targetWords);

  return `${baseContext}

${writingRules}

PREVIOUS SECTIONS WRITTEN (for context and consistency):
${previousContent || '[This is the first section]'}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK NOW
═══════════════════════════════════════════════════════════════════════════════

${sectionInstructions}

IMPORTANT:
- Write approximately ${targetWords} words for this section
- Maintain consistency with any previous sections
- Do NOT include sections that come after this one
- Do NOT write a fake word count at the end
- Just write the content naturally and stop when the section is complete

BEGIN WRITING THIS SECTION NOW:`;
}

function getBaseContext(data: ResearchFormData): string {
  const theoriesText = data.preferredTheories.length > 0 
    ? data.preferredTheories.join(', ')
    : 'Let AI suggest based on topic';

  return `ROLE
You are an expert academic researcher writing a Masters-level research proposal for a Ugandan university. Write in clear, natural academic English that sounds human-written.

STUDENT INFORMATION
Student Name: ${data.studentName || '[Student Name]'}
Registration No: ${data.regNo || '[Registration Number]'}
Program: ${data.program}
Department: ${data.department}
University: ${data.university}
Date: ${data.monthYear}

RESEARCH DETAILS
Topic: ${data.topic}
Research Design: ${data.design === 'quantitative' ? 'Quantitative cross-sectional' : 'Mixed methods'}
Study Area: ${data.studyArea || 'To be determined based on topic'}
Timeline: ${data.timelineWeeks} weeks
Include Budget: ${data.includeBudget}
Currency: ${data.currency}

PREFERRED THEORETICAL FRAMEWORKS: ${theoriesText}

UNIVERSITY-SPECIFIC REQUIREMENTS:
${data.universityFormatInstructions || 'Use standard academic format.'}

ADDITIONAL INSTRUCTIONS: ${data.additionalInstructions || 'None.'}`;
}

function getWritingRules(): string {
  return `═══════════════════════════════════════════════════════════════════════════════
WRITING STYLE RULES (FOLLOW STRICTLY)
═══════════════════════════════════════════════════════════════════════════════

1. AVOID AI CLICHÉS: Never use "In today's digital age", "It is important to note", "This study aims to explore", "delve into", "leverage", "robust", "holistic", "myriad", "plethora", "paradigm shift", "synergy", "utilize", "facilitate", "in terms of".

2. AVOID HYPHEN CHAINS: Never use phrases like "mobile-money-driven-growth". Rewrite as "growth driven by mobile money".

3. VARY SENTENCES: Mix short (8-12 words), medium (15-25), and long (25-35) sentences. Don't start consecutive sentences the same way.

4. CITATIONS: Use APA 7th Edition. High density in literature review. Use Uganda-specific sources (UBOS, Bank of Uganda, GSMA) for local claims.

5. TENSES: Future for methodology ("will examine"), Past for literature ("found that"), Present for facts ("is defined as").

6. NO ASCII ART OR TEXT DIAGRAMS: Never use text-based arrows like "[X] --> [Y]" or "[Variable] --(+)--> [Variable]". These look unprofessional. Instead, describe relationships in prose or use properly formatted tables.

7. NO FAKE WORD COUNTS: Never write "Word count: X" at the end. Just write the content.`;
}

function getSectionInstructions(sectionId: string, data: ResearchFormData, targetWords: number): string {
  switch (sectionId) {
    case 'titleAbstract':
      return `Write the TITLE PAGE and ABSTRACT.

TITLE PAGE should include:
- Full research title (centered, bold, uppercase)
- "A Research Proposal Submitted to ${data.department}"
- "In Partial Fulfillment of the Requirements for ${data.program}"
- Student name and registration number
- University name
- Date: ${data.monthYear}

ABSTRACT (200-300 words):
- Background context (1-2 sentences)
- Problem statement (1 sentence)
- Study objective (1 sentence)
- Methodology overview (2-3 sentences)
- Expected findings (1-2 sentences)
- Significance (1 sentence)

Target: ~${targetWords} words total.`;

    case 'chapter1':
      return `Write CHAPTER ONE: INTRODUCTION

Include these sections with substantial content:
1.1 Background to the Study
    - Use funnel approach: Global → Africa → Uganda
    - Cite statistics and recent developments
    - Establish why this topic matters NOW

1.2 Statement of the Problem
    - Evidence-based, specific gap
    - What's wrong, what's missing, why it matters
    - Cite supporting evidence

1.3 Purpose of the Study
    - One clear overarching statement

1.4 Objectives of the Study
    - General Objective (1)
    - Specific Objectives (3-5, using action verbs: examine, assess, determine, analyze)

1.5 Research Questions
    - One question per specific objective

1.6 Research Hypotheses
    - Directional hypotheses aligned with objectives
    - Format: "There is a significant positive/negative relationship between X and Y"

1.7 Scope of the Study
    - Content scope, Geographical scope, Time scope

1.8 Significance of the Study
    - Theoretical contribution
    - Practical contribution
    - Policy contribution

1.9 Definition of Key Terms
    - Define 5-8 key concepts operationally

Target: ~${targetWords} words.`;

    case 'chapter2a':
      return `Write the first part of CHAPTER TWO: LITERATURE REVIEW

Include:
2.1 Introduction
    - Brief overview of chapter structure

2.2 Theoretical Review
    - Present 2-3 relevant theories
    - For EACH theory include:
      * Origin and key proponents (with citations)
      * Core constructs and concepts
      * How it explains your research variables
      * Relevance to Uganda context
      * Brief limitations

Write in academic prose, not bullet points. Synthesize ideas across paragraphs.

Target: ~${targetWords} words.`;

    case 'chapter2b':
      return `Write the second part of CHAPTER TWO: LITERATURE REVIEW

Include:
2.3 Empirical Review
    - Organize by THEMES, not by individual studies
    - Each paragraph synthesizes multiple sources
    - Cover: relationships between variables, moderating factors, contradictory findings
    - Include both international and Uganda-specific studies

2.4 Study Compatibility Matrix
    - Create a table with 8-12 studies
    - Columns: Author(s)/Year | Setting & Design | Key Findings | Relevance to This Study

2.5 Research Gap
    - What is specifically missing in Uganda context?
    - How does your study address this gap?

2.6 Conceptual Framework

IMPORTANT: Do NOT use text-based arrows like "[X] --> [Y]" or ASCII diagrams. These look unprofessional.

Instead, present the conceptual framework as follows:

A) NARRATIVE DESCRIPTION (2-3 paragraphs):
   - Explain the theoretical logic connecting your variables
   - Describe how the independent variable influences the dependent variable
   - Explain any mediating or moderating effects

B) FRAMEWORK COMPONENTS TABLE:
   Create a professional table with these columns:
   | Variable Type | Variable Name | Dimensions/Indicators | Role in Study |
   
   Include rows for:
   - Independent Variable(s)
   - Dependent Variable(s)  
   - Mediating Variable(s) if applicable
   - Moderating Variable(s) if applicable
   - Control Variables

C) HYPOTHESIZED RELATIONSHIPS TABLE:
   | Hypothesis | Relationship | Expected Direction | Theoretical Basis |
   | H₁ | IV → DV | Positive (+) | Based on [Theory Name] |
   | H₂ | Mediator effect | Positive (+) | Based on [Theory Name] |
   etc.

D) Add this note at the end:
   "Note: A visual diagram of this conceptual framework should be created using Microsoft PowerPoint, Visio, or similar software, based on the relationships specified above. The diagram should show boxes for each variable connected by arrows indicating the hypothesized relationships."

2.7 Summary of Literature Review

Target: ~${targetWords} words.`;

    case 'chapter3a':
      return `Write the first part of CHAPTER THREE: METHODOLOGY

Include:
3.1 Introduction
    - Brief overview

3.2 Research Design
    - State: ${data.design === 'quantitative' ? 'Quantitative cross-sectional design' : 'Mixed methods design'}
    - Justify why this design is appropriate

3.3 Study Area
    - Describe ${data.studyArea || 'the selected location in Uganda'}
    - Relevant characteristics

3.4 Study Population
    - Define target population clearly
    - Inclusion and exclusion criteria

3.5 Sample Size Determination
    - Show the FULL calculation using Cochran (1977) or Yamane (1967)
    - State formula with all variables defined
    - Show substitution with actual numbers
    - Calculate step by step
    - Add 10-15% for non-response
    - State final sample size

3.6 Sampling Procedure
    - Describe technique (stratified, purposive, etc.)
    - Justify the choice
    - Explain implementation steps

Target: ~${targetWords} words.`;

    case 'chapter3b':
      return `Write the second part of CHAPTER THREE: METHODOLOGY

Include:
3.7 Variables and Operationalization
    - Create a detailed table with columns:
      Variable | Type (IV/DV/Mediator/etc.) | Operational Definition | Indicators | Scale | Sample Item | Source

3.8 Data Collection Methods and Instruments
    - Describe questionnaire structure
    - ${data.design === 'mixed' ? 'Describe interview guide for qualitative component' : ''}
    - Pilot testing plan

3.9 Validity and Reliability
    - Content validity (expert review)
    - Construct validity
    - Reliability (Cronbach's alpha target ≥ 0.7)

3.10 Data Management and Analysis Plan
    - Data entry and cleaning
    - Descriptive statistics
    - Inferential statistics (correlation, regression)
    - Software to be used (SPSS, STATA)
    - Diagnostic tests

3.11 Ethical Considerations
    - Informed consent
    - Confidentiality
    - Voluntary participation
    - Right to withdraw
    - IRB approval

3.12 Limitations and Delimitations
    - Acknowledge limitations honestly
    - State mitigation strategies

Target: ~${targetWords} words.`;

    case 'chapter4':
      return `Write CHAPTER FOUR: WORK PLAN AND BUDGET

4.1 Work Plan
    - Create a Gantt-style table for ${data.timelineWeeks} weeks
    - Activities: Proposal finalization, Ethical clearance, Tool development, Pilot testing, Data collection, Data entry, Analysis, Report writing, Defense preparation
    - Mark periods with symbols like ████

${data.includeBudget === 'NO' ? '4.2 Budget: SKIP (student opted out)' : `4.2 Budget
    - Currency: ${data.currency}
    ${data.includeBudget === 'YES' ? `- Detailed table with columns: Item | Description | Unit Cost | Quantity | Total | Justification
    - Include: Personnel, Transport, Communication, Materials, Software, Miscellaneous
    - Add 10% contingency
    - Show GRAND TOTAL` : '- Summary table with categories and totals only'}`}

Target: ~${targetWords} words.`;

    case 'chapter5':
      return `Write CHAPTER FIVE: EXPECTED FINDINGS, CONTRIBUTION, AND DISSEMINATION

5.1 Expected Findings
    - Aligned with each specific objective
    - Written tentatively ("It is expected that...", "The study anticipates...")
    - Be specific about expected relationships and directions

5.2 Expected Contribution
    - Theoretical contribution (how it advances theory)
    - Practical contribution (how practitioners will benefit)
    - Policy contribution (implications for regulators/government)

5.3 Dissemination Plan
    - Academic: Target journals, conferences
    - Practitioner: Policy briefs, stakeholder workshops
    - Community: Feedback to participants

Target: ~${targetWords} words.`;

    case 'references':
      return `Write the REFERENCES section.

- Use APA 7th Edition format strictly
- Alphabetical order by first author's surname
- Include 30-40 references minimum
- Mix:
  * 60-70% peer-reviewed journal articles (recent, 2018-2024)
  * 20-30% institutional reports (UBOS, Bank of Uganda, World Bank, GSMA)
  * 5-10% books or book chapters

Ensure ALL citations mentioned in previous chapters appear here.
Include Uganda-specific sources.

Target: ~${targetWords} words (approximately 30-40 complete references).`;

    case 'appendices':
      return `Write the APPENDICES section.

APPENDIX A: INFORMED CONSENT FORM
- Study title
- Researcher name and contact
- Purpose of the study
- What participation involves
- Risks and benefits
- Confidentiality assurance
- Voluntary participation statement
- Right to withdraw
- Signature and date lines

APPENDIX B: QUESTIONNAIRE
- Clear instructions
- Section A: Demographics (5-8 items)
- Section B: Independent Variable items (based on operationalization)
- Section C: Dependent Variable items
- Use Likert scales as specified in methodology
- Number all items clearly

${data.design === 'mixed' ? `APPENDIX C: INTERVIEW GUIDE
- 8-12 open-ended questions
- Aligned with specific objectives
- Include probing questions` : ''}

Target: ~${targetWords} words.`;

    default:
      return `Write the next section of the proposal. Target: ~${targetWords} words.`;
  }
}

// Ask AI Module - Uses Gemini Flash for fast concept explanations
const ASK_AI_SYSTEM_PROMPT = `You are an expert academic tutor helping university students understand complex concepts. Your role is to explain topics clearly and thoroughly.

GUIDELINES:
1. Start with a brief, accessible overview
2. Break down complex concepts into understandable parts
3. Use real-world examples and analogies
4. Be thorough but concise
5. Use bullet points and numbered lists for clarity
6. End with key takeaways when appropriate
7. Be encouraging and supportive

You can help with any academic subject including sciences, mathematics, social sciences, humanities, business, health sciences, engineering, and more.

STYLE:
- Write in clear, natural language
- Avoid jargon unless explaining it
- Use formatting (bold, bullets) for readability
- Be direct and helpful`;

export interface AskAIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAI(
  userMessage: string,
  conversationHistory: AskAIMessage[] = []
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  // Build conversation context
  let conversationContext = '';
  if (conversationHistory.length > 0) {
    conversationContext = '\n\nPREVIOUS CONVERSATION:\n' + 
      conversationHistory.slice(-6).map(msg => 
        `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`
      ).join('\n\n');
  }

  const prompt = `${ASK_AI_SYSTEM_PROMPT}
${conversationContext}

STUDENT'S QUESTION:
${userMessage}

YOUR RESPONSE:`;

  // Use Flash model for speed (prioritize gemini-3-flash, then fallback)
  const flashModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-flash'
  ];

  let lastError: Error | null = null;

  for (const model of flashModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 4000,
            temperature: 0.7,
            topP: 0.9,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data: GeminiResponse = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('No content in Gemini response');
      }

      return text;
    } catch (error) {
      console.warn(`Ask AI model ${model} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  throw lastError || new Error('All Gemini models failed for Ask AI');
}

// Follow-up chat function (unchanged)
export async function sendFollowUp(
  topic: string,
  university: string,
  query: string,
  currentProposal: string
): Promise<string> {
  const maxLength = 15000;
  const truncatedProposal = currentProposal.length > maxLength
    ? currentProposal.substring(currentProposal.length - maxLength)
    : currentProposal;

  const prompt = `You are helping a Ugandan university student revise their research proposal.

CONTEXT
Topic: ${topic}
University: ${university}

STUDENT'S REQUEST
${query}

CURRENT PROPOSAL (excerpt)
${truncatedProposal}

INSTRUCTIONS
1. Address the specific request
2. Maintain consistency with existing content
3. Use natural academic language (no AI clichés)
4. If editing, provide complete revised section
5. Use APA 7 citations

Respond helpfully:`;

  return generateContentWithFallback(prompt, 8000);
}
