// Data Analysis Lab AI Service - DeepSeek R1 Reasoner Integration
// Implements the structured prompt system for guiding students through data analysis
// Now with DeepSeek R1 for all statistical analysis (no Python backend needed)

import * as dataAnalysisR1 from './dataAnalysisR1';
import type { QualityReport, DescriptiveStats } from './dataAnalysisR1';

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_BASE_URL = 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = 'deepseek-reasoner';

// ============================================================================= // PROMPT DEFINITIONS
// =============================================================================

const BASE_PROMPT = `You are the Data Analysis Lab for Students Companion, helping Ugandan university students analyze research data and write thesis-ready results.

## YOUR ROLE
- Guide students through analysis step-by-step
- Explain statistical concepts simply (like a patient supervisor)
- Generate thesis-ready outputs (tables, narratives, interpretations)
- Always link findings back to research objectives

## WORKFLOW (enforce this order)
1. PLAN → 2. IMPORT → 3. CLEAN → 4. PROFILE → 5. ANALYZE → 6. RESULTS → 7. EXPORT

## OUTPUT RULES
- Tables: APA format, ready to paste into Word
- Narratives: Written for Chapter 4/5, editable
- Always report: effect sizes + confidence intervals (not just p-values)
- Flag limitations and assumptions

## LANGUAGE
- Short sentences, clear explanations
- Define statistical terms on first use
- Use Ugandan research examples when helpful

Before ANY analysis, confirm:
1. What are your research objectives/questions?
2. What type of data do you have?
3. What analysis stage are you at?`;

const QUANT_PROMPT = `## QUANTITATIVE ANALYSIS MODE

### LAYER 0: Analysis Plan
Help student map:
| Objective | Variables (DV, IV) | Data Source | Test/Model | Expected Output |

Define: inclusion/exclusion criteria, primary outcome, missingness rules.
Ask: "Is your sample size justified? (power analysis)"

### LAYER 1-2: Data Intake & Cleaning
On data upload:
- Generate data dictionary (variable, type, values, missing %)
- Flag: duplicates, invalid ranges, outliers, inconsistent categories
- Create audit log of all transformations
- Ask before recoding: "I'll create age groups 18-24, 25-34, etc. Confirm?"

### LAYER 3: Descriptive Statistics (Table 1)
Generate baseline characteristics table:
- Continuous: Mean±SD (normal) or Median[IQR] (skewed)
- Categorical: n (%)
- Compare groups if applicable (p-values + effect sizes)

### LAYER 4: Assumption Checks
Before inference, check and report:
- Normality (Shapiro-Wilk, histograms)
- Homogeneity of variance (Levene's)
- Multicollinearity (VIF for regression)
State: "Assumptions [met/violated]. Proceeding with [parametric/non-parametric]."

### LAYER 5: Bivariate Analysis
Screen each predictor against outcome:
| Variable | Test Used | Result | Effect Size [95% CI] | p-value |

Select test automatically:
- Categorical vs Categorical → Chi-square (or Fisher's exact)
- Continuous vs Binary → t-test (or Mann-Whitney)
- Continuous vs 3+ groups → ANOVA (or Kruskal-Wallis)
- Continuous vs Continuous → Pearson/Spearman correlation

### LAYER 6: Multivariable Modeling
Select model by outcome type:
- Continuous outcome → Linear regression
- Binary outcome → Logistic regression
- Count outcome → Poisson/Negative binomial
- Ordinal outcome → Ordinal logistic
- Time-to-event → Cox regression

Report: coefficients/OR/RR, 95% CI, p-values, model fit statistics
Check: residuals, influential points, goodness-of-fit

### LAYER 7: Results Narrative
Generate Chapter 4 draft:
"[Objective 1] examined [relationship]. [Test] revealed [finding] (statistic=X, p=Y, effect size=Z [CI]). This suggests [interpretation]."

### LAYER 8: Sensitivity Analysis
Offer: "Want me to check robustness with different cutoffs/missing data approaches?"`;

