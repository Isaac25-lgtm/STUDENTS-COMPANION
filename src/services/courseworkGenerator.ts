/**
 * Coursework Generator Service
 * Uses Gemini for generating distinction-level coursework with XML-tag structured output
 */

import type { CourseworkGeneratorInputs } from '../types/coursework';
import { getMinSources } from '../types/coursework';
import { parseCoursework, type ParsedCoursework } from '../utils/courseworkParser';

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

export { parseCoursework, type ParsedCoursework };

/**
 * Build the master prompt for coursework generation with XML-tag structured output
 */
function buildCourseworkPrompt(inputs: CourseworkGeneratorInputs): string {
  const wordCount = inputs.wordCount === 'custom' 
    ? (inputs.customWordCount || 4000) 
    : inputs.wordCount;
  
  const sourceReq = getMinSources(wordCount);
  const abstractWords = Math.round(wordCount * 0.05);

  return `You are an expert academic writing assistant producing ${inputs.academicLevel}-level coursework.

=== ASSIGNMENT ===
QUESTION: ${inputs.assignmentQuestion}
TYPE: ${inputs.courseworkType}
WORD COUNT: ${wordCount} words
LEVEL: ${inputs.academicLevel}
CITATION STYLE: ${inputs.citationStyle}
GEOGRAPHIC FOCUS: ${inputs.geographicFocus || 'Global'}
DISCIPLINE: ${inputs.discipline || 'General Academic'}

STUDENT DETAILS:
Name: ${inputs.studentName || '[Student Name]'}
University: ${inputs.universityName || '[University Name]'}
Course: ${inputs.courseCodeName || '[Course Code - Course Name]'}
Lecturer: ${inputs.lecturerName || '_________________________ (to be filled)'}
Date: ${inputs.submissionDate || '[Date]'}

ADDITIONAL REQUIREMENTS:
Required theorists: ${inputs.requiredTheorists || 'None specified'}
Required sources: ${inputs.requiredSources || 'None specified'}
Additional instructions: ${inputs.additionalInstructions || 'None'}

=== CRITICAL OUTPUT RULES ===

FORBIDDEN - DO NOT USE ANY OF THESE:
- ** for bold (NO **text**)
- ## for headings (NO ## Heading)
- --- for lines
- * for bullets or emphasis
- \`\`\` for code blocks
- Any markdown formatting whatsoever

REQUIRED OUTPUT FORMAT:
Use these exact tags. The system will parse them and apply proper formatting.

<TITLE_PAGE>
<MAIN_TITLE>Your Title In Title Case</MAIN_TITLE>
<SUBTITLE>Your subtitle here</SUBTITLE>
<STUDENT_NAME>${inputs.studentName}</STUDENT_NAME>
<UNIVERSITY>${inputs.universityName}</UNIVERSITY>
<COURSE>${inputs.courseCodeName}</COURSE>
<LECTURER>${inputs.lecturerName || '_________________________'}</LECTURER>
<DATE>${inputs.submissionDate}</DATE>
<WORD_COUNT>${wordCount} words (excluding title page, abstract, and references)</WORD_COUNT>
</TITLE_PAGE>

<ABSTRACT>
<CONTENT>
Write your abstract as a single paragraph here. No line breaks within. 150-200 words covering context, methodology, findings, and conclusion.
</CONTENT>
<KEYWORDS>keyword1, keyword2, keyword3, keyword4, keyword5, keyword6, keyword7</KEYWORDS>
</ABSTRACT>

<SECTION num="1" title="Introduction">
Write the introduction content here as natural paragraphs.

Separate paragraphs with blank lines like this.

Continue with more paragraphs as needed. Use proper academic citations like (Author, Year) within the text.
</SECTION>

<SECTION num="2" title="Theoretical Framework">
<SUBSECTION num="2.1" title="First Theory Name">
Content about the first theory here.

More paragraphs as needed.
</SUBSECTION>
<SUBSECTION num="2.2" title="Second Theory Name">
Content about the second theory here.
</SUBSECTION>
<SUBSECTION num="2.3" title="Third Theory Name">
Content about the third theory here.
</SUBSECTION>
</SECTION>

<SECTION num="3" title="Your Section Title">
<SUBSECTION num="3.1" title="Subsection Title">
Content here.
</SUBSECTION>
<SUBSECTION num="3.2" title="Another Subsection">
Content here.
</SUBSECTION>
</SECTION>

<SECTION num="4" title="Discussion">
Discussion content here.

More paragraphs.
</SECTION>

<SECTION num="5" title="Conclusion">
Conclusion content here.
</SECTION>

<REFERENCES>
<REF>Author, A. A. (Year). Title of article. Journal Name, Volume(Issue), pages. https://doi.org/xxx</REF>
<REF>Author, B. B. (Year). Title of book. Publisher.</REF>
<REF>Continue with all references...</REF>
</REFERENCES>

=== STRUCTURE REQUIREMENTS ===

Word count allocation (based on ${wordCount} total):
- Abstract: 5% (~${abstractWords} words)
- Introduction: 10-12%
- Theoretical Framework: 15-20%
- Main Body (2-3 sections): 40-45%
- Discussion: 10-12%
- Conclusion: 5-7%

Minimum sources: ${sourceReq.min}-${sourceReq.max} references
   - At least 70% peer-reviewed journals
   - Include seminal works + recent (within 5 years)
   - Format strictly per ${inputs.citationStyle}

=== ACADEMIC QUALITY STANDARDS ===

1. THESIS: State a clear, defensible position in the introduction

2. CRITICAL ANALYSIS: Do not just describe - evaluate, compare, synthesize
   Use phrases like:
   - "This suggests that..."
   - "However, this view is limited by..."
   - "A more nuanced interpretation..."
   - "The evidence indicates..."

3. EVIDENCE: Support every claim with citations. Max 2-3 direct quotes per 1000 words.

4. ACADEMIC VOICE:
   - Third person only (no "I think", "In my opinion")
   - Hedging language ("suggests", "indicates", "appears to")
   - Formal register
   - NO contractions (write "cannot" not "can't")

5. REGIONAL RELEVANCE: If geographic focus specified, use local data, institutions, case studies
   - Uganda: Bank of Uganda, UBOS, MoFPED, Makerere research
   - Kenya: CBK, KNBS, regional journals
   - East Africa: EAC, AERC working papers

=== ANTI-AI DETECTION RULES ===

1. SENTENCE VARIATION: Mix short (8-12 words), medium (15-20), long (25-35)

2. BANNED PHRASES - NEVER USE:
   - "In today's rapidly changing world"
   - "It is important to note that"
   - "This is a complex issue"
   - "Many scholars have argued"
   - "The importance cannot be overstated"
   - "In conclusion, it can be said that"
   - "This essay will discuss"
   - "First and foremost"
   - "Last but not least"
   - "At the end of the day"
   - "Moving forward"
   - "delve", "crucial", "comprehensive", "multifaceted", "nuanced"
   - "landscape", "realm", "sphere"
   - "leveraging", "utilizing", "facilitating"

3. TRANSITIONS: Maximum 2 per paragraph. Do not repeat "However" or "Furthermore" within 500 words.

4. PARAGRAPH VARIATION: Vary lengths (4-8 sentences). Sometimes start with evidence, not topic sentence.

5. SPECIFICITY: Use specific names, dates, statistics, institutions - not vague claims.

6. HYPHENATION: Correct usage ("well-established theory" vs "the theory is well established")

=== GENERATE NOW ===

Output the complete coursework using ONLY the XML-style tags shown above. NO MARKDOWN. Natural academic prose within the tags.`;
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

/**
 * Generate coursework and return both raw and parsed output
 */
export async function generateCourseworkParsed(
  inputs: CourseworkGeneratorInputs,
  onProgress?: GenerationProgressCallback
): Promise<{ raw: string; parsed: ParsedCoursework }> {
  const raw = await generateCoursework(inputs, onProgress);
  const parsed = parseCoursework(raw);
  return { raw, parsed };
}

/**
 * Refine existing coursework based on user request
 */
export async function refineCoursework(
  currentRaw: string,
  refinementRequest: string,
  onProgress?: GenerationProgressCallback
): Promise<{ raw: string; parsed: ParsedCoursework }> {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  const refinePrompt = `You previously generated this coursework:

${currentRaw}

The student requests this change: "${refinementRequest}"

Apply ONLY the requested change. Keep everything else exactly the same.
Use the same XML tag format (<TITLE_PAGE>, <SECTION>, <SUBSECTION>, <REFERENCES>, etc.). NO MARKDOWN.
Output the complete revised coursework with all original sections and the requested modifications.

CRITICAL RULES:
- Maintain all XML tags exactly as before
- Only modify the specific parts mentioned in the request
- Keep all other content, structure, and references unchanged
- NO markdown formatting (no **, ##, ---, etc.)

Output the complete revised coursework now:`;

  onProgress?.(20, 'Processing refinement request...');

  let lastError: Error | null = null;

  for (const model of COURSEWORK_MODELS) {
    try {
      console.log(`🔄 Refining with model: ${model}...`);
      onProgress?.(40, `Refining with ${model}...`);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: refinePrompt }] }],
          generationConfig: {
            temperature: 0.5, // Lower temperature for more consistent refinement
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 32000,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`❌ Model ${model} failed with status ${response.status}`);
        throw new Error(`Model ${model} failed: ${response.status} - ${errorText}`);
      }

      onProgress?.(80, 'Processing response...');

      const data: GeminiResponse = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!generatedText) {
        throw new Error('No content generated');
      }

      console.log(`✅ Successfully refined coursework with ${model}`);
      onProgress?.(100, 'Refinement complete!');

      const parsed = parseCoursework(generatedText);
      return { raw: generatedText, parsed };

    } catch (error) {
      console.warn(`❌ Model ${model} failed:`, error);
      lastError = error as Error;
    }
  }

  throw lastError || new Error('All Gemini models failed to refine coursework');
}

/**
 * Regenerate a specific section of the coursework
 */
export async function regenerateSection(
  currentRaw: string,
  sectionNumber: string,
  sectionTitle: string,
  additionalInstructions?: string,
  onProgress?: GenerationProgressCallback
): Promise<{ raw: string; parsed: ParsedCoursework }> {
  const request = additionalInstructions 
    ? `Rewrite section ${sectionNumber} (${sectionTitle}) with these changes: ${additionalInstructions}`
    : `Improve section ${sectionNumber} (${sectionTitle}) - make it more detailed, add more citations, and strengthen the critical analysis`;
  
  return refineCoursework(currentRaw, request, onProgress);
}
