import React, { useState, useEffect } from 'react';
import { User, CreditPackage, SystemSettings } from '../types';
import { Sparkles, Check, MessageSquare, Lock, Ticket, ShieldCheck, Star, ChevronRight, Flame, BadgeCheck } from 'lucide-react';
import { getLevelInfo, getNextLevelInfo, getLevelProgress, getScoreDiscountFromScore } from '../utils/levelSystem';

interface Props {
  user: User;
  settings?: SystemSettings;
  onUserUpdate: (user: User) => void;
  renderEarnContent?: React.ReactNode;
}

const DEFAULT_PACKAGES: CreditPackage[] = [
  { id: 'pkg-1', name: '100 Credits', credits: 100, price: 10 },
  { id: 'pkg-2', name: '200 Credits', credits: 200, price: 20 },
  { id: 'pkg-3', name: '500 Credits', credits: 500, price: 50 },
  { id: 'pkg-4', name: '1000 Credits', credits: 1000, price: 100 },
  { id: 'pkg-5', name: '2000 Credits', credits: 2000, price: 200 },
  { id: 'pkg-6', name: '5000 Credits', credits: 5000, price: 500 },
  { id: 'pkg-7', name: '10000 Credits', credits: 10000, price: 1000 }
];

export const Store: React.FC<Props> = ({ user, settings, renderEarnContent }) => {
  const [tierType, setTierType] = useState<'BASIC' | 'ULTRA' | 'EARN' | 'CREDITS'>('BASIC');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const packages = settings?.packages || DEFAULT_PACKAGES;
  const subscriptionPlans = settings?.subscriptionPlans || [];

  const totalScore = user.totalScore || 0;
  const scoreDiscount = getScoreDiscountFromScore(totalScore);
  const scoreTier = getLevelInfo(totalScore);
  const nextTierInfo = getNextLevelInfo(totalScore);
  const scoreTierProgress = getLevelProgress(totalScore);

  // storeDiscount: only active for Level 1–4 AND user has scored ≥ 100 points
  const activeStoreDiscount =
    (user.storeDiscount && user.storeDiscount > 0 && scoreTier.level <= 4 && totalScore >= 100)
      ? user.storeDiscount
      : 0;

  // === VISIT DISCOUNT ===
  const [visitCount, setVisitCount] = useState<number>(0);
  const visitDiscountRules = settings?.storeVisitDiscountRules || [];
  const visitDiscountEnabled = !!(settings?.storeVisitDiscountEnabled && visitDiscountRules.length > 0);
  const userSubTier: 'FREE' | 'BASIC' | 'ULTRA' =
    (user as any).subscriptionLevel === 'ULTRA' ? 'ULTRA'
    : (user as any).subscriptionLevel === 'BASIC' ? 'BASIC'
    : 'FREE';
  const eligibleTiers: ('FREE' | 'BASIC' | 'ULTRA')[] = settings?.storeVisitDiscountTiers || ['FREE'];
  const isEligibleForVisitDiscount = visitDiscountEnabled && eligibleTiers.includes(userSubTier);
  const visitDiscount = isEligibleForVisitDiscount
    ? (visitDiscountRules
        .filter(r => visitCount >= r.visits)
        .sort((a, b) => b.discountPercent - a.discountPercent)[0]?.discountPercent || 0)
    : 0;
  // Next visit threshold for progress hint
  const nextVisitRule = isEligibleForVisitDiscount
    ? visitDiscountRules
        .filter(r => r.visits > visitCount)
        .sort((a, b) => a.visits - b.visits)[0]
    : null;

  useEffect(() => {
    if (!visitDiscountEnabled) return;
    const key = `store_visit_total_${user.id}`;
    const prev = parseInt(localStorage.getItem(key) || '0', 10);
    const newCount = prev + 1;
    localStorage.setItem(key, String(newCount));
    setVisitCount(newCount);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    if (subscriptionPlans.length > 0 && !selectedPlanId) {
      const defaultPlan = subscriptionPlans.find(p => p.name.includes('Monthly')) || subscriptionPlans[0];
      setSelectedPlanId(defaultPlan.id);
    }
  }, [subscriptionPlans]);

  const selectedPlan = subscriptionPlans.find(p => p.id === selectedPlanId);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<any>(null);

  const event = settings?.specialDiscountEvent;
  const isSubscribed = user.isPremium && user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date();

  const isEventActive = () => {
    if (!event?.enabled) return false;
    const now = Date.now();
    if (!event.startsAt && !event.endsAt) return true;
    const startsAt = event.startsAt ? new Date(event.startsAt).getTime() : 0;
    const endsAt = event.endsAt ? new Date(event.endsAt).getTime() : Infinity;
    if (startsAt === endsAt) return now >= startsAt;
    return now >= startsAt && now < endsAt;
  };

  const isCooldownPhase = () => {
    if (!event?.enabled || !event.startsAt) return false;
    return Date.now() < new Date(event.startsAt).getTime();
  };

  const activeEvent = isEventActive();
  const inCooldown = isCooldownPhase();
  const showEventBanner = activeEvent || inCooldown;

  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    if (!event?.enabled || (!event?.startsAt && !event?.endsAt)) { setTimeLeft(null); return; }
    const calculateTime = () => {
      const now = new Date().getTime();
      const start = event.startsAt ? new Date(event.startsAt).getTime() : 0;
      const end = event.endsAt ? new Date(event.endsAt).getTime() : 0;
      let diff = 0;
      if (now < start) diff = start - now;
      else if (start === end && now >= start) { setTimeLeft(null); return; }
      else if (now < end) diff = end - now;
      if (diff <= 0) { setTimeLeft(null); }
      else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const handleSupportClick = (numEntry: any) => {
    if (!purchaseItem) return;
    const isSub = purchaseItem.duration !== undefined;
    const itemName = purchaseItem.name;
    let price = 0;
    let features = '';
    if (isSub) {
      price = purchaseItem.finalPrice !== undefined ? purchaseItem.finalPrice : (tierType === 'BASIC' ? purchaseItem.basicPrice : purchaseItem.ultraPrice);
      features = tierType === 'BASIC' ? 'MCQ + Notes (Pro)' : 'PDF + Videos + AI Studio (Max)';
    } else {
      price = purchaseItem.price;
      features = `${purchaseItem.credits} Credits`;
    }
    if (typeof (window as any).recordActivity === 'function') {
      (window as any).recordActivity('PURCHASE', `Initiated Purchase: ${itemName}`, price, { itemId: purchaseItem.id, subject: isSub ? 'Subscription' : 'Credits' });
    }
    const message = `Hello Admin, I want to buy:\n\nItem: ${itemName} ${isSub ? `(${tierType === 'BASIC' ? 'PRO' : 'MAX'})` : ''}\nPrice: ₹${price}\nUser ID: ${user.id}\nDetails: ${features}\n\nPlease share payment details.`;
    window.open(`https://wa.me/91${numEntry.number}?text=${encodeURIComponent(message)}`, '_blank');
    setShowSupportModal(false);
  };

  const initiatePurchase = (item: any) => { setPurchaseItem(item); setShowSupportModal(true); };

  if (settings?.isPaymentEnabled === false) {
    return (
      <div className="animate-in fade-in zoom-in duration-300 px-4 py-8">
        <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 text-center shadow-2xl">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-700">
            <Lock size={40} className="text-slate-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-200 mb-2">Store Locked</h3>
          <p className="text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
            {settings.paymentDisabledMessage || "Purchases are currently disabled by the Admin. Please check back later."}
          </p>
        </div>
      </div>
    );
  }

  const defaultBasicFeatures = [
    'Daily Login Bonus: 10 Credits/Day',
    'Full MCQs Unlocked',
    'Premium Notes (Standard)',
    'Audio Library (Standard)',
    'AI Videos (2D Basic)',
    'Team Support',
    'Spin Wheel (5 Spins/Day)'
  ];
  const defaultUltraFeatures = [
    'Daily Login Bonus: 20 Credits/Day',
    'Everything in Basic Unlocked',
    'Premium Notes (Deep Dive)',
    'Ultra Podcast (Studio HD)',
    'AI Videos (2D + 3D Deep Dive)',
    'Competitive Mode Unlocked 🏆',
    'Spin Wheel (10 Spins/Day)'
  ];

  const featuresList = tierType === 'BASIC'
    ? (settings?.storeFeatures?.basic?.filter(f => f.trim()) || defaultBasicFeatures)
    : (settings?.storeFeatures?.ultra?.filter(f => f.trim()) || defaultUltraFeatures);

  const getPerMonthPrice = (plan: any, price: number) => {
    if (plan.duration.toLowerCase().includes('year') || plan.duration.includes('365')) return Math.round(price / 12);
    return null;
  };

  const isPro = tierType === 'BASIC';
  const planAccent = isPro
    ? { from: 'from-cyan-500', via: 'via-sky-400', to: 'to-cyan-500', ring: 'rgba(6,182,212,0.8)', glow: 'rgba(6,182,212,0.12)', border: 'border-cyan-500', text: 'text-cyan-300', bg: 'bg-cyan-500/20', badge: 'bg-cyan-500/25 text-cyan-300 border-cyan-500/40', selectedBg: 'from-cyan-950 to-sky-950' }
    : { from: 'from-violet-500', via: 'via-purple-500', to: 'to-violet-600', ring: 'rgba(139,92,246,0.8)', glow: 'rgba(139,92,246,0.12)', border: 'border-purple-500', text: 'text-purple-300', bg: 'bg-purple-500/20', badge: 'bg-purple-500/25 text-purple-300 border-purple-500/40', selectedBg: 'from-violet-950 to-purple-950' };

  return (
    <div className="animate-in fade-in duration-300 pb-28 bg-black text-white font-sans">

      {/* SUPPORT MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#111] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-white/10 animate-in slide-in-from-bottom-4">
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <MessageSquare size={18} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Support Channel Chuno</h3>
                  <p className="text-[11px] text-slate-500">Payment ke liye ek number select karo</p>
                </div>
              </div>
            </div>
            <div className="px-4 pb-3 space-y-2">
              {(settings?.paymentNumbers || [{id: 'def', name: 'Main Support', number: '8227070298', dailyClicks: 0}]).map((num) => {
                const totalClicks = settings?.paymentNumbers?.reduce((acc, curr) => acc + (curr.dailyClicks || 0), 0) || 1;
                const traffic = Math.round(((num.dailyClicks || 0) / totalClicks) * 100);
                const isGreen = traffic < 30;
                return (
                  <button
                    key={num.id}
                    onClick={() => handleSupportClick(num)}
                    className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl flex justify-between items-center hover:bg-white/10 hover:border-cyan-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm ${isGreen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {num.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">{num.name}</p>
                        <p className="text-[10px] text-slate-500">{isGreen ? '✅ Fast Response' : '⚠️ High Traffic'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isGreen ? 'text-emerald-400 bg-emerald-500/15' : 'text-orange-400 bg-orange-500/15'}`}>{traffic}% Busy</span>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-4 pb-5 pt-2 border-t border-white/5">
              <button onClick={() => setShowSupportModal(false)} className="w-full py-3 text-slate-500 font-bold text-sm hover:text-white transition-colors rounded-xl hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MAIN CONTENT */}
      <div className="px-4 pt-5">

        {/* PLAN TYPE SELECTOR — Premium tab switcher */}
        {(() => {
          const isGameEnabled = settings?.isGameEnabled !== false;
          const allTabs = [
            { id: 'BASIC' as const, label: 'PRO', icon: '⭐', desc: 'Basic' },
            { id: 'ULTRA' as const, label: 'MAX', icon: '⚡', desc: 'Ultra' },
            { id: 'CREDITS' as const, label: 'Credits', icon: '🪙', desc: 'Buy' },
            ...(isGameEnabled ? [{ id: 'EARN' as const, label: 'Earn', icon: '🎰', desc: 'Free' }] : []),
          ];
          return (
        <div className="mb-5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Choose Your Plan</p>
          <div className={`grid gap-2 ${allTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {allTabs.map(tab => {
              const isActive = tierType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTierType(tab.id)}
                  className={`relative py-2.5 px-1 rounded-2xl text-[11px] font-black transition-all flex flex-col items-center gap-0.5 overflow-hidden ${
                    isActive
                      ? tab.id === 'BASIC'
                        ? 'bg-gradient-to-b from-cyan-500/30 to-cyan-600/10 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : tab.id === 'ULTRA'
                        ? 'bg-gradient-to-b from-purple-500/30 to-purple-600/10 text-purple-300 border border-purple-500/60 shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                        : tab.id === 'EARN'
                        ? 'bg-gradient-to-b from-emerald-500/30 to-emerald-600/10 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : 'bg-gradient-to-b from-amber-500/30 to-amber-600/10 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'bg-white/5 text-slate-400 border border-white/8 hover:bg-white/8'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.04) 50%,transparent 60%)', animation: 'shimmer-sweep 2.5s linear infinite' }} />
                  )}
                  <span className="text-lg leading-none">{tab.icon}</span>
                  <span className="leading-tight text-center font-black">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
          );
        })()}

        {/* SPECIAL DISCOUNT EVENT BANNER */}
        {showEventBanner && (
          <div className={`mb-5 p-4 rounded-2xl border animate-in fade-in ${
            activeEvent
              ? 'bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-amber-500/40'
              : 'bg-[#111] border-slate-700'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeEvent ? '🔥' : '⏳'}</span>
              <div className="flex-1">
                <p className={`text-sm font-black ${activeEvent ? 'text-amber-300' : 'text-slate-200'}`}>
                  {activeEvent
                    ? `${event?.eventName || 'Flash Sale'} — ${event?.discountPercent || 0}% OFF!`
                    : `${event?.eventName || 'Sale'} — Jald aane wala hai!`}
                </p>
                <p className={`text-[11px] mt-0.5 ${activeEvent ? 'text-orange-300' : 'text-slate-400'}`}>
                  {activeEvent
                    ? 'Sabhi plans aur credits pe discount apply ho gaya!'
                    : 'Event abhi start nahi hua — countdown dekho neeche'}
                </p>
              </div>
            </div>
            {timeLeft && (
              <div className="flex gap-2 mt-3 justify-center">
                {timeLeft.days > 0 && (
                  <div className="bg-black/40 rounded-xl px-3 py-1.5 text-center min-w-[48px] border border-white/10">
                    <p className="text-base font-black text-white font-mono leading-none">{String(timeLeft.days).padStart(2,'0')}</p>
                    <p className="text-[8px] text-slate-500 uppercase mt-0.5">Days</p>
                  </div>
                )}
                {[{ v: timeLeft.hours, l: 'Hrs' }, { v: timeLeft.minutes, l: 'Min' }, { v: timeLeft.seconds, l: 'Sec' }].map(item => (
                  <div key={item.l} className="bg-black/40 rounded-xl px-3 py-1.5 text-center min-w-[48px] border border-white/10">
                    <p className="text-base font-black text-white font-mono leading-none">{String(item.v).padStart(2,'0')}</p>
                    <p className="text-[8px] text-slate-500 uppercase mt-0.5">{item.l}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* EARN CONTENT — only when game feature is enabled */}
        {tierType === 'EARN' && settings?.isGameEnabled !== false && (
          <div className="animate-in fade-in duration-200">
            {renderEarnContent ?? (
              <div className="text-center py-12 text-slate-500 font-bold">
                <p className="text-2xl mb-2">🎰</p>
                <p>Earn content loading...</p>
              </div>
            )}
          </div>
        )}

        {/* CREDITS CONTENT */}
        {tierType === 'CREDITS' && (
          <div className="animate-in fade-in duration-200 space-y-3">
            <div className="space-y-2">
              {packages.map((pkg) => {
                let finalPrice = pkg.price;
                let discountPercentVal = 0;
                if (activeEvent && event?.discountPercent) discountPercentVal += event.discountPercent;
                if (isSubscribed) discountPercentVal += 5;
                if (activeStoreDiscount > 0) discountPercentVal += activeStoreDiscount;
                if (scoreDiscount > 0) discountPercentVal += scoreDiscount;
                if (visitDiscount > 0) discountPercentVal += visitDiscount;
                if (discountPercentVal > 0) {
                  if (discountPercentVal > 100) discountPercentVal = 100;
                  finalPrice = Math.round(finalPrice * (1 - discountPercentVal / 100));
                }
                const perCredit = finalPrice > 0 ? (finalPrice / pkg.credits).toFixed(2) : '0';
                const isPopular = pkg.credits === 500;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => initiatePurchase(pkg)}
                    className="w-full p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group"
                    style={{
                      background: isPopular ? 'linear-gradient(135deg, rgba(234,179,8,0.12), rgba(245,158,11,0.06))' : 'rgba(255,255,255,0.03)',
                      border: isPopular ? '1px solid rgba(234,179,8,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {isPopular && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-black text-[8px] font-black px-2.5 py-1 rounded-bl-xl rounded-tr-xl">
                        POPULAR
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)' }}>
                          🪙
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{pkg.credits.toLocaleString('en-IN')} Credits</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">₹{perCredit}/credit · {pkg.name}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5">
                          {discountPercentVal > 0 && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-black border border-amber-500/30">
                              {discountPercentVal}% OFF
                            </span>
                          )}
                          <p className="text-base font-black text-white">₹{finalPrice.toLocaleString('en-IN')}</p>
                        </div>
                        {discountPercentVal > 0 && (
                          <p className="text-[9px] text-slate-600 line-through text-right">₹{pkg.price.toLocaleString('en-IN')}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center gap-4 mb-8 mt-2">
              {[
                { icon: <ShieldCheck size={12} />, text: 'Secure Payment' },
                { icon: <Flame size={12} />, text: 'Instant Credits' },
                { icon: <Star size={12} />, text: 'Never Expire' },
              ].map(badge => (
                <div key={badge.text} className="flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                  {badge.icon}
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tierType !== 'EARN' && tierType !== 'CREDITS' && (<>

        {/* SCORE LEVEL BANNER */}
        <div className="mb-4 rounded-2xl overflow-hidden border border-white/10">
          <div className={`bg-gradient-to-r ${scoreTier.gradient} p-0.5`}>
            <div className="bg-[#0e0e0e] rounded-[14px] p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                style={{ background: `${scoreTier.color}22`, boxShadow: `0 0 12px ${scoreTier.glowColor}` }}>
                {scoreTier.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-black text-white">Level {scoreTier.level} {scoreTier.label}</span>
                  <span className="text-[9px] text-slate-400">{totalScore} pts</span>
                  {scoreDiscount > 0 && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full text-white`}
                      style={{ background: `linear-gradient(90deg, ${scoreTier.color}cc, ${scoreTier.color})` }}>
                      {scoreDiscount}% OFF
                    </span>
                  )}
                </div>
                {nextTierInfo ? (
                  <p className="text-[10px] text-slate-400">
                    {nextTierInfo.minScore - totalScore} aur → Level {nextTierInfo.level} {nextTierInfo.emoji} ({nextTierInfo.discount}% OFF)
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-400">Max Level (Legend) — 20% discount unlocked! 🏆</p>
                )}
                <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${scoreTier.gradient} rounded-full transition-all`}
                    style={{ width: `${scoreTierProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PERSONAL DISCOUNT BANNER */}
        {activeStoreDiscount > 0 && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-rose-900/50 to-pink-900/50 border border-rose-500/40 flex items-center gap-3 animate-in fade-in">
            <div className="w-9 h-9 bg-rose-500/25 rounded-xl flex items-center justify-center shrink-0">
              <Ticket size={16} className="text-rose-300" />
            </div>
            <div>
              <p className="text-sm font-black text-rose-300">Personal Discount Active! 🎉</p>
              <p className="text-[11px] text-rose-400/80">{activeStoreDiscount}% OFF sabhi plans pe — Level 4 tak valid</p>
            </div>
          </div>
        )}

        {/* VISIT DISCOUNT BANNER */}
        {visitDiscountEnabled && isEligibleForVisitDiscount && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-emerald-500/30 animate-in fade-in">
            <div className="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 text-lg">🏬</div>
              <div className="flex-1 min-w-0">
                {visitDiscount > 0 ? (
                  <>
                    <p className="text-sm font-black text-emerald-300">Visit Discount Active! +{visitDiscount}% OFF 🎉</p>
                    <p className="text-[10px] text-emerald-400/80 mt-0.5">
                      {visitCount} store visits complete — discount sabhi plans pe apply ho raha hai
                      {nextVisitRule && ` · ${nextVisitRule.visits - visitCount} aur visits pe ${nextVisitRule.discountPercent}% OFF`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-black text-emerald-400">Visit Discount — {visitCount} visit{visitCount !== 1 ? 's' : ''} 🏬</p>
                    {nextVisitRule && (
                      <p className="text-[10px] text-emerald-500/80 mt-0.5">
                        Sirf {nextVisitRule.visits - visitCount} aur visits par {nextVisitRule.discountPercent}% OFF milega!
                      </p>
                    )}
                  </>
                )}
              </div>
              {visitDiscount > 0 && (
                <span className="shrink-0 text-[11px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded-full">
                  -{visitDiscount}%
                </span>
              )}
            </div>
            {/* Visit progress bar */}
            {nextVisitRule && (
              <div className="bg-slate-900/60 px-3.5 py-2 flex items-center gap-2">
                <span className="text-[9px] text-slate-500 font-bold shrink-0">{visitCount}v</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (visitCount / nextVisitRule.visits) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-emerald-400 font-black shrink-0">{nextVisitRule.visits}v → {nextVisitRule.discountPercent}% OFF</span>
              </div>
            )}
          </div>
        )}

        {/* PLAN HERO CARD — PRO or MAX */}
        <div className={`mb-4 rounded-2xl p-4 relative overflow-hidden border`}
          style={{
            background: isPro
              ? 'linear-gradient(135deg, rgba(8,145,178,0.18) 0%, rgba(6,182,212,0.08) 50%, rgba(2,132,199,0.12) 100%)'
              : 'linear-gradient(135deg, rgba(109,40,217,0.18) 0%, rgba(139,92,246,0.08) 50%, rgba(124,58,237,0.12) 100%)',
            border: isPro ? '1px solid rgba(6,182,212,0.35)' : '1px solid rgba(139,92,246,0.35)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none" style={{ background: isPro ? 'rgba(6,182,212,0.08)' : 'rgba(139,92,246,0.08)', filter: 'blur(20px)' }} />
          <div className="relative z-10 flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${planAccent.badge}`}>
                  {isPro ? '⭐ PRO' : '⚡ MAX'}
                </span>
                {isSubscribed && (
                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <BadgeCheck size={9} /> Active
                  </span>
                )}
              </div>
              <p className={`text-xl font-black ${planAccent.text}`}>{isPro ? 'Pro Plan' : 'Max Plan'}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{isPro ? 'Sabse zyada popular choice' : 'Ultimate learning experience'}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl`}
              style={{ background: isPro ? 'rgba(6,182,212,0.15)' : 'rgba(139,92,246,0.15)', border: isPro ? '1px solid rgba(6,182,212,0.3)' : '1px solid rgba(139,92,246,0.3)' }}>
              {isPro ? '⭐' : '⚡'}
            </div>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-1 gap-1.5 relative z-10">
            {featuresList.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${planAccent.bg}`}>
                  <Check size={9} className={planAccent.text} strokeWidth={3} />
                </div>
                <span className="text-[12px] text-slate-300 font-medium leading-snug">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PRICING PLAN CARDS */}
        <div className="space-y-2.5 mb-5">
          {subscriptionPlans.map((plan, idx) => {
            const isSelected = selectedPlanId === plan.id;
            const original = tierType === 'BASIC' ? plan.basicOriginalPrice : plan.ultraOriginalPrice;
            let price = tierType === 'BASIC' ? plan.basicPrice : plan.ultraPrice;
            let discountPercentVal = 0;
            if (activeEvent && event?.discountPercent) discountPercentVal += event.discountPercent;
            if (isSubscribed) discountPercentVal += 5;
            if (activeStoreDiscount > 0) discountPercentVal += activeStoreDiscount;
            if (scoreDiscount > 0) discountPercentVal += scoreDiscount;
            if (visitDiscount > 0) discountPercentVal += visitDiscount;
            if (discountPercentVal > 0) {
              if (discountPercentVal > 100) discountPercentVal = 100;
              price = Math.round(price * (1 - discountPercentVal / 100));
            }
            const hasRenewalBonus = !!isSubscribed;
            const perMonth = getPerMonthPrice(plan, price);
            const isPopular = plan.name.toLowerCase().includes('monthly') || (subscriptionPlans.length > 1 && idx === 1);

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? isPro
                      ? 'bg-gradient-to-r from-cyan-950 to-sky-950 border-cyan-500 shadow-[0_0_0_1px_rgba(6,182,212,0.8),0_0_20px_rgba(6,182,212,0.12)]'
                      : 'bg-gradient-to-r from-violet-950 to-purple-950 border-purple-500 shadow-[0_0_0_1px_rgba(139,92,246,0.8),0_0_20px_rgba(139,92,246,0.12)]'
                    : 'bg-[#111] border-slate-800 hover:border-slate-700 hover:bg-[#1a1a1a]'
                }`}
              >
                {isSelected && (
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.03) 50%,transparent 60%)', animation: 'shimmer-sweep 2.5s linear infinite' }} />
                )}
                {isPopular && !isSelected && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[8px] font-black px-2.5 py-1 rounded-bl-xl rounded-tr-xl">
                    POPULAR
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-0 right-0 text-black text-[8px] font-black px-2.5 py-1 rounded-bl-xl rounded-tr-xl"
                    style={{ background: isPro ? 'rgba(6,182,212,1)' : 'rgba(139,92,246,1)' }}>
                    ✓ SELECTED
                  </div>
                )}
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>{plan.name}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white">₹{price.toLocaleString('en-IN')}</span>
                      {original > price && <span className="text-slate-600 text-xs line-through">₹{original.toLocaleString('en-IN')}</span>}
                    </div>
                    {perMonth && (
                      <p className="text-[10px] text-slate-500 mt-0.5">≈ ₹{perMonth}/month</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {discountPercentVal > 0 && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black border border-amber-500/30">
                        {discountPercentVal}% OFF
                      </span>
                    )}
                    {hasRenewalBonus && discountPercentVal >= 5 && (
                      <span className="text-[8px] text-cyan-400 font-bold">+5% Renewal</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA BUTTON */}
        {subscriptionPlans.length > 0 && (
          <button
            onClick={() => {
              if (!selectedPlan) return;
              let finalPrice = tierType === 'BASIC' ? selectedPlan.basicPrice : selectedPlan.ultraPrice;
              let discountPercentVal = 0;
              if (activeEvent && event?.discountPercent) discountPercentVal += event.discountPercent;
              if (isSubscribed) discountPercentVal += 5;
              if (activeStoreDiscount > 0) discountPercentVal += activeStoreDiscount;
              if (scoreDiscount > 0) discountPercentVal += scoreDiscount;
              if (discountPercentVal > 0) {
                if (discountPercentVal > 100) discountPercentVal = 100;
                finalPrice = Math.round(finalPrice * (1 - discountPercentVal / 100));
              }
              if (settings?.creditFreeEvent?.enabled) finalPrice = 0;
              initiatePurchase({ ...selectedPlan, finalPrice });
            }}
            className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group mb-3 ${
              isPro
                ? 'bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500 text-white shadow-cyan-500/30'
                : 'bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 text-white shadow-purple-500/30'
            }`}
          >
            <span className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12 pointer-events-none" />
            <span className="relative flex items-center justify-center gap-2">
              <Sparkles size={15} />
              Get {isPro ? 'PRO' : 'MAX'} — Abhi Unlock Karo
            </span>
          </button>
        )}

        {/* TRUST BADGES */}
        <div className="flex justify-center gap-5 mb-8 mt-2">
          {[
            { icon: <ShieldCheck size={13} />, text: 'Secure Payment' },
            { icon: <Flame size={13} />, text: 'Instant Access' },
            { icon: <Star size={13} />, text: 'Premium Support' },
          ].map(badge => (
            <div key={badge.text} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold">
              {badge.icon}
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
        </>)}

      </div>
    </div>
  );
};
