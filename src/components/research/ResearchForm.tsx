import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  BookOpen, 
  FileText, 
  Building2, 
  Settings2,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ResearchFormData } from '../../types/research';
import {
  RESEARCH_DESIGNS,
  WORD_COUNT_OPTIONS,
  TIMELINE_OPTIONS,
  BUDGET_OPTIONS,
  CURRENCY_OPTIONS,
  THEORY_OPTIONS,
  DEFAULT_FORM_DATA
} from '../../types/research';

interface ResearchFormProps {
  onSubmit: (data: ResearchFormData) => void;
  isLoading: boolean;
}

const STEPS = [
  { id: 1, name: 'Basic Info', icon: User },
  { id: 2, name: 'Research', icon: BookOpen },
  { id: 3, name: 'Specifications', icon: FileText },
  { id: 4, name: 'University', icon: Building2 },
  { id: 5, name: 'Preferences', icon: Settings2 },
];

export default function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const { darkMode, theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ResearchFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof ResearchFormData, string>>>({});

  const updateField = <K extends keyof ResearchFormData>(field: K, value: ResearchFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleTheory = (theory: string) => {
    setFormData(prev => ({
      ...prev,
      preferredTheories: prev.preferredTheories.includes(theory)
        ? prev.preferredTheories.filter(t => t !== theory)
        : [...prev.preferredTheories, theory]
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof ResearchFormData, string>> = {};

    if (step === 1) {
      if (!formData.studentName.trim()) newErrors.studentName = 'Required';
      if (!formData.regNo.trim()) newErrors.regNo = 'Required';
      if (!formData.program.trim()) newErrors.program = 'Required';
      if (!formData.department.trim()) newErrors.department = 'Required';
      if (!formData.university.trim()) newErrors.university = 'Required';
      if (!formData.supervisor.trim()) newErrors.supervisor = 'Required';
      if (!formData.monthYear.trim()) newErrors.monthYear = 'Required';
    }

    if (step === 2) {
      if (!formData.topic.trim()) newErrors.topic = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit(formData);
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
    darkMode
      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
  }`;

  const labelClass = `block text-sm font-medium mb-2 ${theme.text}`;

  const errorClass = 'text-red-500 text-xs mt-1 flex items-center gap-1';

  return (
    <div className={`rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
      {/* Progress Steps */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  currentStep === step.id
                    ? 'bg-amber-500 text-white'
                    : currentStep > step.id
                    ? `${darkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`
                    : `${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline text-sm font-medium">{step.name}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  currentStep > step.id
                    ? 'bg-emerald-500'
                    : darkMode ? 'bg-slate-700' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => updateField('studentName', e.target.value)}
                  className={inputClass}
                  placeholder="Your full name"
                />
                {errors.studentName && <p className={errorClass}><AlertCircle className="w-3 h-3" />{errors.studentName}</p>}
              </div>

              <div>
                <label className={labelClass}>Registration Number *</label>
                <input
                  type="text"
                  value={formData.regNo}
                  onChange={(e) => updateField('regNo', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., 2024/HD02/1234U"
                />
                {errors.regNo && <p className={errorClass}><AlertCircle className="w-3 h-3" />{errors.regNo}</p>}
              </div>

              <div>
                <label className={labelClass}>Program of Study *</label>
                <input
                  type="text"
                  value={formData.program}
                  onChange={(e) => updateField('program', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., Master of Business Administration"
                />
                {errors.program && <p className={errorClass}><AlertCircle className="w-3 h-3" />{errors.program}</p>}
              </div>

              <div>
                <label className={labelClass}>Department/School/Faculty *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., School of Business"
                />
                {errors.department && <p className={errorClass}><AlertCircle className="w-3 h-3" />{errors.department}</p>}
              </div>

              <div>
                <label className={labelClass}>University *</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => updateField('university', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., Makerere University"
                />
                {errors.university && <p className={errorClass}><AlertCircle className="w-3 h-3" />{errors.university}</p>}
              </div>

              <div>
                <label className={labelClass}>Supervisor (Name & Title) *</label>
                <input
                  type="text"
                  value={formData.supervisor}
                  onChange={(e) => updateField('supervisor', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., Dr. Jane Nakato"
                />
                {errors.supervisor && <p className={errorClass}><AlertCircle className="w-3 h-3" />{errors.supervisor}</p>}
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Submission Month & Year *</label>
                <input
                  type="text"
                  value={formData.monthYear}
                  onChange={(e) => updateField('monthYear', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., January 2025"
                />
                {errors.monthYear && <p className={errorClass}><AlertCircle className="w-3 h-3" />{errors.monthYear}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Research Topic & Design */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>Research Topic & Design</h3>

            <div>
              <label className={labelClass}>Research Topic/Title *</label>
              <textarea
                value={formData.topic}
                onChange={(e) => updateField('topic', e.target.value)}
                className={`${inputClass} min-h-[120px] resize-none`}
                placeholder="Enter your full research topic or title..."
              />
              {errors.topic && <p className={errorClass}><AlertCircle className="w-3 h-3" />{errors.topic}</p>}
            </div>

            <div>
              <label className={labelClass}>Research Design *</label>
              <div className="space-y-2">
                {RESEARCH_DESIGNS.map((design) => (
                  <label
                    key={design.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.design === design.value
                        ? 'border-amber-500 bg-amber-500/10'
                        : darkMode
                        ? 'border-slate-700 hover:border-slate-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="design"
                      value={design.value}
                      checked={formData.design === design.value}
                      onChange={(e) => updateField('design', e.target.value as 'quantitative' | 'mixed')}
                      className="w-4 h-4 text-amber-500"
                    />
                    <span className={theme.text}>{design.label}</span>
                  </label>
                ))}
              </div>
              <p className={`text-xs ${theme.textFaint} mt-2`}>
                Note: This generator is optimized for quantitative and mixed-methods designs.
              </p>
            </div>

            <div>
              <label className={labelClass}>Study Area/Location (Optional)</label>
              <input
                type="text"
                value={formData.studyArea}
                onChange={(e) => updateField('studyArea', e.target.value)}
                className={inputClass}
                placeholder="e.g., Kampala, Wakiso, Mukono (leave blank for AI suggestion)"
              />
            </div>
          </div>
        )}

        {/* Step 3: Document Specifications */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>Document Specifications</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Target Word Count</label>
                <select
                  value={formData.wordCount}
                  onChange={(e) => updateField('wordCount', Number(e.target.value))}
                  className={inputClass}
                >
                  {WORD_COUNT_OPTIONS.map((count) => (
                    <option key={count} value={count}>{count.toLocaleString()} words</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Project Timeline (Weeks)</label>
                <select
                  value={formData.timelineWeeks}
                  onChange={(e) => updateField('timelineWeeks', Number(e.target.value))}
                  className={inputClass}
                >
                  {TIMELINE_OPTIONS.map((weeks) => (
                    <option key={weeks} value={weeks}>{weeks} weeks</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Include Budget Section?</label>
              <div className="space-y-2">
                {BUDGET_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.includeBudget === option.value
                        ? 'border-amber-500 bg-amber-500/10'
                        : darkMode
                        ? 'border-slate-700 hover:border-slate-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="budget"
                      value={option.value}
                      checked={formData.includeBudget === option.value}
                      onChange={(e) => updateField('includeBudget', e.target.value as 'YES' | 'SUMMARY_ONLY' | 'NO')}
                      className="w-4 h-4 text-amber-500"
                    />
                    <span className={theme.text}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.includeBudget !== 'NO' && (
              <div>
                <label className={labelClass}>Budget Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => updateField('currency', e.target.value as typeof formData.currency)}
                  className={inputClass}
                >
                  {CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 4: University Format */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>University-Specific Requirements</h3>

            <div>
              <label className={labelClass}>Does your university have specific proposal format requirements?</label>
              <div className="flex gap-4 mt-2">
                <label
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl border cursor-pointer transition-all ${
                    formData.hasUniversityFormat
                      ? 'border-amber-500 bg-amber-500/10'
                      : darkMode
                      ? 'border-slate-700 hover:border-slate-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="hasFormat"
                    checked={formData.hasUniversityFormat}
                    onChange={() => updateField('hasUniversityFormat', true)}
                    className="w-4 h-4 text-amber-500"
                  />
                  <span className={theme.text}>Yes</span>
                </label>
                <label
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl border cursor-pointer transition-all ${
                    !formData.hasUniversityFormat
                      ? 'border-amber-500 bg-amber-500/10'
                      : darkMode
                      ? 'border-slate-700 hover:border-slate-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="hasFormat"
                    checked={!formData.hasUniversityFormat}
                    onChange={() => updateField('hasUniversityFormat', false)}
                    className="w-4 h-4 text-amber-500"
                  />
                  <span className={theme.text}>No, use standard format</span>
                </label>
              </div>
            </div>

            {formData.hasUniversityFormat && (
              <div>
                <label className={labelClass}>Paste your university's format requirements</label>
                <textarea
                  value={formData.universityFormatInstructions}
                  onChange={(e) => updateField('universityFormatInstructions', e.target.value)}
                  className={`${inputClass} min-h-[200px] resize-none`}
                  placeholder="Paste your university's proposal guidelines here. Include:
- Required chapter headings
- Specific sections your university requires
- Word limits per section (if any)
- Citation style (if different from APA 7)
- Any unique requirements
- Formatting rules (font, spacing, margins)"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 5: Additional Preferences */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>Additional Preferences (Optional)</h3>

            <div>
              <label className={labelClass}>Preferred Theoretical Frameworks</label>
              <p className={`text-xs ${theme.textFaint} mb-3`}>Select any theories you'd like the AI to incorporate</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {THEORY_OPTIONS.map((theory) => (
                  <label
                    key={theory}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.preferredTheories.includes(theory)
                        ? 'border-amber-500 bg-amber-500/10'
                        : darkMode
                        ? 'border-slate-700 hover:border-slate-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.preferredTheories.includes(theory)}
                      onChange={() => toggleTheory(theory)}
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                    <span className={`text-sm ${theme.text}`}>{theory}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Any additional instructions for the AI?</label>
              <textarea
                value={formData.additionalInstructions}
                onChange={(e) => updateField('additionalInstructions', e.target.value)}
                className={`${inputClass} min-h-[120px] resize-none`}
                placeholder="Any special requests or things you want the AI to include..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className={`p-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex justify-between`}>
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            currentStep === 1
              ? 'opacity-50 cursor-not-allowed'
              : darkMode
              ? 'bg-slate-700 hover:bg-slate-600 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep < 5 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-amber-500 hover:bg-amber-600 text-white transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate Proposal
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

