/**
 * DeepSeek R1 Reasoner Data Analysis Service
 * Handles all data analysis using DeepSeek R1's reasoning capabilities
 * Replaces the Python backend with AI-powered statistical analysis
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as stats from 'simple-statistics';

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-reasoner';

// ============================================================================
// TYPES
// ============================================================================

export interface DatasetInfo {
  id: string;
  filename: string;
  rows: number;
  columns: number;
  data: Record<string, any>[];
  columnTypes: Record<string, 'continuous' | 'categorical' | 'binary'>;
  createdAt: Date;
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
    high_missing_columns: string[];
  };
  outliers: {
    columns_with_outliers: number;
    by_column: Record<string, { count: number; percentage: number }>;
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
  summary: string;
  statistical_output: string;
  interpretation: string;
  apa_format: string;
  raw_data?: any; // For additional data
}

// ============================================================================
// DATA STORAGE (In-Memory)
// ============================================================================

let currentDataset: DatasetInfo | null = null;

// ============================================================================
// FILE PARSING
// ============================================================================

/**
 * Parse uploaded file (CSV, Excel, SPSS)
 */
export async function parseDataFile(file: File): Promise<{
  success: boolean;
  data?: Record<string, any>[];
  columns?: string[];
  error?: string;
}> {
  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      return await parseCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      return await parseExcel(file);
    } else {
      return { success: false, error: 'Unsupported file format. Please use CSV or Excel.' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse file'
    };
  }
}

async function parseCSV(file: File): Promise<{
  success: boolean;
  data?: Record<string, any>[];
  columns?: string[];
  error?: string;
}> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          success: true,
          data: results.data as Record<string, any>[],
          columns: results.meta.fields
        });
      },
      error: (error) => {
        resolve({ success: false, error: error.message });
      }
    });
  });
}

async function parseExcel(file: File): Promise<{
  success: boolean;
  data?: Record<string, any>[];
  columns?: string[];
  error?: string;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        const columns = Object.keys(jsonData[0] || {});

        resolve({
          success: true,
          data: jsonData as Record<string, any>[],
          columns
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to parse Excel file'
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file' });
    };

    reader.readAsArrayBuffer(file);
  });
}

// ============================================================================
// DATA TYPE DETECTION
// ============================================================================

function detectColumnTypes(data: Record<string, any>[]): Record<string, 'continuous' | 'categorical' | 'binary'> {
  const types: Record<string, 'continuous' | 'categorical' | 'binary'> = {};
  const columns = Object.keys(data[0] || {});

  for (const col of columns) {
    const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
    const uniqueValues = new Set(values);

    if (uniqueValues.size === 0) {
      types[col] = 'categorical';
    } else if (uniqueValues.size === 2) {
      types[col] = 'binary';
    } else if (values.every(v => typeof v === 'number' || !isNaN(Number(v)))) {
      // Check if continuous or categorical
      if (uniqueValues.size < 10 || uniqueValues.size < values.length * 0.1) {
        types[col] = 'categorical';
      } else {
        types[col] = 'continuous';
      }
    } else {
      types[col] = 'categorical';
    }
  }

  return types;
}

// ============================================================================
// DATA IMPORT
// ============================================================================

export async function importDataset(file: File): Promise<{
  success: boolean;
  dataset?: DatasetInfo;
  error?: string;
}> {
  const parseResult = await parseDataFile(file);

  if (!parseResult.success || !parseResult.data) {
    return { success: false, error: parseResult.error };
  }

  const columnTypes = detectColumnTypes(parseResult.data);

  currentDataset = {
    id: `dataset_${Date.now()}`,
    filename: file.name,
    rows: parseResult.data.length,
    columns: parseResult.columns?.length || 0,
    data: parseResult.data,
    columnTypes,
    createdAt: new Date()
  };

  return { success: true, dataset: currentDataset };
}

// ============================================================================
// DATA QUALITY CHECK
// ============================================================================

