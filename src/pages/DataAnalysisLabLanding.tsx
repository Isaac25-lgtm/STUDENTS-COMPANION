import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, MessageSquareQuote, Calculator, FileText, TrendingUp, Tags, 
  PieChart, Network, ArrowRight, Sparkles, BookOpen, ChevronRight, Clock, Star 
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function DataAnalysisLabLanding() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const analysisTypes = [
    {
      id: 'quantitative',
      title: 'Quantitative Analysis',
      subtitle: 'Numerical Data',
      description: 'For numbers, surveys, and experiments. Get summaries, run statistical tests, and create tables for your thesis.',
      icon: BarChart3,
      color: 'from-orange-500 to-amber-500',
      lightColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600',
      shadowColor: 'shadow-orange-200 dark:shadow-orange-900/30',
      features: [
        { icon: Calculator, text: 'Summarize Your Numbers (Table 1)' },
        { icon: TrendingUp, text: 'Test Your Hypotheses' },
        { icon: PieChart, text: 'Find Relationships in Data' },
        { icon: FileText, text: 'Ready-to-Use Tables & Charts' },
      ],
      fileTypes: 'CSV, Excel',
      popular: true,
      route: '/data-lab/quantitative'
    },
    {
      id: 'qualitative',
      title: 'Qualitative Analysis',
      subtitle: 'Non-Numerical Data',
      description: 'For interviews, focus groups, and open-ended answers. Label your text, find themes, and pick out key quotes.',
      icon: MessageSquareQuote,
      color: 'from-indigo-500 to-purple-600',
      lightColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600',
      shadowColor: 'shadow-indigo-200 dark:shadow-indigo-900/30',
      features: [
        { icon: Tags, text: 'Label & Tag Your Text' },
        { icon: Network, text: 'Find Patterns & Themes' },
        { icon: MessageSquareQuote, text: 'Collect Key Quotes' },
        { icon: BookOpen, text: 'Write Your Findings' },
      ],
      fileTypes: 'TXT, DOCX, PDF',
      popular: false,
      route: '/data-lab/qualitative'
    },
  ];

  const recentSessions = [
    { name: 'Survey Analysis - Customer Satisfaction', type: 'quantitative', date: '2 hours ago', route: '/data-lab/quantitative' },
    { name: 'Interview Coding - Healthcare Access', type: 'qualitative', date: 'Yesterday', route: '/data-lab/qualitative' },
  ];

  return (
    <div className={`min-h-screen ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
    }`}>
      {/* Header */}
      <header className={`${
        darkMode ? 'bg-gray-800/80' : 'bg-white/80'
      } backdrop-blur-sm border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-10`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-400 via-pink-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} text-lg`}>
                Data Analysis Lab
              </h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Students Companion
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 ${
            darkMode ? 'bg-orange-900/30' : 'bg-orange-50'
          } px-4 py-2 rounded-full`}>
            <span className={`${darkMode ? 'text-orange-400' : 'text-orange-600'} font-semibold`}>
              ✦ Unlimited
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
            What type of data are you analyzing?
          </h2>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Pick your analysis type and I'll guide you step-by-step to get results ready for your thesis.
          </p>
        </div>

        {/* Analysis Type Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {analysisTypes.map((type) => (
            <div
              key={type.id}
              className={`relative ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-2xl border-2 ${type.borderColor} p-6 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                hoveredCard === type.id ? type.shadowColor : ''
              }`}
              onMouseEnter={() => setHoveredCard(type.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(type.route)}
            >
              {type.popular && (
                <div className="absolute -top-3 left-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="w-3 h-3" /> Most Popular
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg`}>
                  <type.icon className="w-7 h-7 text-white" />
                </div>
                <span className={`text-xs font-medium ${type.lightColor} ${type.textColor} px-3 py-1 rounded-full`}>
                  {type.fileTypes}
                </span>
              </div>

              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                {type.title}
              </h3>
              <p className={`text-sm font-medium ${type.textColor} mb-3`}>
                {type.subtitle}
              </p>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-5 leading-relaxed`}>
                {type.description}
              </p>

              <div className="space-y-2 mb-6">
                {type.features.map((feature, idx) => (
                  <div key={idx} className={`flex items-center gap-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className={`w-8 h-8 rounded-lg ${type.lightColor} flex items-center justify-center`}>
                      <feature.icon className={`w-4 h-4 ${type.textColor}`} />
                    </div>
                    {feature.text}
                  </div>
                ))}
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(type.route);
                }}
                className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${type.color} hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg ${type.shadowColor}`}
              >
                Start {type.title.split(' ')[0]} Analysis
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Recent Sessions */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl border ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        } p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <Clock className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              Recent Sessions
            </h3>
            <button className={`text-sm ${
              darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
            } font-medium`}>
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentSessions.map((session, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(session.route)}
                className={`flex items-center justify-between p-4 ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                } rounded-xl transition-colors cursor-pointer group`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    session.type === 'quantitative' 
                      ? darkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                      : darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
                  }`}>
                    {session.type === 'quantitative' ? (
                      <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                    ) : (
                      <MessageSquareQuote className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {session.name}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {session.date}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 ${
                  darkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'
                } transition-colors`} />
              </div>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-8`}>
          Not sure which to choose?{' '}
          <button className={`${
            darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
          } hover:underline font-medium`}>
            Learn about analysis types
          </button>
        </p>
      </main>
    </div>
  );
}