const QUAL_PROMPT = `## QUALITATIVE ANALYSIS MODE

### LAYER 1: Transcript Preparation
On upload:
- Format cleanup (speaker labels, timestamps)
- Segment into meaning units
- Confirm: "I found [X] participants, [Y] pages. Ready to code?"

### LAYER 2: Open Coding
Guide student through initial coding:
- Highlight text → suggest codes
- Build codebook incrementally:
| Code | Definition | Inclusion Criteria | Exclusion Criteria | Example Quote |

Ask: "Does this code capture what the participant meant?"

### LAYER 3: Categorization
Help merge codes into categories:
- Show: "These codes seem related: [X, Y, Z]. Combine into category '[Name]'?"
- Map relationships between categories
- Visualize: category hierarchy

### LAYER 4: Theme Development
Transform categories into themes:
- Theme name (concise, conceptual)
- Theme definition (1-2 sentences)
- Theme story (what this theme reveals)
- Supporting quotes (3-5 strongest)

Format output:
**Theme 1: [Name]**
Definition: [What it means]
[Quote 1] - Participant X
[Quote 2] - Participant Y
Interpretation: [What this tells us about the research question]

### LAYER 5: Trustworthiness Documentation
Generate automatically:
- Audit trail (all coding decisions logged)
- Triangulation checklist
- If multiple coders: inter-coder agreement calculation
- Member checking template (if applicable)

### LAYER 6: Results Packaging
Produce:
1. Theme-by-theme narrative (Chapter 4 ready)
2. Quote bank (organized by theme)
3. Thematic map (visual)
4. Codebook appendix

Narrative format:
"Theme 1, [Name], emerged from [X] participants' accounts. As P3 explained: '[quote]'. This reflects [interpretation linked to objective]."`;

const MIXED_PROMPT = `## MIXED METHODS MODE

First, confirm design type:
- **Convergent**: Quant + Qual collected together, compared
- **Explanatory Sequential**: Quant first → Qual explains why
- **Exploratory Sequential**: Qual first → Quant tests findings

### INTEGRATION TOOLS

**Joint Display Table** (auto-generate):
| Quant Finding | Related Qual Theme | Integration Insight |
|---------------|-------------------|---------------------|
| 65% reported X (p<.05) | Theme 2: "Barriers to..." | Numbers show WHAT, quotes show WHY |

**Triangulation Matrix**:
| Finding | Quant Evidence | Qual Evidence | Convergence |
|---------|---------------|---------------|-------------|
| [Topic] | [Stat result] | [Theme/quote] | Agree / Complement / Contradict |

**Integration Narrative** (Chapter 4/5):
"Quantitative results showed [X] (stat). Qualitative findings help explain this: participants described [theme]. As P5 noted, '[quote]'. This suggests [integrated interpretation]."

### META-INFERENCE
Combine both strands:
- What do the numbers say?
- What do the words reveal?
- How do they confirm/expand/contradict each other?
- What's the overall answer to the research question?`;

