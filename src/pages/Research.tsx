import { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  FileText, 
  Users, 
  Lightbulb, 
  ChevronRight, 
  BookOpen, 
  MessageSquare,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ResearchForm from '../components/research/ResearchForm';
import ProposalViewer from '../components/research/ProposalViewer';
import FollowUpChat from '../components/research/FollowUpChat';
import { generateProposal, sendFollowUp } from '../services/gemini';
import { convertMarkdownToDocx } from '../utils/markdownToDocx';
import type { ResearchFormData, ChatMessage } from '../types/research';

type ViewMode = 'home' | 'form' | 'proposal';

export default function Research() {
  const { darkMode, theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [proposal, setProposal] = useState('');
  const [formData, setFormData] = useState<ResearchFormData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const features = [
    { id: 'proposal', name: 'Research Proposal', desc: 'Generate structured proposal with all sections', icon: FileText, color: 'amber' },
    { id: 'literature', name: 'Literature Matrix', desc: 'Organize sources by themes and findings', icon: BookOpen, color: 'blue' },
    { id: 'methodology', name: 'Methodology Guide', desc: 'Get suggestions based on your research question', icon: Lightbulb, color: 'emerald' },
    { id: 'supervisor', name: 'Supervisor Simulation', desc: 'AI feedback mimicking supervisor guidance', icon: MessageSquare, color: 'violet' },
  ];

  const projects = [
    { id: 1, title: 'Impact of Social Media on Mental Health', type: 'MSc Thesis', progress: 45, status: 'Chapter 2' },
    { id: 2, title: 'Healthcare Access in Rural Uganda', type: 'Research Proposal', progress: 80, status: 'Review' },
  ];

  const colorClasses = {
    amber: { bg: darkMode ? 'bg-amber-900/60' : 'bg-amber-100', text: darkMode ? 'text-amber-400' : 'text-amber-600' },
    blue: { bg: darkMode ? 'bg-blue-900/60' : 'bg-blue-100', text: darkMode ? 'text-blue-400' : 'text-blue-600' },
    emerald: { bg: darkMode ? 'bg-emerald-900/60' : 'bg-emerald-100', text: darkMode ? 'text-emerald-400' : 'text-emerald-600' },
    violet: { bg: darkMode ? 'bg-violet-900/60' : 'bg-violet-100', text: darkMode ? 'text-violet-400' : 'text-violet-600' },
  };

  const handleFeatureClick = (featureId: string) => {
    if (featureId === 'proposal') {
      setViewMode('form');
    }
  };

  const handleFormSubmit = async (data: ResearchFormData) => {
    setFormData(data);
    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentSection('Starting...');
    setError(null);

    try {
      const result = await generateProposal(data, (progress, section) => {
        setGenerationProgress(progress);
        setCurrentSection(section);
      });
      setProposal(result);
      setViewMode('proposal');
      setChatMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposal');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setCurrentSection('');
    }
  };

  const handleChatMessage = async (message: string) => {
    if (!formData) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await sendFollowUp(
        formData.topic,
        formData.university,
        message,
        proposal
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Use the proper Markdown to DOCX converter
      await convertMarkdownToDocx(
        proposal,
        formData?.topic || 'Research Proposal',
        formData?.studentName
      );
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Form View
  if (viewMode === 'form') {
    return (
      <div className="animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => setViewMode('home')}
          className={`flex items-center gap-2 mb-6 text-sm font-medium transition-colors ${
            darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Research
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-amber-900/60' : 'bg-amber-100'}`}>
            <Sparkles className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Generate Research Proposal</h1>
            <p className={`text-sm ${theme.textMuted}`}>Complete the form to generate your AI-powered proposal</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Generation Progress Overlay */}
        {isGenerating && (
          <div className={`mb-6 p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/90 border-amber-500/50' : 'bg-white border-amber-400'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin"></div>
              </div>
              <div>
                <p className={`font-semibold ${theme.text}`}>Generating Your Proposal...</p>
                <p className={`text-sm ${theme.textMuted}`}>{currentSection}</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className={`text-xs ${theme.textFaint} mt-2 text-center`}>
              {generationProgress}% complete • Generating chapter by chapter for maximum length
            </p>
          </div>
        )}

        <ResearchForm onSubmit={handleFormSubmit} isLoading={isGenerating} />
      </div>
    );
  }

  // Proposal View
  if (viewMode === 'proposal') {
    return (
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-900/60' : 'bg-emerald-100'}`}>
            <FileText className={`w-6 h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Your Research Proposal</h1>
            <p className={`text-sm ${theme.textMuted}`}>{formData?.topic}</p>
          </div>
        </div>

        {/* Proposal Viewer */}
        <ProposalViewer
          proposal={proposal}
          onProposalChange={setProposal}
          onBack={() => setViewMode('home')}
          isExporting={isExporting}
          onExport={handleExport}
        />

        {/* Follow-up Chat */}
        <FollowUpChat
          messages={chatMessages}
          onSendMessage={handleChatMessage}
          isLoading={isChatLoading}
        />
      </div>
    );
  }

  // Home View
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-amber-900/60' : 'bg-amber-100'}`}>
            <GraduationCap className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Research & Projects</h1>
            <p className={`text-sm ${theme.textMuted}`}>End-to-end support from proposal to thesis</p>
          </div>
        </div>
        <button 
          onClick={() => setViewMode('form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            darkMode 
              ? 'bg-amber-600 hover:bg-amber-500 text-white' 
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          } shadow-lg shadow-amber-500/20`}
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          New Proposal
        </button>
      </div>

      {/* Features Grid */}
      <section className="mb-8">
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>Research Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map((feature) => {
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
            return (
              <button
                key={feature.id}
                onClick={() => handleFeatureClick(feature.id)}
                className={`p-4 rounded-2xl border text-left transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  darkMode 
                    ? 'bg-slate-800/70 border-slate-700/50 hover:border-slate-600' 
                    : 'bg-white/80 border-slate-200/60 hover:border-slate-300'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center mb-3`}>
                  <feature.icon className={`w-5 h-5 ${colors.text}`} strokeWidth={1.5} />
                </div>
                <p className={`font-medium text-sm ${theme.text}`}>{feature.name}</p>
                <p className={`text-xs ${theme.textFaint} mt-0.5`}>{feature.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Supervisor Simulation Banner */}
      <div className={`mb-8 p-5 rounded-2xl overflow-hidden relative ${
        darkMode ? 'bg-gradient-to-r from-violet-900 to-purple-900' : 'bg-gradient-to-r from-violet-600 to-purple-600'
      }`}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'
        }} />
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Users className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div className="text-white">
              <p className="font-semibold">Supervisor Simulation</p>
              <p className="text-sm text-violet-200 mt-0.5">Get AI feedback that mimics the critical questions your supervisor would ask</p>
            </div>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors backdrop-blur">
            Try Now
          </button>
        </div>
      </div>

      {/* Active Projects */}
      <section>
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>Your Projects</h2>
        <div className="space-y-3">
          {projects.map((project) => (
            <div 
              key={project.id}
              className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${theme.card} ${theme.cardHover}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    darkMode ? 'bg-amber-900/60' : 'bg-amber-100'
                  }`}>
                    <GraduationCap className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className={`font-medium ${theme.text}`}>{project.title}</p>
                    <p className={`text-sm ${theme.textFaint}`}>{project.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${theme.text}`}>{project.progress}%</p>
                    <p className={`text-xs ${theme.textFaint}`}>{project.status}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-full border-4 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`} style={{
                    background: `conic-gradient(${darkMode ? '#f59e0b' : '#d97706'} ${project.progress}%, transparent 0)`
                  }} />
                  <ChevronRight className={`w-5 h-5 ${theme.textFaint}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
