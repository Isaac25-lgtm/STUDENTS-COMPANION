import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FlaskConical, 
  Send, 
  Download, 
  CheckCircle2, 
  Lightbulb, 
  Users, 
  MapPin, 
  Clock, 
  Clipboard, 
  Calculator, 
  Database, 
  ChevronRight, 
  ChevronDown, 
  Edit3, 
  RefreshCw, 
  Copy, 
  HelpCircle, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { researchChat } from '../../services/gemini';
import { convertMarkdownToDocx } from '../../utils/markdownToDocx';
import { canAccessSection, saveResearchProgress, getResearchProgress } from '../../utils/researchProgress';
import AccessBlocked from '../../components/AccessBlocked';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface Selections {
  design: string | null;
  approach: string | null;
  population: string;
  area: string;
  sampling: string | null;
  sampleSize: string;
  collection: string[];
  timeline: string;
  analysis: string | null;
}

export default function MethodologyBuilder() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Check access
  const accessCheck = canAccessSection('methodology');
  
  const [currentStep, setCurrentStep] = useState(2);
  const [expandedSection, setExpandedSection] = useState<string>('design');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Let's design your research methodology! I'll help you choose the right approach, sampling method, and analysis plan. First, is your study mainly quantitative (numbers) or qualitative (words/experiences)?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selections, setSelections] = useState<Selections>({
    design: null,
    approach: null,
    population: '',
    area: '',
    sampling: null,
    sampleSize: '',
    collection: [],
    timeline: '',
    analysis: null,
  });

  const steps = [
    { id: 1, name: 'Type', desc: 'Research type' },
    { id: 2, name: 'Design', desc: 'Study design' },
    { id: 3, name: 'Population', desc: 'Who to study' },
    { id: 4, name: 'Sample', desc: 'How many' },
    { id: 5, name: 'Collection', desc: 'Gather data' },
    { id: 6, name: 'Analysis', desc: 'Analyze data' },
    { id: 7, name: 'Export', desc: 'Download' },
  ];

  const sections = [
    { 
      id: 'design', 
      title: 'Research Design', 
      icon: FlaskConical, 
      desc: 'How will you conduct your study?',
      options: ['Cross-sectional', 'Longitudinal', 'Case Study', 'Experimental', 'Quasi-experimental', 'Mixed Methods']
    },
    { 
      id: 'approach', 
      title: 'Research Approach', 
      icon: Sparkles, 
      desc: 'What approach will you use?',
      options: ['Quantitative', 'Qualitative', 'Mixed Methods']
    },
    { 
      id: 'population', 
      title: 'Study Population', 
      icon: Users, 
      desc: 'Who are you studying?',
      isInput: true
    },
    { 
      id: 'area', 
      title: 'Study Area', 
      icon: MapPin, 
      desc: 'Where will you conduct the study?',
      isInput: true
    },
    { 
      id: 'sampling', 
      title: 'Sampling Method', 
      icon: Database, 
      desc: 'How will you select participants?',
      options: ['Simple Random', 'Stratified', 'Cluster', 'Purposive', 'Convenience', 'Snowball']
    },
    { 
      id: 'sampleSize', 
      title: 'Sample Size', 
      icon: Calculator, 
      desc: 'How many participants do you need?',
      isCalculator: true
    },
    { 
      id: 'collection', 
      title: 'Data Collection Methods', 
      icon: Clipboard, 
      desc: 'How will you collect data?',
      multiSelect: ['Questionnaire', 'Interview', 'Focus Group', 'Observation', 'Document Review', 'Experiment']
    },
    { 
      id: 'timeline', 
      title: 'Study Timeline', 
      icon: Clock, 
      desc: 'When will you conduct the study?',
      isInput: true
    },
  ];

  const quickPrompts = [
    { label: 'Explain sampling methods', icon: HelpCircle },
    { label: 'Calculate sample size', icon: Calculator },
    { label: 'Suggest analysis methods', icon: Lightbulb },
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
      const context = `The student is designing their research methodology.
      Current selections:
      - Research Design: ${selections.design || 'Not selected'}
      - Approach: ${selections.approach || 'Not selected'}
      - Population: ${selections.population || 'Not specified'}
      - Study Area: ${selections.area || 'Not specified'}
      - Sampling: ${selections.sampling || 'Not selected'}
      - Sample Size: ${selections.sampleSize || 'Not calculated'}
      - Data Collection: ${selections.collection.join(', ') || 'Not selected'}
      
      They said: "${userMessage}"
      
      Help them with their methodology question. Be specific and practical.`;

      const response = await researchChat(context, 'methodology');
      
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

  const handleQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setIsLoading(true);

    try {
      let context = '';
      
      if (prompt.includes('sampling')) {
        context = `Explain the different sampling methods in simple terms:
        1. Simple Random - everyone has equal chance
        2. Stratified - divide into groups, sample from each
        3. Purposive - choose specific people
        4. Convenience - whoever is available
        5. Snowball - participants refer others
        
        Explain when to use each based on research needs.`;
      } else if (prompt.includes('sample size')) {
        context = `Help calculate sample size. Ask:
        1. What is the population size?
        2. What confidence level? (usually 95%)
        3. What margin of error? (usually 5%)
        
        Then use the formula: n = N / (1 + N * e²)
        where N = population, e = margin of error`;
      } else {
        context = `Suggest appropriate analysis methods based on:
        Research approach: ${selections.approach || 'Not specified'}
        Data collection: ${selections.collection.join(', ') || 'Not specified'}
        
        Suggest specific statistical tests or qualitative analysis methods.`;
      }

      const response = await researchChat(context, 'methodology');
      
      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (sectionId: string, option: string) => {
    setSelections(prev => ({
      ...prev,
      [sectionId]: option
    }));
  };

  const handleMultiSelect = (sectionId: string, option: string) => {
    setSelections(prev => {
      const current = prev[sectionId as keyof Selections];
      if (Array.isArray(current)) {
        const newSelection = current.includes(option)
          ? current.filter(o => o !== option)
          : [...current, option];
        return { ...prev, [sectionId]: newSelection };
      }
      return prev;
    });
  };

  const handleInputChange = (sectionId: string, value: string) => {
    setSelections(prev => ({
      ...prev,
      [sectionId]: value
    }));
  };

  const calculateSampleSize = () => {
    // Simple sample size calculation
    const population = parseInt(selections.population.replace(/\D/g, '')) || 5000;
    const confidenceLevel = 0.95;
    const marginOfError = 0.05;
    
    // Cochran's formula simplified
    const z = 1.96; // 95% confidence
    const p = 0.5; // maximum variability
    const e = marginOfError;
    
    const n0 = (z * z * p * (1 - p)) / (e * e);
    const n = n0 / (1 + (n0 - 1) / population);
    
    const sampleSize = Math.ceil(n);
    setSelections(prev => ({ ...prev, sampleSize: sampleSize.toString() }));
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `Based on a population of ${population.toLocaleString()}, at 95% confidence level and 5% margin of error, you need a sample size of **${sampleSize} participants**.

This ensures your results are statistically representative of the population.`
    }]);
  };

  const exportMethodology = async () => {
    let content = `# Research Methodology\n\n`;
    
    content += `## Research Design\n${selections.design || 'Not specified'}\n\n`;
    content += `## Research Approach\n${selections.approach || 'Not specified'}\n\n`;
    content += `## Study Population\n${selections.population || 'Not specified'}\n\n`;
    content += `## Study Area\n${selections.area || 'Not specified'}\n\n`;
    content += `## Sampling Method\n${selections.sampling || 'Not specified'}\n\n`;
    content += `## Sample Size\n${selections.sampleSize || 'Not calculated'}\n\n`;
    content += `## Data Collection Methods\n${selections.collection.join(', ') || 'Not specified'}\n\n`;
    content += `## Timeline\n${selections.timeline || 'Not specified'}\n\n`;

    // Save progress
    saveResearchProgress({
      methodologyData: content,
    });

    // Convert to Word document and download
    await convertMarkdownToDocx(content, 'Research Methodology', 'Student');
  };

  const exportFullProposal = async () => {
    const progress = getResearchProgress();
    
    if (!progress.proposalCompleted || !progress.literatureCompleted || !progress.methodologyCompleted) {
      alert('Please complete all three chapters before exporting the full proposal.');
      return;
    }

    // Compile full proposal (Chapters 1-3)
    let fullProposal = `# RESEARCH PROPOSAL\n\n`;
    fullProposal += `## ${progress.topic || 'Research Title'}\n\n`;
    fullProposal += `---\n\n`;
    
    // Chapter 1 & 2 - Proposal sections
    if (progress.proposalData) {
      fullProposal += `# CHAPTER 1: INTRODUCTION\n\n`;
      fullProposal += progress.proposalData + '\n\n';
      fullProposal += `---\n\n`;
    }
    
    // Chapter 2 - Literature Review
    if (progress.literatureData) {
      fullProposal += `# CHAPTER 2: LITERATURE REVIEW\n\n`;
      fullProposal += progress.literatureData + '\n\n';
      fullProposal += `---\n\n`;
    }
    
    // Chapter 3 - Methodology
    fullProposal += `# CHAPTER 3: RESEARCH METHODOLOGY\n\n`;
    fullProposal += `## 3.1 Research Design\n${selections.design || 'Not specified'}\n\n`;
    fullProposal += `## 3.2 Research Approach\n${selections.approach || 'Not specified'}\n\n`;
    fullProposal += `## 3.3 Study Population\n${selections.population || 'Not specified'}\n\n`;
    fullProposal += `## 3.4 Study Area\n${selections.area || 'Not specified'}\n\n`;
    fullProposal += `## 3.5 Sampling Method\n${selections.sampling || 'Not specified'}\n\n`;
    fullProposal += `## 3.6 Sample Size\n${selections.sampleSize || 'Not calculated'}\n\n`;
    fullProposal += `## 3.7 Data Collection Methods\n${selections.collection.join(', ') || 'Not specified'}\n\n`;
    fullProposal += `## 3.8 Data Analysis Plan\n${selections.analysis || 'Not specified'}\n\n`;
    fullProposal += `## 3.9 Timeline\n${selections.timeline || 'Not specified'}\n\n`;

    // Export as Word document
    const docTitle = progress.topic ? progress.topic.substring(0, 50) : 'Complete Research Proposal';
    await convertMarkdownToDocx(fullProposal, docTitle, 'Student');
  };

  const markMethodologyComplete = () => {
    if (!selections.design || !selections.approach) {
      alert('Please complete at least the Research Design and Approach before finishing.');
      return;
    }

    let methodologyContent = `## Research Methodology\n\n`;
    methodologyContent += `Research Design: ${selections.design}\n`;
    methodologyContent += `Approach: ${selections.approach}\n`;
    methodologyContent += `Population: ${selections.population}\n`;
    methodologyContent += `Sample Size: ${selections.sampleSize}\n`;

    saveResearchProgress({
      methodologyCompleted: true,
      methodologyData: methodologyContent,
    });

    alert('Congratulations! You have completed all three chapters of your research proposal. You can now download the complete proposal.');
  };

  // Render access blocked if user shouldn't be here
  if (!accessCheck.allowed) {
    return (
      <AccessBlocked
        sectionName="Methodology (Chapter 3)"
        message={accessCheck.message || 'You need to complete previous sections first.'}
        requiredSections={[
          'Chapter 1: Research Proposal (Background, Problem Statement, Objectives)',
          'Chapter 2: Literature Review',
          'Chapter 3: Methodology (You are here)',
        ]}
      />
    );
  }

  const getSelectionStatus = (sectionId: string) => {
    const value = selections[sectionId as keyof Selections];
    if (Array.isArray(value)) {
      return value.length > 0 ? 'completed' : 'empty';
    }
    return value ? 'completed' : 'empty';
  };

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
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Methodology Builder</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chapter 3</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Approach: <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {selections.approach || 'Not set'}
            </span>
          </span>
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
            <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">✦ 847 credits</span>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-6 py-4`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all cursor-pointer ${
                    step.id < currentStep 
                      ? 'bg-green-500 text-white' 
                      : step.id === currentStep 
                        ? 'bg-purple-500 text-white ring-4 ring-purple-100 dark:ring-purple-900/50' 
                        : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  {step.id < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${step.id === currentStep ? 'text-purple-600 dark:text-purple-400' : darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 mt-[-12px] ${step.id < currentStep ? 'bg-green-500' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
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
                    ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-br-md' 
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
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex gap-2">
              {quickPrompts.map((action, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleQuickPrompt(action.label)}
                  className={`flex items-center gap-2 px-3 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-white hover:bg-gray-50 text-gray-700'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg text-sm transition-all`}
                >
                  <action.icon className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-purple-400 hover:bg-gray-700' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'} rounded-lg transition-colors`}>
                <Lightbulb className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about methodology..."
                className={`flex-1 px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600' : 'bg-gray-100 focus:bg-white'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:from-purple-600 hover:to-violet-600 transition-all shadow-lg shadow-purple-200 dark:shadow-purple-900/50 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-xs mt-2 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Powered by Gemini Pro</p>
          </div>
        </div>

        {/* Right Panel - Sections */}
        <div className={`w-3/5 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-slate-50'} p-4`}>
          <div className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'} flex items-center justify-between`}>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Methodology Sections</h3>
              <button 
                onClick={exportMethodology}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Sections Accordion */}
            <div className="flex-1 overflow-y-auto">
              {sections.map((section) => (
                <div key={section.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? '' : section.id)}
                    className={`w-full px-4 py-3 flex items-center justify-between ${darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${getSelectionStatus(section.id) === 'completed' ? (darkMode ? 'bg-green-900/30' : 'bg-green-50') : (darkMode ? 'bg-gray-700' : 'bg-gray-100')} flex items-center justify-center`}>
                        <section.icon className={`w-4 h-4 ${getSelectionStatus(section.id) === 'completed' ? 'text-green-500' : (darkMode ? 'text-gray-400' : 'text-gray-500')}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{section.title}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{section.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSelectionStatus(section.id) === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {expandedSection === section.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {expandedSection === section.id && (
                    <div className={`px-4 pb-4 ${darkMode ? 'bg-gray-750/50' : 'bg-gray-50/50'}`}>
                      {/* Options */}
                      {section.options && (
                        <div className="flex flex-wrap gap-2">
                          {section.options.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleOptionSelect(section.id, option)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                selections[section.id as keyof Selections] === option
                                  ? 'bg-purple-500 text-white'
                                  : darkMode 
                                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-purple-50'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Multi-select */}
                      {section.multiSelect && (
                        <div className="flex flex-wrap gap-2">
                          {section.multiSelect.map((option) => {
                            const isSelected = selections.collection.includes(option);
                            return (
                              <button
                                key={option}
                                onClick={() => handleMultiSelect('collection', option)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-purple-500 text-white'
                                    : darkMode 
                                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-purple-50'
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Text Input */}
                      {section.isInput && (
                        <input
                          type="text"
                          value={selections[section.id as keyof Selections] as string || ''}
                          onChange={(e) => handleInputChange(section.id, e.target.value)}
                          placeholder={`Enter ${section.title.toLowerCase()}...`}
                          className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white border border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        />
                      )}

                      {/* Sample Size Calculator */}
                      {section.isCalculator && (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={selections.population}
                            onChange={(e) => handleInputChange('population', e.target.value)}
                            placeholder="Enter population size (e.g., 5000)"
                            className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white border border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
                          />
                          <button
                            onClick={calculateSampleSize}
                            className="w-full py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Calculator className="w-4 h-4" />
                            Calculate Sample Size
                          </button>
                          {selections.sampleSize && (
                            <div className={`p-4 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-lg`}>
                              <p className={`font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                                Recommended sample size: <span className="text-lg">{selections.sampleSize}</span> participants
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Export Button */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 space-y-2`}>
              <button 
                onClick={exportMethodology}
                className={`w-full py-2.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} text-${darkMode ? 'gray-200' : 'gray-700'} rounded-xl font-medium transition-all flex items-center justify-center gap-2 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
              >
                <Download className="w-4 h-4" />
                Download Methodology
              </button>
              <button 
                onClick={markMethodologyComplete}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-violet-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-200 dark:shadow-purple-900/50"
              >
                <CheckCircle2 className="w-5 h-5" />
                Mark Chapter 3 Complete
              </button>
              <button 
                onClick={exportFullProposal}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-300 dark:shadow-green-900/50 ring-2 ring-green-400 dark:ring-green-600"
              >
                <Download className="w-5 h-5" />
                Export Complete Proposal (Chapters 1-3)
              </button>
              <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
                Complete all sections to export the full proposal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

