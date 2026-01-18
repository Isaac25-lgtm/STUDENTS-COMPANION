import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AccessBlockedProps {
  sectionName: string;
  message: string;
  requiredSections: string[];
}

export default function AccessBlocked({ sectionName, message, requiredSections }: AccessBlockedProps) {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-slate-50'} flex items-center justify-center p-4`}>
      <div className={`max-w-2xl w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8`}>
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50'} flex items-center justify-center`}>
            <Lock className={`w-10 h-10 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
          </div>
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold text-center mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {sectionName} Not Available Yet
        </h1>

        {/* Message */}
        <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'} border`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <p className={`text-sm ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>
              {message}
            </p>
          </div>
        </div>

        {/* Required Steps */}
        <div className="mb-8">
          <h2 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Required Research Flow:
          </h2>
          <div className="space-y-3">
            {requiredSections.map((section, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'
                }`}>
                  {idx + 1}
                </div>
                <span className={darkMode ? 'text-gray-200' : 'text-gray-700'}>
                  {section}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
          <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
            💡 <strong>Why this order?</strong> Research proposals follow a logical flow. Each section builds on the previous one, ensuring your research is well-structured and comprehensive.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/research')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Research Hub
          </button>
          
          <button
            onClick={() => navigate('/research/proposal')}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Start from Beginning
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}


