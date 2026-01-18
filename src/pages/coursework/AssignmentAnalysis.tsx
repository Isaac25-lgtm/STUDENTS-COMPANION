import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Edit3, 
  Zap, 
  ListChecks, 
  FileEdit, 
  Clock,
  Loader2,
  X
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { analyzeAssignment } from '../../services/courseworkAI';
import { saveProject, getProject } from '../../utils/courseworkStorage';
import type { CourseworkProject, MasterPromptAnswers } from '../../types/coursework';

export default function AssignmentAnalysis() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { darkMode } = useTheme();
  
  const [selectedApproach, setSelectedApproach] = useState<'quick' | 'guided' | 'outline'>('guided');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [project, setProject] = useState<CourseworkProject | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [masterAnswers, setMasterAnswers] = useState<Partial<MasterPromptAnswers>>({
    level: 'MSc',
    institution: 'University',
    assignmentType: 'essay',
    dataset: 'none',
    tools: [],
    citationStyle: 'APA 7'
  });

  useEffect(() => {
    const init = async () => {
      const assignmentText = location.state?.assignmentText;
      if (!assignmentText && !id) {
        navigate('/coursework');
        return;
      }

      // Check if project exists
      let existingProject = id ? getProject(id) : null;
      
      if (existingProject) {
        setProject(existingProject);
        setIsAnalyzing(false);
      } else {
        // Analyze new assignment
        setIsAnalyzing(true);
        const analysis = await analyzeAssignment(assignmentText);
        
        const newProject: CourseworkProject = {
          id: id!,
          assignmentText,
          assignmentType: analysis.type,
          wordCount: analysis.wordCount,
          analyzedRequirements: analysis.requirements,
          selectedApproach: 'guided',
          sections: [],
          totalWords: 0,
          status: 'analyzing',
          createdAt: Date.now(),
          lastUpdated: Date.now()
        };
        
        saveProject(newProject);
        setProject(newProject);
        setIsAnalyzing(false);
      }
    };

    init();
  }, [id, location, navigate]);

  const handleStart = () => {
    if (!project) return;

    // For Quick Draft and Outline, we need master prompt answers
    if (selectedApproach === 'quick' || selectedApproach === 'outline') {
      setShowDetailsModal(true);
    } else {
      // Step-by-step guided mode
      const updatedProject = {
        ...project,
        selectedApproach,
        status: 'writing' as const
      };
      saveProject(updatedProject);
      navigate(`/coursework/write/${project.id}`);
    }
  };

  const handleDetailsSubmit = () => {
    if (!project) return;
    
    // Validate required fields
    if (!masterAnswers.topic || !masterAnswers.courseUnit || !masterAnswers.totalLength) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedProject = {
      ...project,
      selectedApproach,
      masterAnswers: masterAnswers as MasterPromptAnswers,
      status: 'writing' as const
    };
    
    saveProject(updatedProject);
    setShowDetailsModal(false);
    
    navigate(`/coursework/write/${project.id}`);
  };

  const approaches = [
    {
      id: 'quick' as const,
      name: 'Quick Draft',
      desc: 'Get a complete draft in minutes, then edit it yourself',
      icon: Zap,
      time: '5-10 mins',
    },
    {
      id: 'guided' as const,
      name: 'Step-by-Step',
      desc: 'I guide you section by section — best results',
      icon: ListChecks,
      time: '30-45 mins',
      recommended: true,
    },
    {
      id: 'outline' as const,
      name: 'Outline Only',
      desc: 'Get a structure, write the content yourself',
      icon: FileEdit,
      time: '5 mins',
    }
  ];

  if (isAnalyzing || !project) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Analyzing your assignment...
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
            This will take just a moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b px-6 py-4`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                I've Read Your Assignment
              </h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Here's what I found
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-3 py-2 rounded-full">
            <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">✦ 847 credits</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Original Assignment */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl border p-5 mb-6`}>
          <div className="flex items-start justify-between mb-3">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your Assignment</p>
            <button 
              onClick={() => navigate('/coursework')}
              className={`text-sm font-medium flex items-center gap-1 ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          </div>
          <p className={`leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {project.assignmentText}
          </p>
        </div>

        {/* What You Need To Do */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold">What You Need To Do</h3>
          </div>
          
          <div className="space-y-3">
            {project.analyzedRequirements.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0" />
                <p className="text-white/90">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm">Type:</span>
              <span className="font-medium">{project.assignmentType}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-sm">Length:</span>
              <span className="font-medium">{project.wordCount.toLocaleString()} words</span>
            </div>
          </div>
        </div>

        {/* Choose How To Work */}
        <div className="mb-6">
          <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            How Do You Want To Work?
          </h3>
          <div className="space-y-3">
            {approaches.map((approach) => (
              <button
                key={approach.id}
                onClick={() => setSelectedApproach(approach.id)}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                  selectedApproach === approach.id
                    ? darkMode 
                      ? 'border-indigo-500 bg-indigo-900/30' 
                      : 'border-indigo-500 bg-indigo-50'
                    : darkMode
                      ? 'border-gray-700 bg-gray-800 hover:border-indigo-600'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedApproach === approach.id 
                    ? 'bg-indigo-500 text-white' 
                    : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  <approach.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {approach.name}
                    </h4>
                    {approach.recommended && (
                      <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">Best</span>
                    )}
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {approach.desc}
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <Clock className="w-4 h-4" />
                  {approach.time}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button 
          onClick={handleStart}
          className="w-full py-4 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          Let's Start <ArrowRight className="w-5 h-5" />
        </button>
      </main>

      {/* Details Collection Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Quick Setup Questions
              </h2>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Answer these quick questions to help me generate high-quality, academic content:
            </p>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Topic/Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={masterAnswers.topic || ''}
                  onChange={(e) => setMasterAnswers({...masterAnswers, topic: e.target.value})}
                  placeholder="e.g., Machine Learning for Healthcare Predictions"
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Course/Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={masterAnswers.courseUnit || ''}
                    onChange={(e) => setMasterAnswers({...masterAnswers, courseUnit: e.target.value})}
                    placeholder="e.g., Applied Machine Learning"
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Level
                  </label>
                  <select
                    value={masterAnswers.level}
                    onChange={(e) => setMasterAnswers({...masterAnswers, level: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                  >
                    <option value="Postgraduate Diploma">Postgraduate Diploma</option>
                    <option value="MSc">MSc</option>
                    <option value="MPhil">MPhil</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Institution
                  </label>
                  <input
                    type="text"
                    value={masterAnswers.institution || ''}
                    onChange={(e) => setMasterAnswers({...masterAnswers, institution: e.target.value})}
                    placeholder="e.g., Makerere University"
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Total Length <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={masterAnswers.totalLength || ''}
                    onChange={(e) => setMasterAnswers({...masterAnswers, totalLength: e.target.value})}
                    placeholder="e.g., 3000 words or 12 pages"
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assignment Type
                  </label>
                  <select
                    value={masterAnswers.assignmentType}
                    onChange={(e) => setMasterAnswers({...masterAnswers, assignmentType: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                  >
                    <option value="essay">Essay</option>
                    <option value="technical report">Technical Report</option>
                    <option value="IMRaD paper">IMRaD Paper</option>
                    <option value="literature review">Literature Review</option>
                    <option value="mini-dissertation chapter">Mini-Dissertation Chapter</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Citation Style
                  </label>
                  <select
                    value={masterAnswers.citationStyle}
                    onChange={(e) => setMasterAnswers({...masterAnswers, citationStyle: e.target.value as any})}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                  >
                    <option value="APA 7">APA 7</option>
                    <option value="Harvard">Harvard</option>
                    <option value="IEEE">IEEE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tools/Software (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Python', 'R', 'SPSS', 'Stata', 'SQL', 'Power BI', 'Excel'].map(tool => (
                    <label key={tool} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={masterAnswers.tools?.includes(tool)}
                        onChange={(e) => {
                          const tools = masterAnswers.tools || [];
                          setMasterAnswers({
                            ...masterAnswers,
                            tools: e.target.checked 
                              ? [...tools, tool]
                              : tools.filter(t => t !== tool)
                          });
                        }}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{tool}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Local Context (Optional)
                </label>
                <input
                  type="text"
                  value={masterAnswers.localContext || ''}
                  onChange={(e) => setMasterAnswers({...masterAnswers, localContext: e.target.value})}
                  placeholder="e.g., Uganda healthcare system, Kampala banking sector"
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDetailsSubmit}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


