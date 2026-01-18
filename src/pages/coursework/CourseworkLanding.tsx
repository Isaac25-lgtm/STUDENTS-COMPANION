import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Camera, ArrowRight, Clock, ChevronRight, History } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getRecentProjects } from '../../utils/courseworkStorage';
import type { CourseworkProject } from '../../types/coursework';

export default function CourseworkLanding() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [assignmentText, setAssignmentText] = useState('');
  const [recentWork, setRecentWork] = useState<CourseworkProject[]>([]);

  useEffect(() => {
    setRecentWork(getRecentProjects(2));
  }, []);

  const handleContinue = () => {
    if (assignmentText.trim().length < 10) return;
    
    // Create new project ID and navigate to analysis
    const projectId = Date.now().toString();
    navigate(`/coursework/analysis/${projectId}`, { 
      state: { assignmentText } 
    });
  };

  const handleContinueProject = (project: CourseworkProject) => {
    if (project.status === 'complete') {
      navigate(`/coursework/review/${project.id}`);
    } else if (project.status === 'writing') {
      navigate(`/coursework/write/${project.id}`);
    } else {
      navigate(`/coursework/analysis/${project.id}`);
    }
  };

  const getProgress = (project: CourseworkProject): number => {
    if (project.status === 'complete') return 100;
    if (project.status === 'draft') return 10;
    if (project.sections.length === 0) return 25;
    const completed = project.sections.filter(s => s.status === 'complete').length;
    return Math.round((completed / project.sections.length) * 100);
  };

  const getDueTime = (project: CourseworkProject): string => {
    const hours = Math.floor((Date.now() - project.lastUpdated) / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-sm'} border-b sticky top-0 z-10`}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Coursework Generator</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Students Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-4 py-2 rounded-full">
            <span className="text-orange-600 dark:text-orange-400 font-semibold">✦ 847 credits</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            What's Your Assignment?
          </h2>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Paste your question below and I'll help you write it step by step.
          </p>
        </div>

        {/* Main Input Area */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl border-2 p-6 mb-6 shadow-sm`}>
          <textarea
            value={assignmentText}
            onChange={(e) => setAssignmentText(e.target.value)}
            placeholder={`Paste your assignment question here...

Example: Discuss the impact of climate change on agricultural productivity in East Africa. Use relevant theories and case studies. (2,500 words)

Or: Develop a predictive model for hospital readmissions using real-world EHR data. Compare at least 3 ML algorithms and justify your choice. Include ethical considerations. (4,000 words)`}
            className={`w-full h-36 px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none`}
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => alert('File upload coming soon! For now, paste text directly.')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Upload className="w-4 h-4" /> Upload File
              </button>
              <button 
                onClick={() => alert('Camera feature coming soon! For now, paste text directly.')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Camera className="w-4 h-4" /> Take Photo
              </button>
            </div>
            
            <button 
              onClick={handleContinue}
              disabled={assignmentText.length < 10}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                assignmentText.length > 10 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 hover:shadow-xl' 
                  : darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Recent Work */}
        {recentWork.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl border p-5`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <History className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              Continue Where You Left Off
            </h3>
            <div className="space-y-3">
              {recentWork.map((work) => (
                <button
                  key={work.id}
                  onClick={() => handleContinueProject(work)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer group ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
                      <FileText className={`w-5 h-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {work.assignmentText.substring(0, 60)}...
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {getDueTime(work)} • {getProgress(work)}% done
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-colors ${darkMode ? 'text-gray-500 group-hover:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-600'}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


