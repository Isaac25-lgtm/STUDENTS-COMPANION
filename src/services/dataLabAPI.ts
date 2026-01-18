/**
 * Data Analysis Lab API Service
 * Communicates with the Python Flask backend for statistical analysis
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Types
export interface DatasetInfo {
  dataset_id: string;
  filename: string;
  rows: number;
  columns: number;
  created_at: string;
}

export interface QualityReport {
  dataset_info: {
    rows: number;
    columns: number;
    column_names: string[];
  };
  duplicates: {
    exact_duplicates: number;
    percentage: number;
  };
  missing_data: {
    total_missing_cells: number;
    overall_missing_percentage: number;
    by_column: Record<string, {
      missing_count: number;
      missing_percentage: number;
      severity: string;
    }>;
  };
  outliers: {
    columns_with_outliers: number;
    by_column: Record<string, {
      iqr_outliers: number;
      percentage: number;
    }>;
  };
  summary: {
    total_issues: number;
    critical_issues: number;
    data_quality_score: number;
    recommendation: string;
  };
}

export interface DescriptiveStats {
  continuous: Record<string, {
    n: number;
    mean: number;
    std: number;
    median: number;
    min: number;
    max: number;
    skewness: number;
  }>;
  categorical: Record<string, {
    n: number;
    unique_values: number;
    categories: Array<{
      category: string;
      n: number;
      percentage: number;
    }>;
  }>;
}

export interface AnalysisResult {
  test_type: string;
  test_statistic: number;
  p_value: number;
  significant: boolean;
  effect_size: {
    [key: string]: number | string;
  };
  [key: string]: unknown;
}

export interface APATable {
  dataframe: Array<Record<string, string | number>>;
  markdown: string;
  apa_note?: string;
}

export interface AIInterpretation {
  success: boolean;
  interpretation: string;
  model: string;
  error?: string;
}

export interface FullAnalysisResponse {
  timestamp: string;
  statistical_results: AnalysisResult;
  apa_table?: APATable;
  ai_interpretation?: AIInterpretation;
}

// API Functions

/**
 * Import a data file
 */
export async function importData(file: File): Promise<{
  success: boolean;
  data?: {
    dataset_id: string;
    filename: string;
    preview: {
      columns: string[];
      preview: Array<Record<string, unknown>>;
      total_rows: number;
    };
    data_dictionary: {
      variables: Array<{
        variable_name: string;
        data_type: string;
        n_valid: number;
        missing_percentage: number;
      }>;
    };
  };
  error?: string;
}> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/analysis/import`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import data',
    };
  }
}

/**
 * List all stored datasets
 */
export async function listDatasets(): Promise<DatasetInfo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/datasets`);
    const result = await response.json();
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

/**
 * Run data quality check
 */
export async function runQualityCheck(datasetId: string): Promise<{
  success: boolean;
  data?: QualityReport;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/quality-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run quality check',
    };
  }
}

/**
 * Apply cleaning operation
 */
export async function cleanData(
  datasetId: string,
  operation: string,
  params: Record<string, unknown>
): Promise<{
  success: boolean;
  data?: {
    new_version: string;
    new_row_count: number;
    [key: string]: unknown;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/clean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        operation,
        params,
      }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clean data',
    };
  }
}

/**
 * Get descriptive statistics
 */
export async function getDescriptiveStats(
  datasetId: string,
  variables?: string[],
  generateNarrative: boolean = false
): Promise<{
  success: boolean;
  data?: {
    statistics: DescriptiveStats;
    table1: APATable;
    narrative?: AIInterpretation;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        variables,
        generate_narrative: generateNarrative,
      }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics',
    };
  }
}

/**
 * Run statistical analysis
 */
export async function runAnalysis(
  datasetId: string,
  analysisType: 'ttest' | 'paired_ttest' | 'anova' | 'chisquare' | 'correlation' | 'linear_regression' | 'logistic_regression' | 'mannwhitney' | 'kruskal',
  params: Record<string, unknown>,
  objective: string = '',
  interpret: boolean = true
): Promise<{
  success?: boolean;
  timestamp?: string;
  statistical_results?: AnalysisResult;
  apa_table?: APATable;
  ai_interpretation?: AIInterpretation;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        analysis_type: analysisType,
        params,
        objective,
        interpret,
      }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run analysis',
    };
  }
}

/**
 * Check statistical assumptions
 */
export async function checkAssumptions(
  datasetId: string,
  checkType: 'normality' | 'homogeneity' | 'multicollinearity',
  params: Record<string, unknown>
): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/assumptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        check_type: checkType,
        params,
      }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check assumptions',
    };
  }
}

/**
 * Generate results package
 */
export async function generateResultsPackage(
  datasetId: string,
  analyses: Array<{ type: string; name: string }>,
  objectives: string[]
): Promise<{
  success: boolean;
  data?: {
    sample_size: number;
    methods: AIInterpretation;
    audit_trail: {
      total_entries: number;
      entries: Array<Record<string, unknown>>;
    };
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/results-package`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        analyses,
        objectives,
      }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate package',
    };
  }
}

/**
 * Export analysis results
 */
export async function exportResults(
  datasetId: string,
  exportType: 'all' | 'audit' | 'code' | 'dictionary' = 'all',
  analyses?: Array<{ type: string; name: string }>
): Promise<{
  success: boolean;
  data?: {
    audit_trail?: string;
    python_code?: string;
    data_dictionary?: Record<string, unknown>;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataset_id: datasetId,
        export_type: exportType,
        analyses,
      }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export results',
    };
  }
}

/**
 * Create analysis plan
 */
export async function createAnalysisPlan(
  objectives: Array<{ text: string; outcome: string; predictors: string[] }>,
  variables: Record<string, { type: string; n_groups?: number }>,
  design: string = 'cross-sectional'
): Promise<{
  success: boolean;
  data?: {
    design: string;
    analysis_plan: Array<{
      objective: string;
      outcome: string;
      predictors: string[];
      suggested_analysis: string;
      expected_output: string;
    }>;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectives, variables, design }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create plan',
    };
  }
}

/**
 * Get AI interpretation for results
 */
export async function getInterpretation(
  results: Record<string, unknown>,
  objective: string,
  analysisType: string
): Promise<AIInterpretation> {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        results,
        objective,
        analysis_type: analysisType,
      }),
    });

    const result = await response.json();
    return result.success ? result.data : { success: false, interpretation: '', model: '', error: result.error };
  } catch (error) {
    return {
      success: false,
      interpretation: '',
      model: '',
      error: error instanceof Error ? error.message : 'Failed to get interpretation',
    };
  }
}

/**
 * Check if backend is running
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:5000/health');
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}



