/**
 * Coursework Generator Service
 * Uses Gemini 2.0 Flash for generating distinction-level coursework
 */

import type { CourseworkGeneratorInputs } from '../types/coursework';
import { getMinSources } from '../types/coursework';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Gemini models - Gemini 3 Flash (Jan 2026)
const COURSEWORK_MODELS = [
  'gemini-3-flash-preview',       // Primary - Gemini 3 Flash
  'gemini-3-pro-preview',         // Fallback - Gemini 3 Pro
  'gemini-2.5-flash',             // Mature fallback
  'gemini-2.0-flash-exp',         // Experimental fallback
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

export type GenerationProgressCallback = (progress: number, status: string) => void;

/**
 * Build the master prompt for coursework generation
 */
function buildCourseworkPrompt(inputs: CourseworkGeneratorInputs): string {
  const wordCount = inputs.wordCount === 'custom' 
    ? (inputs.customWordCount || 4000) 
    : inputs.wordCount;
  
  const sourceReq = getMinSources(wordCount);

  return `You are an expert academic writing assistant specializing in producing publication-quality coursework for ${inputs.academicLevel} students. You write with the precision of a distinguished professor, the clarity of a professional editor, and the insight of a subject-matter expert in ${inputs.discipline || 'General Academic'}.

Your task is to produce a complete, submission-ready coursework document that would earn a distinction (70%+) at a top university.

=== ASSIGNMENT DETAILS ===

ASSIGNMENT QUESTION/TOPIC:
${inputs.assignmentQuestion}

COURSEWORK TYPE: ${inputs.courseworkType}
WORD COUNT TARGET: ${wordCount} words (±5% tolerance)
ACADEMIC LEVEL: ${inputs.academicLevel}
DISCIPLINE/FIELD: ${inputs.discipline || 'General Academic'}
GEOGRAPHIC FOCUS: ${inputs.geographicFocus || 'Global'}
CITATION STYLE: ${inputs.citationStyle}

STUDENT DETAILS (for cover page):
- Name: ${inputs.studentName || '[Student Name]'}
- University: ${inputs.universityName || '[University Name]'}
- Course: ${inputs.courseCodeName || '[Course Code - Course Name]'}
- Lecturer: ${inputs.lecturerName || '[Lecturer Name]'}
- Submission Date: ${inputs.submissionDate || '[Date]'}

SPECIFIC REQUIREMENTS:
- Required theorists/frameworks: ${inputs.requiredTheorists || 'None specified'}
- Required sources: ${inputs.requiredSources || 'None specified'}
- Additional instructions: ${inputs.additionalInstructions || 'None'}

=== OUTPUT STRUCTURE ===

Generate the coursework with these sections (allocate word counts proportionally based on ${wordCount}):

1. TITLE PAGE (not counted)
   - Full descriptive title (10-15 words)
   - Subtitle if applicable
   - Student name, university, course, lecturer, date
   - Word count declaration

2. ABSTRACT (5% of word count)
   - Single paragraph: context, objective, methodology, findings, conclusion
   - 5-7 keywords at the end

3. INTRODUCTION (10-12% of word count)
   - Opening hook establishing significance
   - Background context and key definitions
   - Clear thesis statement (your argument/position)
   - Scope and limitations
   - Structure overview (roadmap)

4. THEORETICAL/CONCEPTUAL FRAMEWORK (15-20% of word count)
   - 2-3 relevant theories from established scholars
   - Explain each theory's relevance
   - Identify your primary theoretical lens

5. MAIN BODY — LITERATURE REVIEW & ANALYSIS (40-45% of word count)
   Divide into 2-4 thematic sections, each with:
   - Clear section heading
   - Topic sentence stating the argument
   - Evidence from peer-reviewed sources
   - Critical analysis (not description)
   - Counter-arguments and limitations
   - Synthesis connecting to thesis

6. DISCUSSION (10-12% of word count)
   - Synthesize findings
   - Policy/practical/theoretical implications
   - Limitations of analysis
   - Future research directions

7. CONCLUSION (5-7% of word count)
   - Restate thesis and main arguments
   - Summarize key findings
   - Final insight or call to action
   - NO new information

8. REFERENCES (not counted)
   - Minimum sources: ${sourceReq.min}-${sourceReq.max}
   - At least 70% peer-reviewed journals
   - Include seminal works + recent (within 5 years)
   - Format strictly per ${inputs.citationStyle}

=== DISTINCTION-LEVEL QUALITY STANDARDS ===

1. ARGUMENTATION
   - Clear, defensible thesis in introduction
   - Every paragraph advances the argument
   - Counter-arguments addressed and refuted
   - Logical, evidence-based conclusion

2. CRITICAL ANALYSIS (NOT DESCRIPTION)
   - Evaluate sources, don't just report them
   - Compare/contrast scholarly perspectives
   - Identify strengths, weaknesses, gaps
   - Synthesize to create new insights
   - Use: "This suggests...", "However, this view is limited by...", "A more nuanced interpretation would..."

3. EVIDENCE INTEGRATION
   - Every claim supported by evidence
   - Direct quotes sparingly (max 2-3 per 1,000 words)
   - Prefer paraphrasing with citations
   - Never drop quotes without analysis

4. THEORETICAL APPLICATION
   - Explicitly connect analysis to framework
   - Use theory to explain, not as decoration

5. ACADEMIC VOICE
   - Third person (no "I think", "In my opinion")
   - Appropriate hedging ("suggests", "indicates", "appears to")
   - Formal register, no colloquialisms
   - No contractions ever

6. REGIONAL RELEVANCE (if geographic focus specified)
   - Context-specific data and examples
   - Regional sources and institutions
   - Local policy frameworks
   - Relevant case studies

=== ANTI-AI DETECTION RULES (CRITICAL) ===

1. SENTENCE VARIATION
   - Mix short (8-12 words), medium (15-20), long (25-35)
   - Never start 2+ consecutive paragraphs the same way
   - Avoid repetitive structures
   - Avoid using hyphens in the middle of sentences unless strictly it is part of the word

2. BANNED PHRASES (Never use):
   - "In today's rapidly changing world..."
   - "It is important to note that..."
   - "This is a complex issue..."
   - "There are many factors to consider..."
   - "In conclusion, it can be said that..."
   - "This essay will discuss..."
   - "Many scholars have argued..."
   - "It is widely recognized that..."
   - "The importance of X cannot be overstated..."
   - "This raises important questions..."
   - "Moving forward...", "At the end of the day..."
   - "First and foremost...", "Last but not least..."
   - "delve", "crucial", "comprehensive", "multifaceted", "nuanced"
   - "landscape", "realm", "sphere"
   - "leveraging", "utilizing", "facilitating"

3. TRANSITION LIMITS
   - Maximum 2 transition words per paragraph
   - Don't repeat "However"/"Furthermore" within 500 words
   - Use logical flow over explicit markers

4. PARAGRAPH VARIATION
   - Vary lengths (4-5 sentences to 6-8)
   - Occasionally start with evidence, not topic sentence
   - Rhetorical questions max 1-2 in entire document

5. NATURAL WRITING MARKERS
   - Occasional parenthetical asides
   - Em-dashes for emphasis — sparingly
   - Vary citation placement in sentences
   - Some complex sentences (as real academic writing has)

6. SPECIFICITY
   - Specific examples, names, dates, figures
   - Actual institutions, policies, events
   - Precise statistics over vague claims
   - Name specific scholars, not "many researchers"

7. HYPHENATION
   - Correct usage: "well-established theory" vs "the theory is well established"
   - "decision-making process" vs "the process of decision making"

8. NO CONTRACTIONS
   - "cannot" not "can't", "does not" not "doesn't"

=== SOURCE REQUIREMENTS ===

TYPES (priority order):
1. Peer-reviewed journal articles (minimum 70%)
2. Seminal books and book chapters
3. Institutional reports (World Bank, IMF, central banks, UN)
4. Government publications
5. Working papers from reputable institutions
6. Quality news (recent events only)

RECENCY:
- 50% from last 5 years
- Include foundational works regardless of date

REGIONAL SOURCES (if specified):
- Uganda: Bank of Uganda, UBOS, MoFPED, Makerere research
- Kenya: CBK, KNBS, regional journals
- East Africa: EAC, AERC working papers
- Africa: AfDB, AU, African journals

=== FINAL CHECKLIST ===

Before output, verify:
□ Word count within ±5% of target
□ Thesis clear in introduction
□ Every paragraph connects to thesis
□ All claims have evidence
□ Counter-arguments addressed
□ Theoretical framework applied
□ Critical analysis throughout
□ Regional context (if specified)
□ Citations correctly formatted
□ References complete
□ No AI-typical phrases
□ Sentence structure varies
□ Academic tone maintained
□ No contractions
□ Conclusion synthesizes only

=== OUTPUT FORMAT ===

Generate complete coursework with clear section headings:
- Main headings: Bold, numbered (1. Introduction, 2. Theoretical Framework...)
- Sub-headings: Bold, numbered (2.1 Financial Intermediation Theory...)
- Body: Standard paragraphs
- Block quotes: Indented for 40+ words
- References: Hanging indent format

BEGIN GENERATING NOW.`;
}

/**
 * Generate coursework using Gemini API
 */
export async function generateCoursework(
  inputs: CourseworkGeneratorInputs,
  onProgress?: GenerationProgressCallback
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  const wordCount = inputs.wordCount === 'custom' 
    ? (inputs.customWordCount || 4000) 
    : inputs.wordCount;

  // Calculate appropriate max tokens (roughly 1.5 tokens per word + buffer)
  const maxTokens = Math.min(Math.ceil(wordCount * 2) + 4000, 32000);

  onProgress?.(10, 'Building prompt...');

  const prompt = buildCourseworkPrompt(inputs);

  onProgress?.(20, 'Connecting to AI...');

  let lastError: Error | null = null;

  for (const model of COURSEWORK_MODELS) {
    try {
      console.log(`🔄 Trying model: ${model}...`);
      onProgress?.(30, `Generating with ${model}...`);

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
        console.warn(`❌ Model ${model} failed with status ${response.status}`);
        throw new Error(`Model ${model} failed: ${response.status} - ${errorText}`);
      }

      onProgress?.(70, 'Processing response...');

      const data: GeminiResponse = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!generatedText) {
        throw new Error('No content generated');
      }

      console.log(`✅ Successfully generated coursework with ${model}`);
      onProgress?.(90, 'Finalizing...');

      // Verify output quality
      const verification = verifyOutput(generatedText, wordCount);
      if (verification.issues.length > 0) {
        console.warn('Output verification issues:', verification.issues);
      }

      onProgress?.(100, 'Complete!');
      return generatedText;

    } catch (error) {
      console.warn(`❌ Model ${model} failed:`, error);
      lastError = error as Error;
    }
  }

  throw lastError || new Error('All Gemini models failed to generate coursework');
}

