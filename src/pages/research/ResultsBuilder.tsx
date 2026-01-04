import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Send, 
  Download, 
  CheckCircle2, 
  ArrowLeft,
  Brain,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Table2,
  ArrowRight,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { researchChat } from '../../services/gemini';
import { convertMarkdownToDocx } from '../../utils/markdownToDocx';
import { getResearchProgress, saveResearchProgress } from '../../utils/researchProgress';

interface Message {
  role: 'assistant' | 'user' | 'thinking';
  content: string;
}

type Phase = 'check-proposal' | 'data-source' | 'chat-results' | 'generating' | 'complete';

export default function ResultsBuilder() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [phase, setPhase] = useState<Phase>('check-proposal');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResults, setGeneratedResults] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Data input
  const [dataSource, setDataSource] = useState<'manual' | 'upload' | 'datalab' | null>(null);
  const [manualData, setManualData] = useState('');
  const [researchTopic, setResearchTopic] = useState('');

  useEffect(() => {
    // Check if proposal is completed
    const progress = getResearchProgress();
    if (progress.proposalCompleted && progress.topic) {
      setResearchTopic(progress.topic);
      setPhase('data-source');
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      setMessages(prev => [...prev, { role: 'thinking', content: 'Processing your input...' }]);

      const context = `Research Topic: "${researchTopic}"
      
The student is working on Chapter 4 (Results and Findings). They said: "${userMessage}"

Help them write clear, academic presentation of their data analysis results. Focus on:
- Presenting findings in a logical order matching research objectives
- Using appropriate statistical language
- Interpreting data without discussing implications (save that for Chapter 5)

Keep responses focused and academic.`;

      const response = await researchChat(context, 'proposal');
      
      if (response) {
        setMessages(prev => prev.filter(m => m.role !== 'thinking').concat([{ 
          role: 'assistant', 
          content: response 
        }]));
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.role !== 'thinking').concat([{ 
        role: 'assistant', 
        content: "I'm having trouble connecting. Please try again." 
      }]));
    } finally {
      setIsLoading(false);
    }
  };

  const generateChapter4 = async () => {
    if (!manualData.trim()) {
      alert('Please enter your data analysis results first');
      return;
    }

    setPhase('generating');
    setGenerationProgress(0);

    try {
      const prompt = `You are an academic writing expert. Write a complete Chapter 4: Results and Findings for a research proposal.

**Research Topic:** ${researchTopic}

**Data Analysis Results provided by student:**
${manualData}

**Instructions:**
1. Write a comprehensive Chapter 4 with proper academic structure
2. Include these sections:
   - 4.0 Introduction (brief overview of chapter)
   - 4.1 Response Rate (if applicable)
   - 4.2 Demographic Characteristics of Respondents
   - 4.3 Descriptive Statistics / Presentation of Findings
   - 4.4 Findings per Research Objective (organize by objectives)
   - 4.5 Hypothesis Testing Results (if applicable)
   - 4.6 Summary of Key Findings

3. Present data clearly using:
   - Tables with proper numbering (Table 4.1, 4.2, etc.)
   - Statistical values where applicable
   - Clear interpretations of each finding

4. Write in third person, past tense
5. Be objective - present findings without discussing implications

Write a complete, well-structured chapter ready for submission.`;

      setGenerationProgress(30);
      const response = await researchChat(prompt, 'proposal');
      setGenerationProgress(80);

      if (response) {
        setGeneratedResults(response);
        
        // Save progress
        saveResearchProgress({
          resultsCompleted: true,
          resultsData: response,
        });

        setGenerationProgress(100);
        setPhase('complete');
      }
    } catch (error) {
      console.error('Error generating Chapter 4:', error);
      alert('Failed to generate Chapter 4. Please try again.');
      setPhase('chat-results');
    }
  };

  const exportResults = async () => {
    await convertMarkdownToDocx(generatedResults, 'Chapter 4 - Results', 'Student');
  };

  const proceedToChapter5 = () => {
    navigate('/research/discussion');
  };

  // Check if proposal is completed
  if (phase === 'check-proposal') {
    return (
      <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-amber-50 to-orange-50'}`}>
        <div className={`max-w-lg w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl text-center`}>
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Complete Chapters 1-3 First
          </h2>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            You need to complete your research proposal (Chapters 1-3) before working on Chapter 4: Results.
          </p>
          <button
            onClick={() => navigate('/research/proposal')}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 flex items-center justify-center gap-2"
          >
            Go to Proposal Builder
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Data source selection
  if (phase === 'data-source') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-amber-50 to-orange-50'}`}>
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-sm'} border-b px-6 py-4`}>
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button onClick={() => navigate('/research')} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Chapter 4: Results & Findings</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Present your data analysis results</p>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-6">
          {/* Topic reminder */}
          <div className={`${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 mb-6`}>
            <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              <strong>Your Topic:</strong> {researchTopic}
            </p>
          </div>

          <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How would you like to input your data analysis results?
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* Option 1: Manual Entry */}
            <button
              onClick={() => {
                setDataSource('manual');
                setPhase('chat-results');
                setMessages([{ 
                  role: 'assistant', 
                  content: `Great! Let's write Chapter 4 for your research on:\n\n**"${researchTopic}"**\n\nPlease paste or type your data analysis findings below. Include:\n\n• Response rates\n• Demographic data\n• Key statistics and results\n• Hypothesis test results (if any)\n\nI'll help you format these into a proper Chapter 4.` 
                }]);
              }}
              className={`p-6 rounded-xl border-2 text-left transition-all ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-amber-500' : 'bg-white border-gray-200 hover:border-amber-500'} hover:shadow-lg`}
            >
              <Table2 className="w-10 h-10 text-amber-500 mb-3" />
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Enter Results Manually</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Type or paste your statistical findings and I'll help format them
              </p>
            </button>

            {/* Option 2: Use Data Lab */}
            <button
              onClick={() => navigate('/data-lab')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-orange-500' : 'bg-white border-gray-200 hover:border-orange-500'} hover:shadow-lg`}
            >
              <BarChart3 className="w-10 h-10 text-orange-500 mb-3" />
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Use Data Analysis Lab</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Analyze your data first, then return to write Chapter 4
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-orange-500">
                <ExternalLink className="w-3 h-3" />
                Opens Data Lab
              </div>
            </button>

            {/* Option 3: Upload Results */}
            <button
              onClick={() => {
                setDataSource('upload');
                setPhase('chat-results');
                setMessages([{ 
                  role: 'assistant', 
                  content: `Please paste your exported analysis results below.\n\nIf you analyzed your data using the Data Lab or external software (SPSS, Excel, etc.), copy the key findings and paste them here.\n\nI'll help organize them into a proper Chapter 4 format.` 
                }]);
              }}
              className={`p-6 rounded-xl border-2 text-left transition-all ${darkMode ? 'bg-gray-800 border-gray-700 hover:border-green-500' : 'bg-white border-gray-200 hover:border-green-500'} hover:shadow-lg`}
            >
              <Upload className="w-10 h-10 text-green-500 mb-3" />
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Paste Analysis Output</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Paste results from SPSS, Excel, or Data Lab
              </p>
            </button>
          </div>

          {/* Flow indicator */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-md`}>
            <p className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Research Flow:</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Ch 1-3 ✓
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                Ch 4: Results (You are here)
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className={`px-3 py-1.5 ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'} rounded-lg text-sm`}>
                Ch 5: Discussion
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat & results input phase
  if (phase === 'chat-results') {
    return (
      <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-amber-50 to-orange-50'}`}>
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-sm'} border-b px-6 py-4`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setPhase('data-source')} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Chapter 4: Results</h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Enter your data analysis findings</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'thinking' ? (
                  <div className={`max-w-[85%] ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'} border rounded-2xl px-4 py-3`}>
                    <div className="flex items-center gap-2">
                      <Brain className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'} animate-pulse`} />
                      <p className={`text-sm italic ${darkMode ? 'text-purple-200' : 'text-purple-800'}`}>{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-md shadow-lg' 
                      : darkMode ? 'bg-gray-800 text-gray-100 border border-gray-700' : 'bg-white text-gray-800 shadow-md border'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                )}
              </div>
            ))}
            {isLoading && !messages.some(m => m.role === 'thinking') && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Data input area */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border rounded-2xl p-4 shadow-xl space-y-3`}>
            <textarea
              value={manualData}
              onChange={(e) => setManualData(e.target.value)}
              placeholder="Paste your data analysis results here...

Example:
- Response Rate: 85% (340 out of 400)
- Male: 55%, Female: 45%
- Mean age: 28.5 years (SD=6.2)
- Correlation between X and Y: r=0.65, p<0.001
- Regression: R²=0.42, β=0.35, p<0.05"
              rows={6}
              className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 text-gray-900'} rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none`}
            />
            
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask AI for help..."
                  className={`flex-1 px-4 py-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none`}
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={generateChapter4}
                disabled={!manualData.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate Chapter 4
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generating phase
  if (phase === 'generating') {
    return (
      <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-amber-50 to-orange-50'}`}>
        <div className={`max-w-2xl w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl`}>
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Generating Chapter 4
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Creating your Results and Findings chapter...
            </p>
            
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {generationProgress}% Complete
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Complete phase
  if (phase === 'complete') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-slate-50'} pb-20`}>
        <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b px-6 py-4 sticky top-0 z-10`}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>✅ Chapter 4 Complete!</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Results and Findings ready</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportResults}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Download .docx
              </button>
              <button
                onClick={proceedToChapter5}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                Proceed to Chapter 5
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto p-6">
          {/* Flow indicator */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 mb-6 shadow-md flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Chapter 4 Complete</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Results & Findings</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">Ch 1-3 ✓</span>
              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">Ch 4 ✓</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className={`px-3 py-1.5 ${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700'} rounded-lg text-sm font-medium`}>
                Next: Chapter 5 (Discussion)
              </span>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 shadow-lg prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}>
            <div className="whitespace-pre-wrap">{generatedResults}</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

