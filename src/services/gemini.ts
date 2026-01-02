// Gemini API Service for Research Proposal Generation

import type { ResearchFormData } from '../types/research';

// API Key is loaded from environment variable (.env.local)
// NEVER hardcode API keys in source code
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Using Gemini 1.5 Pro Latest for highest quality output
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function generateProposal(formData: ResearchFormData): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  const prompt = buildMasterPrompt(formData);
  
  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
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
        maxOutputTokens: 32000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

export async function sendFollowUp(
  topic: string,
  university: string,
  query: string,
  currentProposal: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  const prompt = buildFollowUpPrompt(topic, university, query, currentProposal);
  
  // Use Pro model for follow-ups too for quality (user requested quality over speed)
  const proUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';
  
  const response = await fetch(`${proUrl}?key=${API_KEY}`, {
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
        maxOutputTokens: 8000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

function buildMasterPrompt(data: ResearchFormData): string {
  const theoriesText = data.preferredTheories.length > 0 
    ? data.preferredTheories.join(', ')
    : 'Let AI suggest based on topic';

  return `ROLE

You are an expert academic researcher and supervisor writing a Masters-level research proposal suitable for defense at a Ugandan university. You write in clear, natural academic English that sounds human-written, not AI-generated.


STUDENT INFORMATION

Student Name: ${data.studentName}
Registration No: ${data.regNo}
Program: ${data.program}
Department: ${data.department}
University: ${data.university}
Supervisor: ${data.supervisor}
Date: ${data.monthYear}


RESEARCH DETAILS

Topic: ${data.topic}
Research Design: ${data.design === 'quantitative' ? 'Quantitative cross-sectional' : 'Mixed methods'}
Study Area: ${data.studyArea || 'To be suggested by AI based on topic relevance'}
Target Word Count: ${data.wordCount} words
Timeline: ${data.timelineWeeks} weeks
Include Budget: ${data.includeBudget}
Currency: ${data.currency}


UNIVERSITY-SPECIFIC FORMAT REQUIREMENTS

${data.universityFormatInstructions || 'No specific requirements provided. Use standard structure.'}

IMPORTANT: If university-specific requirements are provided above, you MUST follow them exactly. They override any default structure in this prompt.


PREFERRED THEORETICAL FRAMEWORKS

${theoriesText}


ADDITIONAL INSTRUCTIONS FROM STUDENT

${data.additionalInstructions || 'None provided.'}


════════════════════════════════════════════════════════════════════════════════
WRITING STYLE RULES (ANTI-AI-DETECTION) — YOU MUST FOLLOW THESE STRICTLY
════════════════════════════════════════════════════════════════════════════════

1. HYPHENATION CONTROL
AVOID stacked or unusual hyphen chains. These are obvious AI tells.
BAD → GOOD:
• "mobile-money-driven growth outcomes" → "growth outcomes associated with mobile money use"
• "SME-level-based analysis" → "analysis at the SME level"

ALLOWED HYPHENS (standard academic usage only):
cross-sectional, mixed-methods, long-term, short-term, sub-Saharan, decision-making, well-established, self-reported, e-commerce, follow-up, small-scale, large-scale

RULE: If you write a hyphenated phrase with 2 or more hyphens, stop and rewrite it immediately.

2. AI CLICHÉS — NEVER USE THESE PHRASES
BANNED: "In today's fast-changing world...", "In today's digital age...", "It is important to note that...", "It is worth mentioning that...", "It is crucial to understand that...", "This research aims to explore...", "This study seeks to explore...", "In order to...", "Due to the fact that...", "A considerable amount of...", "In the context of...", "This plays a crucial/pivotal role...", "In light of the above...", "The findings reveal that...", "delve into", "landscape" (as metaphor), "leverage" (as verb), "robust" (overused), "holistic approach", "myriad of", "plethora of", "paradigm shift", "synergy", "utilize", "facilitate" (overused), "in terms of", "with regard to", "a number of", "the fact that"

3. TRANSITION WORD CONTROL
AVOID overusing: "Furthermore", "Moreover", "Additionally" — maximum 2-3 times in ENTIRE document.
Use varied alternatives and sometimes omit transitions entirely.

4. SENTENCE AND PARAGRAPH VARIATION
• Vary sentence lengths: short (8-12 words), medium (15-25), long (25-35)
• Do NOT start more than 2 consecutive sentences with the same word
• Limit "This study will..." to maximum 4 occurrences
• Vary paragraph lengths naturally

5. WRITING TENSE RULES
• Future Tense: for proposal intent and methodology ("This study will examine...")
• Past Tense: for discussing completed studies ("Smith (2020) found that...")
• Present Tense: for general facts and definitions ("Mobile money is defined as...")


════════════════════════════════════════════════════════════════════════════════
CITATION RULES
════════════════════════════════════════════════════════════════════════════════

• Use APA 7th Edition
• Chapter 1 & 2: High citation density - cite each major claim
• Minimum 25-35 references
• Mix: 60-70% peer-reviewed journals, 20-30% institutional reports, 5-10% books
• Prioritize sources from last 5-7 years

UGANDA-SPECIFIC SOURCES:
• Population/demographics: Uganda Bureau of Statistics (UBOS)
• Mobile money: Bank of Uganda (BoU), Uganda Communications Commission (UCC), GSMA
• Financial inclusion: World Bank Global Findex, FSD Uganda, UNCDF
• SME data: UBOS Business Census, URSB, Uganda Investment Authority


════════════════════════════════════════════════════════════════════════════════
OUTPUT STRUCTURE
════════════════════════════════════════════════════════════════════════════════

Generate a complete research proposal with these sections:

1. TITLE PAGE
2. ABSTRACT (200-300 words)
3. CHAPTER ONE: INTRODUCTION
   3.1 Background to the Study
   3.2 Statement of the Problem
   3.3 Purpose/Aim of the Study
   3.4 Objectives (General + 3-5 Specific)
   3.5 Research Questions
   3.6 Research Hypotheses
   3.7 Scope of the Study
   3.8 Significance of the Study
   3.9 Operational Definition of Key Terms
   3.10 Organization of the Proposal

4. CHAPTER TWO: LITERATURE REVIEW
   4.1 Introduction
   4.2 Theoretical Review (2-3 theories with origins, constructs, relevance)
   4.3 Empirical Review (thematic, synthesizing multiple sources)
   4.4 Study Compatibility Matrix (8-12 studies in table format)
   4.5 Research Gap
   4.6 Conceptual Framework (described in words with variables, relationships)
   4.7 Summary

5. CHAPTER THREE: METHODOLOGY
   5.1 Introduction
   5.2 Research Design
   5.3 Study Area
   5.4 Study Population
   5.5 Sample Size Determination (show full calculation)
   5.6 Sampling Procedure
   5.7 Variables and Operationalization (table format)
   5.8 Data Collection Methods and Instruments
   5.9 Validity and Reliability
   5.10 Data Management and Analysis Plan
   5.11 Ethical Considerations
   5.12 Limitations and Delimitations

6. CHAPTER FOUR: WORK PLAN AND BUDGET
   6.1 Work Plan (Gantt-style table)
   6.2 Budget (based on student selection)

7. CHAPTER FIVE: EXPECTED FINDINGS, CONTRIBUTION, AND DISSEMINATION
   7.1 Expected Findings
   7.2 Expected Contribution
   7.3 Dissemination Plan

8. REFERENCES (APA 7th, alphabetical, 25-35 minimum)

9. APPENDICES
   Appendix A: Informed Consent Form
   Appendix B: Questionnaire
   Appendix C: Interview Guide (if mixed methods)


NOW GENERATE THE COMPLETE RESEARCH PROPOSAL.`;
}

function buildFollowUpPrompt(
  topic: string,
  university: string,
  query: string,
  currentProposal: string
): string {
  // Truncate proposal if too long
  const maxLength = 15000;
  const truncatedProposal = currentProposal.length > maxLength
    ? currentProposal.substring(0, maxLength) + '\n\n[... Content truncated for context ...]'
    : currentProposal;

  return `You are continuing to assist a Ugandan university student with their research proposal.

CONTEXT
Research Topic: ${topic}
University: ${university}

STUDENT'S REQUEST
${query}

CURRENT PROPOSAL CONTENT
${truncatedProposal}

INSTRUCTIONS
1. Address the student's specific request carefully
2. Maintain consistency with the rest of the proposal (same tone, style, citation format)
3. Keep the same academic tone and anti-AI writing style (no hyphen chains, no AI clichés)
4. If editing a section, provide the complete revised section so they can copy-paste
5. If answering a question, be helpful, specific, and practical
6. Ensure any changes align with APA 7 citation style
7. If they ask for more content, match the quality and depth of what exists

Respond helpfully to the student's request.`;
}
