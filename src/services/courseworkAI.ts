import { researchChat } from './gemini';
import type { MasterPromptAnswers, AnalysisResult } from '../types/coursework';

const MASTER_PROMPT = `MASTER PROMPT: Distinction-Level Coursework Generator (Data Science)

You are an expert Master's-level academic writer and data science researcher. Your job is to produce a distinction-grade (70%+) coursework that is critical, original, well-structured, and evidence-driven, not descriptive.

OUTPUT REQUIREMENTS (Non-negotiable):

1. Write in a Master's academic tone with a golden thread from aims → literature gap → methods → results → discussion → contribution.

2. Structure rules:
   - Use clear headings and subheadings
   - Introduction must include: context, problem, gap, aim, research questions, thesis statement, contributions, structure of paper
   - Literature review must be thematic synthesis, not one-source-per-paragraph summary (each paragraph cites 2–5 sources, explicitly compare studies)
   - Methods must be replicable (prediction time, leakage controls, split strategy, missingness handling, hyperparameter tuning, metrics, uncertainty)
   - Results must include tables and figure placeholders with captions
   - Discussion must be critical (interpret results, alternative explanations, failure modes, practical implications)
   - Conclusion must include: summary, implications, limitations, future work

3. Originality rules (Master's-level contribution):
   Must include at least one of: defensible decision policy, transportability analysis, calibration framework, or fairness audit

4. Evidence and citations rules (anti-hallucination):
   - Use real, citable sources only (peer-reviewed journals, books, reputable institutions)
   - If unsure a citation exists, write: [CITATION NEEDED] instead of inventing
   - Do NOT invent authors, DOIs, journal names, volumes, or page numbers
   - Provide full reference list at end
   - Keep direct quotes minimal; paraphrase and synthesize

5. Length rules:
   Match requested word count. Allocate approx: Introduction 10%, Literature 25%, Methods 20%, Results 15–20%, Discussion 20%, Conclusion 5–10%

6. If dataset is synthetic: Include "Synthetic Data Generation" subsection with sample size, distributions, missingness, validation

7. If health/clinical: Include ethics/data governance paragraph, "predictive ≠ causal" statement, caution about bias

8. Formatting:
   - Professional academic language but readable
   - Avoid AI tells (no "moreover" overuse, no generic filler)
   - Use signposting transitions
   - Include Appendix with variable dictionary, reproducibility checklist

You MUST follow these rules strictly.`;

export async function analyzeAssignment(assignmentText: string): Promise<AnalysisResult> {
  try {
    const prompt = `${MASTER_PROMPT}

Student's assignment question: "${assignmentText}"

Analyze this assignment and identify:
1. Type of assignment (essay/technical report/literature review/etc.)
2. Estimated word count needed
3. 4-5 key requirements the student must address
4. Suggested section structure

Respond in this exact format:

TYPE: [assignment type]
WORD COUNT: [number]
REQUIREMENTS:
- [requirement 1]
- [requirement 2]
- [requirement 3]
- [requirement 4]
SECTIONS:
- [section 1]
- [section 2]
- [section 3]`;

    const response = await researchChat(prompt, 'coursework');
    
    // Parse the response
    const typeMatch = response.match(/TYPE:\s*(.+)/);
    const wordCountMatch = response.match(/WORD COUNT:\s*(\d+)/);
    const requirementsMatch = response.match(/REQUIREMENTS:\s*([\s\S]+?)(?=SECTIONS:|$)/);
    const sectionsMatch = response.match(/SECTIONS:\s*([\s\S]+)/);
    
    const requirements = requirementsMatch 
      ? requirementsMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim())
      : [];
    
    const sections = sectionsMatch
      ? sectionsMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim())
      : [];

    return {
      type: typeMatch ? typeMatch[1].trim() : 'Academic Essay',
      wordCount: wordCountMatch ? parseInt(wordCountMatch[1]) : 2500,
      requirements,
      suggestedSections: sections
    };
  } catch (error) {
    console.error('Error analyzing assignment:', error);
    // Fallback
    return {
      type: 'Academic Essay',
      wordCount: 2500,
      requirements: [
        'Address the main question comprehensively',
        'Use relevant academic sources',
        'Provide critical analysis',
        'Include proper citations'
      ],
      suggestedSections: ['Introduction', 'Literature Review', 'Main Analysis', 'Conclusion']
    };
  }
}

