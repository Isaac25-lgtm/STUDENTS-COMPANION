import { useState, useRef, useEffect } from 'react';
import { 
  FlaskConical, Upload, BarChart3, MessageSquareText, ArrowLeft, ArrowRight,
  Send, Loader2, RefreshCw, ChevronRight, FileSpreadsheet, FileText, 
  CheckCircle2, Circle, AlertCircle, Sparkles, Download, MessageCircle,
  PieChart, TrendingUp, Table, Brain, Lightbulb, X, Activity, Layers, 
  AlertTriangle, Check, Search
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  sendDataLabMessage, 
  WORKFLOW_STAGES, 
  getStageIndex,
  getInitialGreeting,
  importDataFile,
  runQualityCheck,
  getDescriptiveStats,
  checkBackendAvailability,
  type AnalysisType, 
  type WorkflowStage,
  type DataLabMessage 
} from '../services/dataLabAI';
import type { QualityReport, DescriptiveStats, APATable, AnalysisResult } from '../services/dataLabAPI';

export default function DataLab() {
  const { darkMode, theme } = useTheme();

  // Analysis state
  const [viewMode, setViewMode] = useState<'selection' | 'analysis'>('selection');
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('plan');
  const [backendReady, setBackendReady] = useState<boolean>(false);
  
  // Data state
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [descriptiveStats, setDescriptiveStats] = useState<DescriptiveStats | null>(null);
  const [lastResult, setLastResult] = useState<{table?: APATable, interpretation?: string} | null>(null);
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'variables' | 'results'>('overview');
  
  // Chat state
  const [messages, setMessages] = useState<DataLabMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom input state (for supervisor comments, specific requests)
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customContext, setCustomContext] = useState('');
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Check backend status on mount
  useEffect(() => {
    checkBackendAvailability().then(setBackendReady);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus chat input when switching to analysis mode
  useEffect(() => {
    if (viewMode === 'analysis') {
      chatInputRef.current?.focus();
    }
  }, [viewMode]);

  // Start analysis session
  const startAnalysis = (type: AnalysisType) => {
    setAnalysisType(type);
    setCurrentStage('plan');
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: getInitialGreeting(type),
        timestamp: new Date(),
        stage: 'plan'
      }
    ]);
    setViewMode('analysis');
    setError(null);
  };

  // Send message to AI
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !analysisType) return;

    const userMessage: DataLabMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      stage: currentStage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendDataLabMessage(
        userMessage.content,
        analysisType,
        currentStage,
        messages,
        customContext || undefined
      );

      const assistantMessage: DataLabMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        reasoningContent: response.reasoning,
        timestamp: new Date(),
        stage: currentStage
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Clear custom context after use
      if (customContext) {
        setCustomContext('');
        setShowCustomInput(false);
      }
    } catch (err) {
      console.error('Data Lab AI error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
      chatInputRef.current?.focus();
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsUploading(true);
    setError(null);

    try {
      // 1. Import Data
      const importResult = await importDataFile(file);
      
      if (!importResult.success || !importResult.datasetId) {
        throw new Error(importResult.error || 'Failed to upload file');
      }
      
      setCurrentDatasetId(importResult.datasetId);
      setCurrentStage('clean'); // Move to clean/profile stage
      
      // 2. Run Quality Check
      const qualityResult = await runQualityCheck();
      if (qualityResult.success && qualityResult.report) {
        setQualityReport(qualityResult.report);
      }
      
      // 3. Get Descriptive Stats
      const statsResult = await getDescriptiveStats();
      if (statsResult.success && statsResult.statistics) {
        setDescriptiveStats(statsResult.statistics);
      }
      
      // 4. Update UI
      setActiveTab('health');
      
      // 5. Add System Message
      const issues = qualityResult.report?.summary.total_issues || 0;
      const critical = qualityResult.report?.summary.critical_issues || 0;
      
      const analysisMsg = `I've uploaded and analyzed **${file.name}**.
      
      **Data Summary:**
      - ${importResult.dataDictionary ? (importResult.dataDictionary as any).variables.length : '?'} variables
      - ${importResult.preview ? (importResult.preview as any).total_rows : '?'} rows
      
      **Quality Check:**
      - Found ${issues} potential issues (${critical} critical).
      - Quality Score: ${qualityResult.report?.summary.data_quality_score || 0}/100
      
      I've populated the dashboard with details. Check the **Data Health** tab.
      
      Should we proceed to clean this data, or start analysis?`;
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: analysisMsg,
        timestamp: new Date(),
        stage: 'profile'
      }]);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ **Upload Failed**: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        stage: 'import'
      }]);
    } finally {
      setIsUploading(false);
    }
  };

  // Reset session
  const resetSession = () => {
    setViewMode('selection');
    setAnalysisType(null);
    setCurrentStage('plan');
    setMessages([]);
    setInputMessage('');
    setCustomContext('');
    setUploadedFile(null);
    setCurrentDatasetId(null);
    setQualityReport(null);
    setDescriptiveStats(null);
    setLastResult(null);
    setError(null);
  };

  // ============================================================================
  // DASHBOARD COMPONENTS
  // ============================================================================

  const renderDataHealthTab = () => {
    if (!qualityReport) return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Activity className={`w-12 h-12 mb-4 ${theme.textFaint}`} />
        <p className={theme.textMuted}>Upload a dataset to see its health report.</p>
      </div>
    );

    const { summary, missing_data, duplicates, outliers } = qualityReport;

    return (
      <div className="space-y-6">
        {/* Score Card */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${theme.text}`}>Data Health Score</h3>
            <span className={`text-2xl font-bold ${
              summary.data_quality_score > 80 ? 'text-emerald-500' : 
              summary.data_quality_score > 50 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {summary.data_quality_score}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className={`h-2.5 rounded-full ${
                summary.data_quality_score > 80 ? 'bg-emerald-500' : 
                summary.data_quality_score > 50 ? 'bg-amber-500' : 'bg-red-500'
              }`} 
              style={{ width: `${summary.data_quality_score}%` }}
            ></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
              <div className={`text-lg font-bold ${duplicates.exact_duplicates > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {duplicates.exact_duplicates}
              </div>
              <div className={`text-xs ${theme.textFaint}`}>Duplicates</div>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
              <div className={`text-lg font-bold ${missing_data.total_missing_cells > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {missing_data.overall_missing_percentage}%
              </div>
              <div className={`text-xs ${theme.textFaint}`}>Missing</div>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
              <div className={`text-lg font-bold ${outliers.columns_with_outliers > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                {outliers.columns_with_outliers}
              </div>
              <div className={`text-xs ${theme.textFaint}`}>Outlier Vars</div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-3">
          <h4 className={`text-sm font-medium ${theme.textMuted} uppercase`}>Detected Issues</h4>
          
          {missing_data.high_missing_columns.map(col => (
            <div key={col} className={`flex items-center gap-3 p-3 rounded-xl border ${darkMode ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className={`text-sm font-medium ${theme.text}`}>High Missing Data: {col}</p>
                <p className={`text-xs ${theme.textFaint}`}>More than 20% values are missing. Suggestion: Drop or impute.</p>
              </div>
              <button 
                onClick={() => setInputMessage(`Help me handle missing data in ${col}`)}
                className={`ml-auto text-xs px-3 py-1.5 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-white text-red-600 border border-red-200'}`}
              >
                Fix
              </button>
            </div>
          ))}

          {duplicates.exact_duplicates > 0 && (
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${darkMode ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100'}`}>
              <Layers className="w-5 h-5 text-amber-500" />
              <div>
                <p className={`text-sm font-medium ${theme.text}`}>Duplicate Rows Found</p>
                <p className={`text-xs ${theme.textFaint}`}>{duplicates.exact_duplicates} exact duplicates detected.</p>
              </div>
              <button 
                onClick={() => setInputMessage('Remove duplicate rows')}
                className={`ml-auto text-xs px-3 py-1.5 rounded-lg ${darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-white text-amber-600 border border-amber-200'}`}
              >
                Remove
              </button>
            </div>
          )}

          {summary.total_issues === 0 && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${darkMode ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100'}`}>
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <p className={`text-sm font-medium ${theme.text}`}>Clean Dataset</p>
                <p className={`text-xs ${theme.textFaint}`}>No critical issues found. You are ready to analyze!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVariablesTab = () => {
    if (!descriptiveStats) return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Table className={`w-12 h-12 mb-4 ${theme.textFaint}`} />
        <p className={theme.textMuted}>Upload data to see variable summaries.</p>
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border ${theme.card}`}>
            <h4 className={`text-sm font-medium ${theme.text} mb-2`}>Continuous</h4>
            <div className="space-y-2">
              {Object.keys(descriptiveStats.continuous).map(v => (
                <div key={v} className="flex justify-between items-center text-xs">
                  <span className={theme.textMuted}>{v}</span>
                  <span className="font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                    μ={descriptiveStats.continuous[v].mean.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${theme.card}`}>
            <h4 className={`text-sm font-medium ${theme.text} mb-2`}>Categorical</h4>
            <div className="space-y-2">
              {Object.keys(descriptiveStats.categorical).map(v => (
                <div key={v} className="flex justify-between items-center text-xs">
                  <span className={theme.textMuted}>{v}</span>
                  <span className="font-mono bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded dark:bg-purple-900 dark:text-purple-300">
                    {descriptiveStats.categorical[v].unique_values} cats
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Table 1 Preview */}
        <div className={`p-4 rounded-xl border ${theme.card}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className={`font-semibold ${theme.text}`}>Sample Characteristics (Table 1)</h4>
            <button 
              onClick={() => setInputMessage("Generate APA Table 1")}
              className="text-xs text-blue-500 hover:underline"
            >
              Generate Full Table
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <tr>
                  <th className="py-2 px-2">Variable</th>
                  <th className="py-2 px-2">Mean (SD) / n (%)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(descriptiveStats.continuous).slice(0, 3).map(([k, v]) => (
                  <tr key={k} className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <td className={`py-2 px-2 ${theme.text}`}>{k}</td>
                    <td className={`py-2 px-2 ${theme.textMuted}`}>{v.mean.toFixed(2)} ({v.std.toFixed(2)})</td>
                  </tr>
                ))}
                {Object.entries(descriptiveStats.categorical).slice(0, 3).map(([k, v]) => (
                  <tr key={k} className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <td className={`py-2 px-2 ${theme.text}`}>{k}</td>
                    <td className={`py-2 px-2 ${theme.textMuted}`}>
                      {v.categories[0].category}: {v.categories[0].n} ({v.categories[0].percentage}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: SELECTION MODE
  // ============================================================================
  if (viewMode === 'selection') {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-violet-900/60' : 'bg-violet-100'}`}>
              <FlaskConical className={`w-6 h-6 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Data Analysis Lab</h1>
              <p className={`text-sm ${theme.textMuted}`}>AI-powered analysis with Python accuracy</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${backendReady ? (darkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700') : (darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-50 text-amber-700')} text-xs font-medium`}>
            <Activity className="w-3.5 h-3.5" />
            {backendReady ? 'Python Engine Ready' : 'Connecting to Engine...'}
          </div>
        </div>

        {/* Analysis Type Selection Cards - keeping existing good design */}
        <div className="mb-8">
          <h2 className={`text-lg font-semibold ${theme.text} mb-2`}>Choose Your Analysis Type</h2>
          <p className={`text-sm ${theme.textMuted} mb-6`}>Select the approach that matches your research methodology</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantitative */}
            <button
              onClick={() => startAnalysis('quantitative')}
              className={`p-6 rounded-2xl border text-left transition-all hover:shadow-lg hover:-translate-y-1 group ${
                darkMode
                  ? 'bg-gradient-to-br from-blue-900/40 to-slate-800/60 border-blue-800/50 hover:border-blue-600'
                  : 'bg-gradient-to-br from-blue-50 to-white border-blue-200 hover:border-blue-400'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${darkMode ? 'bg-blue-800/60' : 'bg-blue-100'} group-hover:scale-110 transition-transform`}>
                <BarChart3 className={`w-7 h-7 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={1.5} />
              </div>
              <h3 className={`font-bold text-lg ${theme.text} mb-2`}>Quantitative</h3>
              <p className={`text-sm ${theme.textFaint} mb-4`}>Statistical analysis for surveys and experiments</p>
              <ul className={`text-xs ${theme.textMuted} space-y-1`}>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Descriptive Statistics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Regression & ANOVA</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Accurate Python Stats</li>
              </ul>
            </button>

            {/* Qualitative */}
            <button
              onClick={() => startAnalysis('qualitative')}
              className={`p-6 rounded-2xl border text-left transition-all hover:shadow-lg hover:-translate-y-1 group ${
                darkMode
                  ? 'bg-gradient-to-br from-purple-900/40 to-slate-800/60 border-purple-800/50 hover:border-purple-600'
                  : 'bg-gradient-to-br from-purple-50 to-white border-purple-200 hover:border-purple-400'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${darkMode ? 'bg-purple-800/60' : 'bg-purple-100'} group-hover:scale-110 transition-transform`}>
                <MessageSquareText className={`w-7 h-7 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} strokeWidth={1.5} />
              </div>
              <h3 className={`font-bold text-lg ${theme.text} mb-2`}>Qualitative</h3>
              <p className={`text-sm ${theme.textFaint} mb-4`}>Thematic analysis for interview transcripts</p>
              <ul className={`text-xs ${theme.textMuted} space-y-1`}>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-purple-500" /> Open & Axial Coding</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-purple-500" /> Theme Development</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-purple-500" /> Codebook Generation</li>
              </ul>
            </button>

            {/* Mixed Methods */}
            <button
              onClick={() => startAnalysis('mixed')}
              className={`p-6 rounded-2xl border text-left transition-all hover:shadow-lg hover:-translate-y-1 group ${
                darkMode
                  ? 'bg-gradient-to-br from-amber-900/40 to-slate-800/60 border-amber-800/50 hover:border-amber-600'
                  : 'bg-gradient-to-br from-amber-50 to-white border-amber-200 hover:border-amber-400'
              }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${darkMode ? 'bg-amber-800/60' : 'bg-amber-100'} group-hover:scale-110 transition-transform`}>
                <PieChart className={`w-7 h-7 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.5} />
              </div>
              <h3 className={`font-bold text-lg ${theme.text} mb-2`}>Mixed Methods</h3>
              <p className={`text-sm ${theme.textFaint} mb-4`}>Integrate quant and qual data</p>
              <ul className={`text-xs ${theme.textMuted} space-y-1`}>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-amber-500" /> Joint Display Tables</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-amber-500" /> Triangulation Matrix</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-amber-500" /> Integration Narrative</li>
              </ul>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: ANALYSIS MODE (Redesigned Split View)
  // ============================================================================
  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Workspace Header */}
      <div className={`flex items-center justify-between px-4 py-3 mb-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <button onClick={resetSession} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
            <ArrowLeft className={`w-5 h-5 ${theme.textMuted}`} />
          </button>
          <div>
            <h2 className={`text-sm font-bold ${theme.text}`}>
              {analysisType === 'quantitative' ? 'Quantitative Analysis' : analysisType === 'qualitative' ? 'Qualitative Analysis' : 'Mixed Methods'}
            </h2>
            <p className={`text-xs ${theme.textFaint}`}>
              {uploadedFile ? uploadedFile.name : 'No data uploaded'}
            </p>
          </div>
        </div>
        
        {/* Quick Stats or Actions */}
        {qualityReport && (
          <div className="flex gap-4 text-xs">
            <div className={`flex items-center gap-1.5 ${theme.textMuted}`}>
              <Table className="w-3.5 h-3.5" />
              <span>{qualityReport.dataset_info.rows} Rows</span>
            </div>
            <div className={`flex items-center gap-1.5 ${qualityReport.summary.critical_issues > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              <Activity className="w-3.5 h-3.5" />
              <span>Health: {qualityReport.summary.data_quality_score}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* LEFT PANEL: Chat Interface (Supervisor) */}
        <div className={`w-[40%] flex flex-col rounded-2xl border ${theme.card} overflow-hidden shadow-sm`}>
          <div className={`p-3 border-b ${theme.divider} bg-opacity-50`}>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-500">
              <Brain className="w-3.5 h-3.5" />
              AI Supervisor
        </div>
      </div>

          <div className="flex-1 p-4 overflow-y-auto bg-opacity-30">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'assistant' 
                    ? 'bg-emerald-600'
                    : 'bg-blue-600'
                }`}>
                  {msg.role === 'assistant' ? <Brain className="w-3.5 h-3.5 text-white" /> : <span className="text-white text-[10px] font-bold">ME</span>}
                </div>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'assistant'
                    ? darkMode ? 'bg-slate-700/50 text-slate-200' : 'bg-slate-100 text-slate-800'
                    : 'bg-blue-600 text-white shadow-md'
                }`}>
                  <div className="whitespace-pre-wrap">
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-1 last:mb-0">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-center text-xs text-emerald-500 ml-10">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing...
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>

          {/* Input Area */}
          <div className={`p-4 border-t ${theme.divider} bg-opacity-50`}>
            <div className="flex items-center gap-2 mb-2">
               <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv,.xlsx,.xls,.sav"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload Data
              </button>
              
              <button 
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`p-1.5 rounded-lg ${showCustomInput ? 'bg-amber-100 text-amber-600' : theme.textFaint}`}
              >
                <Lightbulb className="w-4 h-4" />
        </button>
      </div>

            {showCustomInput && (
              <textarea
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="Supervisor instructions..."
                className={`w-full p-2 mb-2 rounded-lg text-xs border ${theme.input} resize-none`}
                rows={2}
              />
            )}

            <div className={`flex items-center gap-2 ${theme.input} rounded-xl px-3 py-2 border`}>
              <input
                ref={chatInputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your instruction..."
                className={`flex-1 bg-transparent text-sm outline-none ${theme.text}`}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`p-1.5 rounded-lg transition-all ${
                  inputMessage.trim() ? 'bg-blue-600 text-white' : theme.textFaint
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Smart Dashboard (Lab Bench) */}
        <div className={`flex-1 flex flex-col rounded-2xl border ${theme.card} overflow-hidden shadow-sm`}>
          {/* Dashboard Tabs */}
          <div className={`flex items-center px-2 border-b ${theme.divider}`}>
            {[
              { id: 'overview', label: 'Overview', icon: PieChart },
              { id: 'health', label: 'Data Health', icon: Activity },
              { id: 'variables', label: 'Variables', icon: Table },
              { id: 'results', label: 'Results', icon: FileText },
            ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? `border-blue-500 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                    : `border-transparent ${theme.textMuted} hover:${theme.text}`
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
            </button>
          ))}
        </div>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20">
            {activeTab === 'overview' && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                {!currentDatasetId ? (
                  <div className="max-w-md space-y-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                      <Upload className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${theme.text}`}>Ready to Analyze</h3>
                    <p className={theme.textMuted}>
                      Upload your CSV, Excel, or SPSS file to the left. I'll immediately scan it for quality issues and suggest the best statistical tests.
                    </p>
            </div>
                ) : (
                  <div className="w-full max-w-2xl space-y-6">
                    {/* File Card */}
                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                          <FileSpreadsheet className="w-6 h-6" />
          </div>
                        <div className="text-left">
                          <h3 className={`font-bold ${theme.text}`}>{uploadedFile?.name}</h3>
                          <p className={`text-sm ${theme.textMuted}`}>
                            {qualityReport?.dataset_info.rows} rows • {qualityReport?.dataset_info.columns} variables
                          </p>
            </div>
          </div>
                      
                      {/* Recommendations */}
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => { setActiveTab('health'); setInputMessage('Show me the data issues.'); }}
                          className={`p-4 rounded-xl border text-left transition-all ${darkMode ? 'bg-slate-900/50 border-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}
                        >
                          <Activity className="w-5 h-5 text-emerald-500 mb-2" />
                          <h4 className={`font-medium ${theme.text}`}>Check Quality</h4>
                          <p className={`text-xs ${theme.textMuted}`}>Review missing values & outliers</p>
                        </button>
                        <button 
                          onClick={() => { setActiveTab('variables'); setInputMessage('Describe the key variables.'); }}
                          className={`p-4 rounded-xl border text-left transition-all ${darkMode ? 'bg-slate-900/50 border-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}
                        >
                          <Search className="w-5 h-5 text-blue-500 mb-2" />
                          <h4 className={`font-medium ${theme.text}`}>Explore Data</h4>
                          <p className={`text-xs ${theme.textMuted}`}>View descriptive statistics</p>
                        </button>
            </div>
          </div>
        </div>
                )}
              </div>
            )}

            {activeTab === 'health' && renderDataHealthTab()}
            
            {activeTab === 'variables' && renderVariablesTab()}
            
            {activeTab === 'results' && (
              <div className="flex flex-col items-center justify-center h-full">
                <FileText className={`w-12 h-12 mb-4 ${theme.textFaint}`} />
                <p className={theme.textMuted}>Analysis results will appear here.</p>
                <p className={`text-xs ${theme.textFaint} mt-2`}>Try asking: "Run a correlation between..."</p>
              </div>
            )}
              </div>
            </div>
        </div>
    </div>
  );
}
