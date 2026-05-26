import React, { useState, useMemo } from 'react';
import { X as XIcon, Check, AlertCircle, RefreshCw, Trophy, ChevronRight, ChevronLeft, Layers, MessageSquare, HelpCircle, RotateCcw } from 'lucide-react';
import { MistakeEntry, removeMistakes } from '../utils/mistakeBank';

interface Props {
  mistakes: MistakeEntry[];
  onClose: () => void;
  onComplete?: (removedIds: string[]) => void;
}

type Mode = 'MCQ' | 'FLASHCARD' | 'QA';

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const MistakePracticeView: React.FC<Props> = ({ mistakes, onClose, onComplete }) => {
  const session = useMemo(() => shuffle(mistakes), [mistakes]);
  const [mode, setMode] = useState<Mode>('MCQ');
  const [idx, setIdx] = useState(0);

  // MCQ state
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);

  // Flashcard state
  const [flipped, setFlipped] = useState(false);
  const [fcSeen, setFcSeen] = useState<Set<number>>(new Set());

  const total = session.length;
  const current = session[idx];

  const resetQuestion = () => {
    setSelected(null);
    setRevealed(false);
    setFlipped(false);
  };

  const goTo = (newIdx: number) => {
    setIdx(newIdx);
    resetQuestion();
  };

  const handleSelect = (optIdx: number) => {
    if (revealed || !current) return;
    setSelected(optIdx);
    setRevealed(true);
    if (optIdx === current.correctAnswer) {
      setCorrectIds(prev => prev.includes(current.id) ? prev : [...prev, current.id]);
    } else {
      setWrongCount(c => c + 1);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= total) {
      removeMistakes(correctIds).finally(() => {
        setFinished(true);
        onComplete?.(correctIds);
      });
      return;
    }
    goTo(idx + 1);
  };

  const handleBack = () => {
    if (idx > 0) goTo(idx - 1);
  };

  const handleFlip = () => {
    setFlipped(f => !f);
    setFcSeen(prev => new Set(prev).add(idx));
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    resetQuestion();
    setFcSeen(new Set());
  };

  if (total === 0) {
    return (
      <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Trophy className="text-emerald-600" size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">No mistakes to practice!</h3>
          <p className="text-sm text-slate-500 mb-6">Sab clean hai. Naye MCQ try karein.</p>
          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-slate-800 text-white font-black">Close</button>
        </div>
      </div>
    );
  }

  if (finished) {
    const fixed = correctIds.length;
    const remaining = total - fixed;
    return (
      <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-4 text-white">
            <Trophy size={30} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-1">Practice Complete!</h3>
          <p className="text-sm text-slate-500 mb-5">Galtiyon se seekha kuch toh sahi.</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
              <div className="text-2xl font-black text-emerald-600">{fixed}</div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Fixed ✓</div>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3">
              <div className="text-2xl font-black text-amber-600">{remaining}</div>
              <div className="text-[10px] font-bold text-amber-700 uppercase">Still Wrong ✗</div>
            </div>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black shadow-lg">
            Done
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = revealed && selected === current.correctAnswer;
  const progressPct = Math.round(((idx + (revealed ? 1 : 0)) / total) * 100);

  const ModeTab = ({ m, icon, label }: { m: Mode; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => switchMode(m)}
      className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-black rounded-xl transition-all ${
        mode === m ? 'bg-white shadow text-indigo-700' : 'text-slate-500'
      }`}
    >
      {icon}{label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/70 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4">
      <div className="bg-gradient-to-b from-slate-50 to-white sm:rounded-3xl w-full sm:max-w-lg flex flex-col shadow-2xl overflow-hidden max-h-screen">

        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <h3 className="text-base font-black tracking-tight">My Mistake Practice</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-95 transition-all">
              <XIcon size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <span className="bg-white/20 rounded-full px-2 py-0.5">Q {idx + 1} / {total}</span>
            <span className="bg-emerald-400/30 rounded-full px-2 py-0.5">✓ {correctIds.length}</span>
            <span className="bg-rose-400/30 rounded-full px-2 py-0.5">✗ {wrongCount}</span>
          </div>
          <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="px-4 py-2 bg-white border-b border-slate-100 shrink-0">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
            <ModeTab m="MCQ" icon={<HelpCircle size={12} />} label="MCQ" />
            <ModeTab m="FLASHCARD" icon={<Layers size={12} />} label="Flashcard" />
            <ModeTab m="QA" icon={<MessageSquare size={12} />} label="Q&A" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Source chips */}
          {current.chapterTitle && (
            <div className="mb-3 flex flex-wrap gap-1.5 items-center">
              {current.subjectName && <span className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{current.subjectName}</span>}
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{current.chapterTitle}</span>
              {current.topic && <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">{current.topic}</span>}
            </div>
          )}

          {/* ── MCQ MODE ── */}
          {mode === 'MCQ' && (
            <>
              <h4 className="text-[15px] font-bold text-slate-800 leading-relaxed mb-4">{current.question}</h4>
              <div className="space-y-2">
                {current.options.map((opt, oi) => {
                  const isSelected = selected === oi;
                  const isCorrectOpt = oi === current.correctAnswer;
                  let cls = 'border-slate-200 bg-white hover:border-indigo-300';
                  if (revealed) {
                    if (isCorrectOpt) cls = 'border-emerald-400 bg-emerald-50';
                    else if (isSelected) cls = 'border-rose-400 bg-rose-50';
                    else cls = 'border-slate-200 bg-slate-50 opacity-60';
                  } else if (isSelected) {
                    cls = 'border-indigo-400 bg-indigo-50';
                  }
                  return (
                    <button
                      key={oi}
                      onClick={() => handleSelect(oi)}
                      disabled={revealed}
                      className={`w-full text-left rounded-2xl border-2 p-3 flex items-start gap-3 transition-all active:scale-[0.99] ${cls}`}
                    >
                      <span className={`shrink-0 w-7 h-7 rounded-full font-black text-sm flex items-center justify-center ${
                        revealed && isCorrectOpt ? 'bg-emerald-500 text-white' :
                        revealed && isSelected ? 'bg-rose-500 text-white' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="text-sm text-slate-800 leading-snug pt-0.5 flex-1">{opt}</span>
                      {revealed && isCorrectOpt && <Check size={18} className="ml-auto text-emerald-600 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
              {revealed && current.explanation && (
                <div className={`mt-4 rounded-2xl border p-3 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className={`text-xs font-black mb-1 ${isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isCorrect ? '✓ Bilkul sahi!' : '💡 Yaad rakhein:'}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{current.explanation}</p>
                </div>
              )}
            </>
          )}

          {/* ── FLASHCARD MODE ── */}
          {mode === 'FLASHCARD' && (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleFlip}
                className={`w-full min-h-[220px] rounded-3xl border-2 flex flex-col items-center justify-center px-6 py-8 text-center transition-all duration-300 active:scale-[0.98] shadow-md ${
                  flipped
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
                    : 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200'
                }`}
              >
                {!flipped ? (
                  <>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">❓ Question — Tap to Flip</span>
                    <p className="text-[15px] font-bold text-slate-800 leading-relaxed">{current.question}</p>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">✅ Sahi Jawab</span>
                    <p className="text-xl font-black text-emerald-700 leading-snug mb-2">
                      {String.fromCharCode(65 + current.correctAnswer)}. {current.options[current.correctAnswer]}
                    </p>
                    {current.explanation && (
                      <p className="text-xs text-slate-600 mt-2 bg-white/70 rounded-xl px-3 py-2 leading-relaxed border border-emerald-200">{current.explanation}</p>
                    )}
                  </>
                )}
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <RotateCcw size={12} />
                <span>Tap card to flip</span>
                {fcSeen.size > 0 && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{fcSeen.size} dekha</span>}
              </div>
            </div>
          )}

          {/* ── Q&A MODE ── */}
          {mode === 'QA' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">❓ Sawaal</p>
                <p className="text-[15px] font-bold text-slate-800 leading-relaxed">{current.question}</p>
              </div>
              {!revealed ? (
                <button
                  onClick={() => setRevealed(true)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Jawab Dekho
                </button>
              ) : (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">✅ Sahi Jawab</p>
                  <p className="text-base font-black text-emerald-800">
                    {String.fromCharCode(65 + current.correctAnswer)}. {current.options[current.correctAnswer]}
                  </p>
                  {current.explanation && (
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <p className="text-[10px] font-black text-amber-700 mb-1">💡 Explanation</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{current.explanation}</p>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-[10px] font-black text-slate-500 mb-2">Kya tumhe pata tha?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setCorrectIds(prev => prev.includes(current.id) ? prev : [...prev, current.id]); handleNext(); }}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black active:scale-95 transition-all"
                      >
                        ✓ Haan, pata tha
                      </button>
                      <button
                        onClick={() => { setWrongCount(c => c + 1); handleNext(); }}
                        className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-xs font-black active:scale-95 transition-all"
                      >
                        ✗ Nahi pata tha
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — Back + Next/Finish */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white shrink-0">
          <div className="flex gap-3">
            {/* Back button */}
            <button
              onClick={handleBack}
              disabled={idx === 0}
              className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 shrink-0 ${
                idx === 0
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ChevronLeft size={18} />
              Back
            </button>

            {/* Next / Finish button */}
            {mode === 'MCQ' ? (
              <button
                onClick={handleNext}
                disabled={!revealed}
                className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  revealed
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {idx + 1 >= total ? <><Trophy size={16} /> Finish</> : <>Next <ChevronRight size={16} /></>}
              </button>
            ) : mode === 'FLASHCARD' ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg active:scale-[0.98] transition-all"
              >
                {idx + 1 >= total ? <><Trophy size={16} /> Finish</> : <>Next <ChevronRight size={16} /></>}
              </button>
            ) : (
              /* Q&A — Next only if revealed */
              <button
                onClick={handleNext}
                disabled={!revealed}
                className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  revealed
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg active:scale-[0.98]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {idx + 1 >= total ? <><Trophy size={16} /> Finish</> : <>Next <ChevronRight size={16} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
