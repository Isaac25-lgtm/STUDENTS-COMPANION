import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Send, 
  Download, 
  Search, 
  Plus, 
  FileText, 
  Link, 
  Quote, 
  Layers, 
  Grid3X3, 
  CheckCircle2, 
  Lightbulb, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Filter, 
  SortAsc, 
  Eye, 
  BookMarked, 
  GraduationCap, 
  Calendar, 
  User,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { researchChat } from '../../services/gemini';
import { convertMarkdownToDocx } from '../../utils/markdownToDocx';
import { canAccessSection, saveResearchProgress } from '../../utils/researchProgress';
import AccessBlocked from '../../components/AccessBlocked';
import SectionReviewPrompt from '../../components/SectionReviewPrompt';

interface Source {
  id: number;
  title: string;
  author: string;
  year: number;
  type: string;
  theme: string;
  status: 'new' | 'summarized';
  summary?: string;
}

interface Theme {
  id: number;
  name: string;
  color: string;
  sources: number;
  desc: string;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function LiteratureReviewBuilder() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Check access
  const accessCheck = canAccessSection('literature');
  
  const [currentStep, setCurrentStep] = useState(2);
  const [activeTab, setActiveTab] = useState('sources');
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Let's build your literature review! I can help you find sources, summarize them, organize by themes, and write your review. What's your research topic?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [topic, setTopic] = useState('');
  
  const [sources, setSources] = useState<Source[]>([
    { id: 1, title: 'Healthcare Access in Rural Uganda: A Systematic Review', author: 'Mukasa et al.', year: 2023, type: 'Journal', theme: 'Access Barriers', status: 'summarized' },
    { id: 2, title: 'Community Health Workers and Primary Care Delivery', author: 'WHO Report', year: 2022, type: 'Report', theme: 'CHW Programs', status: 'summarized' },
    { id: 3, title: 'Mobile Health Interventions in Sub-Saharan Africa', author: 'Ochieng & Smith', year: 2024, type: 'Journal', theme: 'mHealth', status: 'new' },
  ]);
  
  const [themes, setThemes] = useState<Theme[]>([
    { id: 1, name: 'Access Barriers', color: 'bg-red-500', sources: 4, desc: 'Distance, cost, and availability challenges' },
    { id: 2, name: 'CHW Programs', color: 'bg-blue-500', sources: 3, desc: 'Community health worker effectiveness' },
    { id: 3, name: 'mHealth Solutions', color: 'bg-green-500', sources: 2, desc: 'Mobile technology in healthcare' },
  ]);

  const [draftContent, setDraftContent] = useState('');

  const steps = [
    { id: 1, name: 'Topic', desc: 'Define scope' },
    { id: 2, name: 'Find', desc: 'Search sources' },
    { id: 3, name: 'Summarize', desc: 'Extract key points' },
    { id: 4, name: 'Organize', desc: 'Group by themes' },
    { id: 5, name: 'Write', desc: 'Draft review' },
    { id: 6, name: 'Export', desc: 'Download' },
  ];

  const quickActions = [
    { icon: Search, label: 'Find more sources', color: 'text-blue-500' },
    { icon: Layers, label: 'Suggest themes', color: 'text-purple-500' },
    { icon: FileText, label: 'Write a section', color: 'text-emerald-500' },
  ];

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
      let context = '';
      
      if (!topic) {
        setTopic(userMessage);
        context = `The student wants to do a literature review on: "${userMessage}". 
        Acknowledge their topic and ask if they want you to:
        1. Suggest relevant sources/databases to search
        2. Help identify key themes to look for
        3. Start by adding some sources they already have
        
        Be helpful and conversational.`;
      } else {
        context = `The student is building a literature review on: "${topic}". 
        They currently have ${sources.length} sources organized into ${themes.length} themes.
        They said: "${userMessage}"
        Help them with their request.`;
      }

      const response = await researchChat(context, 'literature');
      
      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (isLoading) return;
    
    setMessages(prev => [...prev, { role: 'user', content: action }]);
    setIsLoading(true);

    try {
      let context = '';
      
      if (action.includes('sources')) {
        context = `The student is looking for more sources for their literature review on "${topic}".
        Current themes: ${themes.map(t => t.name).join(', ')}.
        Suggest 3-5 specific academic sources (with author, year, journal) they should look for.
        Include databases they should search (Google Scholar, PubMed, etc.)`;
      } else if (action.includes('themes')) {
        context = `The student wants theme suggestions for their literature review on "${topic}".
        Current themes: ${themes.map(t => t.name).join(', ')}.
        Suggest 2-3 additional themes that might be relevant based on their topic.`;
      } else if (action.includes('section')) {
        context = `The student wants help writing a section of their literature review on "${topic}".
        Themes: ${themes.map(t => t.name).join(', ')}.
        Sources: ${sources.length} total.
        Write a paragraph for the first theme "${themes[0]?.name || 'Access Barriers'}" that synthesizes multiple sources.`;
      }

      const response = await researchChat(context, 'literature');
      
      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const summarizeSource = async (sourceId: number) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    try {
      const context = `Provide a brief academic summary (2-3 sentences) of this research source:
      Title: "${source.title}"
      Author: ${source.author}
      Year: ${source.year}
      
      Include: main findings, methodology if relevant, and how it might relate to healthcare access research.`;

      const response = await researchChat(context, 'literature');
      
      if (response) {
        setSources(prev => prev.map(s => 
          s.id === sourceId ? { ...s, status: 'summarized', summary: response } : s
        ));
      }
    } catch (error) {
      console.error('Error summarizing:', error);
    }
  };

