import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  BarChart3, 
  MessageSquare, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Lock,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getResearchProgress, clearResearchProgress } from '../utils/researchProgress';

export default function ResearchBuilderLanding() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [progress, setProgress] = useState(getResearchProgress());

  useEffect(() => {
    setProgress(getResearchProgress());
  }, []);

  const researchSections = [
    {
      id: 'proposal',
      title: 'Research Proposal',
      subtitle: 'Chapters 1-3 + References',
      description: 'Generate your complete proposal: Introduction, Literature Review, Methodology, and References in one go.',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      lightColor: 'bg-blue-50',
      darkLightColor: 'bg-blue-900/30',
      textColor: 'text-blue-600',
      darkTextColor: 'text-blue-400',
      borderColor: 'border-blue-200 hover:border-blue-400',
      darkBorderColor: 'border-blue-800 hover:border-blue-600',
      shadowColor: 'shadow-blue-200',
      isCompleted: progress.proposalCompleted,
      isLocked: false,
      outputs: ['Background', 'Problem Statement', 'Objectives', 'Literature Review', 'Methodology', 'References'],
      route: '/research/proposal'
    },
    {
      id: 'results',
      title: 'Results & Findings',
      subtitle: 'Chapter 4',
      description: 'Present your data analysis results with proper tables, statistics, and interpretations.',
      icon: BarChart3,
      color: 'from-amber-500 to-orange-500',
      lightColor: 'bg-amber-50',
      darkLightColor: 'bg-amber-900/30',
      textColor: 'text-amber-600',
      darkTextColor: 'text-amber-400',
      borderColor: 'border-amber-200 hover:border-amber-400',
      darkBorderColor: 'border-amber-800 hover:border-amber-600',
      shadowColor: 'shadow-amber-200',
      isCompleted: progress.resultsCompleted,
      isLocked: !progress.proposalCompleted,
      outputs: ['Response Rate', 'Demographics', 'Descriptive Stats', 'Hypothesis Tests', 'Key Findings'],
      route: '/research/results'
    },
    {
      id: 'discussion',
      title: 'Discussion & Conclusions',
      subtitle: 'Chapter 5',
      description: 'Interpret your findings, discuss limitations, draw conclusions, and make recommendations.',
      icon: MessageSquare,
      color: 'from-purple-500 to-violet-500',
      lightColor: 'bg-purple-50',
      darkLightColor: 'bg-purple-900/30',
      textColor: 'text-purple-600',
      darkTextColor: 'text-purple-400',
      borderColor: 'border-purple-200 hover:border-purple-400',
      darkBorderColor: 'border-purple-800 hover:border-purple-600',
      shadowColor: 'shadow-purple-200',
      isCompleted: progress.discussionCompleted,
      isLocked: !progress.resultsCompleted,
      outputs: ['Interpretation', 'Implications', 'Limitations', 'Conclusions', 'Recommendations'],
      route: '/research/discussion'
    },
  ];

  const handleCardClick = (section: typeof researchSections[0]) => {
    if (section.isLocked) {
      // Show which section to complete first
      if (!progress.proposalCompleted) {
        alert('Please complete Chapters 1-3 (Proposal) first.');
      } else if (!progress.resultsCompleted) {
        alert('Please complete Chapter 4 (Results) first.');
      }
      return;
    }
    navigate(section.route);
  };

  const handleStartNew = () => {
    if (confirm('This will clear your current progress. Are you sure?')) {
      clearResearchProgress();
      setProgress(getResearchProgress());
      navigate('/research/proposal');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/80 backdrop-blur-sm'} border-b ${darkMode ? 'border-gray-700' : ''} sticky top-0 z-10`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Research Builder</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Students Companion</p>
            </div>
          </div>
          
          {(progress.proposalCompleted || progress.resultsCompleted || progress.discussionCompleted) && (
            <button
              onClick={handleStartNew}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              <RefreshCw className="w-4 h-4" />
              Start New Research
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className={`text-3xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Build Your Research Step by Step
          </h2>
          <p className={`max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Complete each chapter in order. AI will guide you through the entire research writing process.
          </p>
        </div>

        {/* Progress Flow */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 mb-8 shadow-md border ${darkMode ? 'border-gray-700' : ''}`}>
          <div className="flex items-center justify-between">
            {researchSections.map((section, idx) => (
              <React.Fragment key={section.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    section.isCompleted 
                      ? 'bg-green-500' 
                      : section.isLocked 
                        ? darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        : `bg-gradient-to-r ${section.color}`
                  }`}>
                    {section.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : section.isLocked ? (
                      <Lock className="w-5 h-5 text-gray-400" />
                    ) : (
                      <section.icon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{section.title}</p>
                  <p className={`text-xs ${section.isCompleted ? 'text-green-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {section.isCompleted ? 'Complete ✓' : section.subtitle}
                  </p>
                </div>
                {idx < researchSections.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${
                    researchSections[idx].isCompleted ? 'bg-green-500' : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Section Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {researchSections.map((section) => (
            <div
              key={section.id}
              onClick={() => handleCardClick(section)}
              onMouseEnter={() => setHoveredCard(section.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 ${
                section.isLocked
                  ? darkMode ? 'bg-gray-800/50 border-gray-700 opacity-60' : 'bg-gray-50 border-gray-200 opacity-60'
                  : section.isCompleted
                    ? darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                    : darkMode 
                      ? `bg-gray-800 ${section.darkBorderColor}` 
                      : `bg-white ${section.borderColor}`
              } ${!section.isLocked && hoveredCard === section.id ? 'shadow-xl scale-[1.02]' : ''}`}
            >
              {/* Status Badge */}
              {section.isCompleted && (
                <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Complete
                </div>
              )}
              
              {section.isLocked && (
                <div className={`absolute -top-3 right-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-400'} text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1`}>
                  <Lock className="w-3 h-3" />
                  Locked
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg ${section.isLocked ? 'opacity-50' : ''}`}>
                  <section.icon className="w-7 h-7 text-white" />
                </div>
              </div>

              <h3 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {section.title}
              </h3>
              <p className={`text-sm font-medium mb-3 ${darkMode ? section.darkTextColor : section.textColor}`}>
                {section.subtitle}
              </p>
              <p className={`text-sm mb-5 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {section.description}
              </p>

              <div className="space-y-2 mb-6">
                {section.outputs.slice(0, 4).map((output, idx) => (
                  <div key={idx} className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${section.color}`} />
                    {output}
                  </div>
                ))}
                {section.outputs.length > 4 && (
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    + {section.outputs.length - 4} more
                  </p>
                )}
              </div>

              <button
                className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  section.isLocked
                    ? darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : section.isCompleted
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : `bg-gradient-to-r ${section.color} hover:opacity-90 text-white shadow-lg`
                }`}
                disabled={section.isLocked}
              >
                {section.isCompleted ? 'View & Edit' : section.isLocked ? 'Complete Previous First' : 'Start'}
                {!section.isLocked && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          ))}
        </div>

        {/* Quick Info */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl border ${darkMode ? 'border-gray-700' : ''} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <Clock className="w-5 h-5 text-gray-400" />
              How It Works
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">1</div>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Proposal (Ch 1-3)</p>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter your topic, fill academic details, and generate Introduction, Literature Review, Methodology with References.
              </p>
            </div>
            
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-amber-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">2</div>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Results (Ch 4)</p>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Input your data analysis findings and AI will format them into a proper Chapter 4 with tables and interpretations.
              </p>
            </div>
            
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-purple-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">3</div>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Discussion (Ch 5)</p>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Provide key findings and AI will generate discussion, conclusions, and recommendations for your complete research.
              </p>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className={`text-center text-sm mt-8 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          Need help with data analysis? <button onClick={() => navigate('/data-lab')} className="text-blue-500 hover:underline font-medium">Use the Data Analysis Lab</button>
        </p>
      </main>
    </div>
  );
}