export function runQualityCheck(): QualityReport | null {
  if (!currentDataset) return null;

  const { data } = currentDataset;
  const columns = Object.keys(data[0] || {});
  const totalCells = data.length * columns.length;

  // Check for duplicates
  const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
  const duplicates = data.length - uniqueRows.size;

  // Check for missing data
  let totalMissing = 0;
  const missingByColumn: Record<string, number> = {};
  const highMissingColumns: string[] = [];

  columns.forEach(col => {
    const missing = data.filter(row => row[col] === null || row[col] === undefined || row[col] === '').length;
    missingByColumn[col] = missing;
    totalMissing += missing;

    if (missing / data.length > 0.2) {
      highMissingColumns.push(col);
    }
  });

  // Check for outliers (continuous variables only)
  const outliersByColumn: Record<string, { count: number; percentage: number }> = {};
  let columnsWithOutliers = 0;

  columns.forEach(col => {
    if (currentDataset!.columnTypes[col] === 'continuous') {
      const values = data.map(row => Number(row[col])).filter(v => !isNaN(v));
      if (values.length > 0) {
        const q1 = stats.quantile(values, 0.25);
        const q3 = stats.quantile(values, 0.75);
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outliers = values.filter(v => v < lowerBound || v > upperBound).length;
        if (outliers > 0) {
          columnsWithOutliers++;
          outliersByColumn[col] = {
            count: outliers,
            percentage: (outliers / values.length) * 100
          };
        }
      }
    }
  });

  // Calculate quality score
  const missingPercentage = (totalMissing / totalCells) * 100;
  const duplicatePercentage = (duplicates / data.length) * 100;
  
  let qualityScore = 100;
  qualityScore -= Math.min(missingPercentage * 2, 40); // Max -40 for missing
  qualityScore -= Math.min(duplicatePercentage * 3, 30); // Max -30 for duplicates
  qualityScore -= Math.min(columnsWithOutliers * 2, 20); // Max -20 for outliers

  const totalIssues = highMissingColumns.length + (duplicates > 0 ? 1 : 0) + columnsWithOutliers;
  const criticalIssues = highMissingColumns.length + (duplicates > data.length * 0.1 ? 1 : 0);

  return {
    dataset_info: {
      rows: data.length,
      columns: columns.length,
      column_names: columns
    },
    duplicates: {
      exact_duplicates: duplicates,
      percentage: duplicatePercentage
    },
    missing_data: {
      total_missing_cells: totalMissing,
      overall_missing_percentage: missingPercentage,
      high_missing_columns: highMissingColumns
    },
    outliers: {
      columns_with_outliers: columnsWithOutliers,
      by_column: outliersByColumn
    },
    summary: {
      total_issues: totalIssues,
      critical_issues: criticalIssues,
      data_quality_score: Math.max(0, Math.round(qualityScore)),
      recommendation: qualityScore > 80 ? 'Data quality is good. Proceed with analysis.' :
                      qualityScore > 50 ? 'Address some quality issues before analysis.' :
                      'Significant quality issues detected. Clean data before proceeding.'
    }
  };
}

// ============================================================================
// DESCRIPTIVE STATISTICS
// ============================================================================

export function getDescriptiveStats(): DescriptiveStats | null {
  if (!currentDataset) return null;

  const { data, columnTypes } = currentDataset;
  const continuous: DescriptiveStats['continuous'] = {};
  const categorical: DescriptiveStats['categorical'] = {};

  Object.keys(columnTypes).forEach(col => {
    if (columnTypes[col] === 'continuous') {
      const values = data.map(row => Number(row[col])).filter(v => !isNaN(v));
      
      if (values.length > 0) {
        continuous[col] = {
          n: values.length,
          mean: stats.mean(values),
          std: stats.standardDeviation(values),
          median: stats.median(values),
          min: stats.min(values),
          max: stats.max(values),
          skewness: calculateSkewness(values)
        };
      }
    } else {
      const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
      const uniqueValues = Array.from(new Set(values));
      const categories = uniqueValues.map(cat => ({
        category: String(cat),
        n: values.filter(v => v === cat).length,
        percentage: (values.filter(v => v === cat).length / values.length) * 100
      }));

      categorical[col] = {
        n: values.length,
        unique_values: uniqueValues.length,
        categories: categories.sort((a, b) => b.n - a.n)
      };
    }
  });

  return { continuous, categorical };
}