  const addNewSource = () => {
    const newSource: Source = {
      id: sources.length + 1,
      title: 'New Source',
      author: 'Author Name',
      year: 2024,
      type: 'Journal',
      theme: themes[0]?.name || 'General',
      status: 'new'
    };
    setSources(prev => [...prev, newSource]);
  };

  const addNewTheme = () => {
    const colors = ['bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-violet-500'];
    const newTheme: Theme = {
      id: themes.length + 1,
      name: 'New Theme',
      color: colors[themes.length % colors.length],
      sources: 0,
      desc: 'Click to edit description'
    };
    setThemes(prev => [...prev, newTheme]);
  };

  const generateDraft = async () => {
    setIsLoading(true);
    try {
      const context = `Write a literature review section on "${topic}".
      
      Organize by these themes:
      ${themes.map(t => `- ${t.name}: ${t.desc}`).join('\n')}
      
      Reference these sources:
      ${sources.map(s => `- ${s.author} (${s.year}): ${s.title}`).join('\n')}
      
      Write 3-4 paragraphs that:
      1. Introduce the topic and its importance
      2. Discuss each theme with synthesized findings from sources
      3. Identify gaps in the literature
      
      Use APA-style in-text citations.`;

      const response = await researchChat(context, 'literature');
      
      if (response) {
        setDraftContent(response);
        setActiveTab('draft');
      }
    } catch (error) {
      console.error('Error generating draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReview = async () => {
    let content = `# Literature Review\n\n## Topic: ${topic}\n\n`;
    
    // Add sources with proper APA citations and DOI/links
    content += `## References\n\n`;
    sources.forEach(s => {
      content += `${s.author} (${s.year}). ${s.title}. *${s.type}*.`;
      // Add DOI/URL placeholder - in real implementation, this would come from the source data
      if (s.type === 'Journal') {
        content += ` https://doi.org/10.xxxx/example (Replace with actual DOI)`;
      }
      content += `\n\n`;
    });
    
    content += `\n## Themes\n\n`;
    themes.forEach(t => {
      content += `### ${t.name}\n${t.desc}\n\n`;
    });
    if (draftContent) {
      content += `## Literature Review\n\n${draftContent}`;
    }

    // Save progress
    saveResearchProgress({
      literatureData: content,
    });

    // Convert to Word document and download
    const docTitle = topic ? `Literature Review - ${topic.substring(0, 40)}` : 'Literature Review';
    await convertMarkdownToDocx(content, docTitle, 'Student');
  };

  const markLiteratureComplete = () => {
    if (sources.length < 3) {
      alert('Please add at least 3 sources before completing this section.');
      return;
    }
    if (!draftContent || draftContent.length < 200) {
      alert('Please generate a draft review before completing this section.');
      return;
    }

    // Save all literature data
    let literatureContent = `## Literature Review\n\n`;
    literatureContent += `### Sources (${sources.length})\n\n`;
    sources.forEach(s => {
      literatureContent += `${s.author} (${s.year}). ${s.title}. *${s.type}*.\n`;
    });
    literatureContent += `\n### Review\n\n${draftContent}`;

    saveResearchProgress({
      literatureCompleted: true,
      literatureData: literatureContent,
    });

    setShowReviewPrompt(true);
  };

  // Render access blocked if user shouldn't be here
  if (!accessCheck.allowed) {
    return (
      <AccessBlocked
        sectionName="Literature Review (Chapter 2)"
        message={accessCheck.message || 'You need to complete previous sections first.'}
        requiredSections={[
          'Chapter 1: Research Proposal (Background, Problem Statement, Objectives)',
          'Chapter 2: Literature Review (You are here)',
          'Chapter 3: Methodology',
        ]}
      />
    );
  }

  const filteredSources = sources.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-6 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/research')}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <ArrowLeft className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Literature Review Builder</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chapter 2</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Sources: <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{sources.length}</span>
          </span>
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
            <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">✦ 847 credits</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-6 py-4`}>
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all cursor-pointer ${
                    step.id < currentStep 
                      ? 'bg-green-500 text-white' 
                      : step.id === currentStep 
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/50' 
                        : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  {step.id < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${step.id === currentStep ? 'text-emerald-600 dark:text-emerald-400' : darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-10 h-0.5 mx-1 mt-[-12px] ${step.id < currentStep ? 'bg-green-500' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className={`w-2/5 flex flex-col border-r ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md' 
                    : darkMode 
                      ? 'bg-gray-700 text-gray-100 rounded-bl-md' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-bl-md`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex gap-2">
              {quickActions.map((action, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleQuickAction(action.label)}
                  className={`flex items-center gap-2 px-3 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-white hover:bg-gray-50 text-gray-700'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg text-sm transition-all`}
                >
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-emerald-400 hover:bg-gray-700' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'} rounded-lg transition-colors`}>
                <Lightbulb className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about sources, themes, or writing..."
                className={`flex-1 px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600' : 'bg-gray-100 focus:bg-white'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all`}
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-xs mt-2 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Powered by Gemini Pro</p>
          </div>
        </div>

        {/* Right Panel - Workspace */}
        <div className={`w-3/5 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-slate-50'} p-4 gap-4`}>
          {/* Tabs */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden flex flex-col flex-1`}>
            <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {[
                { id: 'sources', label: 'Sources', count: sources.length, icon: BookMarked },
                { id: 'themes', label: 'Themes', count: themes.length, icon: Layers },
                { id: 'matrix', label: 'Matrix', icon: Grid3X3 },
                { id: 'draft', label: 'Draft', icon: FileText },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' 
                      : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4 inline mr-2" />
                  {tab.label} {tab.count !== undefined && `(${tab.count})`}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'sources' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input
                        type="text"
                        placeholder="Search sources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      />
                    </div>
                    <button 
                      onClick={addNewSource}
                      className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {filteredSources.map((source) => (
                    <div key={source.id} className={`p-4 ${darkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-colors group`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{source.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              source.status === 'summarized' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                            }`}>
                              {source.status}
                            </span>
                          </div>
                          <div className={`flex items-center gap-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {source.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {source.year}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                              {source.theme}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => summarizeSource(source.id)}
                            className={`p-1.5 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded-lg`}
                          >
                            <Eye className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          </button>
                          <button className={`p-1.5 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded-lg`}>
                            <Edit3 className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          </button>
                          <button className={`p-1.5 ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-100'} rounded-lg`}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'themes' && (
                <div className="space-y-3">
                  {themes.map((theme) => (
                    <div key={theme.id} className={`p-4 rounded-xl border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'} hover:shadow-md transition-all`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-10 rounded-full ${theme.color}`} />
                          <div>
                            <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{theme.name}</h4>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{theme.desc}</p>
                          </div>
                        </div>
                        <span className={`text-sm ${darkMode ? 'bg-gray-600' : 'bg-gray-100'} px-2 py-1 rounded-full`}>
                          {theme.sources} sources
                        </span>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={addNewTheme}
                    className={`w-full p-3 border-2 border-dashed ${darkMode ? 'border-gray-600 hover:border-emerald-500' : 'border-gray-300 hover:border-emerald-400'} rounded-xl text-gray-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2`}
                  >
                    <Plus className="w-4 h-4" />
                    Create New Theme
                  </button>
                </div>
              )}

              {activeTab === 'matrix' && (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <thead>
                      <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                        <th className="p-3 text-left font-medium">Author</th>
                        <th className="p-3 text-left font-medium">Year</th>
                        <th className="p-3 text-left font-medium">Theme</th>
                        <th className="p-3 text-left font-medium">Key Findings</th>
                        <th className="p-3 text-left font-medium">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.map((source) => (
                        <tr key={source.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <td className="p-3">{source.author}</td>
                          <td className="p-3">{source.year}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              {source.theme}
                            </span>
                          </td>
                          <td className="p-3 text-xs">{source.summary?.substring(0, 60) || 'Click to summarize'}...</td>
                          <td className="p-3 text-xs text-amber-600">To be identified</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'draft' && (
                <div className="space-y-4">
                  {draftContent ? (
                    <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'} whitespace-pre-wrap leading-relaxed`}>
                        {draftContent}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>No draft generated yet</p>
                      <button 
                        onClick={generateDraft}
                        disabled={isLoading}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        Generate Draft Review
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="space-y-2">
            <button 
              onClick={exportReview}
              className={`w-full py-2.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} text-${darkMode ? 'gray-200' : 'gray-700'} rounded-xl font-medium transition-all flex items-center justify-center gap-2 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
            >
              <Download className="w-4 h-4" />
              Download Literature Review
            </button>
            <button 
              onClick={markLiteratureComplete}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50"
            >
              <CheckCircle2 className="w-5 h-5" />
              Complete & Proceed to Methodology
            </button>
          </div>
        </div>
      </div>

      {/* Review Prompt Modal */}
      {showReviewPrompt && (
        <SectionReviewPrompt
          sectionName="Literature Review (Chapter 2)"
          nextSectionName="Methodology (Chapter 3)"
          nextSectionPath="/research/methodology"
          onClose={() => setShowReviewPrompt(false)}
          onExport={exportReview}
          canProceed={true}
        />
      )}
    </div>
  );
}