export async function generateQuickDraft(
  assignmentText: string,
  answers: MasterPromptAnswers
): Promise<string> {
  const contextBlock = `
STUDENT DETAILS:
- Topic/Title: ${answers.topic}
- Course/Unit: ${answers.courseUnit}
- Level: ${answers.level} at ${answers.institution}
- Length: ${answers.totalLength}
- Assignment Type: ${answers.assignmentType}
- Dataset: ${answers.dataset}${answers.datasetDetails ? ` (${answers.datasetDetails})` : ''}
- Tools: ${answers.tools.join(', ')}
- Citation Style: ${answers.citationStyle}
${answers.rubric ? `- Rubric: ${answers.rubric}` : ''}
${answers.requiredSections ? `- Required Sections: ${answers.requiredSections.join(', ')}` : ''}
${answers.localContext ? `- Local Context: ${answers.localContext}` : ''}
${answers.deadline ? `- Deadline: ${answers.deadline}` : ''}
`;

  const prompt = `${MASTER_PROMPT}

${contextBlock}

ASSIGNMENT QUESTION:
"${assignmentText}"

Now write the COMPLETE coursework following ALL rules in the master prompt above. Include:
- Title page elements
- Abstract (if Master's level)
- Full body with numbered sections and subsections
- Tables and figures with captions (use placeholders if no actual data)
- References section with real citations (use [CITATION NEEDED] if unsure)
- Appendices

Write the full ${answers.totalLength} coursework now:`;

  return await researchChat(prompt, 'coursework');
}

export async function generateSectionContent(
  sectionName: string,
  sectionIndex: number,
  userInput: string,
  previousSections: string,
  masterAnswers: MasterPromptAnswers,
  assignmentText: string
): Promise<string> {
  const contextBlock = `
ASSIGNMENT: "${assignmentText}"

STUDENT DETAILS:
- Topic: ${masterAnswers.topic}
- Course: ${masterAnswers.courseUnit}
- Level: ${masterAnswers.level}
- Total Length: ${masterAnswers.totalLength}
- Citation Style: ${masterAnswers.citationStyle}
- Tools: ${masterAnswers.tools.join(', ')}
- Dataset: ${masterAnswers.dataset}
`;

  const prompt = `${MASTER_PROMPT}

${contextBlock}

PREVIOUS SECTIONS WRITTEN:
${previousSections || '[This is the first section]'}

---

CURRENT TASK: Write the "${sectionName}" section (Section ${sectionIndex + 1})

Student's input/ideas for this section:
"${userInput}"

Following the master prompt rules, write a comprehensive, distinction-level "${sectionName}" section. Make it academically rigorous with proper citations.`;

  return await researchChat(prompt, 'coursework');
}

export async function generateOutline(
  assignmentText: string,
  answers: Partial<MasterPromptAnswers>
): Promise<string[]> {
  const prompt = `${MASTER_PROMPT}

ASSIGNMENT: "${assignmentText}"

Student details:
- Type: ${answers.assignmentType || 'Essay'}
- Length: ${answers.totalLength || '2500 words'}
- Level: ${answers.level || 'MSc'}

Generate ONLY the outline/structure with:
- Section headings
- Brief bullet points of what each section should cover
- Estimated word count per section

Do NOT write the full content yet. Just the structure.

Format as:
## Section Name (XXX words)
- Key point 1
- Key point 2`;

  const response = await researchChat(prompt, 'coursework');
  
  // Split by section headings
  return response.split('##').filter(s => s.trim()).map(s => '## ' + s.trim());
}

export async function askSectionQuestion(
  sectionName: string,
  sectionIndex: number,
  assignmentText: string
): Promise<string> {
  const prompt = `You are guiding a student to write the "${sectionName}" section of their coursework.

Assignment: "${assignmentText}"

This is section ${sectionIndex + 1}. Ask the student ONE focused question to help them provide content for this section. 

The question should:
- Be specific and actionable
- Help them think critically
- Guide them toward Master's-level analysis

Just ask the question, no preamble.`;

  return await researchChat(prompt, 'coursework');
}