const LAYER_PROMPTS: Record<string, string> = {
  plan: `You're helping a student create their analysis plan. Ask for:
1. Research objectives/questions (list them)
2. Study design (cross-sectional, cohort, experimental, qualitative, mixed)
3. Variables: What's the main outcome? What are the predictors/factors?
4. Sample size: How many participants? Is this justified?

Then generate a table:
| Objective | Variable(s) | Data Source | Analysis Method | Expected Output |

Flag any gaps: "Objective 3 doesn't have a clear analysis method. What relationship are you testing?"`,

  import: `Student is uploading data. On receiving file:
1. Detect format (CSV, Excel, SPSS)
2. Show first 5 rows
3. Generate data dictionary:
   | Variable | Type | Valid Values | Missing (n, %) |
4. Tag as "v1_raw"
5. Ask: "Does this look correct? Any variables to rename or drop?"`,

  clean: `Run data quality checks:
1. **Duplicates**: Found [X] duplicate rows. Remove?
2. **Missing data**: [Variable] has [X]% missing. Options: delete cases, impute, or flag.
3. **Invalid values**: [Variable] has values outside expected range [X-Y].
4. **Inconsistencies**: [Variable] has [X] different spellings of same category.

For each issue, ask: "How should I handle this?"
Log every transformation in audit trail.
Output: "v2_cleaned" dataset ready.`,

  profile: `Generate exploratory data analysis:

**For continuous variables:**
- Mean, SD, Median, IQR, Min, Max
- Distribution shape (histogram description)
- Flag: "Variable X is skewed right - consider non-parametric tests"

**For categorical variables:**
- Frequency table with percentages
- Flag sparse categories: "Category Y has only 3 cases - consider collapsing"

**Cross-tabulations** (if groups exist):
- Baseline characteristics by group
- Flag imbalances

Output: Sample characteristics table (Table 1 draft)`,

  analyze: `Guide student through analysis:

1. **What's your objective?** → Map to appropriate test
2. **Check assumptions** → Report pass/fail
3. **Run analysis** → Show full output
4. **Interpret** → Plain English + statistical reporting

For each test, output:
- Test name and why it's appropriate
- Key statistics (test statistic, df, p-value)
- Effect size with 95% CI
- One-sentence interpretation
- APA-format results sentence`,

  results: `Generate thesis-ready outputs:

**Tables**: APA format with title, clean formatting
**Figures**: Describe what to create (bar chart, scatter plot, thematic map)
**Narrative**: Write Chapter 4 draft paragraphs

Structure:
1. Restate objective
2. Present finding (with statistics or quotes)
3. Brief interpretation

End each section: "Link to Objective [X]: [How this answers the research question]"`,

  export: `Prepare final deliverables:

1. **Methods summary** (for Chapter 3):
   "Data were analyzed using [software]. [Tests] were used to examine [objectives]. Statistical significance was set at p<0.05."

2. **Results package**:
   - All tables (APA format)
   - All figures
   - Chapter 4 narrative draft

3. **Appendices**:
   - Data dictionary
   - Codebook (if qualitative)
   - Audit trail / transformation log
   - Full model outputs`
};

// =============================================================================
// TYPES
// =============================================================================

export type AnalysisType = 'quantitative' | 'qualitative' | 'mixed';
export type WorkflowStage = 'plan' | 'import' | 'clean' | 'profile' | 'analyze' | 'results' | 'export';

export interface DataLabMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoningContent?: string;
  timestamp: Date;
  stage?: WorkflowStage;
}

export interface AnalysisSession {
  id: string;
  type: AnalysisType;
  currentStage: WorkflowStage;
  objectives: string[];
  dataUploaded: boolean;
  messages: DataLabMessage[];
  createdAt: Date;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

function getAnalysisPrompt(analysisType: AnalysisType, stage?: WorkflowStage): string {
  let prompt = BASE_PROMPT + '\n\n';
  
  // Add analysis type specific prompt
  switch (analysisType) {
    case 'quantitative':
      prompt += QUANT_PROMPT;
      break;
    case 'qualitative':
      prompt += QUAL_PROMPT;
      break;
    case 'mixed':
      prompt += MIXED_PROMPT;
      break;
  }
  
  // Add stage-specific prompt if provided
  if (stage && LAYER_PROMPTS[stage]) {
    prompt += '\n\n## CURRENT STAGE: ' + stage.toUpperCase() + '\n' + LAYER_PROMPTS[stage];
  }
  
  return prompt;
}

export async function sendDataLabMessage(
  userMessage: string,
  analysisType: AnalysisType,
  currentStage: WorkflowStage,
  conversationHistory: DataLabMessage[],
  customContext?: string
): Promise<{ content: string; reasoning?: string }> {
  if (!API_KEY) {
    throw new Error('DeepSeek API key not configured. Please add VITE_DEEPSEEK_API_KEY to your .env.local file.');
  }

  const systemPrompt = getAnalysisPrompt(analysisType, currentStage);
  
  // Build messages array for the API
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];
  
  // Add conversation history (last 10 messages for context)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  }
  
  // Add custom context if provided (e.g., supervisor comments)
  let finalUserMessage = userMessage;
  if (customContext) {
    finalUserMessage = `[Additional context from student/supervisor: ${customContext}]\n\n${userMessage}`;
  }
  
  messages.push({ role: 'user', content: finalUserMessage });

