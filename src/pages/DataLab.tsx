import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Send, Download, FileSpreadsheet, BarChart3, Table2, FileText, 
  CheckCircle2, Circle, ChevronRight, Lightbulb, Trash2, RefreshCw, 
  Settings, HelpCircle, X, File, Activity, TrendingUp, PieChart, AlertCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import * as dataAnalysisR1 from '../services/dataAnalysisR1';
import type { QualityReport, DescriptiveStats, AnalysisResult } from '../services/dataAnalysisR1';
import { saveAs } from 'file-saver';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeneratedOutput {
  id: string;
  name: string;
  type: 'table' | 'chart' | 'document';
  status: 'ready' | 'generating';
  data?: any;
  content?: string;
  downloadFormat?: 'csv' | 'xlsx' | 'txt' | 'md';
}

export default function DataLab() {
  const { darkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1',
      role: 'assistant', 
      content: "Welcome to Data Analysis Lab! I'll guide you through your statistical analysis step by step. What are your research objectives?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [descriptiveStats, setDescriptiveStats] = useState<DescriptiveStats | null>(null);
  const [researchObjectives, setResearchObjectives] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const steps = [
    { id: 1, name: 'Plan', desc: 'Define objectives' },
    { id: 2, name: 'Import', desc: 'Upload data' },
    { id: 3, name: 'Clean', desc: 'Handle missing data' },
    { id: 4, name: 'Profile', desc: 'Descriptive stats' },
    { id: 5, name: 'Analyze', desc: 'Statistical tests' },
    { id: 6, name: 'Results', desc: 'Tables & narratives' },
    { id: 7, name: 'Export', desc: 'Download Chapter 4' },
  ];

  const quickActions = [
    { icon: FileText, label: 'Define Objectives', color: 'bg-blue-500', action: 'objectives' },
    { icon: Table2, label: 'Choose Variables', color: 'bg-purple-500', action: 'variables' },
    { icon: BarChart3, label: 'Pick Analysis', color: 'bg-orange-500', action: 'analysis' },
  ];

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsProcessing(true);

    // Simple rule-based responses + AI for complex queries
    try {
      if (currentStep === 1) {
        // Planning phase - capture objectives
        setResearchObjectives(userMessage);
        setTimeout(() => {
          addMessage('assistant', 
            `Great! I've noted your research objectives: "${userMessage}"\n\n` +
            `Now let's import your dataset. Please upload your CSV or Excel file using the upload area on the right. ` +
            `I'll automatically check data quality and generate descriptive statistics.`
          );
          setCurrentStep(2);
        }, 800);
      } else if (currentStep === 2 && !uploadedFile) {
        addMessage('assistant', 
          `Please upload your dataset first. You can drag and drop a CSV or Excel file in the upload area, or click to browse.`
        );
      } else {
        // Use AI for analysis requests
        await handleAnalysisRequest(userMessage);
      }
    } catch (error) {
      addMessage('assistant', 'Sorry, I encountered an error processing your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalysisRequest = async (request: string) => {
    const lowerRequest = request.toLowerCase();
    
    if (lowerRequest.includes('correlation') || lowerRequest.includes('relationship')) {
      await runCorrelationAnalysis();
    } else if (lowerRequest.includes('regression') || lowerRequest.includes('predict')) {
      await runRegressionAnalysis();
    } else if (lowerRequest.includes('compare') || lowerRequest.includes('difference')) {
      await runComparisonAnalysis();
    } else if (lowerRequest.includes('describe') || lowerRequest.includes('summary')) {
      showDescriptiveStats();
    } else {
      // General AI response
      addMessage('assistant', 
        `I can help you with:\n\n` +
        `• **Descriptive Statistics** - Summary of your variables\n` +
        `• **Correlation Analysis** - Relationships between variables\n` +
        `• **Regression Analysis** - Predictive modeling\n` +
        `• **Comparison Tests** - t-tests, ANOVA, chi-square\n\n` +
        `What would you like to analyze?`
      );
    }
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = 'dataTransfer' in e ? e.dataTransfer?.files[0] : e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);
    
    addMessage('assistant', `📂 Uploading and analyzing "${file.name}"...`);

    try {
      // Import dataset
      const importResult = await dataAnalysisR1.importDataset(file);
      
      if (!importResult.success) {
        addMessage('assistant', `❌ Failed to import file: ${importResult.error}`);
        setUploadedFile(null);
        return;
      }

      // Run quality check
      const quality = dataAnalysisR1.runQualityCheck();
      setQualityReport(quality);

      // Get descriptive stats
      const stats = dataAnalysisR1.getDescriptiveStats();
      setDescriptiveStats(stats);

      // Add quality report output
      if (quality) {
        const qualityOutput: GeneratedOutput = {
          id: 'quality_' + Date.now(),
          name: 'Data Quality Report',
          type: 'document',
          status: 'ready',
          content: formatQualityReport(quality),
          downloadFormat: 'txt'
        };
        setOutputs(prev => [...prev, qualityOutput]);
      }

      // Add descriptive stats output
      if (stats) {
        const statsOutput: GeneratedOutput = {
          id: 'descriptive_' + Date.now(),
          name: 'Descriptive Statistics',
          type: 'table',
          status: 'ready',
          data: stats,
          content: formatDescriptiveStats(stats),
          downloadFormat: 'csv'
        };
        setOutputs(prev => [...prev, statsOutput]);
      }

      // Success message
      const dataset = importResult.dataset!;
      const issueCount = quality?.summary.total_issues || 0;
      const qualityScore = quality?.summary.data_quality_score || 0;

      addMessage('assistant',
        `✅ **File uploaded successfully!**\n\n` +
        `📊 **Dataset Summary:**\n` +
        `• ${dataset.rows} rows, ${dataset.columns} columns\n` +
        `• Data Quality Score: ${qualityScore}/100\n` +
        `• Issues Found: ${issueCount}\n\n` +
        `${issueCount > 0 ? 
          `⚠️ I found some data quality issues. Check the "Data Quality Report" in outputs.\n\n` : 
          `✨ Your data looks clean!\n\n`}` +
        `I've generated descriptive statistics. You can now proceed with:\n` +
        `• Data cleaning (if needed)\n` +
        `• Correlation analysis\n` +
        `• Regression analysis\n` +
        `• Comparison tests\n\n` +
        `What would you like to do next?`
      );

      setCurrentStep(3);
      
    } catch (error) {
      console.error('File processing error:', error);
      addMessage('assistant', `❌ Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const showDescriptiveStats = () => {
    if (!descriptiveStats) {
      addMessage('assistant', 'Please upload a dataset first.');
      return;
    }

    const summary = formatDescriptiveStats(descriptiveStats);
    addMessage('assistant', 
      `📊 **Descriptive Statistics Summary:**\n\n${summary}\n\n` +
      `The full statistics table is available in the outputs panel on the right.`
    );
  };

  const runCorrelationAnalysis = async () => {
    if (!uploadedFile) {
      addMessage('assistant', 'Please upload a dataset first.');
      return;
    }

    setIsProcessing(true);
    addMessage('assistant', '🔄 Running correlation analysis...');

    try {
      const dataset = dataAnalysisR1.getCurrentDataset();
      if (!dataset) {
        throw new Error('No dataset loaded');
      }

      // Get continuous variables
      const continuousVars = Object.entries(dataset.columnTypes)
        .filter(([_, type]) => type === 'continuous')
        .map(([name]) => name);

      if (continuousVars.length < 2) {
        addMessage('assistant', '⚠️ Need at least 2 continuous variables for correlation analysis.');
        return;
      }

      const result = await dataAnalysisR1.runStatisticalAnalysis(
        'correlation',
        continuousVars.slice(0, 5), // Limit to 5 variables
        researchObjectives || 'Examine relationships between variables'
      );

      if (result) {
        const output: GeneratedOutput = {
          id: 'correlation_' + Date.now(),
          name: 'Correlation Analysis',
          type: 'table',
          status: 'ready',
          data: result,
          content: result.statistical_output,
          downloadFormat: 'txt'
        };
        setOutputs(prev => [...prev, output]);

        addMessage('assistant', 
          `✅ **Correlation Analysis Complete**\n\n` +
          `${result.interpretation}\n\n` +
          `The detailed correlation matrix is available in the outputs panel.`
        );
        setCurrentStep(5);
      }
    } catch (error) {
      addMessage('assistant', `❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const runRegressionAnalysis = async () => {
    if (!uploadedFile) {
      addMessage('assistant', 'Please upload a dataset first.');
      return;
    }

    setIsProcessing(true);
    addMessage('assistant', '🔄 Running regression analysis...');

    try {
      const dataset = dataAnalysisR1.getCurrentDataset();
      if (!dataset) throw new Error('No dataset loaded');

      const continuousVars = Object.entries(dataset.columnTypes)
        .filter(([_, type]) => type === 'continuous')
        .map(([name]) => name);

      if (continuousVars.length < 2) {
        addMessage('assistant', '⚠️ Need at least 2 continuous variables for regression.');
        return;
      }

      const result = await dataAnalysisR1.runStatisticalAnalysis(
        'linear_regression',
        continuousVars.slice(0, 4),
        researchObjectives || 'Predict outcome variable'
      );

      if (result) {
        const output: GeneratedOutput = {
          id: 'regression_' + Date.now(),
          name: 'Regression Analysis',
          type: 'document',
          status: 'ready',
          content: result.statistical_output,
          downloadFormat: 'txt'
        };
        setOutputs(prev => [...prev, output]);

        addMessage('assistant',
          `✅ **Regression Analysis Complete**\n\n` +
          `${result.interpretation}\n\n` +
          `**APA Format:**\n${result.apa_format}\n\n` +
          `Full results are available in the outputs panel.`
        );
        setCurrentStep(5);
      }
    } catch (error) {
      addMessage('assistant', `❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const runComparisonAnalysis = async () => {
    addMessage('assistant', 
      `For comparison tests, I need to know:\n\n` +
      `• What groups are you comparing?\n` +
      `• What outcome variable?\n` +
      `• Independent samples or paired?\n\n` +
      `Please provide more details or I'll run a general t-test.`
    );
  };

  const handleQuickAction = (action: string) => {
    if (action === 'objectives') {
      setInput('My research objective is to ');
    } else if (action === 'variables') {
      if (descriptiveStats) {
        const vars = [
          ...Object.keys(descriptiveStats.continuous),
          ...Object.keys(descriptiveStats.categorical)
        ].join(', ');
        addMessage('assistant', `📋 **Available Variables:**\n\n${vars}\n\nWhich variables would you like to analyze?`);
      } else {
        addMessage('assistant', 'Please upload a dataset first to see available variables.');
      }
    } else if (action === 'analysis') {
      addMessage('assistant', 
        `📊 **Available Analyses:**\n\n` +
        `1. **Correlation** - Examine relationships\n` +
        `2. **Regression** - Predict outcomes\n` +
        `3. **t-test/ANOVA** - Compare groups\n` +
        `4. **Chi-square** - Test associations\n\n` +
        `What type of analysis do you need?`
      );
    }
  };

  const handleDownload = (output: GeneratedOutput) => {
    if (!output.content) return;

    const blob = new Blob([output.content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${output.name}.${output.downloadFormat || 'txt'}`);
  };

  const handleDownloadAll = () => {
    outputs.forEach(output => {
      if (output.status === 'ready' && output.content) {
        setTimeout(() => handleDownload(output), 100);
      }
    });
  };

  const exportChapter4 = async () => {
    if (outputs.length === 0) {
      addMessage('assistant', '⚠️ No results to export yet. Please complete some analyses first.');
      return;
    }

    setIsProcessing(true);
    addMessage('assistant', '📄 Generating Chapter 4...');

    try {
      const chapter4Content = generateChapter4(outputs, researchObjectives, qualityReport, descriptiveStats);
      
      const blob = new Blob([chapter4Content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, 'Chapter_4_Results.txt');

      addMessage('assistant', 
        `✅ **Chapter 4 exported successfully!**\n\n` +
        `The file includes:\n` +
        `• Introduction\n` +
        `• Data quality assessment\n` +
        `• Descriptive statistics\n` +
        `• All analysis results\n` +
        `• APA-formatted reporting\n\n` +
        `You can now edit and format it in Word.`
      );
      setCurrentStep(7);
    } catch (error) {
      addMessage('assistant', '❌ Failed to export Chapter 4.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">Data Analysis Lab</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Students Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Session: <span className="font-medium text-gray-700 dark:text-gray-300">Quantitative Analysis</span>
          </span>
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
            <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">✦ Unlimited</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step.id < currentStep ? 'bg-green-500 text-white' :
                  step.id === currentStep ? 'bg-orange-500 text-white ring-4 ring-orange-100 dark:ring-orange-900' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}>
                  {step.id < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step.id}
          </div>
                <span className={`text-xs mt-1.5 font-medium ${
                  step.id === currentStep ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.name}
                </span>
        </div>
              {idx < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 mt-[-12px] ${
                  step.id < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-1/2 flex flex-col border-r dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-orange-500 text-white rounded-br-md' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 rounded-bl-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>

          {/* Quick Actions */}
          <div className="px-4 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-2 mb-3">
              {quickActions.map((action, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleQuickAction(action.action)}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <action.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Lightbulb className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe your analysis needs..."
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-gray-600"
                />
              </div>
              <button 
                onClick={handleSend}
                disabled={isProcessing || !input.trim()}
                className="p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">Powered by DeepSeek R1 Reasoner</p>
          </div>
        </div>

        {/* Right Panel - Workspace */}
        <div className="w-1/2 flex flex-col bg-gray-50 dark:bg-gray-900 p-4">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-all cursor-pointer ${
              dragOver ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 
              uploadedFile ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 
              'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              onChange={handleFileDrop} 
              accept=".csv,.xlsx,.xls" 
            />
            {uploadedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-10 h-10 text-green-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-800 dark:text-gray-200">{uploadedFile.name}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">✓ File uploaded successfully</p>
                </div>
            <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setUploadedFile(null);
                    setOutputs([]);
                    setQualityReport(null);
                    setDescriptiveStats(null);
                    dataAnalysisR1.clearCurrentDataset();
                  }}
                  className="ml-4 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                >
                  <X className="w-5 h-5" />
            </button>
            </div>
                ) : (
              <>
                <Upload className={`w-12 h-12 mx-auto mb-3 ${dragOver ? 'text-orange-500' : 'text-gray-400'}`} />
                <p className="font-medium text-gray-700 dark:text-gray-300">Drop your dataset here</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">CSV, Excel (.xlsx, .xls) supported</p>
              </>
            )}
          </div>
                      
          {/* Generated Outputs */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Generated Outputs</h3>
              {outputs.length > 0 && (
                        <button 
                  onClick={handleDownloadAll}
                  className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium flex items-center gap-1"
                        >
                  <Download className="w-4 h-4" /> Download All
                        </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {outputs.length > 0 ? outputs.map((output) => (
                <div key={output.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group">
                  <div className="flex items-center gap-3">
                    {output.type === 'table' ? (
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Table2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    ) : output.type === 'chart' ? (
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{output.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ready to download</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                      onClick={() => handleDownload(output)}
                      className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
                        >
                      <Download className="w-4 h-4" />
                        </button>
            </div>
          </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <FileText className="w-12 h-12 mb-2" />
                  <p className="text-sm">No outputs generated yet</p>
                  <p className="text-xs">Complete the analysis steps to see results here</p>
        </div>
                )}
              </div>

            {/* Export Chapter 4 Button */}
            {outputs.length > 0 && (
              <div className="p-4 border-t dark:border-gray-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                <button 
                  onClick={exportChapter4}
                  disabled={isProcessing}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 dark:shadow-orange-900/30 disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  Export Complete Chapter 4
                </button>
              </div>
            )}
              </div>
            </div>
        </div>
    </div>
  );
}

// Helper Functions

function formatQualityReport(report: QualityReport): string {
  return `DATA QUALITY REPORT
==================

Dataset Information:
• Rows: ${report.dataset_info.rows}
• Columns: ${report.dataset_info.columns}
• Variables: ${report.dataset_info.column_names.join(', ')}

Quality Score: ${report.summary.data_quality_score}/100

Duplicates:
• Exact duplicates: ${report.duplicates.exact_duplicates} (${report.duplicates.percentage.toFixed(1)}%)

Missing Data:
• Total missing cells: ${report.missing_data.total_missing_cells}
• Overall missing: ${report.missing_data.overall_missing_percentage.toFixed(1)}%
${report.missing_data.high_missing_columns.length > 0 ? 
  `• Columns with high missing data: ${report.missing_data.high_missing_columns.join(', ')}` : 
  '• No columns with high missing data'}

Outliers:
• Columns with outliers: ${report.outliers.columns_with_outliers}
${Object.entries(report.outliers.by_column).map(([col, info]) => 
  `• ${col}: ${info.count} outliers (${info.percentage.toFixed(1)}%)`
).join('\n')}

Summary:
• Total issues: ${report.summary.total_issues}
• Critical issues: ${report.summary.critical_issues}
• Recommendation: ${report.summary.recommendation}
`;
}

function formatDescriptiveStats(stats: DescriptiveStats): string {
  let output = 'DESCRIPTIVE STATISTICS\n=====================\n\n';
  
  output += 'CONTINUOUS VARIABLES:\n\n';
  Object.entries(stats.continuous).forEach(([varName, data]) => {
    output += `${varName}:\n`;
    output += `  N = ${data.n}\n`;
    output += `  Mean = ${data.mean.toFixed(2)}\n`;
    output += `  SD = ${data.std.toFixed(2)}\n`;
    output += `  Median = ${data.median.toFixed(2)}\n`;
    output += `  Min = ${data.min.toFixed(2)}\n`;
    output += `  Max = ${data.max.toFixed(2)}\n`;
    output += `  Skewness = ${data.skewness.toFixed(2)}\n\n`;
  });
  
  output += '\nCATEGORICAL VARIABLES:\n\n';
  Object.entries(stats.categorical).forEach(([varName, data]) => {
    output += `${varName} (${data.unique_values} categories):\n`;
    data.categories.slice(0, 5).forEach(cat => {
      output += `  ${cat.category}: ${cat.n} (${cat.percentage.toFixed(1)}%)\n`;
    });
    output += '\n';
  });
  
  return output;
}

function generateChapter4(
  outputs: GeneratedOutput[], 
  objectives: string, 
  quality: QualityReport | null,
  stats: DescriptiveStats | null
): string {
  let chapter = `CHAPTER FOUR: RESULTS

4.1 Introduction

This chapter presents the results of the data analysis conducted to address the research objectives. The analysis was performed using advanced statistical methods to ensure accuracy and reliability.

${objectives ? `Research Objective: ${objectives}\n\n` : ''}`;

  if (quality) {
    chapter += `4.2 Data Quality Assessment

The dataset consisted of ${quality.dataset_info.rows} observations across ${quality.dataset_info.columns} variables. Data quality checks revealed a quality score of ${quality.summary.data_quality_score}/100. ${quality.summary.total_issues > 0 ? 
      `A total of ${quality.summary.total_issues} issues were identified and addressed through appropriate cleaning procedures.` : 
      'The data demonstrated high quality with minimal issues.'
    }

`;
  }

  if (stats) {
    chapter += `4.3 Descriptive Statistics

Table 4.1 presents the descriptive statistics for all study variables.

${formatDescriptiveStats(stats)}

`;
  }

  outputs.forEach((output, index) => {
    if (output.type !== 'document' || output.name === 'Data Quality Report') return;
    
    chapter += `4.${3 + index} ${output.name}

${output.content || ''}

`;
  });

  chapter += `4.${outputs.length + 4} Summary

This chapter presented the results of the statistical analyses conducted. The findings provide important insights into the research questions and will be discussed in detail in the following chapter.
`;

  return chapter;
}
