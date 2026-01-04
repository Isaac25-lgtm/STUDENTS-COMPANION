import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Sparkles, Clock, ChevronRight, AlertCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getProjects, deleteProject } from '../utils/courseworkStorage';
import type { CourseworkProject } from '../types/coursework';

export default function Coursework() {
  const navigate = useNavigate();
  const { darkMode, theme } = useTheme();
  const [recentProjects, setRecentProjects] = useState<CourseworkProject[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const projects = getProjects().sort((a, b) => b.lastUpdated - a.lastUpdated);
    setRecentProjects(projects);
  };

  const handleNewDraft = () => {
    navigate('/coursework/new');
  };

  const handleOpenProject = (project: CourseworkProject) => {
    if (project.status === 'complete') {
      navigate(`/coursework/review/${project.id}`);
    } else if (project.status === 'writing') {
      navigate(`/coursework/write/${project.id}`);
    } else {
      navigate(`/coursework/analysis/${project.id}`);
    }
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this draft?')) {
      deleteProject(projectId);
      loadProjects();
    }
  };

  const getProgress = (project: CourseworkProject): number => {
    if (project.status === 'complete') return 100;
    if (project.status === 'draft' || project.status === 'analyzing') return 10;
    if (project.sections.length === 0) return 25;
    const completed = project.sections.filter(s => s.status === 'complete').length;
    return Math.round((completed / project.sections.length) * 75) + 25;
  };

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusLabel = (project: CourseworkProject): string => {
    switch (project.status) {
      case 'complete': return 'Completed';
      case 'writing': return 'In Progress';
      case 'analyzing': return 'Analyzing';
      default: return 'Draft';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-violet-900/60' : 'bg-violet-100'}`}>
            <FileText className={`w-6 h-6 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme.text}`}>Coursework Generator</h1>
            <p className={`text-sm ${theme.textMuted}`}>Turn assignment briefs into distinction-grade drafts</p>
          </div>
        </div>
        <button 
          onClick={handleNewDraft}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            darkMode 
              ? 'bg-violet-600 hover:bg-violet-500 text-white' 
              : 'bg-violet-600 hover:bg-violet-700 text-white'
          } shadow-lg shadow-violet-500/20`}
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          New Draft
        </button>
      </div>

      {/* Info Banner */}
      <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 ${
        darkMode ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-amber-50 border border-amber-100'
      }`}>
        <AlertCircle className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
        <div>
          <p className={`text-sm font-medium ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
            Master's Level Quality
          </p>
          <p className={`text-sm ${darkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
            Our AI generates distinction-grade coursework with proper citations, critical analysis, and academic structure. 
            Uses [CITATION NEEDED] markers where verification is required.
          </p>
        </div>
      </div>

      {/* Quick Start Card */}
      <div className={`mb-8 p-6 rounded-2xl ${theme.card} border overflow-hidden relative`}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${theme.text}`}>Start a New Assignment</h2>
              <p className={`text-sm ${theme.textMuted}`}>Paste your assignment question and let AI guide you</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="text-2xl mb-2">📝</div>
              <p className={`font-medium text-sm ${theme.text}`}>Essays</p>
              <p className={`text-xs ${theme.textFaint} mt-0.5`}>Argumentative & analytical</p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="text-2xl mb-2">📊</div>
              <p className={`font-medium text-sm ${theme.text}`}>Technical Reports</p>
              <p className={`text-xs ${theme.textFaint} mt-0.5`}>Data science & analysis</p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="text-2xl mb-2">📚</div>
              <p className={`font-medium text-sm ${theme.text}`}>Literature Reviews</p>
              <p className={`text-xs ${theme.textFaint} mt-0.5`}>Thematic synthesis</p>
            </div>
          </div>

          <button 
            onClick={handleNewDraft}
            className={`w-full py-4 rounded-xl font-semibold transition-all bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-lg flex items-center justify-center gap-2`}
          >
            <Plus className="w-5 h-5" />
            Start New Assignment
          </button>
        </div>
      </div>

      {/* Recent Drafts */}
      <section>
        <h2 className={`text-xs font-semibold ${theme.textFaint} uppercase tracking-wider mb-4`}>
          {recentProjects.length > 0 ? 'Recent Drafts' : 'No drafts yet'}
        </h2>
        
        {recentProjects.length > 0 ? (
          <div className={`${theme.card} rounded-2xl border overflow-hidden`}>
            {recentProjects.map((project, i) => (
              <div 
                key={project.id}
                onClick={() => handleOpenProject(project)}
                className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                  darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'
                } ${i !== recentProjects.length - 1 ? `border-b ${theme.divider}` : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  project.status === 'complete' 
                    ? darkMode ? 'bg-green-900/60' : 'bg-green-100'
                    : darkMode ? 'bg-violet-900/60' : 'bg-violet-100'
                }`}>
                  <FileText className={`w-5 h-5 ${
                    project.status === 'complete'
                      ? darkMode ? 'text-green-400' : 'text-green-600'
                      : darkMode ? 'text-violet-400' : 'text-violet-600'
                  }`} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${theme.text} truncate`}>
                    {project.masterAnswers?.topic || project.assignmentText.substring(0, 60)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`h-1.5 w-24 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div 
                        className={`h-full rounded-full ${
                          project.status === 'complete' ? 'bg-emerald-500' : 'bg-violet-500'
                        }`}
                        style={{ width: `${getProgress(project)}%` }}
                      />
                    </div>
                    <span className={`text-xs ${theme.textFaint}`}>
                      {getStatusLabel(project)} • {getProgress(project)}%
                    </span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${theme.textFaint}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {getTimeAgo(project.lastUpdated)}
                </div>
                <button
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className={`w-4 h-4 ${theme.textFaint}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className={`${theme.card} rounded-2xl border p-8 text-center`}>
            <FileText className={`w-12 h-12 mx-auto mb-3 ${theme.textFaint}`} />
            <p className={`font-medium ${theme.text}`}>No drafts yet</p>
            <p className={`text-sm ${theme.textMuted} mt-1`}>Start your first assignment to see it here</p>
            <button 
              onClick={handleNewDraft}
              className={`mt-4 px-6 py-2 rounded-lg font-medium ${darkMode ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700'}`}
            >
              Get Started
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