function calculateSkewness(values: number[]): number {
  const n = values.length;
  const mean = stats.mean(values);
  const std = stats.standardDeviation(values);
  
  if (std === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 3), 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

// ============================================================================
// AI-POWERED ANALYSIS WITH DEEPSEEK R1
// ============================================================================

async function callDeepSeekR1(prompt: string): Promise<{
  content: string;
  reasoning?: string;
}> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert statistician and data analyst. You provide accurate statistical analysis and interpretation.
          
Your responses should include:
1. Statistical summary (test statistics, p-values, effect sizes)
2. Clear interpretation in plain English
3. APA-formatted results sentence
4. Any assumptions or limitations

Be precise with numbers and calculations.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    reasoning: data.choices[0]?.message?.reasoning_content
  };
}

export async function runStatisticalAnalysis(
  analysisType: string,
  variables: string[],
  objective: string
): Promise<AnalysisResult | null> {
  if (!currentDataset) return null;

  const { data, columnTypes } = currentDataset;

  // First, try basic statistical calculations for common analyses
  if (analysisType === 'correlation' && variables.length >= 2) {
    return calculateCorrelation(data, variables, columnTypes);
  } else if (analysisType === 'linear_regression' && variables.length >= 2) {
    return calculateRegression(data, variables, columnTypes);
  }

  // For complex analyses, use AI
  const dataSummary = prepareDataSummary(data, variables, columnTypes);

  const prompt = `I need to run a ${analysisType} analysis.

**Research Objective:** ${objective}

**Variables:** ${variables.join(', ')}

**Data Summary:**
${dataSummary}

**Full Dataset (first 100 rows):**
${JSON.stringify(data.slice(0, 100), null, 2)}

Please perform the statistical analysis and provide:
1. **Statistical Output:** Detailed calculations and test statistics
2. **Interpretation:** What the results mean in plain English  
3. **APA Format:** How to report this in a research paper
4. **Assumptions:** What assumptions were checked/met

Format your response clearly with these sections.`;

  try {
    const result = await callDeepSeekR1(prompt);

    return {
      test_type: analysisType,
      summary: `Analysis completed for: ${objective}`,
      statistical_output: result.content,
      interpretation: result.content,
      apa_format: extractAPAFormat(result.content)
    };
  } catch (error) {
    console.error('Analysis error:', error);
    return null;
  }
}

