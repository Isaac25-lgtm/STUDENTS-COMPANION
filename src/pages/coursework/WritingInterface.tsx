import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, 
  Send, 
  Download, 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Edit3, 
  RefreshCw, 
  Copy, 
  Eye, 
  Save, 
  Sparkles,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getProject, saveProject } from '../../utils/courseworkStorage';
import { generateSectionContent, askSectionQuestion, generateQuickDraft, generateOutline } from '../../services/courseworkAI';
import type { CourseworkProject, CourseworkSection, ChatMessage, MasterPromptAnswers } from '../../types/coursework';

const DEFAULT_SECTIONS: CourseworkSection[] = [
  { id: 0, name: 'Introduction', content: '', words: 0, targetWords: 250, status: 'empty' },
  { id: 1, name: 'Literature Review', content: '', words: 0, targetWords: 600, status: 'empty' },
  { id: 2, name: 'Methodology', content: '', words: 0, targetWords: 400, status: 'empty' },
  { id: 3, name: 'Results/Analysis', content: '', words: 0, targetWords: 500, status: 'empty' },
  { id: 4, name: 'Discussion', content: '', words: 0, targetWords: 400, status: 'empty' },
  { id: 5, name: 'Conclusion', content: '', words: 0, targetWords: 250, status: 'empty' },
];

