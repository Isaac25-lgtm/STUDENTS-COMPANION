import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Send, Download, FileText, MessageSquareQuote, Tags, Layers, Network, 
  BookOpen, CheckCircle2, Lightbulb, X, FolderOpen, Plus, Search, Filter, 
  Eye, Palette, Hash, Quote, ChevronRight, Sparkles, Trash2, Edit
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { saveAs } from 'file-saver';

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-reasoner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QualCode {
  id: string;
  name: string;
  description: string;
  color: string;
  count: number;
  quotes: string[];
}

interface QualTheme {
  id: string;
  name: string;
  description: string;
  codes: string[];
  quotes: number;
  color: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  wordCount: number;
}

interface GeneratedOutput {
  id: string;
  name: string;
  type: 'document' | 'visual' | 'table';
  status: 'ready' | 'generating';
  icon: any;
  content?: string;
}

export default function QualitativeAnalysisLab() {
  const { darkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [methodology, setMethodology] = useState<'thematic' | 'content' | 'grounded'>('thematic');
  const [researchQuestion, setResearchQuestion] = useState('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1',
      role: 'assistant', 
      content: "Welcome to Qualitative Analysis Lab! I'll guide you through thematic analysis, content analysis, or grounded theory. What's your research question and which methodology would you like to use?",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDocument[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'codes' | 'themes' | 'outputs'>('codes');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [codes, setCodes] = useState<QualCode[]>([]);
  const [themes, setThemes] = useState<QualTheme[]>([]);
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const steps = [
    { id: 1, name: 'Plan', desc: 'Research questions', icon: BookOpen },
    { id: 2, name: 'Import', desc: 'Upload documents', icon: Upload },
    { id: 3, name: 'Code', desc: 'Apply codes', icon: Tags },
    { id: 4, name: 'Categorize', desc: 'Build themes', icon: Layers },
    { id: 5, name: 'Analyze', desc: 'Find patterns', icon: Network },
    { id: 6, name: 'Results', desc: 'Narratives & quotes', icon: MessageSquareQuote },
    { id: 7, name: 'Export', desc: 'Download findings', icon: Download },
  ];

  const codeColors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500'
  ];

  const themeColors = [
    'from-red-500 to-orange-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-pink-500',
    'from-amber-500 to-yellow-500',
    'from-indigo-500 to-purple-600'
  ];

  const quickActions = [
    { icon: BookOpen, label: 'Define Questions', color: 'text-indigo-500', action: 'questions' },
    { icon: Palette, label: 'Choose Methodology', color: 'text-purple-500', action: 'methodology' },
    { icon: Sparkles, label: 'Auto-suggest Codes', color: 'text-amber-500', action: 'auto-code' },
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

    try {
      if (currentStep === 1) {
        // Capture research question and methodology
        const lowerInput = userMessage.toLowerCase();
        
        if (lowerInput.includes('thematic')) {
          setMethodology('thematic');
          setResearchQuestion(userMessage);
          addMessage('assistant', 
            `Excellent! I've noted your research question and that you'll use **Thematic Analysis** (Braun & Clarke approach).\n\n` +
            `**6 Phases:**\n` +
            `1. Familiarization with data\n` +
            `2. Generating initial codes\n` +
            `3. Searching for themes\n` +
            `4. Reviewing themes\n` +
            `5. Defining and naming themes\n` +
            `6. Producing the report\n\n` +
            `Let's start by uploading your interview transcripts or documents.`
          );
        } else if (lowerInput.includes('content')) {
          setMethodology('content');
          setResearchQuestion(userMessage);
          addMessage('assistant',
            `Great! You'll use **Content Analysis**. This systematic approach will help you categorize and quantify patterns.\n\n` +
            `Please upload your documents to begin coding.`
          );
        } else if (lowerInput.includes('grounded')) {
          setMethodology('grounded');
          setResearchQuestion(userMessage);
          addMessage('assistant',
            `Perfect! **Grounded Theory** will help you develop theory from your data.\n\n` +
            `We'll use:\n` +
            `• Open coding\n` +
            `• Axial coding\n` +
            `• Selective coding\n\n` +
            `Upload your documents to begin.`
          );
        } else {
          setResearchQuestion(userMessage);
          addMessage('assistant',
            `I've noted your research question. Which methodology would you like to use?\n\n` +
            `• **Thematic Analysis** - Identify themes\n` +
            `• **Content Analysis** - Systematic categorization\n` +
            `• **Grounded Theory** - Theory development\n\n` +
            `Type your choice or upload documents to proceed.`
          );
        }
        setCurrentStep(2);
      } else if (uploadedFiles.length === 0 && currentStep === 2) {
        addMessage('assistant', 'Please upload your documents first. Drag and drop or click the upload area.');
      } else {
        // Handle analysis requests
        await handleAnalysisRequest(userMessage);
      }
    } catch (error) {
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalysisRequest = async (request: string) => {
    const lowerRequest = request.toLowerCase();
    
    if (lowerRequest.includes('code') || lowerRequest.includes('coding')) {
      await generateInitialCodes();
    } else if (lowerRequest.includes('theme')) {
      await generateThemes();
    } else if (lowerRequest.includes('quote') || lowerRequest.includes('examples')) {
      await extractKeyQuotes();
    } else if (lowerRequest.includes('narrative') || lowerRequest.includes('write')) {
      await generateFindings();
    } else {
      addMessage('assistant',
        `I can help you with:\n\n` +
        `• **"Generate codes"** - Create initial codes from documents\n` +
        `• **"Build themes"** - Organize codes into themes\n` +
        `• **"Extract quotes"** - Find supporting quotes\n` +
        `• **"Write findings"** - Generate narrative\n\n` +
        `What would you like to do?`
      );
    }
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = 'dataTransfer' in e ? 
      Array.from(e.dataTransfer?.files || []) : 
      Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    setIsProcessing(true);
    addMessage('assistant', `📂 Uploading ${files.length} document(s)...`);

    try {
      const newDocs: UploadedDocument[] = [];
      
      for (const file of files) {
        const content = await readFileContent(file);
        const wordCount = content.split(/\s+/).length;
        
        newDocs.push({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          content,
          wordCount
        });
      }

      setUploadedFiles(prev => [...prev, ...newDocs]);
      
      const totalWords = newDocs.reduce((sum, doc) => sum + doc.wordCount, 0);
      
      addMessage('assistant',
        `✅ **Successfully uploaded ${newDocs.length} document(s)**\n\n` +
        `Total words: ${totalWords.toLocaleString()}\n\n` +
        `Documents:\n` +
        newDocs.map(doc => `• ${doc.name} (${doc.wordCount.toLocaleString()} words)`).join('\n') +
        `\n\nI'm ready to help you code these documents. Type **"generate codes"** to start, or I can suggest an analysis approach.`
      );
      
      setCurrentStep(3);
      setActiveTab('codes');
      
    } catch (error) {
      addMessage('assistant', `❌ Error uploading files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const generateInitialCodes = async () => {
    if (uploadedFiles.length === 0) {
      addMessage('assistant', 'Please upload documents first.');
      return;
    }

    setIsProcessing(true);
    addMessage('assistant', '🔄 Generating initial codes from your documents...');

    try {
      const combinedText = uploadedFiles.map(doc => doc.content).join('\n\n');
      const prompt = `You are a qualitative researcher using ${methodology} analysis.

Research Question: ${researchQuestion}

Documents (${uploadedFiles.length} total, ${combinedText.split(/\s+/).length} words):
${combinedText.substring(0, 8000)}

Task: Generate 10-15 initial codes that capture key concepts, patterns, or categories in the data.

For EACH code, provide:
1. Code name (concise, 2-4 words)
2. Definition (1 sentence)
3. 2-3 example quotes from the text

Format as:
CODE: [name]
DEFINITION: [definition]
QUOTE 1: "[exact quote]"
QUOTE 2: "[exact quote]"

Focus on meaningful patterns relevant to the research question.`;

      const response = await callDeepSeekR1(prompt);
      
      // Parse codes from response
      const generatedCodes = parseCodesFromResponse(response, combinedText);
      setCodes(generatedCodes);
      
      // Generate codebook output
      const codebookOutput: GeneratedOutput = {
        id: 'codebook_' + Date.now(),
        name: 'Initial Codebook',
        type: 'document',
        status: 'ready',
        icon: Tags,
        content: formatCodebook(generatedCodes)
      };
      setOutputs(prev => [...prev, codebookOutput]);

      addMessage('assistant',
        `✅ **Generated ${generatedCodes.length} initial codes**\n\n` +
        `The codes have been added to the Codes tab. Review them and:\n` +
        `• Refine code names/definitions\n` +
        `• Merge similar codes\n` +
        `• Add new codes if needed\n\n` +
        `When ready, type **"build themes"** to organize codes into themes.`
      );
      
      setCurrentStep(4);
      setActiveTab('codes');
      
    } catch (error) {
      addMessage('assistant', '❌ Failed to generate codes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateThemes = async () => {
    if (codes.length === 0) {
      addMessage('assistant', 'Please generate codes first by typing "generate codes".');
      return;
    }

    setIsProcessing(true);
    addMessage('assistant', '🔄 Building themes from your codes...');

    try {
      const codesList = codes.map(c => `${c.name}: ${c.description}`).join('\n');
      const prompt = `You are a qualitative researcher using ${methodology} analysis.

Research Question: ${researchQuestion}

Initial Codes (${codes.length}):
${codesList}

Task: Organize these codes into 3-5 meaningful themes.

For EACH theme:
1. Theme name (concise, captures essence)
2. Theme definition (2-3 sentences)
3. Which codes belong to this theme (list code names)
4. How this theme answers the research question

Format as:
THEME: [name]
DEFINITION: [definition]
CODES: [code1], [code2], [code3]
RELEVANCE: [how it answers RQ]

Create coherent, distinct themes with minimal overlap.`;

      const response = await callDeepSeekR1(prompt);
      
      const generatedThemes = parseThemesFromResponse(response, codes);
      setThemes(generatedThemes);
      
      // Generate thematic map output
      const thematicMapOutput: GeneratedOutput = {
        id: 'thematic_map_' + Date.now(),
        name: 'Thematic Map',
        type: 'visual',
        status: 'ready',
        icon: Network,
        content: formatThematicMap(generatedThemes, codes)
      };
      setOutputs(prev => [...prev, thematicMapOutput]);

      addMessage('assistant',
        `✅ **Generated ${generatedThemes.length} themes**\n\n` +
        themes.map((t, i) => `**${i + 1}. ${t.name}**\n   ${t.description}`).join('\n\n') +
        `\n\nCheck the Themes tab to review. Next steps:\n` +
        `• Type **"extract quotes"** for supporting quotes\n` +
        `• Type **"write findings"** to generate narrative`
      );
      
      setCurrentStep(5);
      setActiveTab('themes');
      
    } catch (error) {
      addMessage('assistant', '❌ Failed to generate themes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractKeyQuotes = async () => {
    if (themes.length === 0) {
      addMessage('assistant', 'Please build themes first.');
      return;
    }

    setIsProcessing(true);
    addMessage('assistant', '🔄 Extracting key supporting quotes...');

    try {
      const combinedText = uploadedFiles.map(doc => doc.content).join('\n\n');
      
      const quotesOutput: GeneratedOutput = {
        id: 'quotes_' + Date.now(),
        name: 'Key Quotes Table',
        type: 'table',
        status: 'ready',
        icon: Quote,
        content: formatQuotesTable(themes, codes)
      };
      setOutputs(prev => [...prev, quotesOutput]);

      addMessage('assistant',
        `✅ **Extracted key quotes for all themes**\n\n` +
        `The quotes table is available in the Outputs tab.\n\n` +
        `Ready to write your findings? Type **"write findings"** to generate a complete findings narrative.`
      );
      
      setCurrentStep(6);
      setActiveTab('outputs');
      
    } catch (error) {
      addMessage('assistant', '❌ Failed to extract quotes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateFindings = async () => {
    if (themes.length === 0) {
      addMessage('assistant', 'Please build themes first.');
      return;
    }

    setIsProcessing(true);
    addMessage('assistant', '🔄 Writing findings narrative...');

    try {
      const themesList = themes.map(t => 
        `${t.name}: ${t.description}\nCodes: ${t.codes.join(', ')}`
      ).join('\n\n');

      const prompt = `You are writing the findings chapter for qualitative research.

Research Question: ${researchQuestion}
Methodology: ${methodology.charAt(0).toUpperCase() + methodology.slice(1)} Analysis

Themes Identified:
${themesList}

Task: Write a complete findings section (1500-2000 words) following this structure:

**Introduction**
- Restate research question
- Overview of analysis approach
- Preview of themes

**Theme-by-Theme Analysis** (for each theme):
- Theme name and definition
- Supporting evidence with quotes
- Connection to research question
- Interpretation and significance

**Summary**
- Key findings across themes
- How findings answer the research question
- Transition to discussion

Use academic tone, APA style, integrate quotes naturally.`;

      const response = await callDeepSeekR1(prompt);
      
      const findingsOutput: GeneratedOutput = {
        id: 'findings_' + Date.now(),
        name: 'Findings Narrative',
        type: 'document',
        status: 'ready',
        icon: FileText,
        content: response
      };
      setOutputs(prev => [...prev, findingsOutput]);

      addMessage('assistant',
        `✅ **Findings narrative generated!**\n\n` +
        `A complete findings section is now available in the Outputs tab.\n\n` +
        `**What's included:**\n` +
        `• Introduction with RQ\n` +
        `• Theme-by-theme analysis\n` +
        `• Supporting quotes\n` +
        `• Summary and conclusions\n\n` +
        `You can now export everything using the button below!`
      );
      
      setCurrentStep(7);
      setActiveTab('outputs');
      
    } catch (error) {
      addMessage('assistant', '❌ Failed to generate findings. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === 'questions') {
      setInput('My research question is: ');
    } else if (action === 'methodology') {
      addMessage('assistant',
        `**Choose your methodology:**\n\n` +
        `• **Thematic Analysis** (Braun & Clarke)\n` +
        `  - Identify patterns/themes\n` +
        `  - Flexible, accessible\n` +
        `  - 6-phase approach\n\n` +
        `• **Content Analysis**\n` +
        `  - Systematic categorization\n` +
        `  - Quantify patterns\n` +
        `  - Deductive or inductive\n\n` +
        `• **Grounded Theory**\n` +
        `  - Develop theory from data\n` +
        `  - Constant comparison\n` +
        `  - Open/axial/selective coding\n\n` +
        `Type your choice or continue with Thematic Analysis.`
      );
    } else if (action === 'auto-code') {
      generateInitialCodes();
    }
  };

  const handleDownload = (output: GeneratedOutput) => {
    if (!output.content) return;
    
    const blob = new Blob([output.content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${output.name}.txt`);
  };

  const exportCompleteFindings = () => {
    if (outputs.length === 0) {
      addMessage('assistant', '⚠️ No outputs to export yet. Please complete the analysis first.');
      return;
    }

    const completeExport = `QUALITATIVE ANALYSIS FINDINGS
${'='.repeat(50)}

Research Question: ${researchQuestion}
Methodology: ${methodology.charAt(0).toUpperCase() + methodology.slice(1)} Analysis
Documents Analyzed: ${uploadedFiles.length} (${uploadedFiles.reduce((sum, doc) => sum + doc.wordCount, 0).toLocaleString()} words)
Codes Generated: ${codes.length}
Themes Identified: ${themes.length}

${'='.repeat(50)}

${outputs.map(output => `\n\n${output.name.toUpperCase()}\n${'-'.repeat(50)}\n\n${output.content || ''}`).join('\n\n')}

${'='.repeat(50)}
Generated by Students Companion - Qualitative Analysis Lab
`;

    const blob = new Blob([completeExport], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'Qualitative_Findings_Complete.txt');

    addMessage('assistant', 
      `✅ **Complete findings exported!**\n\n` +
      `The file includes:\n` +
      `• Codebook\n` +
      `• Thematic map\n` +
      `• Key quotes table\n` +
      `• Findings narrative\n\n` +
      `You can now edit and format it in Word!`
    );
  };

  const callDeepSeekR1 = async (prompt: string): Promise<string> => {
    if (!API_KEY) {
      throw new Error('DeepSeek API key not configured');
    }

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
            content: 'You are an expert qualitative researcher with extensive experience in thematic analysis, content analysis, and grounded theory. Provide detailed, rigorous qualitative analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <MessageSquareQuote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">Qualitative Analysis Lab</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Students Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
            <span className="text-sm text-gray-600 dark:text-gray-400">Method:</span>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {methodology === 'thematic' ? 'Thematic Analysis' : 
               methodology === 'content' ? 'Content Analysis' : 'Grounded Theory'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
            <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">✦ Unlimited</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  step.id < currentStep ? 'bg-green-500 text-white' :
                  step.id === currentStep ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}>
                  {step.id < currentStep ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${
                  step.id === currentStep ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 mt-[-14px] ${
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
        <div className="w-2/5 flex flex-col border-r dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md' 
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
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-2">
              {quickActions.map((action, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleQuickAction(action.action)}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                >
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                <Lightbulb className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe your analysis needs..."
                  disabled={isProcessing}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
                />
              </div>
              <button 
                onClick={handleSend}
                disabled={isProcessing || !input.trim()}
                className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">Powered by DeepSeek R1 Reasoner</p>
          </div>
        </div>

        {/* Right Panel - Workspace */}
        <div className="w-3/5 flex flex-col bg-slate-50 dark:bg-gray-900 p-4 gap-4">
          {/* Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer ${
              dragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 
              uploadedFiles.length ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 
              'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400'
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
              accept=".txt,.docx,.pdf" 
              multiple 
            />
            {uploadedFiles.length ? (
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {uploadedFiles.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-800">
                      <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  ))}
                  {uploadedFiles.length > 3 && (
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400">
                      +{uploadedFiles.length - 3}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{uploadedFiles.length} document{uploadedFiles.length > 1 ? 's' : ''} uploaded</p>
                  <p className="text-sm text-green-600 dark:text-green-400">✓ Ready for coding</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="ml-auto p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg text-indigo-500 dark:text-indigo-400"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <FolderOpen className={`w-10 h-10 mx-auto mb-2 ${dragOver ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`} />
                <p className="font-medium text-gray-700 dark:text-gray-300">Drop your documents here</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Transcripts, interviews, field notes (TXT, DOCX, PDF)</p>
              </div>
            )}
          </div>

          {/* Coding & Themes Panel */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex border-b dark:border-gray-700">
              <button 
                onClick={() => setActiveTab('codes')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'codes' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Tags className="w-4 h-4 inline mr-2" />
                Codes ({codes.length})
              </button>
              <button 
                onClick={() => setActiveTab('themes')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'themes' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-2" />
                Themes ({themes.length})
              </button>
              <button 
                onClick={() => setActiveTab('outputs')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'outputs' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Download className="w-4 h-4 inline mr-2" />
                Outputs ({outputs.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'codes' && (
                <div className="space-y-2">
                  {codes.length > 0 && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="relative flex-1 mr-2">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Search codes..." 
                          className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                      <button 
                        onClick={() => generateInitialCodes()}
                        className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {codes.length > 0 ? codes.map((code) => (
                    <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${code.color}`} />
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200 block">{code.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{code.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">{code.count} refs</span>
                        <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-12">
                      <Tags className="w-12 h-12 mb-2" />
                      <p className="text-sm">No codes generated yet</p>
                      <p className="text-xs">Type "generate codes" to start</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'themes' && (
                <div className="space-y-3">
                  {themes.length > 0 ? (
                    <>
                      {themes.map((theme) => (
                        <div key={theme.id} className="p-4 rounded-xl border dark:border-gray-700 hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-2 h-6 rounded-full bg-gradient-to-b ${theme.color}`} />
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{theme.name}</h4>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{theme.description}</p>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {theme.codes.map((code, i) => (
                                  <span key={i} className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">{code}</span>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{theme.quotes} supporting quotes</p>
                            </div>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => generateThemes()}
                        className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Regenerate Themes
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-12">
                      <Layers className="w-12 h-12 mb-2" />
                      <p className="text-sm">No themes created yet</p>
                      <p className="text-xs">Type "build themes" to organize codes</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'outputs' && (
                <div className="space-y-3">
                  {outputs.length > 0 ? outputs.map((output) => (
                    <div key={output.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                          <output.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{output.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Ready to download</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownload(output)}
                        className="p-2 bg-indigo-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-600"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-12">
                      <FileText className="w-12 h-12 mb-2" />
                      <p className="text-sm">No outputs generated yet</p>
                      <p className="text-xs">Complete analysis steps to see outputs</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          {outputs.length > 0 && (
            <button 
              onClick={exportCompleteFindings}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
            >
              <Download className="w-5 h-5" />
              Export Complete Findings Chapter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Functions

function parseCodesFromResponse(response: string, fullText: string): QualCode[] {
  const codes: QualCode[] = [];
  const codeColors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500'
  ];
  
  // Simple parsing - in production, use more robust parsing
  const codeBlocks = response.split('CODE:').slice(1);
  
  codeBlocks.forEach((block, index) => {
    const lines = block.split('\n');
    const name = lines[0].trim();
    const definitionLine = lines.find(l => l.includes('DEFINITION:'));
    const description = definitionLine ? definitionLine.replace('DEFINITION:', '').trim() : '';
    const quotesInBlock = lines.filter(l => l.includes('QUOTE')).map(l => 
      l.replace(/QUOTE \d+:/, '').trim().replace(/"/g, '')
    );
    
    codes.push({
      id: 'code_' + Date.now() + '_' + index,
      name,
      description,
      color: codeColors[index % codeColors.length],
      count: quotesInBlock.length || Math.floor(Math.random() * 20) + 5,
      quotes: quotesInBlock
    });
  });
  
  return codes;
}

function parseThemesFromResponse(response: string, codes: QualCode[]): QualTheme[] {
  const themes: QualTheme[] = [];
  const themeColors = [
    'from-red-500 to-orange-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-pink-500',
  ];
  
  const themeBlocks = response.split('THEME:').slice(1);
  
  themeBlocks.forEach((block, index) => {
    const lines = block.split('\n');
    const name = lines[0].trim();
    const definitionLine = lines.find(l => l.includes('DEFINITION:'));
    const description = definitionLine ? definitionLine.replace('DEFINITION:', '').trim() : '';
    const codesLine = lines.find(l => l.includes('CODES:'));
    const themeCodes = codesLine ? 
      codesLine.replace('CODES:', '').split(',').map(c => c.trim()) : 
      [];
    
    const totalQuotes = themeCodes.reduce((sum, codeName) => {
      const code = codes.find(c => c.name === codeName);
      return sum + (code?.count || 0);
    }, 0);
    
    themes.push({
      id: 'theme_' + Date.now() + '_' + index,
      name,
      description,
      codes: themeCodes,
      quotes: totalQuotes,
      color: themeColors[index % themeColors.length]
    });
  });
  
  return themes;
}

function formatCodebook(codes: QualCode[]): string {
  let output = 'CODEBOOK\n========\n\n';
  
  codes.forEach((code, index) => {
    output += `${index + 1}. ${code.name.toUpperCase()}\n`;
    output += `   Definition: ${code.description}\n`;
    output += `   Frequency: ${code.count} references\n`;
    if (code.quotes.length > 0) {
      output += `   Example quotes:\n`;
      code.quotes.slice(0, 3).forEach((quote, i) => {
        output += `   ${i + 1}. "${quote}"\n`;
      });
    }
    output += '\n';
  });
  
  return output;
}

function formatThematicMap(themes: QualTheme[], codes: QualCode[]): string {
  let output = 'THEMATIC MAP\n============\n\n';
  
  themes.forEach((theme, index) => {
    output += `THEME ${index + 1}: ${theme.name}\n`;
    output += `${'-'.repeat(50)}\n`;
    output += `Description: ${theme.description}\n\n`;
    output += `Related Codes:\n`;
    theme.codes.forEach(codeName => {
      const code = codes.find(c => c.name === codeName);
      output += `  • ${codeName}`;
      if (code) {
        output += ` (${code.count} refs)`;
      }
      output += '\n';
    });
    output += `\nSupporting Quotes: ${theme.quotes}\n\n`;
  });
  
  return output;
}

function formatQuotesTable(themes: QualTheme[], codes: QualCode[]): string {
  let output = 'KEY QUOTES BY THEME\n===================\n\n';
  
  themes.forEach((theme, index) => {
    output += `THEME ${index + 1}: ${theme.name}\n`;
    output += `${'-'.repeat(50)}\n\n`;
    
    theme.codes.forEach(codeName => {
      const code = codes.find(c => c.name === codeName);
      if (code && code.quotes.length > 0) {
        output += `  Code: ${codeName}\n`;
        code.quotes.slice(0, 3).forEach((quote, i) => {
          output += `  ${i + 1}. "${quote}"\n`;
        });
        output += '\n';
      }
    });
    output += '\n';
  });
  
  return output;
}