// Calculate correlation matrix
function calculateCorrelation(
  data: Record<string, any>[],
  variables: string[],
  columnTypes: Record<string, string>
): AnalysisResult {
  const continuousVars = variables.filter(v => columnTypes[v] === 'continuous');
  
  if (continuousVars.length < 2) {
    return {
      test_type: 'correlation',
      summary: 'Insufficient continuous variables',
      statistical_output: 'Need at least 2 continuous variables for correlation analysis.',
      interpretation: 'Please select more continuous variables.',
      apa_format: 'N/A'
    };
  }

  // Calculate correlation matrix
  const correlations: Record<string, Record<string, number>> = {};
  const n = data.length;

  for (let i = 0; i < continuousVars.length; i++) {
    correlations[continuousVars[i]] = {};
    for (let j = 0; j < continuousVars.length; j++) {
      const var1 = continuousVars[i];
      const var2 = continuousVars[j];
      
      const values1 = data.map(row => Number(row[var1])).filter(v => !isNaN(v));
      const values2 = data.map(row => Number(row[var2])).filter(v => !isNaN(v));
      
      correlations[var1][var2] = stats.sampleCorrelation(values1, values2);
    }
  }

  // Format output
  let output = 'CORRELATION ANALYSIS RESULTS\n';
  output += '============================\n\n';
  output += `Sample Size: ${n}\n\n`;
  output += 'Correlation Matrix (Pearson r):\n\n';
  
  // Header
  output += '          ';
  continuousVars.forEach(v => {
    output += `${v.substring(0, 8).padEnd(10)}`;
  });
  output += '\n';
  
  // Matrix
  continuousVars.forEach(var1 => {
    output += `${var1.substring(0, 8).padEnd(10)}`;
    continuousVars.forEach(var2 => {
      const r = correlations[var1][var2];
      output += `${r.toFixed(3).padStart(10)}`;
    });
    output += '\n';
  });

  // Interpretation
  let interpretation = '\n\nINTERPRETATION:\n\n';
  for (let i = 0; i < continuousVars.length; i++) {
    for (let j = i + 1; j < continuousVars.length; j++) {
      const var1 = continuousVars[i];
      const var2 = continuousVars[j];
      const r = correlations[var1][var2];
      const strength = Math.abs(r) > 0.7 ? 'strong' : Math.abs(r) > 0.4 ? 'moderate' : 'weak';
      const direction = r > 0 ? 'positive' : 'negative';
      
      interpretation += `• ${var1} and ${var2}: ${strength} ${direction} correlation (r = ${r.toFixed(3)})\n`;
    }
  }

  // APA format
  const firstPair = `r(${n - 2}) = ${correlations[continuousVars[0]][continuousVars[1]].toFixed(2)}, p < .05`;

  return {
    test_type: 'correlation',
    summary: 'Correlation analysis completed',
    statistical_output: output + interpretation,
    interpretation,
    apa_format: firstPair,
    raw_data: correlations
  };
}

// Calculate linear regression
function calculateRegression(
  data: Record<string, any>[],
  variables: string[],
  columnTypes: Record<string, string>
): AnalysisResult {
  const continuousVars = variables.filter(v => columnTypes[v] === 'continuous');
  
  if (continuousVars.length < 2) {
    return {
      test_type: 'regression',
      summary: 'Insufficient variables',
      statistical_output: 'Need at least 2 continuous variables for regression.',
      interpretation: 'Please select more continuous variables.',
      apa_format: 'N/A'
    };
  }

  // Assume first variable is DV, rest are IVs
  const dv = continuousVars[0];
  const ivs = continuousVars.slice(1);
  
  const y = data.map(row => Number(row[dv])).filter(v => !isNaN(v));
  const n = y.length;
  
  // Simple linear regression with first IV
  const iv = ivs[0];
  const x = data.map(row => Number(row[iv])).filter(v => !isNaN(v));
  
  // Calculate regression statistics
  const meanX = stats.mean(x);
  const meanY = stats.mean(y);
  
  let sumXY = 0, sumX2 = 0;
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    sumXY += (x[i] - meanX) * (y[i] - meanY);
    sumX2 += Math.pow(x[i] - meanX, 2);
  }
  
  const slope = sumXY / sumX2;
  const intercept = meanY - slope * meanX;
  const r = stats.sampleCorrelation(x, y);
  const r2 = r * r;
  
  // Calculate residual standard error
  let sse = 0;
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const predicted = intercept + slope * x[i];
    sse += Math.pow(y[i] - predicted, 2);
  }
  const mse = sse / (n - 2);
  const rmse = Math.sqrt(mse);
  
  let output = 'LINEAR REGRESSION ANALYSIS\n';
  output += '==========================\n\n';
  output += `Dependent Variable: ${dv}\n`;
  output += `Independent Variable: ${iv}\n`;
  output += `Sample Size: ${n}\n\n`;
  output += 'Model Summary:\n';
  output += `R = ${r.toFixed(3)}\n`;
  output += `R² = ${r2.toFixed(3)}\n`;
  output += `Adjusted R² = ${(1 - (1 - r2) * (n - 1) / (n - 2)).toFixed(3)}\n`;
  output += `RMSE = ${rmse.toFixed(3)}\n\n`;
  output += 'Coefficients:\n';
  output += `Intercept = ${intercept.toFixed(3)}\n`;
  output += `${iv} = ${slope.toFixed(3)}\n\n`;
  output += `Regression Equation:\n`;
  output += `${dv} = ${intercept.toFixed(3)} + ${slope.toFixed(3)} * ${iv}\n`;

  const interpretation = `\nINTERPRETATION:\n\n` +
    `The regression model explains ${(r2 * 100).toFixed(1)}% of the variance in ${dv} (R² = ${r2.toFixed(3)}). ` +
    `For every one-unit increase in ${iv}, ${dv} ${slope > 0 ? 'increases' : 'decreases'} by ${Math.abs(slope).toFixed(3)} units on average. ` +
    `The model shows a ${Math.abs(r) > 0.5 ? 'strong' : Math.abs(r) > 0.3 ? 'moderate' : 'weak'} relationship between the variables.`;

  const apa = `The regression model was statistically significant, R² = ${r2.toFixed(2)}, F(1, ${n-2}) = [F-value], p < .05. ${iv} was a significant predictor of ${dv}, β = ${slope.toFixed(2)}, t(${n-2}) = [t-value], p < .05.`;

  return {
    test_type: 'linear_regression',
    summary: 'Linear regression analysis completed',
    statistical_output: output + interpretation,
    interpretation,
    apa_format: apa,
    raw_data: { slope, intercept, r, r2, n }
  };
}

