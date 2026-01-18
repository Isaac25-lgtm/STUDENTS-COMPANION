import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  Sparkles, 
  ChevronDown,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  GraduationCap,
  MapPin,
  User,
  Calendar,
  FileSearch,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { generateCoursework, getEstimatedTime, verifyOutput } from '../../services/courseworkGenerator';
import { convertMarkdownToDocx } from '../../utils/markdownToDocx';
import type { 
  CourseworkGeneratorInputs,
  CourseworkType,
  AcademicLevel,
  CitationStyle,
  GeographicFocus,
  Discipline,
} from '../../types/coursework';
import {
  WORD_COUNT_OPTIONS,
  COURSEWORK_TYPES,
  ACADEMIC_LEVELS,
  CITATION_STYLES,
  GEOGRAPHIC_FOCUSES,
  DISCIPLINES,
  UNIVERSITY_OPTIONS,
  calculateCredits,
} from '../../types/coursework';

type Phase = 'form' | 'generating' | 'complete';

export default function CourseworkGenerator() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [phase, setPhase] = useState<Phase>('form');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [verificationResult, setVerificationResult] = useState<{ status: string; wordCount: number; issues: string[] } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CourseworkGeneratorInputs>({
    assignmentQuestion: '',
    wordCount: 4000,
    customWordCount: undefined,
    courseworkType: 'Critical Essay (Argue a position with evidence)',
    academicLevel: "Master's/Postgraduate",
    citationStyle: 'APA 7th Edition',
    geographicFocus: 'Global',
    discipline: undefined,
    requiredTheorists: '',
    requiredSources: '',
    universityName: '',
    studentName: '',
    courseCodeName: '',
    submissionDate: '',
    lecturerName: '',
    additionalInstructions: '',
  });

  const [showOptional, setShowOptional] = useState(false);

  const effectiveWordCount = formData.wordCount === 'custom' 
    ? (formData.customWordCount || 4000) 
    : formData.wordCount;

  const creditsNeeded = calculateCredits(effectiveWordCount);
  const estimatedTime = getEstimatedTime(effectiveWordCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.assignmentQuestion.length < 50) {
      alert('Please provide a more detailed assignment question (at least 50 characters)');
      return;
    }

    setPhase('generating');
    setGenerationProgress(0);

    try {
      const content = await generateCoursework(formData, (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      });

      setGeneratedContent(content);
      
      const verification = verifyOutput(content, effectiveWordCount);
      setVerificationResult(verification);
      
      setPhase('complete');
    } catch (error) {
      console.error('Generation error:', error);
      alert(`Failed to generate coursework: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPhase('form');
    }
  };

  const handleExport = async () => {
    const title = formData.assignmentQuestion.substring(0, 50);
    await convertMarkdownToDocx(generatedContent, title, formData.studentName || 'Student');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Form Phase
  if (phase === 'form') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-white to-violet-50'} pb-20`}>
        {/* Header */}
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-sm'} border-b sticky top-0 z-10`}>
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')} 
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Coursework Generator</h1>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Distinction-grade academic writing</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-violet-900/30' : 'bg-violet-50'}`}>
              <Sparkles className={`w-4 h-4 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
              <span className={`font-semibold ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>{creditsNeeded} credits</span>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* Assignment Question - Main Input */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm`}>
            <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-red-500">*</span> Paste your assignment question or topic
            </label>
            <textarea
              value={formData.assignmentQuestion}
              onChange={(e) => setFormData(prev => ({ ...prev, assignmentQuestion: e.target.value }))}
              placeholder="e.g., Evaluate the impact of mobile money services on the formal banking sector in Uganda. Discuss the regulatory challenges and opportunities for financial inclusion. Use relevant theories and case studies to support your argument."
              className={`w-full h-40 px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none`}
              required
              minLength={50}
            />
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {formData.assignmentQuestion.length}/50 minimum characters
            </p>
          </div>

          {/* Core Settings */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm`}>
            <h2 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <BookOpen className={`w-5 h-5 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
              Core Settings
            </h2>

            {/* Word Count */}
            <div className="mb-5">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="text-red-500">*</span> Target word count
              </label>
              <div className="flex flex-wrap gap-2">
                {WORD_COUNT_OPTIONS.map(option => (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, wordCount: option.value }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.wordCount === option.value
                        ? 'bg-violet-500 text-white shadow-md'
                        : darkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {formData.wordCount === 'custom' && (
                <input
                  type="number"
                  value={formData.customWordCount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customWordCount: parseInt(e.target.value) || undefined }))}
                  placeholder="Enter custom word count"
                  className={`mt-3 w-full px-4 py-2 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                  min={500}
                  max={10000}
                />
              )}
            </div>

            {/* Coursework Type */}
            <div className="mb-5">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="text-red-500">*</span> Type of coursework
              </label>
              <select
                value={formData.courseworkType}
                onChange={(e) => setFormData(prev => ({ ...prev, courseworkType: e.target.value as CourseworkType }))}
                className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
              >
                {COURSEWORK_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Academic Level */}
            <div className="mb-5">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="text-red-500">*</span> Academic level
              </label>
              <div className="flex flex-wrap gap-2">
                {ACADEMIC_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, academicLevel: level }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.academicLevel === level
                        ? 'bg-violet-500 text-white shadow-md'
                        : darkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Citation Style */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="text-red-500">*</span> Citation style
              </label>
              <select
                value={formData.citationStyle}
                onChange={(e) => setFormData(prev => ({ ...prev, citationStyle: e.target.value as CitationStyle }))}
                className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
              >
                {CITATION_STYLES.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className={`w-full flex items-center justify-between px-6 py-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border rounded-2xl shadow-sm`}
          >
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Optional Settings (Recommended for better results)
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showOptional ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>

          {/* Optional Settings */}
          {showOptional && (
            <>
              {/* Context Settings */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm`}>
                <h2 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <MapPin className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  Context & Focus
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Geographic focus
                    </label>
                    <select
                      value={formData.geographicFocus || 'Global'}
                      onChange={(e) => setFormData(prev => ({ ...prev, geographicFocus: e.target.value as GeographicFocus }))}
                      className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    >
                      {GEOGRAPHIC_FOCUSES.map(focus => (
                        <option key={focus} value={focus}>{focus}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Subject area / Discipline
                    </label>
                    <select
                      value={formData.discipline || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, discipline: e.target.value as Discipline || undefined }))}
                      className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    >
                      <option value="">Select discipline...</option>
                      {DISCIPLINES.map(discipline => (
                        <option key={discipline} value={discipline}>{discipline}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Specific theories or authors you must include
                  </label>
                  <textarea
                    value={formData.requiredTheorists}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiredTheorists: e.target.value }))}
                    placeholder="e.g., Must reference Keynesian theory, Porter's Five Forces, Technology Acceptance Model..."
                    className={`w-full h-20 px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none`}
                    maxLength={500}
                  />
                </div>

                <div className="mt-4">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Specific sources you must cite
                  </label>
                  <textarea
                    value={formData.requiredSources}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiredSources: e.target.value }))}
                    placeholder="e.g., World Bank reports, specific journal articles, course readings..."
                    className={`w-full h-20 px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none`}
                    maxLength={500}
                  />
                </div>
              </div>

              {/* Student Details (for cover page) */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm`}>
                <h2 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <User className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  Student Details (for cover page)
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Your name
                    </label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                      placeholder="John Doe"
                      className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      University
                    </label>
                    <select
                      value={formData.universityName}
                      onChange={(e) => setFormData(prev => ({ ...prev, universityName: e.target.value }))}
                      className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    >
                      <option value="">Select university...</option>
                      {UNIVERSITY_OPTIONS.map(uni => (
                        <option key={uni} value={uni}>{uni}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Course code and name
                    </label>
                    <input
                      type="text"
                      value={formData.courseCodeName}
                      onChange={(e) => setFormData(prev => ({ ...prev, courseCodeName: e.target.value }))}
                      placeholder="e.g., FIN7201 - Development Finance"
                      className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Lecturer/Supervisor name
                    </label>
                    <input
                      type="text"
                      value={formData.lecturerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lecturerName: e.target.value }))}
                      placeholder="Dr. Jane Smith"
                      className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Submission date
                    </label>
                    <input
                      type="date"
                      value={formData.submissionDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, submissionDate: e.target.value }))}
                      className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Instructions */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm`}>
                <h2 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <FileSearch className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                  Additional Instructions
                </h2>
                <textarea
                  value={formData.additionalInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                  placeholder="Any other specific requirements, rubric criteria, or preferences..."
                  className={`w-full h-24 px-4 py-3 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none`}
                  maxLength={1000}
                />
              </div>
            </>
          )}

          {/* Generation Info */}
          <div className={`${darkMode ? 'bg-violet-900/20 border-violet-800' : 'bg-violet-50 border-violet-200'} border rounded-2xl p-5`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-violet-800' : 'bg-violet-100'}`}>
                <Clock className={`w-5 h-5 ${darkMode ? 'text-violet-300' : 'text-violet-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${darkMode ? 'text-violet-200' : 'text-violet-900'}`}>Generation Details</h3>
                <div className={`text-sm mt-1 space-y-1 ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>
                  <p>Word count: <strong>{effectiveWordCount.toLocaleString()} words</strong></p>
                  <p>Estimated time: <strong>{estimatedTime}</strong></p>
                  <p>Credits required: <strong>{creditsNeeded} credits</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formData.assignmentQuestion.length < 50}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              formData.assignmentQuestion.length >= 50
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-xl shadow-violet-200 dark:shadow-violet-900/50 hover:shadow-2xl hover:scale-[1.01]'
                : darkMode 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-6 h-6" />
            Generate Distinction-Grade Coursework
          </button>
        </form>
      </div>
    );
  }

  // Generating Phase
  if (phase === 'generating') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-violet-50 to-purple-100'}`}>
        <div className={`max-w-lg w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-10 shadow-2xl`}>
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
            
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Generating Your Coursework
              </h2>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {generationStatus || 'Preparing your distinction-grade content...'}
              </p>
            </div>

            <div className="space-y-2">
              <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {generationProgress}% Complete
              </p>
            </div>

            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              This may take {estimatedTime}. Please do not close this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Complete Phase
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-slate-50'} pb-20`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-b sticky top-0 z-10`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Coursework Generated!</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {verificationResult?.wordCount.toLocaleString()} words generated
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg flex items-center gap-2 hover:opacity-90 shadow-lg"
            >
              <Download className="w-4 h-4" />
              Download .docx
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Verification Status */}
        {verificationResult && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            verificationResult.status === 'pass'
              ? darkMode ? 'bg-emerald-900/30 border border-emerald-800' : 'bg-emerald-50 border border-emerald-200'
              : darkMode ? 'bg-amber-900/30 border border-amber-800' : 'bg-amber-50 border border-amber-200'
          }`}>
            {verificationResult.status === 'pass' ? (
              <CheckCircle2 className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            ) : (
              <AlertCircle className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            )}
            <div>
              <p className={`font-medium ${
                verificationResult.status === 'pass'
                  ? darkMode ? 'text-emerald-300' : 'text-emerald-800'
                  : darkMode ? 'text-amber-300' : 'text-amber-800'
              }`}>
                {verificationResult.status === 'pass' 
                  ? 'Quality check passed!' 
                  : 'Review recommended'}
              </p>
              {verificationResult.issues.length > 0 && (
                <ul className={`text-sm mt-1 ${darkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
                  {verificationResult.issues.map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Content Display */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-lg`}>
          <div className={`prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}>
            <div className="whitespace-pre-wrap font-serif leading-relaxed">
              {generatedContent}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setPhase('form');
              setGeneratedContent('');
              setVerificationResult(null);
            }}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-50 text-gray-700 border'
            }`}
          >
            Generate Another
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
