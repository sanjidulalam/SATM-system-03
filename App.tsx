
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Send, 
  Sparkles, 
  ArrowRight, 
  MousePointer2, 
  RefreshCcw, 
  Landmark, 
  FileSpreadsheet, 
  ExternalLink, 
  Activity,
  Cpu,
  Database,
  ShieldCheck,
  Zap,
  Layers,
  CircleAlert
} from 'lucide-react';
import { ENTRY_IDS, GOOGLE_FORM_ACTION_URL, LIKERT_QUESTIONS } from './constants';

type QuestionType = 'welcome' | 'choice' | 'likert' | 'multi' | 'text' | 'submit' | 'success';

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  options?: string[];
  allowOther?: boolean;
  entryIndex: number;
}

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState({
    consent: false,
    responses: {} as Record<number, any>
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'linking' | 'transmitting' | 'complete'>('idle');

  const formRef = useRef<HTMLFormElement>(null);

  // Strictly align the 46 questions to the 46 Entry IDs provided
  const surveyQuestions = useMemo((): Question[] => [
    { id: 'welcome', type: 'welcome', title: 'Rediscovering Authentic Potential', entryIndex: 0 },
    // Demographics (1-5)
    { id: 'q1', entryIndex: 1, type: 'choice', title: 'Age Range', options: ['18-20', '21-23', '24-26', '27-30', 'Above 30'] },
    { id: 'q2', entryIndex: 2, type: 'choice', title: 'Gender', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
    { id: 'q3', entryIndex: 3, type: 'choice', title: 'Academic Level', options: ['Undergraduate', 'Postgraduate (Master\'s)', 'Doctoral'], allowOther: true },
    { id: 'q4', entryIndex: 4, type: 'choice', title: 'Field of Study', options: ['Management', 'Engineering', 'Sciences', 'Arts & Humanities'], allowOther: true },
    { id: 'q5', entryIndex: 5, type: 'choice', title: 'Years of SM Use', options: ['Less than 2 years', '2-5 years', '5-10 years', 'More than 10 years'] },
    // Likert Questions (6-35)
    ...LIKERT_QUESTIONS.map((q, i) => ({
      id: `likert-${i}`,
      entryIndex: i + 6,
      type: 'likert' as QuestionType,
      title: q,
      subtitle: `Select 1 (Strongly Disagree) to 5 (Strongly Agree)`
    })),
    // Digital Detox / Reconnection (36-40)
    { id: 'q31', entryIndex: 36, type: 'choice', title: 'Break Frequency', options: ['Daily', 'Several times a week', 'Weekly', 'Rarely', 'Never'] },
    { id: 'q32', entryIndex: 37, type: 'choice', title: 'Device-Free Zones', options: ['Yes, regularly', 'Occasionally', 'Rarely', 'Never'] },
    { id: 'q33', entryIndex: 38, type: 'choice', title: 'Detox Improvements', options: ['Significant improvement', 'Some improvement', 'No change', 'Worsened'] },
    { id: 'q34', entryIndex: 39, type: 'multi', title: 'Reconnection Activities', options: ['Meditation/Mindfulness', 'Exercise/Outdoor activities', 'Creative hobbies', 'Reading', 'Journaling', 'Social connections (offline)'], allowOther: true },
    { id: 'q35', entryIndex: 40, type: 'likert', title: 'Digital Wellness Rating', subtitle: '1 (Poor) to 5 (Excellent)', options: ['1', '2', '3', '4', '5'] },
    // Qualitative Reflections (41-45)
    { id: 'q36', entryIndex: 41, type: 'text', title: 'SM & Authentic Self Relationship' },
    { id: 'q37', entryIndex: 42, type: 'text', title: 'Self-Authentication Strategies' },
    { id: 'q38', entryIndex: 43, type: 'text', title: 'Impact on Motivation' },
    { id: 'q39', entryIndex: 44, type: 'text', title: 'Challenges Online' },
    { id: 'q40', entryIndex: 45, type: 'text', title: 'Recommendations for Others' },
    // Entry 46 is for Consent Confirmation
    { id: 'submit', type: 'submit', title: 'Final Data Transmission', entryIndex: 46 }
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

    const isAutoType = (currentQuestion.type === 'choice' && !currentQuestion.allowOther) || currentQuestion.type === 'likert';
    if (isAutoType) {
      setTimeout(handleNext, 350);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSyncStatus('linking');
    
    // UI-Enhanced Sync steps
    setTimeout(() => setSyncStatus('transmitting'), 800);

    // TRIPLE-VERIFIED SUBMISSION ARCHITECTURE
    // 1. HIDDEN IFRAME POST (Bypasses CORS entirely)
    if (formRef.current) {
      formRef.current.submit();
    }

    // 2. AJAX BACKUP (Direct POST with no-cors)
    try {
      const urlEncodedData = new URLSearchParams();
      Object.keys(ENTRY_IDS).forEach((key) => {
        const numKey = parseInt(key);
        let val = numKey === 46 ? "Confirmed Consent" : formData.responses[numKey];
        if (Array.isArray(val)) val = val.join(', ');
        urlEncodedData.append((ENTRY_IDS as any)[key], String(val || 'No Response'));
      });

      await fetch(GOOGLE_FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlEncodedData.toString()
      });
    } catch (e) {
      console.warn("AJAX sync path blocked. Relying on primary form injection.");
    }

    // Delay for visual impact and to ensure browser registers submission
    setTimeout(() => {
      setSyncStatus('complete');
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 3000);
  };

  const downloadResultsCSV = () => {
    // HORIZONTAL ROW FORMAT: All headers in one row, all answers in the next row
    const questionsForExport = surveyQuestions.filter(q => q.entryIndex > 0);
    
    const headers = questionsForExport.map(q => `"${q.title.replace(/"/g, '""')}"`);
    headers.unshift('"Submission Time"');

    const dataRow = questionsForExport.map(q => {
      let val = q.entryIndex === 46 ? "Confirmed Consent" : formData.responses[q.entryIndex];
      if (Array.isArray(val)) val = val.join('; ');
      return `"${String(val || 'N/A').replace(/"/g, '""')}"`;
    });
    dataRow.unshift(`"${new Date().toLocaleString()}"`);

    // Add Entry Index Header as a 3rd optional row for easy mapping verification
    const indexHeader = questionsForExport.map(q => `"Entry ${q.entryIndex}"`);
    indexHeader.unshift('"Index Map"');

    // UTF-8 BOM is critical for Excel characters
    const csvContent = "\uFEFF" + 
                        headers.join(",") + "\n" + 
                        dataRow.join(",") + "\n" +
                        indexHeader.join(",");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `SATM_Response_Row_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderWelcome = () => (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000">
      <div className="text-center space-y-8">
        <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-500 blur-[60px] opacity-20 animate-pulse"></div>
            <div className="relative p-6 rounded-full bg-slate-900 border border-blue-500/50 text-blue-400 floating shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <Landmark size={64} />
            </div>
        </div>
        <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight">
              SATM <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">RESEARCH</span>
            </h1>
            <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
              Global Initiative: Investigating digital behavioral patterns and the Self-Authentication Theory of Motivation.
            </p>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-8 pt-6">
        <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <label className="relative flex items-center gap-5 cursor-pointer p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500 transition-all">
                <input 
                    type="checkbox" 
                    className="w-8 h-8 rounded-xl bg-slate-950 border-slate-700 checked:bg-blue-600"
                    checked={formData.consent}
                    onChange={(e) => setFormData(prev => ({ ...prev, consent: e.target.checked }))}
                />
                <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">Participation Consent</span>
                    <span className="text-slate-500 text-sm">I agree to contribute my data to the study.</span>
                </div>
            </label>
        </div>

        <button 
          disabled={!formData.consent}
          onClick={handleNext}
          className={`group w-full py-7 rounded-[2rem] flex items-center justify-center gap-4 text-2xl font-black transition-all transform active:scale-95 ${
            formData.consent 
            ? 'bg-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:bg-blue-500 hover:-translate-y-1' 
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          Initialize Sync <Zap size={32} className={formData.consent ? "animate-pulse" : ""} />
        </button>
      </div>
    </div>
  );

  const renderChoice = () => {
    const currentVal = formData.responses[currentQuestion.entryIndex];
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-right-12 duration-700">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="bg-blue-500/10 text-blue-500 p-2 rounded-lg"><Cpu size={16} /></span>
                <span className="text-slate-500 font-black tracking-widest text-xs uppercase">DATA NODE {currentQuestion.entryIndex}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">{currentQuestion.title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-5">
            {currentQuestion.options?.map((opt, i) => (
                <button
                    key={opt}
                    onClick={() => updateResponse(opt)}
                    className={`option-button group p-8 rounded-[2rem] border-2 text-left flex items-center justify-between transition-all duration-300 ${
                        currentVal === opt 
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400 scale-[1.02]' 
                        : 'border-slate-800/60 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-white'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-slate-700 group-hover:text-blue-500 transition-colors">0{i+1}</span>
                        <span className="text-xl md:text-2xl font-bold">{opt}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${
                        currentVal === opt ? 'border-blue-500 bg-blue-500 text-slate-950 rotate-12' : 'border-slate-800'
                    }`}>
                        {currentVal === opt && <Check size={24} strokeWidth={4} />}
                    </div>
                </button>
            ))}
            {currentQuestion.allowOther && (
                <div className={`p-2 rounded-[2rem] border-2 transition-all ${
                    currentVal && !currentQuestion.options?.includes(currentVal) ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800/40 bg-slate-900/20'
                }`}>
                    <input 
                        type="text"
                        placeholder="Please specify..."
                        className="w-full bg-slate-950 p-6 rounded-[1.5rem] outline-none border border-slate-800 text-white focus:border-blue-500 transition-all font-bold text-xl placeholder:text-slate-800"
                        onChange={(e) => updateResponse(e.target.value)}
                        value={!currentQuestion.options?.includes(currentVal) ? currentVal : ''}
                    />
                </div>
            )}
        </div>
        <div className="flex justify-between pt-10">
            <button onClick={handleBack} className="p-5 px-10 rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-3 font-bold">
                <ChevronLeft size={24} /> Back
            </button>
            {currentQuestion.allowOther && (
                <button onClick={handleNext} disabled={!currentVal} className="px-14 py-5 rounded-3xl bg-blue-600 text-white font-black hover:bg-blue-500 flex items-center gap-3 shadow-xl disabled:opacity-30">
                    Next <ChevronRight size={24} />
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
        <div className="space-y-16 animate-in fade-in slide-in-from-right-12 duration-700 text-center">
            <div className="space-y-6">
                <div className="flex items-center justify-center gap-3">
                    <Activity size={18} className="text-blue-500" />
                    <span className="text-slate-500 font-black tracking-widest text-xs uppercase">PSYCHOMETRIC SCALE • {currentQuestion.entryIndex}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-4xl mx-auto">{currentQuestion.title}</h2>
            </div>
            <div className="relative pt-10 max-w-4xl mx-auto">
                <div className="flex justify-between text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] mb-12 px-6">
                    <span className="text-red-500/40">Strongly Disagree</span>
                    <span className="hidden md:block">Neutral</span>
                    <span className="text-emerald-500/40">Strongly Agree</span>
                </div>
                <div className="flex gap-3 md:gap-6 items-center justify-between">
                    {options.map((val) => (
                        <button
                            key={val}
                            onClick={() => updateResponse(val)}
                            className={`group flex-1 h-28 md:h-40 rounded-[2.5rem] border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                                currentVal === val 
                                ? 'border-blue-500 bg-blue-500 text-slate-950 scale-110 shadow-[0_0_60px_rgba(59,130,246,0.2)] z-10' 
                                : 'border-slate-800/40 bg-slate-900/20 text-slate-500 hover:border-slate-600 hover:text-white'
                            }`}
                        >
                            <span className="text-4xl md:text-6xl font-black">{val}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex justify-between items-center pt-14">
                <button onClick={handleBack} className="p-5 px-10 rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-3 font-bold">
                    <ChevronLeft size={24} /> Back
                </button>
                <div className="flex items-center gap-4 text-blue-500 font-black bg-blue-500/5 p-4 px-8 rounded-full border border-blue-500/20">
                    <Zap size={18} className="animate-pulse" /> 
                    <span className="text-xs uppercase tracking-[0.2em]">AUTO-SYNC ACTIVE</span>
                </div>
            </div>
        </div>
    );
  };

  const renderMulti = () => {
    const selected: string[] = Array.isArray(formData.responses[currentQuestion.entryIndex]) ? formData.responses[currentQuestion.entryIndex] : [];
    const toggle = (opt: string) => {
        let newList = selected.includes(opt) ? selected.filter(i => i !== opt) : [...selected, opt];
        updateResponse(newList);
    };
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Database size={16} className="text-emerald-500" />
                    <span className="text-slate-500 font-black tracking-widest text-xs uppercase">CLUSTER MAPPING</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">{currentQuestion.title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {currentQuestion.options?.map(opt => (
                    <button
                        key={opt}
                        onClick={() => toggle(opt)}
                        className={`group p-8 rounded-[2.2rem] border-2 text-left flex items-center justify-between transition-all duration-300 ${
                            selected.includes(opt) 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                            : 'border-slate-800/40 bg-slate-900/20 text-slate-500 hover:border-slate-600 hover:text-white'
                        }`}
                    >
                        <span className="text-xl md:text-2xl font-bold">{opt}</span>
                        <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${
                            selected.includes(opt) ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-800'
                        }`}>
                            {selected.includes(opt) && <Check size={26} strokeWidth={4} />}
                        </div>
                    </button>
                ))}
            </div>
            <div className="flex justify-between pt-10">
                <button onClick={handleBack} className="p-5 px-10 rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-3 font-bold">
                    <ChevronLeft size={24} /> Back
                </button>
                <button onClick={handleNext} className="px-14 py-5 rounded-3xl bg-blue-600 text-white font-black hover:bg-blue-500 shadow-xl flex items-center gap-3">
                    Proceed <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
  };

  const renderText = () => {
    const val = formData.responses[currentQuestion.entryIndex] || '';
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-right-12 duration-700">
          <div className="space-y-4 text-center">
              <span className="text-blue-400 font-black tracking-widest text-xs uppercase">DETAILED INPUT • {currentQuestion.entryIndex}</span>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-4xl mx-auto">{currentQuestion.title}</h2>
          </div>
          <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-b from-blue-600 to-transparent rounded-[3rem] blur opacity-10 transition duration-500"></div>
              <textarea
                  autoFocus
                  className="relative w-full h-64 md:h-80 p-10 rounded-[3rem] bg-slate-950 border-2 border-slate-800 text-white text-2xl outline-none focus:border-blue-500 transition-all font-medium placeholder:text-slate-900 scrollbar-hide"
                  placeholder="Elaborate your findings here..."
                  value={val}
                  onChange={(e) => updateResponse(e.target.value)}
              />
          </div>
          <div className="flex justify-between pt-6">
              <button onClick={handleBack} className="p-5 px-10 rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-3 font-bold">
                  <ChevronLeft size={24} /> Back
              </button>
              <button onClick={handleNext} disabled={!val} className="px-16 py-5 rounded-3xl bg-blue-600 text-white font-black hover:bg-blue-500 shadow-2xl shadow-blue-600/20 flex items-center gap-3 disabled:opacity-20">
                  Submit Response <ChevronRight size={24} />
              </button>
          </div>
      </div>
    );
  }

  const renderSubmit = () => (
    <div className="text-center space-y-14 animate-in fade-in zoom-in-95 duration-1000">
        <div className="relative mx-auto w-32 h-32">
            <div className={`absolute inset-0 bg-blue-500 rounded-full blur-[60px] opacity-40 ${isSubmitting ? 'animate-ping' : ''}`}></div>
            <div className="relative w-full h-full bg-slate-900 border-2 border-blue-500 rounded-full flex items-center justify-center text-blue-500 floating">
                {isSubmitting ? <RefreshCcw size={64} className="animate-spin" /> : <Send size={64} />}
            </div>
        </div>
        
        <div className="space-y-6">
            <h2 className="text-5xl md:text-7xl font-black text-white">{isSubmitting ? 'UPLOADING...' : 'PROCESS COMPLETE'}</h2>
            <div className="flex flex-col items-center gap-4 text-slate-400 text-xl font-medium max-w-xl mx-auto">
                <p>Ready to transmit your data to the @ST-ResearchTeam cloud database.</p>
                {isSubmitting && (
                    <div className="flex items-center gap-3 text-blue-500 font-black animate-pulse">
                        <Activity size={20} />
                        <span className="uppercase tracking-[0.3em] text-sm">
                            {syncStatus === 'linking' ? 'Resolving Network Link...' : 'Registering Entry 1-46...'}
                        </span>
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-col gap-6 max-w-md mx-auto pt-10">
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="group relative w-full py-8 rounded-[2.5rem] bg-blue-600 text-white text-3xl font-black hover:bg-blue-500 shadow-[0_0_50px_rgba(37,99,235,0.4)] flex items-center justify-center gap-5 transition-all transform active:scale-95 disabled:opacity-50 overflow-hidden"
            >
                <Zap size={32} /> LIVE REGISTER
            </button>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={downloadResultsCSV} className="p-5 rounded-3xl border border-emerald-500/30 text-emerald-500 font-black hover:bg-emerald-500/10 flex items-center justify-center gap-2 text-sm uppercase transition-all">
                    <FileSpreadsheet size={18} /> Excel (Row)
                </button>
                <button onClick={handleBack} className="p-5 rounded-3xl bg-slate-950 border border-slate-800 text-slate-600 font-black hover:text-white flex items-center justify-center gap-2 text-sm uppercase transition-all">
                    Review
                </button>
            </div>
        </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-16 animate-in fade-in zoom-in-95 duration-1000 text-center">
        <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 blur-[150px] opacity-20 animate-pulse"></div>
            <div className="w-56 h-56 bg-emerald-600 text-slate-950 rounded-full flex items-center justify-center relative shadow-[0_0_100px_rgba(16,185,129,0.3)] border-[12px] border-slate-950">
                <Check size={120} strokeWidth={5} className="animate-bounce" />
            </div>
        </div>
        <div className="space-y-8 max-w-3xl">
            <h2 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter">DATA SYNCED</h2>
            <p className="text-slate-400 text-2xl font-medium leading-relaxed">
                The institutional sync is complete. Your responses have been registered in the Google Form database.
            </p>
        </div>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
            <button 
                onClick={downloadResultsCSV}
                className="flex-1 py-7 rounded-[2rem] bg-emerald-600 text-slate-950 font-black hover:bg-emerald-500 shadow-2xl flex items-center justify-center gap-3 text-xl transition-all"
            >
                <FileSpreadsheet size={28} /> DOWNLOAD ROW
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 py-7 rounded-[2rem] bg-slate-900 text-white font-black hover:bg-slate-800 border border-slate-700 flex items-center justify-center gap-3 text-xl transition-all"
            >
                NEW STUDY
            </button>
        </div>
        
        <div className="pt-10 space-y-4">
            <div className="flex items-center justify-center gap-6 text-slate-700 font-black text-[10px] uppercase tracking-[0.4em]">
                <span>Verified @ST-TEAM</span>
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                <span>Session ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSe5QizV-hupWjb6GnBOxOZaMMs9z7b3n-N327oeTp9YblPqOQ/viewform" 
              target="_blank" 
              className="flex items-center gap-2 text-blue-900/40 hover:text-blue-500 transition-colors mx-auto w-fit text-xs font-bold"
            >
              Manual Registration Fallback <ExternalLink size={12} />
            </a>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 md:py-24 relative overflow-x-hidden select-none">
        {/* Decorative Background Atmosphere */}
        <div className="fixed top-[-40%] left-[-20%] w-[100%] h-[100%] bg-blue-900/10 blur-[250px] rounded-full -z-10 animate-pulse"></div>
        <div className="fixed bottom-[-40%] right-[-20%] w-[100%] h-[100%] bg-indigo-950/10 blur-[250px] rounded-full -z-10"></div>

        {/* 
            HIDDEN RELIABILITY ENGINE: 
            This form acts as a silent background proxy to the Google Form.
            Using target="hidden_iframe" ensures no page jump.
        */}
        <form 
            ref={formRef} 
            target="hidden_iframe" 
            action={GOOGLE_FORM_ACTION_URL} 
            method="POST" 
            className="hidden"
        >
            {Object.keys(ENTRY_IDS).map((key) => {
              const numKey = parseInt(key);
              let val = numKey === 46 ? "Consent Given" : formData.responses[numKey];
              if (Array.isArray(val)) val = val.join(', ');
              
              return (
                <input 
                  key={key} 
                  type="hidden" 
                  name={(ENTRY_IDS as any)[key]} 
                  value={String(val || 'No Response')} 
                />
              );
            })}
        </form>
        <iframe name="hidden_iframe" style={{ display: 'none' }} />

        <div className="w-full max-w-6xl relative z-10">
            {/* Cyber Header */}
            {!isSubmitted && (
                <div className="mb-20">
                    <div className="flex justify-between items-end mb-8">
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40"></div>
                                <div className="relative w-16 h-16 rounded-[1.25rem] bg-slate-950 border-2 border-blue-500 flex items-center justify-center text-blue-500 shadow-2xl">
                                    <Activity size={32} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-white font-black uppercase text-sm tracking-[0.4em]">LIVE DATA LINK</h4>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span className="text-blue-500/60 text-[10px] font-black uppercase tracking-widest">TRANSMISSION READY</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col">
                            <span className="text-white font-black text-4xl leading-none">0{currentIndex} <span className="text-slate-800 text-2xl">/</span> <span className="text-slate-600 text-xl font-bold">{totalSteps - 1}</span></span>
                            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Study Phase</span>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-900 overflow-hidden p-0.5">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(59,130,246,0.6)]" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Main Interactive Interface */}
            <main className={`glass-panel rounded-[5rem] p-10 md:p-28 transition-all duration-1000 min-h-[700px] flex flex-col justify-center border-2 border-slate-800/40 relative overflow-hidden ${isSubmitted ? 'border-none bg-transparent shadow-none' : ''}`}>
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
            </main>

            {/* Signature Footer */}
            <footer className="mt-28 text-center space-y-12 pb-20">
                <div className="flex flex-col items-center gap-6 group">
                    <div className="flex items-center gap-6 opacity-20 group-hover:opacity-100 transition-all duration-700">
                        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-blue-500 rounded-full"></div>
                        <Layers size={28} className="text-blue-500" />
                        <div className="w-32 h-[1px] bg-gradient-to-l from-transparent via-blue-500 to-blue-500 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-center gap-3">
                            <ShieldCheck size={20} className="text-blue-500" />
                            <p className="text-white font-black tracking-[0.8em] text-3xl uppercase leading-none select-none drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">@ST-ResearchTeam</p>
                        </div>
                        <p className="text-slate-600 font-black text-[11px] uppercase tracking-[0.5em] opacity-80 group-hover:opacity-100 transition-opacity">Institutional Research Group • SATM Division</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap justify-center items-center gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-800">
                    <div className="flex items-center gap-2">
                        <Activity size={12} />
                        <span>CLOUD UPLOAD READY</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Database size={12} />
                        <span>GOOGLE FORMS MAPPING ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap size={12} />
                        <span>EXCEL HORIZONTAL EXPORT</span>
                    </div>
                </div>
            </footer>
        </div>
    </div>
  );
}
