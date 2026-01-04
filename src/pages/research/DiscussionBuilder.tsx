import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Send, 
  Download, 
  CheckCircle2, 
  ArrowLeft,
  Brain,
  Sparkles,
  BookOpen,
  Target,
  AlertTriangle,
  ListChecks,
  Lightbulb,
  ArrowRight,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { researchChat } from '../../services/gemini';
import { convertMarkdownToDocx } from '../../utils/markdownToDocx';
import { getResearchProgress, saveResearchProgress, canAccessSection } from '../../utils/researchProgress';

interface Message {
  role: 'assistant' | 'user' | 'thinking';
  content: string;
}

type Phase = 'check-access' | 'input-context' | 'generating' | 'complete';

export default function DiscussionBuilder() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [phase, setPhase] = useState<Phase>('check-access');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedDiscussion, setGeneratedDiscussion] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Context from previous chapters
  const [researchTopic, setResearchTopic] = useState('');
  const [resultsData, setResultsData] = useState('');
  const [discussionContext, setDiscussionContext] = useState('');

  useEffect(() => {
    const access = canAccessSection('discussion');
    if (access.allowed) {
      const progress = getResearchProgress();
      setResearchTopic(progress.topic || '');
      setResultsData(progress.resultsData || '');
      setPhase('input-context');
      setMessages([{
        role: 'assistant',
        content: `Great! Let's write **Chapter 5: Discussion, Conclusions & Recommendations**.\n\n**Your Research Topic:** ${progress.topic || 'Not specified'}\n\nTo write a strong discussion chapter, please provide:\n\n1. **Key findings from Chapter 4** (summary of main results)\n2. **How do these findings compare to the literature you reviewed?**\n3. **Any unexpected results or surprises?**\n\nPaste your key findings below, and I'll help you write a comprehensive Chapter 5.`
      }]);
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
      
The student is working on Chapter 5 (Discussion, Conclusions & Recommendations). They said: "${userMessage}"

Help them interpret their findings, connect to literature, identify implications and limitations, and write recommendations.

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

  const generateChapter5 = async () => {
    if (!discussionContext.trim()) {
      alert('Please enter your key findings and context first');
      return;
    }

    setPhase('generating');
    setGenerationProgress(0);

    try {
      const prompt = `You are an academic writing expert. Write a complete Chapter 5: Discussion, Conclusions and Recommendations for a research proposal.

**Research Topic:** ${researchTopic}

**Chapter 4 Results Summary (provided by student):**
${discussionContext}

${resultsData ? `**Detailed Results from Chapter 4:**\n${resultsData.substring(0, 2000)}` : ''}

**Instructions:**
Write a comprehensive Chapter 5 with these sections:

5.0 Introduction
- Brief overview of the chapter structure

5.1 Discussion of Findings
- Organize by research objective/question
- For each finding:
  - State the finding
  - Explain what it means
  - Compare with existing literature (cite studies)
  - Explain why the result might have occurred
- Discuss any unexpected findings

5.2 Practical Implications
- What do these findings mean for practice?
- Who can use these findings and how?

5.3 Theoretical Implications
- How do findings contribute to theory?
- Do they support or challenge existing theories?

5.4 Limitations of the Study
- Be honest about methodological limitations
- Discuss how limitations might affect results

5.5 Conclusions
- Summarize key findings (match with objectives)
- What are the main takeaways?

5.6 Recommendations
- For practitioners/policymakers
- For future research

Write in third person, past tense. Be academic and comprehensive.`;

      setGenerationProgress(30);
      const response = await researchChat(prompt, 'proposal');
      setGenerationProgress(80);

      if (response) {
        setGeneratedDiscussion(response);
        
        // Save progress
        saveResearchProgress({
          discussionCompleted: true,
          discussionData: response,
        });

        setGenerationProgress(100);
        setPhase('complete');
      }
    } catch (error) {
      console.error('Error generating Chapter 5:', error);
      alert('Failed to generate Chapter 5. Please try again.');
      setPhase('input-context');
    }
  };

  const exportDiscussion = async () => {
    await convertMarkdownToDocx(generatedDiscussion, 'Chapter 5 - Discussion', 'Student');
  };

  const exportFullThesis = async () => {
    const progress = getResearchProgress();
    
    let fullThesis = '# COMPLETE RESEARCH DOCUMENT\n\n';
    
    if (progress.proposalData) {
      fullThesis += '# CHAPTERS 1-3: PROPOSAL\n\n' + progress.proposalData + '\n\n';
    }
    
    if (progress.resultsData) {
      fullThesis += '# CHAPTER 4: RESULTS AND FINDINGS\n\n' + progress.resultsData + '\n\n';
    }
    
    fullThesis += '# CHAPTER 5: DISCUSSION, CONCLUSIONS AND RECOMMENDATIONS\n\n' + generatedDiscussion;
    
    await convertMarkdownToDocx(fullThesis, 'Complete Research - Chapters 1-5', 'Student');
  };

  // Check access
  if (phase === 'check-access') {
    const access = canAccessSection('discussion');
    if (!access.allowed) {
      return (
        <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-violet-50'}`}>
          <div className={`max-w-lg w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl text-center`}>
            <AlertCircle className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Complete Previous Chapters First
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              {access.message}
            </p>
            
            <div className="space-y-3">
              {!getResearchProgress().proposalCompleted && (
                <button
                  onClick={() => navigate('/research/proposal')}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Go to Proposal Builder (Ch 1-3)
                </button>
              )}
              
              {getResearchProgress().proposalCompleted && !getResearchProgress().resultsCompleted && (
                <button
                  onClick={() => navigate('/research/results')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  Go to Results Builder (Ch 4)
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Input context phase
  if (phase === 'input-context') {
    return (
      <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-violet-50'}`}>
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-sm'} border-b px-6 py-4`}>
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button onClick={() => navigate('/research')} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Chapter 5: Discussion & Conclusions</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Interpret findings and write recommendations</p>
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
                      ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-br-md shadow-lg' 
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
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Context input */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border rounded-2xl p-4 shadow-xl space-y-3`}>
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                <Lightbulb className={`w-5 h-5 mx-auto mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <p className={`text-xs font-medium ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Interpretation</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
                <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <p className={`text-xs font-medium ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Limitations</p>
              </div>
              <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <ListChecks className={`w-5 h-5 mx-auto mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <p className={`text-xs font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Recommendations</p>
              </div>
            </div>
            
            <textarea
              value={discussionContext}
              onChange={(e) => setDiscussionContext(e.target.value)}
              placeholder="Summarize your key findings from Chapter 4...

Example:
- Finding 1: Distance to health facilities was significantly associated with healthcare access (r=0.65, p<0.001)
- Finding 2: Most respondents (78%) cited cost as a major barrier
- Finding 3: No significant difference between male and female healthcare utilization
- Unexpected: Age was not a significant predictor contrary to literature"
              rows={6}
              className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 text-gray-900'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none`}
            />
            
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask AI for help..."
                  className={`flex-1 px-4 py-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none`}
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={generateChapter5}
                disabled={!discussionContext.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-violet-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate Chapter 5
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
      <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-violet-50'}`}>
        <div className={`max-w-2xl w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl`}>
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Generating Chapter 5
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Creating Discussion, Conclusions & Recommendations...
            </p>
            
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-violet-500 h-full transition-all duration-500"
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
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>🎉 Research Complete!</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>All 5 chapters ready</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportDiscussion}
                className={`px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg flex items-center gap-2`}
              >
                <Download className="w-4 h-4" />
                Download Ch 5
              </button>
              <button
                onClick={exportFullThesis}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Download Full Research (Ch 1-5)
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto p-6">
          {/* Completion indicator */}
          <div className={`${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} border rounded-xl p-6 mb-6 text-center`}>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Congratulations! 🎓
            </h2>
            <p className={`${darkMode ? 'text-green-200' : 'text-green-700'} mb-4`}>
              You have completed all 5 chapters of your research document!
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm">Ch 1-3 ✓</span>
              <span className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm">Ch 4 ✓</span>
              <span className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm">Ch 5 ✓</span>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 shadow-lg prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}>
            <div className="whitespace-pre-wrap">{generatedDiscussion}</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
