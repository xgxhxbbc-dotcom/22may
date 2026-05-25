import React, { useState } from "react";
import { SystemSettings } from "../../types";
import { getStudentGuideData } from "../../utils/studentDocumentation";
import {
  HelpCircle,
  Zap,
  GraduationCap,
  X,
  ChevronRight,
  ChevronDown,
  Coins,
  Layout,
  Star,
  Brain,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  BookMarked,
} from "lucide-react";

interface Props {
  settings?: SystemSettings;
  onClose: () => void;
}

const QUICK_STEPS = [
  {
    step: "01",
    icon: BookMarked,
    color: "bg-indigo-100 text-indigo-600",
    accent: "border-indigo-200",
    title: "Apna Subject Chunein",
    desc: "Home se class, board aur subject select karein. Chapters aur notes directly milenge.",
  },
  {
    step: "02",
    icon: Brain,
    color: "bg-purple-100 text-purple-600",
    accent: "border-purple-200",
    title: "Notes Padho & Suno",
    desc: "TTS Reader se koi bhi note sunein. Tap any line to read it aloud — Hindi aur English dono.",
  },
  {
    step: "03",
    icon: Zap,
    color: "bg-amber-100 text-amber-600",
    accent: "border-amber-200",
    title: "MCQ Practice Karein",
    desc: "Chapter wise MCQs practice karein, score dekho, aur galat answers Mistake Bank mein save honge.",
  },
  {
    step: "04",
    icon: Star,
    color: "bg-rose-100 text-rose-600",
    accent: "border-rose-200",
    title: "AI Se Madad Lo",
    desc: "NSTA AI Tutor se koi bhi sawaal pucho. Study Planner bana ke padhai organized karo.",
  },
];

const TIER_CARDS = [
  {
    name: "Free",
    icon: "🎓",
    color: "bg-slate-100 border-slate-300",
    labelColor: "text-slate-600",
    perks: ["Basic notes access", "Daily MCQ practice (limited)", "Standard videos"],
  },
  {
    name: "Basic",
    icon: "⭐",
    color: "bg-cyan-50 border-cyan-300",
    labelColor: "text-cyan-700",
    perks: ["Premium notes & PDFs", "Higher daily limits", "Deep Dive notes"],
  },
  {
    name: "Ultra",
    icon: "⚡",
    color: "bg-violet-50 border-violet-300",
    labelColor: "text-violet-700",
    perks: ["Unlimited everything", "AI Hub full access", "Premium mock tests", "Audio Slides"],
  },
];

export const StudentGuide: React.FC<Props> = ({ settings, onClose }) => {
  const data = getStudentGuideData(settings);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "FEATURES" | "FAQ">(
    "OVERVIEW",
  );
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 px-5 py-5 text-white shrink-0 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 left-0 w-40 h-20 bg-indigo-600/30 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black leading-tight">App Guide</h2>
                <p className="text-indigo-200 text-[11px] font-medium mt-0.5">
                  {settings?.appName || 'IDEAL INSPIRATION CLASSES'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-white border-b border-slate-100 shrink-0 px-4 pt-1">
          {[
            { id: "OVERVIEW", label: "Start Here", icon: Layout },
            { id: "FEATURES", label: "Features", icon: Sparkles },
            { id: "FAQ", label: "FAQ", icon: HelpCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? "text-indigo-600 border-indigo-600"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto bg-slate-50">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "OVERVIEW" && (
            <div className="animate-in slide-in-from-bottom-2 duration-200">

              {/* Welcome banner */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 mx-4 mt-4 rounded-2xl p-4 text-white shadow-lg shadow-indigo-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Welcome</p>
                <h3 className="text-base font-black leading-snug">{data.overview.subtitle}</h3>
                <p className="text-indigo-100 text-[11px] mt-1.5 leading-relaxed line-clamp-3">
                  {data.overview.content}
                </p>
              </div>

              {/* Tier snapshot */}
              <div className="px-4 mt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Plan Levels</p>
                <div className="grid grid-cols-3 gap-2">
                  {TIER_CARDS.map((tier) => (
                    <div key={tier.name} className={`${tier.color} border rounded-2xl p-3`}>
                      <div className="text-xl leading-none mb-1.5">{tier.icon}</div>
                      <p className={`text-xs font-black ${tier.labelColor} mb-1`}>{tier.name}</p>
                      {tier.perks.slice(0, 2).map((p, i) => (
                        <p key={i} className="text-[9px] text-slate-500 font-medium leading-snug flex items-start gap-0.5">
                          <CheckCircle2 size={9} className="text-emerald-500 shrink-0 mt-0.5" /> {p}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick start steps */}
              <div className="px-4 mt-5 mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">How To Get Started</p>
                <div className="space-y-2.5">
                  {QUICK_STEPS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className={`bg-white border ${s.accent} rounded-2xl p-3.5 flex items-start gap-3 shadow-sm`}>
                        <div className={`${s.color} w-9 h-9 rounded-xl flex items-center justify-center shrink-0`}>
                          <Icon size={17} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Step {s.step}</span>
                          </div>
                          <h4 className="font-black text-slate-800 text-sm leading-tight">{s.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 shrink-0 mt-1" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coins tip */}
              <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Coins size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-800">Coins Earn Karo — Daily!</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">Daily login, Study Timer, aur Store se Coins milenge. Premium features unlock karne ke liye coins use karo.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── FEATURES TAB ── */}
          {activeTab === "FEATURES" && (
            <div className="space-y-3 p-4 animate-in slide-in-from-bottom-2 duration-200">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex gap-3 items-center">
                <div className="bg-amber-100 p-1.5 rounded-full shrink-0">
                  <Coins size={16} className="text-amber-700" />
                </div>
                <p className="text-[11px] text-amber-800 font-bold leading-snug">
                  Niche dikhaye costs live hain — Admin settings ke mutabiq.
                </p>
              </div>

              {data.features.map((feat, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                    <p className="font-black text-slate-700 text-xs uppercase tracking-wider">{feat.title}</p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {feat.items.map((item, i) => (
                      <div key={i} className="px-4 py-3 flex justify-between items-center gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.details}</p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                            item.cost.toLowerCase().includes("free")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          {item.cost}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FAQ TAB ── */}
          {activeTab === "FAQ" && (
            <div className="space-y-2 p-4 animate-in slide-in-from-bottom-2 duration-200">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 mb-3">
                <MessageCircle size={16} className="text-blue-600 shrink-0" />
                <p className="text-[11px] text-blue-800 font-bold">
                  Aur sawaal ho toh App ke Chat Support mein pucho.
                </p>
              </div>
              {data.faq.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === item.q ? null : item.q)
                    }
                    className="w-full flex justify-between items-center px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-bold text-slate-800 text-sm leading-snug pr-2">{item.q}</span>
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${expandedFaq === item.q ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                      {expandedFaq === item.q ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </span>
                  </button>
                  {expandedFaq === item.q && (
                    <div className="px-4 pb-4 text-[12px] text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50 animate-in slide-in-from-top-1 duration-150">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 transition-colors active:scale-95"
          >
            Samajh Gaya — Guide Band Karo
          </button>
        </div>
      </div>
    </div>
  );
};
