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
  MapPin,
  User,
  FileSearch,
  Loader2,
  RefreshCw,
  Eye,
  Edit3,
  ChevronRight,
  Hash,
  BookMarked
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  generateCoursework, 
  getEstimatedTime, 
  verifyOutput,
  refineCoursework,
  parseCoursework,
  type ParsedCoursework
} from '../../services/courseworkGenerator';
import { convertMarkdownToDocx } from '../../utils/markdownToDocx';
import { formatParsedCoursework, getBodyWordCount } from '../../utils/courseworkParser';
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

type Phase = 'form' | 'generating' | 'complete' | 'refining';

export default function CourseworkGenerator() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [phase, setPhase] = useState<Phase>('form');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [parsedContent, setParsedContent] = useState<ParsedCoursework | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ status: string; wordCount: number; issues: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');
  const [refinementRequest, setRefinementRequest] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

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
      
      // Parse the content into structured format
      const parsed = parseCoursework(content);
      setParsedContent(parsed);
      
      const verification = verifyOutput(content, effectiveWordCount);
      setVerificationResult(verification);
      
      setPhase('complete');
    } catch (error) {
      console.error('Generation error:', error);
      alert(`Failed to generate coursework: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPhase('form');
    }
  };

  const handleRefine = async () => {
    if (!refinementRequest.trim() || !generatedContent) return;
    
    setPhase('refining');
    setGenerationProgress(0);

    try {
      const { raw, parsed } = await refineCoursework(generatedContent, refinementRequest, (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      });

      setGeneratedContent(raw);
      setParsedContent(parsed);
      
      const verification = verifyOutput(raw, effectiveWordCount);
      setVerificationResult(verification);
      
      setRefinementRequest('');
      setPhase('complete');
    } catch (error) {
      console.error('Refinement error:', error);
      alert(`Failed to refine coursework: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPhase('complete');
    }
  };

  const handleExport = async () => {
    const title = parsedContent?.titlePage.mainTitle || formData.assignmentQuestion.substring(0, 50);
    const exportContent = parsedContent ? formatParsedCoursework(parsedContent) : generatedContent;
    await convertMarkdownToDocx(exportContent, title, formData.studentName || 'Student');
  };

  const handleCopy = () => {
    const copyContent = parsedContent ? formatParsedCoursework(parsedContent) : generatedContent;
    navigator.clipboard.writeText(copyContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStructuredWordCount = () => {
    if (parsedContent) {
      return getBodyWordCount(parsedContent);
    }
    return generatedContent.split(/\s+/).length;
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

          {/* Student Details - Cover Page (Required) */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm`}>
            <h2 className={`font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <User className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              Cover Page Details
            </h2>
            <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              These details will appear on your coursework title page
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="text-red-500">*</span> Your name
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                  placeholder="e.g., John Doe"
                  className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="text-red-500">*</span> University
                </label>
                <select
                  value={formData.universityName}
                  onChange={(e) => setFormData(prev => ({ ...prev, universityName: e.target.value }))}
                  className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                  required
                >
                  <option value="">Select university...</option>
                  {UNIVERSITY_OPTIONS.map(uni => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="text-red-500">*</span> Course code and name
                </label>
                <input
                  type="text"
                  value={formData.courseCodeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, courseCodeName: e.target.value }))}
                  placeholder="e.g., FIN7201 - Development Finance"
                  className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="text-red-500">*</span> Submission date
                </label>
                <input
                  type="date"
                  value={formData.submissionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, submissionDate: e.target.value }))}
                  className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                  required
                />
              </div>
            </div>

            <p className={`text-xs mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              💡 Lecturer/Supervisor name can be added after printing if needed
            </p>
          </div>

          {/* Optional Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className={`w-full flex items-center justify-between px-6 py-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border rounded-2xl shadow-sm`}
          >
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Additional Settings (Theories, Sources, Lecturer & More)
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

              {/* Lecturer (Optional) */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-2xl p-6 border shadow-sm`}>
                <h2 className={`font-semibold mb-2 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <User className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  Lecturer/Supervisor (Optional)
                </h2>
                <p className={`text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Leave blank if you prefer to add after printing
                </p>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Lecturer/Supervisor name
                  </label>
                  <input
                    type="text"
                    value={formData.lecturerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lecturerName: e.target.value }))}
                    placeholder="e.g., Dr. Jane Smith (or leave blank)"
                    className={`w-full px-4 py-2.5 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500`}
                  />
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
  if (phase === 'generating' || phase === 'refining') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-violet-50 to-purple-100'}`}>
        <div className={`max-w-lg w-full mx-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-10 shadow-2xl`}>
          <div className="text-center space-y-6">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-xl ${
              phase === 'refining' 
                ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                : 'bg-gradient-to-br from-violet-500 to-purple-600'
            }`}>
              {phase === 'refining' ? (
                <RefreshCw className="w-12 h-12 text-white animate-spin" />
              ) : (
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              )}
            </div>
            
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {phase === 'refining' ? 'Refining Your Coursework' : 'Generating Your Coursework'}
              </h2>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {generationStatus || (phase === 'refining' ? 'Applying your requested changes...' : 'Preparing your distinction-grade content...')}
              </p>
            </div>

            <div className="space-y-2">
              <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className={`h-full transition-all duration-500 ease-out ${
                    phase === 'refining' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600' 
                      : 'bg-gradient-to-r from-violet-500 to-purple-600'
                  }`}
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {generationProgress}% Complete
              </p>
            </div>

            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {phase === 'refining' ? 'This may take a minute...' : `This may take ${estimatedTime}. Please do not close this page.`}
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {parsedContent?.titlePage.mainTitle || 'Coursework Generated!'}
              </h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {getStructuredWordCount().toLocaleString()} words • {parsedContent?.sections.length || 0} sections • {parsedContent?.references.length || 0} references
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className={`flex rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <button
                onClick={() => setViewMode('structured')}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'structured'
                    ? 'bg-violet-500 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                Structured
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'raw'
                    ? 'bg-violet-500 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Raw
              </button>
            </div>
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

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            {/* Verification Status */}
            {verificationResult && (
              <div className={`p-4 rounded-xl flex items-start gap-3 ${
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
            {viewMode === 'structured' && parsedContent ? (
              <div className="space-y-4">
                {/* Title Page */}
                {parsedContent.titlePage.mainTitle && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="text-center space-y-2">
                      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {parsedContent.titlePage.mainTitle}
                      </h2>
                      {parsedContent.titlePage.subtitle && (
                        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {parsedContent.titlePage.subtitle}
                        </p>
                      )}
                      <div className={`pt-4 space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {parsedContent.titlePage.studentName && <p>{parsedContent.titlePage.studentName}</p>}
                        {parsedContent.titlePage.university && <p>{parsedContent.titlePage.university}</p>}
                        {parsedContent.titlePage.course && <p>{parsedContent.titlePage.course}</p>}
                        {parsedContent.titlePage.lecturer && <p>Supervisor: {parsedContent.titlePage.lecturer}</p>}
                        {parsedContent.titlePage.date && <p>{parsedContent.titlePage.date}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Abstract */}
                {parsedContent.abstract.content && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Abstract</h3>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {parsedContent.abstract.content}
                    </p>
                    {parsedContent.abstract.keywords && (
                      <p className={`text-sm mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        <span className="font-medium">Keywords: </span>{parsedContent.abstract.keywords}
                      </p>
                    )}
                  </div>
                )}

                {/* Sections */}
                {parsedContent.sections.map((section, idx) => (
                  <div 
                    key={idx} 
                    className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border transition-all ${
                      selectedSection === section.number 
                        ? darkMode ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-violet-400 ring-2 ring-violet-200'
                        : darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedSection(selectedSection === section.number ? null : section.number)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {section.number}. {section.title}
                      </h3>
                      <ChevronRight className={`w-5 h-5 transition-transform ${darkMode ? 'text-gray-500' : 'text-gray-400'} ${selectedSection === section.number ? 'rotate-90' : ''}`} />
                    </div>
                    
                    {section.subsections.length > 0 ? (
                      <div className="space-y-4">
                        {section.subsections.map((sub, subIdx) => (
                          <div key={subIdx} className={`pl-4 border-l-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {sub.number} {sub.title}
                            </h4>
                            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {sub.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {section.content}
                      </p>
                    )}
                  </div>
                ))}

                {/* References */}
                {parsedContent.references.length > 0 && (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <BookMarked className={`w-5 h-5 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        References ({parsedContent.references.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {parsedContent.references.map((ref, idx) => (
                        <p key={idx} className={`text-sm pl-4 -indent-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {ref}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Raw Content View */
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-lg`}>
                <div className={`prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                  <div className="whitespace-pre-wrap font-serif leading-relaxed text-sm">
                    {generatedContent}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-4">
            {/* Stats Card */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-5 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Hash className={`w-5 h-5 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
                Document Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-violet-50'}`}>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-violet-700'}`}>
                    {getStructuredWordCount().toLocaleString()}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-violet-600'}`}>Words</p>
                </div>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-emerald-50'}`}>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-emerald-700'}`}>
                    {parsedContent?.sections.length || 0}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-emerald-600'}`}>Sections</p>
                </div>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-blue-700'}`}>
                    {parsedContent?.references.length || 0}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-blue-600'}`}>References</p>
                </div>
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-amber-50'}`}>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-amber-700'}`}>
                    {parsedContent?.parseSuccess ? '✓' : '~'}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-amber-600'}`}>Structured</p>
                </div>
              </div>
            </div>

            {/* Refinement Panel */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-5 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Edit3 className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                Refine Content
              </h3>
              <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Request specific changes or improvements
              </p>
              <textarea
                value={refinementRequest}
                onChange={(e) => setRefinementRequest(e.target.value)}
                placeholder="e.g., Add more citations to the theoretical framework section, or expand the discussion on policy implications..."
                className={`w-full h-24 px-3 py-2 text-sm rounded-xl resize-none ${
                  darkMode 
                    ? 'bg-gray-700 text-white placeholder-gray-500 border-gray-600' 
                    : 'bg-gray-50 text-gray-900 placeholder-gray-400 border-gray-200'
                } border focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
              <button
                onClick={handleRefine}
                disabled={!refinementRequest.trim()}
                className={`w-full mt-3 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  refinementRequest.trim()
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90 shadow-lg'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Apply Changes
              </button>
            </div>

            {/* Quick Refinements */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-5 shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Quick Refinements
              </h3>
              <div className="space-y-2">
                {[
                  'Add more citations throughout',
                  'Strengthen the conclusion',
                  'Expand the theoretical framework',
                  'Add more critical analysis',
                  'Include more regional examples',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setRefinementRequest(suggestion)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setPhase('form');
                  setGeneratedContent('');
                  setParsedContent(null);
                  setVerificationResult(null);
                }}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700' : 'bg-white hover:bg-gray-50 text-gray-700 border'
                }`}
              >
                Generate Another
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