/**
 * Verify generated output meets requirements
 */
export function verifyOutput(text: string, targetWordCount: number): {
  status: 'pass' | 'fail';
  wordCount: number;
  issues: string[];
} {
  const issues: string[] = [];
  const wordCount = text.split(/\s+/).length;

  // Word count check (±5% tolerance)
  const tolerance = 0.05;
  const minWords = targetWordCount * (1 - tolerance);
  const maxWords = targetWordCount * (1 + tolerance);

  if (wordCount < minWords * 0.7) {
    issues.push(`Word count too low: ${wordCount} (target: ${targetWordCount})`);
  } else if (wordCount > maxWords * 1.3) {
    issues.push(`Word count too high: ${wordCount} (target: ${targetWordCount})`);
  }

  // Check for required sections
  const requiredSections = ['introduction', 'conclusion', 'references'];
  for (const section of requiredSections) {
    if (!text.toLowerCase().includes(section)) {
      issues.push(`Missing section: ${section}`);
    }
  }

  // Check for banned phrases
  const bannedPhrases = [
    'in today\'s rapidly changing world',
    'it is important to note that',
    'this is a complex issue',
    'in conclusion, it can be said that',
    'many scholars have argued',
    'first and foremost',
    'last but not least',
  ];
  
  for (const phrase of bannedPhrases) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) {
      issues.push(`Contains banned phrase: "${phrase}"`);
    }
  }

  // Check for contractions
  const contractions = ['can\'t', 'won\'t', 'don\'t', 'doesn\'t', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t'];
  for (const contraction of contractions) {
    if (text.toLowerCase().includes(contraction)) {
      issues.push(`Contains contraction: "${contraction}"`);
    }
  }

  return {
    status: issues.length === 0 ? 'pass' : 'fail',
    wordCount,
    issues,
  };
}

/**
 * Get estimated generation time based on word count
 */
export function getEstimatedTime(wordCount: number): string {
  const seconds = Math.ceil(30 + (wordCount / 1000) * 15);
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes}-${minutes + 1} minutes`;
}
