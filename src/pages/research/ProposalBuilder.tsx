import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Send, 
  Download, 
  CheckCircle2, 
  Lightbulb, 
  Target, 
  HelpCircle, 
  AlertCircle, 
  BookOpen, 
  Users, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  ChevronRight, 
  ChevronDown, 
  Edit3, 
  Eye, 
  ArrowRight, 
  ArrowLeft,
  Save, 
  X 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { researchChat } from '../../services/gemini';
import { convertMarkdownToDocx } from '../../utils/markdownToDocx';
import { saveResearchProgress, getResearchProgress } from '../../utils/researchProgress';
import SectionReviewPrompt from '../../components/SectionReviewPrompt';
import SectionFormFields from '../../components/SectionFormFields';
import type { ResearchFormData } from '../../types/research';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface SectionOutput {
  status: 'empty' | 'generating' | 'draft' | 'approved';
  content: string;
}

export default function ProposalBuilder() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedSection, setExpandedSection] = useState<string>('background');
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Welcome! Let's build your research proposal together. First, tell me: What topic or problem do you want to research? Be as specific as you can about the area, population, and context." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, SectionOutput>>({
    background: { status: 'empty', content: '' },
    problem: { status: 'empty', content: '' },
    objectives: { status: 'empty', content: '' },
    questions: { status: 'empty', content: '' },
    significance: { status: 'empty', content: '' },
    scope: { status: 'empty', content: '' },
  });

  // Store form data for eventual generation
  const [formData, setFormData] = useState<Partial<ResearchFormData>>({
    program: '',
    department: '',
    university: '',
    submissionDate: '',
    title: '',
    topicDescription: '',
    objectives: '',
    targetPopulation: '',
    studyLocation: '',
    studyType: 'quantitative' as const,
    sectionOrder: 'standard' as const,
    referenceStyle: 'APA' as const,
    academicLevel: 'undergraduate' as const,
    includeTimeline: false,
    includeBudget: false,
  });

  const steps = [
    { id: 1, name: 'Topic', desc: 'Choose your topic' },
    { id: 2, name: 'Background', desc: 'Set the context' },
    { id: 3, name: 'Problem', desc: 'State the problem' },
    { id: 4, name: 'Objectives', desc: 'Set your goals' },
    { id: 5, name: 'Questions', desc: 'Form questions' },
    { id: 6, name: 'Significance', desc: 'Why it matters' },
    { id: 7, name: 'Review', desc: 'Check & export' },
  ];

  const sections = [
    { id: 'background', title: 'Background of the Study', icon: BookOpen, desc: 'What is already known about your topic?' },
    { id: 'problem', title: 'Problem Statement', icon: AlertCircle, desc: 'What specific problem will you address?' },
    { id: 'objectives', title: 'Research Objectives', icon: Target, desc: 'What do you want to achieve?' },
    { id: 'questions', title: 'Research Questions', icon: HelpCircle, desc: 'What questions will guide your study?' },
    { id: 'significance', title: 'Significance of the Study', icon: Sparkles, desc: 'Why does this research matter?' },
    { id: 'scope', title: 'Scope & Limitations', icon: Users, desc: 'What will you include and exclude?' },
  ];

  const quickPrompts = [
    { label: 'Help me narrow my topic', icon: Target },
    { label: 'Give me examples', icon: Lightbulb },
    { label: 'Check my wording', icon: Edit3 },
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
      // Build context based on current step
      let context = '';
      if (currentStep === 1) {
        context = `The student is defining their research topic. They said: "${userMessage}". 
        Help them clarify their topic and then ask follow-up questions about:
        - Their target population
        - The study location
        - What they already know about this topic
        
        Be encouraging and conversational. Keep your response under 150 words.`;
        
        // Store topic in form data
        setFormData(prev => ({ ...prev, topicDescription: userMessage }));
      } else if (currentStep === 2) {
        context = `The student is working on the Background section of their research proposal. Their topic is: "${formData.topicDescription}". They said: "${userMessage}".
        
        Help them develop the background by asking about what they already know and generate a draft if they've provided enough information.`;
      } else {
        context = `The student is working on their research proposal. Current section: ${sections[currentStep - 2]?.title || 'Topic'}. 
        Topic: ${formData.topicDescription}. They said: "${userMessage}". Help them with their current section.`;
      }

      const response = await researchChat(context, 'proposal');
      
      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        
        // Auto-advance step based on conversation
        if (currentStep === 1 && userMessage.length > 50) {
          // They've described their topic well, suggest moving to background
          setTimeout(() => {
            setCurrentStep(2);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const generateSection = async (sectionId: string, sectionFormData?: Record<string, string>) => {
    if (!formData.topicDescription && !sectionFormData?.topic) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Please tell me about your research topic first before I can generate this section." 
      }]);
      return;
    }

    setOutputs(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], status: 'generating' }
    }));

    try {
      let prompt = '';
      
      // Build detailed prompts using the form data provided
      switch (sectionId) {
        case 'background':
          prompt = `Generate a comprehensive Background of the Study section for a research proposal with the following details:
          
          **Research Topic**: ${sectionFormData?.topic || formData.topicDescription}
          **Target Population**: ${sectionFormData?.population}
          **Study Location**: ${sectionFormData?.location}
          **Existing Knowledge**: ${sectionFormData?.context}
          
          Write 3-4 well-structured paragraphs that:
          1. Introduce the topic and its importance
          2. Provide relevant statistics and context
          3. Explain what is already known from previous studies
          4. Lead naturally into why more research is needed
          
          Use academic language and include proper transitions between paragraphs.`;
          break;
          
        case 'problem':
          prompt = `Generate a Problem Statement for a research proposal with these details:
          
          **Main Problem/Gap**: ${sectionFormData?.issue}
          **Evidence**: ${sectionFormData?.evidence}
          **Consequences**: ${sectionFormData?.consequences}
          **Topic**: ${formData.topicDescription}
          
          Write a clear, compelling problem statement (2-3 paragraphs) that:
          1. States the specific problem or gap in knowledge
          2. Provides evidence that this is a real problem
          3. Explains the consequences of not addressing it
          4. Sets up the need for your research`;
          break;
          
        case 'objectives':
          prompt = `Generate Research Objectives based on:
          
          **General Objective**: ${sectionFormData?.general}
          **Specific Objective 1**: ${sectionFormData?.specific1}
          **Specific Objective 2**: ${sectionFormData?.specific2}
          ${sectionFormData?.specific3 ? `**Specific Objective 3**: ${sectionFormData.specific3}` : ''}
          
          Format the output as:
          
          **General Objective:**
          [Rewrite the general objective professionally using proper academic verbs like "to assess", "to examine", "to investigate"]
          
          **Specific Objectives:**
          1. [Professionally formatted specific objective 1]
          2. [Professionally formatted specific objective 2]
          ${sectionFormData?.specific3 ? '3. [Professionally formatted specific objective 3]' : ''}`;
          break;
          
        case 'questions':
          prompt = `Generate Research Questions that directly match these objectives:
          
          **Question 1**: ${sectionFormData?.question1}
          **Question 2**: ${sectionFormData?.question2}
          ${sectionFormData?.question3 ? `**Question 3**: ${sectionFormData.question3}` : ''}
          
          Rewrite each as a clear, researchable question starting with appropriate question words (What, How, Why, To what extent, etc.).
          
          Format as:
          1. [Question 1]
          2. [Question 2]
          ${sectionFormData?.question3 ? '3. [Question 3]' : ''}`;
          break;
          
        case 'significance':
          prompt = `Generate the Significance of the Study section based on:
          
          **Benefit to Policymakers**: ${sectionFormData?.policymakers}
          **Benefit to Practitioners**: ${sectionFormData?.practitioners}
          **Benefit to Community**: ${sectionFormData?.community}
          ${sectionFormData?.researchers ? `**Benefit to Researchers**: ${sectionFormData.researchers}` : ''}
          
          Write a well-structured section explaining who will benefit from this research and how. Organize by stakeholder groups.`;
          break;
          
        case 'scope':
          prompt = `Generate the Scope and Limitations section with:
          
          **Geographical Scope**: ${sectionFormData?.geographical}
          **Time Frame**: ${sectionFormData?.timeframe}
          **What's Included**: ${sectionFormData?.included}
          **What's Excluded/Limitations**: ${sectionFormData?.excluded}
          
          Write a clear section that:
          1. Defines the geographical and temporal scope
          2. Specifies what the study will cover
          3. Acknowledges limitations and what is excluded`;
          break;
          
        default:
          prompt = `Generate content for ${sectionId} section of a research proposal about: ${formData.topicDescription}`;
      }

      const response = await researchChat(prompt, 'proposal');
      
      if (response) {
        setOutputs(prev => ({
          ...prev,
          [sectionId]: { status: 'draft', content: response }
        }));
        
        // Store the form data in formData state
        if (sectionFormData) {
          setFormData(prev => ({
            ...prev,
            ...sectionFormData,
            topicDescription: sectionFormData.topic || prev.topicDescription,
            targetPopulation: sectionFormData.population || prev.targetPopulation,
            studyLocation: sectionFormData.location || prev.studyLocation,
          }));
        }
      }
    } catch (error) {
      console.error('Error generating section:', error);
      setOutputs(prev => ({
        ...prev,
        [sectionId]: { status: 'empty', content: '' }
      }));
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I encountered an error generating this section. Please try again." 
      }]);
    }
  };

  const approveSection = (sectionId: string) => {
    setOutputs(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], status: 'approved' }
    }));
    
    // Move to next section
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex < sections.length - 1) {
      setExpandedSection(sections[currentIndex + 1].id);
      setCurrentStep(currentIndex + 3); // +2 because Topic is step 1, Background is step 2
    } else {
      setCurrentStep(7); // Review step
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const exportProposal = async () => {
    // Compile all sections into markdown format
    let proposal = '# Research Proposal\n\n';
    
    // Add title if available
    if (formData.topicDescription) {
      proposal += `## ${formData.topicDescription}\n\n`;
    }
    
    sections.forEach(section => {
      if (outputs[section.id].content) {
        proposal += `## ${section.title}\n\n${outputs[section.id].content}\n\n`;
      }
    });
    
    // Generate title for the document
    const docTitle = formData.topicDescription 
      ? formData.topicDescription.substring(0, 50) 
      : 'Research Proposal';
    
    // Save progress with proposal data
    saveResearchProgress({
      proposalData: proposal,
      topic: formData.topicDescription,
    });
    
    // Convert to Word document and download
    await convertMarkdownToDocx(proposal, docTitle, 'Student');
  };

  const markProposalComplete = () => {
    // Check if all sections are completed
    const allCompleted = sections.every(section => 
      outputs[section.id].status === 'approved' || outputs[section.id].content.length > 100
    );

    if (allCompleted) {
      // Save all sections data
      let proposalContent = '';
      sections.forEach(section => {
        if (outputs[section.id].content) {
          proposalContent += `## ${section.title}\n\n${outputs[section.id].content}\n\n`;
        }
      });

      saveResearchProgress({
        proposalCompleted: true,
        proposalData: proposalContent,
        topic: formData.topicDescription,
      });

      setShowReviewPrompt(true);
    } else {
      alert('Please complete all sections before proceeding to the next chapter.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-500';
      case 'draft': return 'text-amber-500';
      case 'generating': return 'text-blue-500';
      default: return darkMode ? 'text-gray-500' : 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'approved': return darkMode ? 'bg-green-900/30' : 'bg-green-50';
      case 'draft': return darkMode ? 'bg-amber-900/30' : 'bg-amber-50';
      case 'generating': return darkMode ? 'bg-blue-900/30' : 'bg-blue-50';
      default: return darkMode ? 'bg-gray-800' : 'bg-gray-50';
    }
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
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Research Proposal Builder</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Chapter 1-3 Foundation</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Topic: <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {formData.topicDescription ? formData.topicDescription.substring(0, 40) + '...' : 'Not set'}
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
                        ? 'bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900/50' 
                        : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'
                  }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  {step.id < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${step.id === currentStep ? 'text-blue-600 dark:text-blue-400' : darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
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
        <div className={`w-1/2 flex flex-col border-r ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-md' 
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
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex gap-2 mb-3">
              {quickPrompts.map((action, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleQuickPrompt(action.label)}
                  className={`flex items-center gap-2 px-3 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-white hover:bg-gray-50 text-gray-700'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg text-sm transition-colors`}
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
              <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded-lg`}>
                <Lightbulb className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe your research topic..."
                  className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600' : 'bg-gray-100 focus:bg-white'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  disabled={isLoading}
                />
              </div>
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-xs mt-2 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Powered by Gemini Pro</p>
          </div>
        </div>

        {/* Right Panel - Sections */}
        <div className={`w-1/2 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-slate-50'} p-4`}>
          <div className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden flex flex-col`}>
            {/* Section Header */}
            <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'} flex items-center justify-between`}>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Proposal Sections</h3>
              <button 
                onClick={exportProposal}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export All
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
                      <div className={`w-8 h-8 rounded-lg ${getStatusBg(outputs[section.id].status)} flex items-center justify-center`}>
                        <section.icon className={`w-4 h-4 ${getStatusColor(outputs[section.id].status)}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{section.title}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{section.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBg(outputs[section.id].status)} ${getStatusColor(outputs[section.id].status)}`}>
                        {outputs[section.id].status === 'empty' ? 'Not started' : 
                         outputs[section.id].status === 'generating' ? 'Generating...' :
                         outputs[section.id].status === 'draft' ? 'Draft' : 'Approved'}
                      </span>
                      {expandedSection === section.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {expandedSection === section.id && (
                    <div className={`px-4 pb-4 ${darkMode ? 'bg-gray-750/50' : 'bg-gray-50/50'}`}>
                      {outputs[section.id].content ? (
                        <div className="space-y-3">
                          <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'} whitespace-pre-wrap`}>
                              {outputs[section.id].content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => approveSection(section.id)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </button>
                            <button 
                              onClick={() => setOutputs(prev => ({ ...prev, [section.id]: { status: 'empty', content: '' } }))}
                              className={`flex items-center gap-1.5 px-3 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} text-sm rounded-lg transition-colors`}
                            >
                              <RefreshCw className="w-4 h-4" />
                              Re-generate
                            </button>
                            <button 
                              onClick={() => copyToClipboard(outputs[section.id].content)}
                              className={`flex items-center gap-1.5 px-3 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} text-sm rounded-lg transition-colors`}
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <SectionFormFields
                          sectionId={section.id}
                          onGenerate={(formData) => generateSection(section.id, formData)}
                          isGenerating={outputs[section.id].status === 'generating'}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Export Button */}
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 space-y-2`}>
              <button 
                onClick={exportProposal}
                className={`w-full py-2.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} text-${darkMode ? 'gray-200' : 'gray-700'} rounded-xl font-medium transition-all flex items-center justify-center gap-2 border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
              >
                <Download className="w-4 h-4" />
                Download Proposal
              </button>
              <button 
                onClick={markProposalComplete}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/50"
              >
                <CheckCircle2 className="w-5 h-5" />
                Complete & Proceed to Literature Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Prompt Modal */}
      {showReviewPrompt && (
        <SectionReviewPrompt
          sectionName="Research Proposal (Chapter 1)"
          nextSectionName="Literature Review (Chapter 2)"
          nextSectionPath="/research/literature"
          onClose={() => setShowReviewPrompt(false)}
          onExport={exportProposal}
          canProceed={true}
        />
      )}
    </div>
  );
}

