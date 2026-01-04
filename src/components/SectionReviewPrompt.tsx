import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Download, RefreshCw, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SectionReviewPromptProps {
  sectionName: string;
  nextSectionName: string;
  nextSectionPath: string;
  onClose: () => void;
  onExport: () => void;
  canProceed?: boolean;
}

export default function SectionReviewPrompt({
  sectionName,
  nextSectionName,
  nextSectionPath,
  onClose,
  onExport,
  canProceed = true,
}: SectionReviewPromptProps) {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`max-w-2xl w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{sectionName} Complete!</h2>
                <p className="text-green-100 text-sm">Great progress on your research</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              ✓ Your {sectionName} has been saved. You can download it now or proceed to the next section.
            </p>
          </div>

          <div>
            <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Before you continue, please:
            </h3>
            <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Review your {sectionName} content for completeness</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Download a copy for your records (optional)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>Make any final edits before proceeding</span>
              </li>
            </ul>
          </div>

          {!canProceed && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'} border ${darkMode ? 'border-amber-800' : 'border-amber-200'}`}>
              <p className={`text-sm ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                ⚠️ Please ensure all sections are completed before proceeding.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onExport}
              className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } transition-colors`}
            >
              <Download className="w-5 h-5" />
              Download {sectionName}
            </button>
            
            <button
              onClick={() => navigate(nextSectionPath)}
              disabled={!canProceed}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                canProceed
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } transition-all`}
            >
              Proceed to {nextSectionName}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Your progress is automatically saved
          </p>
        </div>
      </div>
    </div>
  );
}

