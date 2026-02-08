
import React, { useState, useRef, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Check, Send, ShieldCheck, Sparkles, ArrowRight, MousePointer2, Download, RefreshCcw, Landmark, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { ENTRY_IDS, GOOGLE_FORM_ACTION_URL, LIKERT_QUESTIONS } from './constants';

type QuestionType = 'welcome' | 'choice' | 'likert' | 'multi' | 'text' | 'submit' | 'success';

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  options?: string[];
  allowOther?: boolean;
  entryIndex: number; // Strictly maps to Entry ID 1-46
}

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({
    consent: false,
    responses: {} as Record<number, any>
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  // Flattened question structure to match entry IDs 1 to 46
  const surveyQuestions = useMemo((): Question[] => [
    { id: 'welcome', type: 'welcome', title: 'Rediscovering Authentic Potential', entryIndex: 0 },
    // Demographics (1-5)
    { id: 'q1', entryIndex: 1, type: 'choice', title: 'What is your age range?', options: ['18-20', '21-23', '24-26', '27-30', 'Above 30'] },
    { id: 'q2', entryIndex: 2, type: 'choice', title: 'Gender Identification', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
    { id: 'q3', entryIndex: 3, type: 'choice', title: 'Current Academic Level', options: ['Undergraduate', 'Postgraduate (Master\'s)', 'Doctoral'], allowOther: true },
    { id: 'q4', entryIndex: 4, type: 'choice', title: 'Field of Study', options: ['Management', 'Engineering', 'Sciences', 'Arts & Humanities'], allowOther: true },
    { id: 'q5', entryIndex: 5, type: 'choice', title: 'Years of Social Media Use', options: ['Less than 2 years', '2-5 years', '5-10 years', 'More than 10 years'] },
    // Likert Questions (6-35)
    ...LIKERT_QUESTIONS.map((q, i) => ({
      id: `likert-${i}`,
      entryIndex: i + 6,
      type: 'likert' as QuestionType,
      title: q,
      subtitle: `Select 1 (Strongly Disagree) to 5 (Strongly Agree)`
    })),
    // Digital Detox (36-40)
    { id: 'q31', entryIndex: 36, type: 'choice', title: 'How often do you intentionally take breaks from social media?', options: ['Daily', 'Several times a week', 'Weekly', 'Rarely', 'Never'] },
    { id: 'q32', entryIndex: 37, type: 'choice', title: 'Do you have device-free times or zones in your daily routine?', options: ['Yes, regularly', 'Occasionally', 'Rarely', 'Never'] },
    { id: 'q33', entryIndex: 38, type: 'choice', title: 'Noticed improvements after reducing social media use?', options: ['Significant improvement', 'Some improvement', 'No change', 'Worsened'] },
    { id: 'q34', entryIndex: 39, type: 'multi', title: 'What activities help you reconnect with your authentic self?', options: ['Meditation/Mindfulness', 'Exercise/Outdoor activities', 'Creative hobbies', 'Reading', 'Journaling', 'Social connections (offline)'], allowOther: true },
    { id: 'q35', entryIndex: 40, type: 'likert', title: 'How would you rate your current digital wellness?', subtitle: '1 (Poor) to 5 (Excellent)', options: ['1', '2', '3', '4', '5'] },
    // Reflections (41-45)
    { id: 'q36', entryIndex: 41, type: 'text', title: 'Relationship between your authentic self and social media presence?' },
    { id: 'q37', entryIndex: 42, type: 'text', title: 'Effective strategies for maintaining self-authentication?' },
    { id: 'q38', entryIndex: 43, type: 'text', title: 'How does self-authentication impact your academic/personal motivation?' },
    { id: 'q39', entryIndex: 44, type: 'text', title: 'Challenges in maintaining your authentic self while online?' },
    { id: 'q40', entryIndex: 45, type: 'text', title: 'Recommendations for others struggling with digital authenticity?' },
    { id: 'submit', type: 'submit', title: 'Finalize Your Submission', entryIndex: 46 }
  ], []);

  const totalSteps = surveyQuestions.length;
  const currentQuestion = surveyQuestions[currentIndex];
  const progress = (currentIndex / (totalSteps - 1)) * 100;

  const handleNext = () => {
    if (currentIndex < totalSteps - 1) {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const updateResponse = (val: any) => {
    const entryIdx = currentQuestion.entryIndex;
    setFormData(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [entryIdx]: val
      }
    }));

    // Auto-advance for choice/likert types if no other option is needed
    const isAutoType = (currentQuestion.type === 'choice' && !currentQuestion.allowOther) || currentQuestion.type === 'likert';
    if (isAutoType) {
      setTimeout(handleNext, 400);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    
    // Fill the hidden form
    if (formRef.current) {
      try {
        formRef.current.submit();
        setTimeout(() => {
          setIsSubmitting(false);
          setIsSubmitted(true);
        }, 2500);
      } catch (err) {
        setIsSubmitting(false);
        alert("Submission failed. Please download the results as a CSV for manual recording.");
      }
    }
  };

  const downloadResultsCSV = () => {
    const headers = ["Question Index", "Question Title", "Answer"];
    const rows = surveyQuestions
      .filter(q => q.entryIndex > 0 && q.entryIndex < 46)
      .map(q => [
        q.entryIndex,
        `"${q.title.replace(/"/g, '""')}"`,
        `"${String(formData.responses[q.entryIndex] || '').replace(/"/g, '""')}"`
      ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "SATM_Survey_Results.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderWelcome = () => (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center space-y-6">
        <div className="inline-block p-4 rounded-3xl bg-blue-500/10 text-blue-400 mb-2 floating">
            <Landmark size={48} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
          SATM <span className="text-blue-500">Research</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          Investigating Digital Wellness and the "Self-Authentication Theory of Motivation".
        </p>
      </div>

      <div className="space-y-6 pt-6 max-w-lg mx-auto">
        <label className="flex items-center gap-4 cursor-pointer group p-6 rounded-2xl bg-slate-800/20 hover:bg-slate-800/40 border border-slate-800 transition-all">
            <input 
                type="checkbox" 
                className="w-6 h-6 rounded-lg bg-slate-900 border-slate-700"
                checked={formData.consent}
                onChange={(e) => setFormData(prev => ({ ...prev, consent: e.target.checked }))}
            />
            <span className="text-slate-300 font-medium group-hover:text-white">I consent to participate in this academic study</span>
        </label>

        <button 
          disabled={!formData.consent}
          onClick={handleNext}
          className={`w-full py-6 rounded-3xl flex items-center justify-center gap-3 text-2xl font-black transition-all transform active:scale-95 ${
            formData.consent 
            ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-1' 
            : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
          }`}
        >
          Begin Exploration <ArrowRight size={28} />
        </button>
      </div>
    </div>
  );

  const renderChoice = () => {
    const currentVal = formData.responses[currentQuestion.entryIndex];
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="space-y-4">
            <span className="text-blue-500 font-black tracking-widest text-sm uppercase">Demographics • Entry {currentQuestion.entryIndex}</span>
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">{currentQuestion.title}</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options?.map(opt => (
                <button
                    key={opt}
                    onClick={() => updateResponse(opt)}
                    className={`option-button group p-6 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                        currentVal === opt 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-white'
                    }`}
                >
                    <span className="text-xl font-bold">{opt}</span>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        currentVal === opt ? 'border-blue-400 bg-blue-400 text-slate-950' : 'border-slate-700'
                    }`}>
                        {currentVal === opt && <Check size={18} strokeWidth={4} />}
                    </div>
                </button>
            ))}

            {currentQuestion.allowOther && (
                <div className={`flex flex-col gap-4 p-6 rounded-2xl border-2 transition-all ${
                    currentVal && !currentQuestion.options?.includes(currentVal) ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/40'
                }`}>
                    <input 
                        type="text"
                        placeholder="Please specify other..."
                        className="bg-slate-950 p-5 rounded-xl outline-none border border-slate-800 text-white focus:border-blue-500 transition-all font-bold"
                        onChange={(e) => updateResponse(e.target.value)}
                        value={!currentQuestion.options?.includes(currentVal) ? currentVal : ''}
                    />
                </div>
            )}
        </div>

        <div className="flex justify-between pt-6">
            <button onClick={handleBack} className="p-4 px-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-2">
                <ChevronLeft size={20} /> Back
            </button>
            {currentQuestion.allowOther && (
                <button onClick={handleNext} disabled={!currentVal} className="px-12 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2">
                    Next <ChevronRight size={20} />
                </button>
            )}
        </div>
      </div>
    );
  };

  const renderLikert = () => {
    const currentVal = formData.responses[currentQuestion.entryIndex];
    const options = ['1', '2', '3', '4', '5'];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500 text-center">
            <div className="space-y-6">
                <span className="text-blue-500 font-black tracking-widest text-sm uppercase">Intensity Scale • {currentQuestion.entryIndex}</span>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-3xl mx-auto">{currentQuestion.title}</h2>
            </div>

            <div className="relative pt-8">
                <div className="flex justify-between text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-widest mb-8 px-4">
                    <span className="text-red-400/60">Strongly Disagree</span>
                    <span>Neutral</span>
                    <span className="text-emerald-400/60">Strongly Agree</span>
                </div>
                <div className="flex gap-2 md:gap-5 items-center justify-between">
                    {options.map((val) => (
                        <button
                            key={val}
                            onClick={() => updateResponse(val)}
                            className={`option-button flex-1 h-24 md:h-32 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                currentVal === val 
                                ? 'border-blue-500 bg-blue-500 text-slate-950 scale-110 shadow-3xl shadow-blue-500/40 z-10' 
                                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-white'
                            }`}
                        >
                            <span className="text-3xl md:text-5xl font-black">{val}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center pt-10">
                <button onClick={handleBack} className="p-4 px-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-2">
                    <ChevronLeft size={20} /> Back
                </button>
                <div className="flex items-center gap-3 text-slate-600 font-bold bg-slate-900/40 p-3 px-5 rounded-full border border-slate-800/50">
                    <MousePointer2 size={16} className="text-blue-500 animate-pulse" /> 
                    <span className="text-xs uppercase tracking-widest">Auto-Advances</span>
                </div>
            </div>
        </div>
    );
  };

  const renderMulti = () => {
    const selected: string[] = Array.isArray(formData.responses[currentQuestion.entryIndex]) ? formData.responses[currentQuestion.entryIndex] : [];
    const toggle = (opt: string) => {
        let newList;
        if (selected.includes(opt)) {
            newList = selected.filter(i => i !== opt);
        } else {
            newList = [...selected, opt];
        }
        updateResponse(newList);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-4">
                <span className="text-emerald-500 font-black tracking-widest text-sm uppercase">Multiple Choice</span>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">{currentQuestion.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options?.map(opt => (
                    <button
                        key={opt}
                        onClick={() => toggle(opt)}
                        className={`option-button group p-6 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                            selected.includes(opt) 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-white'
                        }`}
                    >
                        <span className="text-lg md:text-xl font-bold">{opt}</span>
                        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                            selected.includes(opt) ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-slate-700'
                        }`}>
                            {selected.includes(opt) && <Check size={20} strokeWidth={4} />}
                        </div>
                    </button>
                ))}
            </div>

            <div className="flex justify-between pt-8">
                <button onClick={handleBack} className="p-4 px-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-2">
                    <ChevronLeft size={20} /> Back
                </button>
                <button onClick={handleNext} className="px-12 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-500 shadow-3xl shadow-blue-500/20 flex items-center gap-2">
                    Continue <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
  };

  const renderText = () => {
    const val = formData.responses[currentQuestion.entryIndex] || '';
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="space-y-4 text-center">
              <span className="text-blue-400 font-black tracking-widest text-sm uppercase">Open Reflection</span>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-2xl mx-auto">{currentQuestion.title}</h2>
          </div>

          <textarea
              autoFocus
              className="w-full h-56 md:h-72 p-8 rounded-[2.5rem] bg-slate-950/80 border-2 border-slate-800 text-white text-xl outline-none focus:border-blue-500 transition-all font-medium placeholder:text-slate-700"
              placeholder="Type your response here..."
              value={val}
              onChange={(e) => updateResponse(e.target.value)}
          />

          <div className="flex justify-between pt-4">
              <button onClick={handleBack} className="p-4 px-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-2">
                  <ChevronLeft size={20} /> Back
              </button>
              <button onClick={handleNext} disabled={!val} className="px-14 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-500 shadow-3xl shadow-blue-500/20 flex items-center gap-2 disabled:opacity-30">
                  Continue <ChevronRight size={20} />
              </button>
          </div>
      </div>
    );
  }

  const renderSubmit = () => (
    <div className="text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="w-28 h-28 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto floating shadow-2xl shadow-blue-500/10">
            <Send size={56} />
        </div>
        <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-white">Capture Insights</h2>
            <p className="text-slate-400 text-xl font-medium max-w-lg mx-auto leading-relaxed">
                Sync your data to the Google cloud or download a local Excel-ready backup.
            </p>
        </div>

        <div className="flex flex-col gap-4 max-w-md mx-auto pt-8">
            <button 
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="w-full py-6 rounded-3xl bg-blue-600 text-white text-2xl font-black hover:bg-blue-500 shadow-3xl shadow-blue-600/40 flex items-center justify-center gap-4 transition-all transform active:scale-95 disabled:opacity-50"
            >
                {isSubmitting ? <RefreshCcw className="animate-spin" /> : <><Send size={24} /> Register & Sync</>}
            </button>
            <div className="flex flex-col gap-2">
                <button 
                    onClick={downloadResultsCSV}
                    className="w-full py-4 rounded-2xl border-2 border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2"
                >
                    <FileSpreadsheet size={20} /> Download Excel (.csv)
                </button>
                <button onClick={handleBack} className="w-full py-4 rounded-2xl bg-slate-900/50 text-slate-500 font-bold hover:text-white border border-slate-800">
                    Review Answers
                </button>
            </div>
        </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-1000 text-center">
        <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-20 animate-pulse"></div>
            <div className="w-48 h-48 bg-blue-600 text-white rounded-full flex items-center justify-center relative shadow-3xl shadow-blue-500/40 border-8 border-slate-950">
                <Check size={96} strokeWidth={4} />
            </div>
        </div>
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-5xl md:text-8xl font-black text-white leading-tight">Sync Complete</h2>
            <p className="text-slate-400 text-2xl font-medium leading-relaxed">
                Thank you. Your contribution has been registered to the research database.
            </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
            <button 
                onClick={downloadResultsCSV}
                className="px-10 py-5 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-500 shadow-2xl shadow-emerald-600/20 flex items-center gap-2"
            >
                <FileSpreadsheet size={24} /> Download Excel Backup
            </button>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSe5QizV-hupWjb6GnBOxOZaMMs9z7b3n-N327oeTp9YblPqOQ/viewform" 
              target="_blank" 
              className="px-10 py-5 rounded-2xl bg-slate-800 text-white font-black hover:bg-slate-700 flex items-center gap-2 transition-all"
            >
                Manual Verification <ExternalLink size={20} />
            </a>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 md:py-20 relative overflow-x-hidden">
        {/* Background Decor */}
        <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[180px] rounded-full -z-10"></div>
        <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-950/10 blur-[180px] rounded-full -z-10"></div>

        {/* Hidden Form for Google Submission */}
        <form 
            ref={formRef} 
            target="hidden_iframe" 
            action={GOOGLE_FORM_ACTION_URL} 
            method="POST" 
            className="hidden"
        >
            {/* Map responses 1 to 46 */}
            {Object.keys(ENTRY_IDS).map((key) => {
              const numKey = parseInt(key);
              let val = formData.responses[numKey] || '';
              if (Array.isArray(val)) val = val.join(', ');
              return <input key={key} type="hidden" name={(ENTRY_IDS as any)[key]} value={val} />;
            })}
            {/* Special mapping for Entry 46 if not defined in responses */}
            <input type="hidden" name={ENTRY_IDS[46]} value={formData.consent ? "Consent Provided" : "No Consent"} />
        </form>
        <iframe name="hidden_iframe" className="hidden" />

        <div className="w-full max-w-5xl relative z-10">
            {/* Header / Progress */}
            {!isSubmitted && (
                <div className="mb-14">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                <Sparkles size={20} />
                            </div>
                            <h4 className="text-white font-black uppercase text-xs tracking-widest">SATM Analysis</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-blue-500 font-black text-xl">{Math.round(progress)}%</span>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-slate-900/80 rounded-full border border-slate-800 overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className={`glass-panel rounded-[3.5rem] p-8 md:p-20 transition-all duration-700 min-h-[600px] flex flex-col justify-center border border-slate-700/50 ${isSubmitted ? 'border-none bg-transparent shadow-none' : ''}`}>
                {isSubmitted ? renderSuccess() : (
                    <>
                        {currentQuestion.type === 'welcome' && renderWelcome()}
                        {currentQuestion.type === 'choice' && renderChoice()}
                        {currentQuestion.type === 'likert' && renderLikert()}
                        {currentQuestion.type === 'multi' && renderMulti()}
                        {currentQuestion.type === 'text' && renderText()}
                        {currentQuestion.type === 'submit' && renderSubmit()}
                    </>
                )}
            </div>

            {/* Footer with Logo */}
            <footer className="mt-20 text-center space-y-6 pb-12">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent rounded-full mb-4"></div>
                    <p className="text-white font-black tracking-[0.5em] text-lg uppercase opacity-90">@ST-ResearchTeam</p>
                    <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Global Self-Authentication Network</p>
                </div>
            </footer>
        </div>
    </div>
  );
}