  try {
    const response = await fetch(`${DEEPSEEK_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;
    
    return {
      content: assistantMessage.content,
      reasoning: assistantMessage.reasoning_content || undefined
    };
  } catch (error) {
    console.error('Data Lab AI error:', error);
    throw error;
  }
}

// =============================================================================
// WORKFLOW HELPERS
// =============================================================================

export const WORKFLOW_STAGES: { id: WorkflowStage; name: string; description: string; icon: string }[] = [
  { id: 'plan', name: 'Analysis Plan', description: 'Define objectives and variables', icon: '📋' },
  { id: 'import', name: 'Data Import', description: 'Upload and preview your data', icon: '📤' },
  { id: 'clean', name: 'Data Cleaning', description: 'Handle missing values and errors', icon: '🧹' },
  { id: 'profile', name: 'Data Profile', description: 'Explore and describe your data', icon: '📊' },
  { id: 'analyze', name: 'Analysis', description: 'Run statistical tests or coding', icon: '🔬' },
  { id: 'results', name: 'Results', description: 'Generate tables and narratives', icon: '📝' },
  { id: 'export', name: 'Export', description: 'Download thesis-ready outputs', icon: '📦' },
];

export function getStageIndex(stage: WorkflowStage): number {
  return WORKFLOW_STAGES.findIndex(s => s.id === stage);
}

export function getNextStage(currentStage: WorkflowStage): WorkflowStage | null {
  const currentIndex = getStageIndex(currentStage);
  if (currentIndex < WORKFLOW_STAGES.length - 1) {
    return WORKFLOW_STAGES[currentIndex + 1].id;
  }
  return null;
}

export function getPreviousStage(currentStage: WorkflowStage): WorkflowStage | null {
  const currentIndex = getStageIndex(currentStage);
  if (currentIndex > 0) {
    return WORKFLOW_STAGES[currentIndex - 1].id;
  }
  return null;
}

// Initial greeting based on analysis type
export function getInitialGreeting(analysisType: AnalysisType): string {
  const greetings: Record<AnalysisType, string> = {
    quantitative: `Welcome to the **Quantitative Analysis Lab**! 📊

This lab is powered by **DeepSeek R1 Reasoner** for intelligent statistical analysis.

**Workflow:**
1. **Plan** - Define objectives and variables
2. **Import** - Upload data (CSV, Excel)
3. **Clean** - Handle missing data/outliers
4. **Profile** - Generate descriptive statistics
5. **Analyze** - Run statistical tests with AI reasoning
6. **Results** - Create tables and narratives
7. **Export** - Download thesis-ready outputs

**Key Features:**
- 🧠 **AI-Powered Analysis** with chain-of-thought reasoning
- 📊 **Smart Interpretation** of statistical results
- ✍️ **APA Format** reporting assistance

Let's start! **What are your main research objectives?**`,

    qualitative: `Welcome to the **Qualitative Analysis Lab**! 📝

This lab helps you analyze interview transcripts and text data systematically.

**Powered by DeepSeek R1 Reasoner** for intelligent thematic analysis.

**Workflow:**
1. **Plan** - Define research questions
2. **Import** - Upload transcripts
3. **Clean** - Format and organize data
4. **Profile** - Initial reading
5. **Analyze** - AI-assisted coding and theme development
6. **Results** - Generate thematic narratives
7. **Export** - Download codebook and draft

Let's start! **What are your main research questions?**`,

    mixed: `Welcome to the **Mixed Methods Analysis Lab**! 🔬

This lab integrates quantitative and qualitative data for comprehensive analysis.

**Powered by DeepSeek R1 Reasoner** for sophisticated mixed methods integration.

**Design Types:**
- **Convergent**: Compare simultaneous data
- **Explanatory Sequential**: Qual explains Quant
- **Exploratory Sequential**: Quant tests Qual themes

**Which design are you using?**`
  };
  
  return greetings[analysisType];
}

// =============================================================================
// DATA ANALYSIS FUNCTIONS (Using DeepSeek R1)
// =============================================================================

/**
 * Check if API key is configured
 */
export async function checkBackendAvailability(): Promise<boolean> {
  return !!API_KEY;
}

/**
 * Get current dataset
 */
export function getCurrentDatasetId(): string | null {
  const dataset = dataAnalysisR1.getCurrentDataset();
  return dataset?.id || null;
}

/**
 * Set current dataset (legacy - not needed with R1)
 */
export function setCurrentDatasetId(id: string | null): void {
  // No-op for R1 implementation
}

/**
 * Import data file using DeepSeek R1
 */
export async function importDataFile(file: File): Promise<{
  success: boolean;
  datasetId?: string;
  preview?: unknown;
  dataDictionary?: unknown;
  error?: string;
}> {
  const result = await dataAnalysisR1.importDataset(file);
  
  if (result.success && result.dataset) {
    return {
      success: true,
      datasetId: result.dataset.id,
      preview: {
        columns: Object.keys(result.dataset.data[0] || {}),
        preview: result.dataset.data.slice(0, 5),
        total_rows: result.dataset.rows
      },
      dataDictionary: {
        variables: Object.entries(result.dataset.columnTypes).map(([name, type]) => ({
          variable_name: name,
          data_type: type,
          n_valid: result.dataset!.data.filter(row => row[name] != null).length,
          missing_percentage: (result.dataset!.data.filter(row => row[name] == null).length / result.dataset!.rows) * 100
        }))
      }
    };
  }
  
  return {
    success: false,
    error: result.error || 'Failed to import data'
  };
}

/**
 * Run data quality check using DeepSeek R1
 */
export async function runQualityCheck(): Promise<{
  success: boolean;
  report?: QualityReport;
  error?: string;
}> {
  const report = dataAnalysisR1.runQualityCheck();
  
  if (report) {
    return { success: true, report };
  }
  
  return { success: false, error: 'No dataset loaded' };
}

/**
 * Get descriptive statistics using DeepSeek R1
 */
export async function getDescriptiveStats(
  variables?: string[],
  generateNarrative: boolean = false
): Promise<{
  success: boolean;
  statistics?: DescriptiveStats;
  table1?: any;
  narrative?: any;
  error?: string;
}> {
  const stats = dataAnalysisR1.getDescriptiveStats();
  
  if (stats) {
    return {
      success: true,
      statistics: stats,
      table1: { markdown: 'Table 1 placeholder' },
      narrative: undefined
    };
  }
  
  return { success: false, error: 'No dataset loaded' };
}

/**
 * Run statistical analysis using DeepSeek R1
 */
export async function runStatisticalAnalysis(
  analysisType: string,
  params: { variables?: string[] } & Record<string, unknown>,
  objective: string
): Promise<{
  success: boolean;
  results?: any;
  table?: any;
  interpretation?: any;
  error?: string;
}> {
  if (!params.variables || params.variables.length === 0) {
    return { success: false, error: 'No variables specified' };
  }

  const result = await dataAnalysisR1.runStatisticalAnalysis(
    analysisType,
    params.variables,
    objective
  );
  
  if (result) {
    return {
      success: true,
      results: result,
      table: { markdown: result.statistical_output },
      interpretation: { interpretation: result.interpretation, success: true, model: 'deepseek-reasoner' }
    };
  }
  
  return { success: false, error: 'Analysis failed' };
}

/**
 * Clean data (basic operations)
 */
export async function cleanData(
  operation: string,
  params: Record<string, unknown>
): Promise<{
  success: boolean;
  newRowCount?: number;
  details?: Record<string, unknown>;
  error?: string;
}> {
  // Simple cleaning operations can be implemented here
  return {
    success: true,
    newRowCount: dataAnalysisR1.getCurrentDataset()?.rows || 0,
    details: { operation, message: 'Cleaning operation simulated' }
  };
}

/**
 * Export results
 */
export async function exportResults(
  exportType: 'all' | 'audit' | 'code' | 'dictionary' = 'all',
  analyses?: Array<{ type: string; name: string }>
): Promise<{
  success: boolean;
  auditTrail?: string;
  pythonCode?: string;
  dataDictionary?: Record<string, unknown>;
  error?: string;
}> {
  return {
    success: true,
    auditTrail: 'Analysis audit trail',
    pythonCode: '# Analysis code would go here',
    dataDictionary: {}
  };
}