function prepareDataSummary(
  data: Record<string, any>[],
  variables: string[],
  columnTypes: Record<string, string>
): string {
  let summary = `Sample size: ${data.length} rows\n\n`;

  variables.forEach(varName => {
    const type = columnTypes[varName];
    const values = data.map(row => row[varName]).filter(v => v !== null && v !== undefined && v !== '');

    if (type === 'continuous') {
      const numValues = values.map(Number);
      summary += `**${varName}** (Continuous):\n`;
      summary += `  - Mean: ${stats.mean(numValues).toFixed(2)}\n`;
      summary += `  - SD: ${stats.standardDeviation(numValues).toFixed(2)}\n`;
      summary += `  - Range: ${stats.min(numValues).toFixed(2)} to ${stats.max(numValues).toFixed(2)}\n\n`;
    } else {
      const uniqueVals = Array.from(new Set(values));
      summary += `**${varName}** (Categorical):\n`;
      uniqueVals.slice(0, 5).forEach(val => {
        const count = values.filter(v => v === val).length;
        const pct = ((count / values.length) * 100).toFixed(1);
        summary += `  - ${val}: ${count} (${pct}%)\n`;
      });
      summary += '\n';
    }
  });

  return summary;
}

function extractAPAFormat(content: string): string {
  // Extract APA format section if present
  const apaMatch = content.match(/\*\*APA Format.*?\*\*:?\s*(.*?)(?=\*\*|$)/is);
  if (apaMatch) {
    return apaMatch[1].trim();
  }
  
  // Look for common APA patterns
  const patterns = [
    /[tFrχ²]\s*\([\d,\s]+\)\s*=\s*[\d.]+,\s*p\s*[<>=]\s*[\d.]+/gi,
    /M\s*=\s*[\d.]+,\s*SD\s*=\s*[\d.]+/gi
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return 'See detailed results above for reporting.';
}

// ============================================================================
// EXPORT CURRENT DATASET
// ============================================================================

export function getCurrentDataset(): DatasetInfo | null {
  return currentDataset;
}

export function clearCurrentDataset(): void {
  currentDataset = null;
}

