import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Send, 
  Download, 
  CheckCircle2, 
  Lightbulb, 
  ArrowLeft,
  Brain,
  Sparkles,
  User,
  GraduationCap,
  MapPin,
  Calendar,
  FileSearch,
  Settings as SettingsIcon,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { researchChat, generateProposal } from '../../services/gemini';
import { convertMarkdownToDocx } from '../../utils/markdownToDocx';
import { saveResearchProgress } from '../../utils/researchProgress';
import SectionReviewPrompt from '../../components/SectionReviewPrompt';
import type { ResearchFormData } from '../../types/research';
import { 
  RESEARCH_DESIGNS, 
  WORD_COUNT_OPTIONS, 
  TIMELINE_OPTIONS, 
  BUDGET_OPTIONS, 
  CURRENCY_OPTIONS,
  THEORY_OPTIONS,
  DEFAULT_FORM_DATA 
} from '../../types/research';

interface Message {
  role: 'assistant' | 'user' | 'thinking';
  content: string;
}

type Phase = 'chat-topic' | 'form-details' | 'generating' | 'complete';

export default function ProposalBuilder() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [phase, setPhase] = useState<Phase>('chat-topic');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "👋 **Welcome to the Research Proposal Builder!**\n\nI'll help you create a comprehensive research proposal (Chapters 1-3) with references.\n\n**Tell me your research topic:**\n\nJust type your topic and we'll proceed to fill in the details.\n\n*Example: \"Impact of mobile banking on financial inclusion in rural Uganda\"*" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [wantsTopicHelp, setWantsTopicHelp] = useState(false);
  
  // Form data using the original structure
  const [formData, setFormData] = useState<ResearchFormData>(DEFAULT_FORM_DATA);
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState('');

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
      // Check if user is asking for topic help
      if (wantsTopicHelp) {
        setMessages(prev => [...prev, { 
          role: 'thinking', 
          content: 'Analyzing and suggesting topic refinements...' 
        }]);

        const helpPrompt = `You are an expert research advisor for Ugandan university students.

A student said: "${userMessage}"

They want help refining or getting suggestions for their research topic.

Provide 2-3 specific, researchable topic suggestions based on their input. Keep it brief and actionable.

End by asking them to type their chosen topic when ready.`;

        const response = await researchChat(helpPrompt, 'proposal');
        
        if (response) {
          setMessages(prev => prev.filter(m => m.role !== 'thinking').concat([{ 
            role: 'assistant', 
            content: response 
          }]));
        }
        setWantsTopicHelp(false);
      } else {
        // User provided a topic - automatically proceed to details form
        setFormData(prev => ({ ...prev, topic: userMessage }));
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `✅ **Topic received:** "${userMessage}"\n\nProceeding to details form...` 
        }]);
        
        // Automatically proceed to form after a brief moment
        setTimeout(() => {
          setPhase('form-details');
        }, 800);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.filter(m => m.role !== 'thinking').concat([{ 
        role: 'assistant', 
        content: "I'm having trouble connecting. Please try again." 
      }]));
    } finally {
      setIsLoading(false);
    }
  };

  const requestTopicHelp = () => {
    setWantsTopicHelp(true);
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: "Sure! Tell me:\n\n• What general area interests you?\n• Any specific context (location, population, industry)?\n• Is this for a specific course?\n\nI'll suggest refined, researchable topics for you." 
    }]);
  };

  const proceedToForm = () => {
    if (!formData.topic) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        setFormData(prev => ({ ...prev, topic: lastUserMessage.content }));
      }
    }
    setPhase('form-details');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.program || !formData.university || !formData.topic) {
      alert('Please fill in all required fields');
      return;
    }

    setPhase('generating');
    
    try {
      // Use the original generateProposal function
      const proposal = await generateProposal(formData, (progress, section) => {
        setGenerationProgress(progress);
        setCurrentSection(section);
      });

      setGeneratedProposal(proposal);
      setPhase('complete');
      
      // Save to progress
      saveResearchProgress({
        proposalCompleted: true,
        proposalData: proposal,
        topic: formData.topic,
      });

    } catch (error) {
      console.error('Error generating proposal:', error);
      alert('Failed to generate proposal. Please try again.');
      setPhase('form-details');
    }
  };

  const exportProposal = async () => {
    await convertMarkdownToDocx(generatedProposal, formData.topic.substring(0, 50), formData.studentName || 'Student');
  };

  const proceedToChapter4 = () => {
    // Save progress and navigate to Chapter 4 (Results/Data Analysis)
    saveResearchProgress({
      proposalCompleted: true,
      proposalData: generatedProposal,
      topic: formData.topic,
    });
    navigate('/research/results'); // Chapter 4
  };

  // Render: Chat Phase (Topic Entry)
  if (phase === 'chat-topic') {
    return (
      <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-cyan-50'}`}>
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-sm'} border-b px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/research')} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Research Proposal Builder</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chapters 1-3 + References</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'thinking' ? (
                  <div className={`max-w-[85%] ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'} border rounded-2xl px-4 py-3`}>
                    <div className="flex items-center gap-2">
                      <Brain className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'} animate-pulse`} />
                      <p className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-800'} italic`}>{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-md shadow-lg' 
                      : darkMode 
                        ? 'bg-gray-800 text-gray-100 border border-gray-700' 
                        : 'bg-white text-gray-800 shadow-md border'
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border rounded-2xl p-4 shadow-xl space-y-3`}>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your research topic here..."
                  className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  disabled={isLoading}
                />
              </div>
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Topic Help Option */}
              <button
                onClick={requestTopicHelp}
                className={`px-3 py-2 text-sm rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'} flex items-center gap-2`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Need topic suggestions?
              </button>

              {/* Proceed button - only show after user has typed a topic */}
              {messages.filter(m => m.role === 'user').length > 0 && (
                <button
                  onClick={proceedToForm}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 ml-auto"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Continue to Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Powered by Gemini Pro
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render: Form Phase (Original Hardcoded Questions)
  if (phase === 'form-details') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-slate-50'} pb-20`}>
        <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b px-6 py-4 sticky top-0 z-10`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Research Details</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fill in your academic details for Chapters 1-3</p>
            </div>
            <button onClick={() => setPhase('chat-topic')} className={`flex items-center gap-1 text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </header>

        <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Topic Display */}
          <div className={`${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`}>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>
              📚 Your Research Topic
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-blue-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium`}
              required
            />
          </div>

          {/* Section 1: Basic Information */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-md border ${darkMode ? 'border-gray-700' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <User className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Basic Information</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Student Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.studentName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Registration Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.regNo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, regNo: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="2021/BSC/001"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Program/Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.program}
                  onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="e.g., Bachelor of Business Administration"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="e.g., Department of Business Studies"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  University <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="e.g., Makerere University"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Month & Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.monthYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthYear: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="e.g., January 2024"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Research Design */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-md border ${darkMode ? 'border-gray-700' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <FileSearch className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Research Design</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Research Design <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.design}
                  onChange={(e) => setFormData(prev => ({ ...prev, design: e.target.value as 'quantitative' | 'mixed' }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  required
                >
                  {RESEARCH_DESIGNS.map(design => (
                    <option key={design.value} value={design.value}>{design.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Study Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.studyArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, studyArea: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  placeholder="e.g., Kampala District"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Specifications */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-md border ${darkMode ? 'border-gray-700' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <SettingsIcon className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Document Specifications</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Word Count Target
                </label>
                <select
                  value={formData.wordCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, wordCount: parseInt(e.target.value) }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                >
                  {WORD_COUNT_OPTIONS.map(count => (
                    <option key={count} value={count}>{count} words</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Timeline (Weeks)
                </label>
                <select
                  value={formData.timelineWeeks}
                  onChange={(e) => setFormData(prev => ({ ...prev, timelineWeeks: parseInt(e.target.value) }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                >
                  {TIMELINE_OPTIONS.map(weeks => (
                    <option key={weeks} value={weeks}>{weeks} weeks</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Include Budget?
                </label>
                <select
                  value={formData.includeBudget}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeBudget: e.target.value as 'YES' | 'SUMMARY_ONLY' | 'NO' }))}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                >
                  {BUDGET_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: University Format */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-md border ${darkMode ? 'border-gray-700' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
              <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>University Format</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasFormat"
                  checked={formData.hasUniversityFormat}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasUniversityFormat: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="hasFormat" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  My university has specific formatting requirements
                </label>
              </div>
              {formData.hasUniversityFormat && (
                <textarea
                  value={formData.universityFormatInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, universityFormatInstructions: e.target.value }))}
                  rows={4}
                  placeholder="Describe your university's specific requirements (e.g., section order, heading styles, citation format...)"
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                />
              )}
            </div>
          </div>

          {/* Section 5: Additional Preferences */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-md border ${darkMode ? 'border-gray-700' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Additional Preferences</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Preferred Theories (Optional)
                </label>
                <div className="grid md:grid-cols-2 gap-2">
                  {THEORY_OPTIONS.map(theory => (
                    <label key={theory} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.preferredTheories.includes(theory)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, preferredTheories: [...prev.preferredTheories, theory] }));
                          } else {
                            setFormData(prev => ({ ...prev, preferredTheories: prev.preferredTheories.filter(t => t !== theory) }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{theory}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Additional Instructions (Optional)
                </label>
                <textarea
                  value={formData.additionalInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                  rows={3}
                  placeholder="Any other specific requirements or preferences..."
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                />
              </div>
            </div>
          </div>

          {/* What will be generated */}
          <div className={`${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} border rounded-xl p-4`}>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-green-200' : 'text-green-900'}`}>📄 What will be generated:</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>Chapter 1: Introduction</p>
                <ul className={`${darkMode ? 'text-green-200' : 'text-green-700'} text-xs mt-1 space-y-0.5`}>
                  <li>• Background of the Study</li>
                  <li>• Problem Statement</li>
                  <li>• Research Objectives</li>
                  <li>• Research Questions</li>
                  <li>• Significance of Study</li>
                  <li>• Scope & Limitations</li>
                </ul>
              </div>
              <div>
                <p className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>Chapter 2: Literature Review</p>
                <ul className={`${darkMode ? 'text-green-200' : 'text-green-700'} text-xs mt-1 space-y-0.5`}>
                  <li>• Theoretical Framework</li>
                  <li>• Conceptual Framework</li>
                  <li>• Empirical Review</li>
                  <li>• Research Gap</li>
                </ul>
              </div>
              <div>
                <p className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>Chapter 3: Methodology</p>
                <ul className={`${darkMode ? 'text-green-200' : 'text-green-700'} text-xs mt-1 space-y-0.5`}>
                  <li>• Research Design</li>
                  <li>• Population & Sample</li>
                  <li>• Data Collection</li>
                  <li>• Data Analysis</li>
                  <li>• Ethical Considerations</li>
                </ul>
              </div>
            </div>
            <p className={`text-xs mt-3 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
              + Complete <strong>References</strong> section at the end with real, accessible sources
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-6 h-6" />
            Generate Chapters 1-3 + References
          </button>
        </form>
      </div>
    );
  }

  // Render: Generating Phase
  if (phase === 'generating') {
    return (
      <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-cyan-50'}`}>
        <div className={`max-w-2xl w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-2xl`}>
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Generating Your Research Proposal
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Creating Chapters 1-3 with comprehensive references...
            </p>
            
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {generationProgress}% Complete {currentSection && `• ${currentSection}`}
              </p>
            </div>

            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              This may take 2-3 minutes. Please don't close this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render: Complete Phase
  if (phase === 'complete') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-slate-50'} pb-20`}>
        <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b px-6 py-4 sticky top-0 z-10`}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>✅ Proposal Complete!</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chapters 1-3 + References ready</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportProposal}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Download .docx
              </button>
              <button
                onClick={proceedToChapter4}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                Proceed to Chapter 4
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
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Chapters 1-3 Complete</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Proposal with References</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className={`px-3 py-1.5 rounded-lg ${darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'} text-sm font-medium`}>
                Next: Chapter 4 (Results)
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className={`px-3 py-1.5 rounded-lg ${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700'} text-sm font-medium`}>
                Chapter 5 (Discussion)
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-8 shadow-lg prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}>
            <div className="whitespace-pre-wrap">
              {generatedProposal}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
