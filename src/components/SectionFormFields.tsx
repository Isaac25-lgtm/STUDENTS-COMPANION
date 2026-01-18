import React, { useState } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SectionFormFieldsProps {
  sectionId: string;
  onGenerate: (formData: Record<string, string>) => void;
  isGenerating: boolean;
}

export default function SectionFormFields({ sectionId, onGenerate, isGenerating }: SectionFormFieldsProps) {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sectionForms: Record<string, { fields: Array<{ name: string; label: string; placeholder: string; type: 'text' | 'textarea'; required: boolean }> }> = {
    background: {
      fields: [
        { name: 'topic', label: 'Research Topic', placeholder: 'E.g., Factors affecting maternal healthcare access in rural Uganda', type: 'text', required: true },
        { name: 'population', label: 'Target Population', placeholder: 'E.g., Pregnant women in Gulu District', type: 'text', required: true },
        { name: 'location', label: 'Study Location', placeholder: 'E.g., Gulu District, Northern Uganda', type: 'text', required: true },
        { name: 'context', label: 'What do you already know about this topic?', placeholder: 'Share any background information, statistics, or prior knowledge...', type: 'textarea', required: true },
      ],
    },
    problem: {
      fields: [
        { name: 'issue', label: 'What is the main problem or gap?', placeholder: 'Describe the specific problem your research addresses...', type: 'textarea', required: true },
        { name: 'evidence', label: 'What evidence shows this is a problem?', placeholder: 'E.g., statistics, reports, observations...', type: 'textarea', required: true },
        { name: 'consequences', label: 'What happens if this problem is not solved?', placeholder: 'Describe the implications or consequences...', type: 'textarea', required: true },
      ],
    },
    objectives: {
      fields: [
        { name: 'general', label: 'General Objective (What is the main goal?)', placeholder: 'E.g., To assess factors affecting maternal healthcare access...', type: 'textarea', required: true },
        { name: 'specific1', label: 'Specific Objective 1', placeholder: 'E.g., To determine the distance from health facilities...', type: 'text', required: true },
        { name: 'specific2', label: 'Specific Objective 2', placeholder: 'E.g., To examine the role of cost in accessing healthcare...', type: 'text', required: true },
        { name: 'specific3', label: 'Specific Objective 3', placeholder: 'E.g., To identify cultural barriers to healthcare access...', type: 'text', required: false },
      ],
    },
    questions: {
      fields: [
        { name: 'question1', label: 'Research Question 1 (matching Objective 1)', placeholder: 'What is the distance from health facilities?', type: 'text', required: true },
        { name: 'question2', label: 'Research Question 2 (matching Objective 2)', placeholder: 'How does cost affect healthcare access?', type: 'text', required: true },
        { name: 'question3', label: 'Research Question 3 (matching Objective 3)', placeholder: 'What cultural barriers exist?', type: 'text', required: false },
      ],
    },
    significance: {
      fields: [
        { name: 'policymakers', label: 'How will this benefit policymakers/government?', placeholder: 'E.g., Inform policies on rural healthcare funding...', type: 'textarea', required: true },
        { name: 'practitioners', label: 'How will this benefit healthcare practitioners?', placeholder: 'E.g., Help design better outreach programs...', type: 'textarea', required: true },
        { name: 'community', label: 'How will this benefit the community/society?', placeholder: 'E.g., Improve maternal health outcomes...', type: 'textarea', required: true },
        { name: 'researchers', label: 'How will this benefit future researchers?', placeholder: 'E.g., Provide baseline data for future studies...', type: 'textarea', required: false },
      ],
    },
    scope: {
      fields: [
        { name: 'geographical', label: 'Geographical Scope', placeholder: 'E.g., Gulu District, Northern Uganda', type: 'text', required: true },
        { name: 'timeframe', label: 'Time Frame', placeholder: 'E.g., January 2024 - June 2024', type: 'text', required: true },
        { name: 'included', label: 'What will be included in the study?', placeholder: 'List what your study will cover...', type: 'textarea', required: true },
        { name: 'excluded', label: 'What will be excluded/limitations?', placeholder: 'E.g., Does not cover private healthcare facilities...', type: 'textarea', required: true },
      ],
    },
  };

  const currentForm = sectionForms[sectionId];

  if (!currentForm) {
    return null;
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentForm.fields.forEach(field => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = 'This field is required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onGenerate(formData);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'} border`}>
        <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
          📝 Please fill in the required fields below. The AI will use this information to generate high-quality content for this section.
        </p>
      </div>

      {currentForm.fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors[field.name]
                  ? 'border-red-500 focus:ring-red-500'
                  : darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 transition-colors`}
            />
          ) : (
            <input
              type="text"
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors[field.name]
                  ? 'border-red-500 focus:ring-red-500'
                  : darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 transition-colors`}
            />
          )}
          {errors[field.name] && (
            <div className="flex items-center gap-1 text-red-500 text-xs">
              <AlertCircle className="w-3 h-3" />
              {errors[field.name]}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={isGenerating}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate with AI
          </>
        )}
      </button>

      <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        All required fields (*) must be filled before generating
      </p>
    </div>
  );
}