export default function WritingInterface() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { darkMode } = useTheme();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [project, setProject] = useState<CourseworkProject | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState<CourseworkSection[]>(DEFAULT_SECTIONS);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) {
        navigate('/coursework');
        return;
      }

      const existingProject = getProject(id);
      if (!existingProject) {
        navigate('/coursework');
        return;
      }

      setProject(existingProject);

      // Handle different approaches
      if (existingProject.selectedApproach === 'quick') {
        await handleQuickDraft(existingProject);
      } else if (existingProject.selectedApproach === 'outline') {
        await handleOutlineOnly(existingProject);
      } else {
        // Guided mode - load sections and start chat
        if (existingProject.sections.length > 0) {
          setSections(existingProject.sections);
        } else {
          // Calculate target words based on project word count
          const totalWords = existingProject.wordCount || 2500;
          const newSections = DEFAULT_SECTIONS.map((section, idx) => ({
            ...section,
            targetWords: Math.round(totalWords * getPercentage(idx))
          }));
          setSections(newSections);
        }

        // Start with first section question
        const question = await askSectionQuestion(
          DEFAULT_SECTIONS[0].name,
          0,
          existingProject.assignmentText
        );
        setMessages([{ role: 'assistant', content: question }]);
      }
    };

    loadProject();
  }, [id, navigate]);

  const getPercentage = (sectionIndex: number): number => {
    const percentages = [0.10, 0.25, 0.20, 0.18, 0.17, 0.10]; // Introduction, Lit Review, Methods, Results, Discussion, Conclusion
    return percentages[sectionIndex] || 0.15;
  };

  const handleQuickDraft = async (proj: CourseworkProject) => {
    if (!proj.masterAnswers) {
      navigate(`/coursework/analysis/${id}`);
      return;
    }

    setIsGenerating(true);
    setMessages([{ 
      role: 'assistant', 
      content: 'Generating your complete coursework... This may take a few minutes. Please wait.' 
    }]);

    try {
      const fullContent = await generateQuickDraft(proj.assignmentText, proj.masterAnswers);
      
      const updatedProject = {
        ...proj,
        fullContent,
        totalWords: fullContent.split(/\s+/).length,
        status: 'complete' as const
      };
      
      saveProject(updatedProject);
      setProject(updatedProject);
      navigate(`/coursework/review/${id}`);
    } catch (error) {
      console.error('Error generating quick draft:', error);
      setMessages([{ 
        role: 'assistant', 
        content: 'Sorry, there was an error generating your coursework. Please try again.' 
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOutlineOnly = async (proj: CourseworkProject) => {
    setIsGenerating(true);
    setMessages([{ 
      role: 'assistant', 
      content: 'Generating your outline... Please wait.' 
    }]);

    try {
      const outline = await generateOutline(proj.assignmentText, proj.masterAnswers || {});
      
      const updatedProject = {
        ...proj,
        outline,
        status: 'complete' as const
      };
      
      saveProject(updatedProject);
      setProject(updatedProject);
      
      // Show outline in chat
      setMessages([
        { role: 'assistant', content: 'Here\'s your outline:\n\n' + outline.join('\n\n') },
        { role: 'assistant', content: 'You can now download this outline or switch to Step-by-Step mode to fill in the content.' }
      ]);
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating outline:', error);
      setMessages([{ 
        role: 'assistant', 
        content: 'Sorry, there was an error generating your outline. Please try again.' 
      }]);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !project) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // Get previous sections content for context
      const previousSections = sections
        .filter(s => s.status === 'complete')
        .map(s => `## ${s.name}\n${s.content}`)
        .join('\n\n');

      // Generate section content
      const content = await generateSectionContent(
        sections[currentSection].name,
        currentSection,
        userMessage,
        previousSections,
        project.masterAnswers || {
          topic: project.assignmentText.substring(0, 100),
          courseUnit: 'Academic',
          level: 'MSc',
          institution: 'University',
          totalLength: `${project.wordCount} words`,
          assignmentType: 'essay',
          dataset: 'none',
          tools: [],
          citationStyle: 'APA 7'
        },
        project.assignmentText
      );

      // Update section
      const wordCount = content.split(/\s+/).length;
      const updatedSections = sections.map((s, idx) => 
        idx === currentSection 
          ? { ...s, content, words: wordCount, status: 'complete' as const }
          : s
      );
      setSections(updatedSections);

      // Save to project
      const totalWords = updatedSections.reduce((sum, s) => sum + s.words, 0);
      const updatedProject = {
        ...project,
        sections: updatedSections,
        totalWords,
        lastUpdated: Date.now()
      };
      saveProject(updatedProject);
      setProject(updatedProject);

      // Add AI response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Here's the ${sections[currentSection].name} section:\n\n"${content.substring(0, 500)}${content.length > 500 ? '...' : ''}"\n\nWould you like me to expand this, change something, or shall we move to the next section?`
      }]);

    } catch (error) {
      console.error('Error generating content:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble generating that content. Could you try again or rephrase your input?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const moveToNextSection = async () => {
    if (currentSection < sections.length - 1) {
      const nextSection = currentSection + 1;
      setCurrentSection(nextSection);
      
      // Update current section status
      const updatedSections = sections.map((s, idx) => 
        idx === currentSection && s.status !== 'complete'
          ? { ...s, status: 'complete' as const }
          : idx === nextSection
            ? { ...s, status: 'writing' as const }
            : s
      );
      setSections(updatedSections);

      // Ask question for next section
      if (project) {
        const question = await askSectionQuestion(
          sections[nextSection].name,
          nextSection,
          project.assignmentText
        );
        setMessages(prev => [...prev, { role: 'assistant', content: question }]);
      }
    } else {
      // All sections done - go to review
      if (project) {
        const updatedProject = {
          ...project,
          sections,
          status: 'complete' as const
        };
        saveProject(updatedProject);
      }
      navigate(`/coursework/review/${id}`);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'complete') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'writing') return <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />;
    return <Circle className={`w-5 h-5 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />;
  };

  const totalWords = sections.reduce((sum, s) => sum + s.words, 0);
  const targetWords = project?.wordCount || 2500;
  const progress = Math.round((totalWords / targetWords) * 100);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!project) {
    return (
      <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {project.selectedApproach === 'quick' ? 'Generating Your Coursework...' : 'Generating Your Outline...'}
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            This may take 2-3 minutes. Please don't close this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b px-6 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/coursework')}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {project.assignmentText.substring(0, 40)}...
            </h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {totalWords} / {targetWords} words ({progress}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const content = sections.map(s => `## ${s.name}\n\n${s.content}`).join('\n\n');
              copyToClipboard(content);
            }}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <Save className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate(`/coursework/review/${id}`)}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b px-6 py-2`}>
        <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Chat */}
        <div className={`w-1/2 flex flex-col border-r ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-indigo-500 text-white rounded-br-sm' 
                    : darkMode 
                      ? 'bg-gray-700 text-gray-100 rounded-bl-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Writing...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div className={`px-4 py-2 border-t ${darkMode ? 'border-gray-700' : ''}`}>
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={moveToNextSection}
                className={`px-3 py-1.5 text-xs rounded-lg ${darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
              >
                ✓ Next Section
              </button>
              <button 
                onClick={() => setInput('Make it more academic')}
                className={`px-3 py-1.5 text-xs rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                More academic
              </button>
              <button 
                onClick={() => setInput('Add more citations')}
                className={`px-3 py-1.5 text-xs rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Add citations
              </button>
            </div>
          </div>

          {/* Input */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : ''}`}>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your ideas or ask for help..."
                className={`flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100'}`}
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right - Sections */}
        <div className={`w-1/2 flex flex-col p-4 ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
          {/* Section List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(idx)}
                className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                  currentSection === idx
                    ? darkMode 
                      ? 'bg-gray-800 border-2 border-indigo-500 shadow-sm'
                      : 'bg-white border-2 border-indigo-500 shadow-sm'
                    : darkMode
                      ? 'bg-gray-800 border border-gray-700 hover:border-indigo-600'
                      : 'bg-white border border-gray-200 hover:border-indigo-300'
                }`}
              >
                {getStatusIcon(section.status)}
                <div className="flex-1">
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {section.name}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {section.words} / {section.targetWords} words
                  </p>
                </div>
                {currentSection === idx && (
                  <ChevronRight className="w-5 h-5 text-indigo-500" />
                )}
              </button>
            ))}
          </div>

          {/* Current Section Content */}
          {sections[currentSection]?.content && (
            <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {sections[currentSection].name}
                </p>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setInput(`Rewrite the ${sections[currentSection].name}`)}
                    className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => copyToClipboard(sections[currentSection].content)}
                    className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setInput(`Regenerate the ${sections[currentSection].name} with more detail`)}
                    className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className={`text-sm leading-relaxed line-clamp-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {sections[currentSection].content}
              </p>
            </div>
          )}

          {/* Export Button */}
          <button 
            onClick={() => navigate(`/coursework/review/${id}`)}
            className="mt-4 w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Review & Download
          </button>
        </div>
      </div>
    </div>
  );
}


