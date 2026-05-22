import React, { useState, useMemo } from 'react';
import { User, SystemSettings, SpinReward, SpinGameType } from '../types';
import { Trophy, Zap, Star, Lock, ChevronRight } from 'lucide-react';
import { CustomAlert } from './CustomDialogs';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
  settings?: SystemSettings;
}

const DEFAULT_REWARDS: SpinReward[] = [
  {id: '1', type: 'COINS', value: 0, label: '0', color: '#ef4444', probability: 20},
  {id: '2', type: 'COINS', value: 1, label: '1 CR', color: '#3b82f6', probability: 25},
  {id: '3', type: 'COINS', value: 2, label: '2 CR', color: '#22c55e', probability: 25},
  {id: '4', type: 'COINS', value: 5, label: '5 CR', color: '#a855f7', probability: 15},
  {id: '5', type: 'COINS', value: 10, label: '10 CR', color: '#f97316', probability: 10},
  {id: '6', type: 'COINS', value: 0, label: 'Try Again', color: '#fbbf24', probability: 5},
];

function pickWeightedRandom(rewards: SpinReward[]): number {
  const hasProbability = rewards.some(r => r.probability !== undefined && r.probability > 0);
  if (!hasProbability) return Math.floor(Math.random() * rewards.length);

  const total = rewards.reduce((s, r) => s + (r.probability || 0), 0);
  if (total === 0) return Math.floor(Math.random() * rewards.length);

  let rand = Math.random() * total;
  for (let i = 0; i < rewards.length; i++) {
    rand -= (rewards[i].probability || 0);
    if (rand <= 0) return i;
  }
  return rewards.length - 1;
}

interface SpinWheelCoreProps {
  user: User;
  onUpdateUser: (user: User) => void;
  rewards: SpinReward[];
  cost: number;
  dailyLimit: number;
  spinKey: string; // unique key per game type for tracking daily spins
  typeName: string;
  typeEmoji?: string;
}

const SpinWheelCore: React.FC<SpinWheelCoreProps> = ({ user, onUpdateUser, rewards, cost, dailyLimit, spinKey, typeName, typeEmoji }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultMessage, setResultMessage] = useState<React.ReactNode | null>(null);
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});

  const todayStr = new Date().toISOString().split('T')[0];

  const normalizedRewards: SpinReward[] = useMemo(() => {
    const raw = rewards || [];
    if (raw.length === 0) return DEFAULT_REWARDS;
    return raw.map((r: any, idx: number) => {
      if (typeof r === 'number') {
        const colors = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#fbbf24'];
        return { id: `legacy-${idx}`, type: 'COINS', value: r, label: r === 0 ? '0' : `${r} CR`, color: colors[idx % colors.length] };
      }
      return r;
    });
  }, [rewards]);

  const SEGMENT_COUNT = normalizedRewards.length;
  const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

  // Per-type daily spin tracking
  const spinDateKey = `dailySpinDate_${spinKey}`;
  const spinCountKey = `dailySpinCount_${spinKey}`;

  const storedDate = (user as any)[spinDateKey];
  const storedCount = (user as any)[spinCountKey];
  const spinsUsed = storedDate === todayStr ? (storedCount || 0) : 0;
  const remainingSpins = Math.max(0, dailyLimit - spinsUsed);
  const canSpin = remainingSpins > 0;

  const handleSpin = () => {
    if (!canSpin || isSpinning) return;
    if (cost > 0 && user.credits < cost) {
      setAlertConfig({isOpen: true, message: `Insufficient Credits! You need ${cost} Credits to spin.`});
      return;
    }

    setIsSpinning(true);
    setResultMessage(null);

    const winningIndex = pickWeightedRandom(normalizedRewards);
    const wonReward = normalizedRewards[winningIndex];

    if (typeof (window as any).recordActivity === 'function') {
      (window as any).recordActivity('GAME', `Spin Wheel (${typeName}): Played`, cost);
    }

    const extraSpins = 360 * 6;
    const segmentOffset = Math.floor(Math.random() * (SEGMENT_ANGLE - 4)) + 2;
    const finalRotation = extraSpins + (360 - (winningIndex * SEGMENT_ANGLE)) + segmentOffset;
    setRotation(prev => prev + finalRotation);

    setTimeout(() => {
      setIsSpinning(false);

      let msg: React.ReactNode;
      const isWin = (wonReward.type === 'COINS' && Number(wonReward.value) > 0) || wonReward.type === 'SUBSCRIPTION';

      if (isWin) {
        if (typeof (window as any).recordActivity === 'function') {
          (window as any).recordActivity('GAME', `Spin Wheel (${typeName}): Won ${wonReward.label}`, Number(wonReward.value));
        }
        msg = (
          <div className="flex flex-col items-center animate-bounce">
            <div className="text-4xl mb-2">🎉💎🎉</div>
            <div className="text-xl font-black text-green-600">You won {wonReward.label}!</div>
          </div>
        );
      } else {
        msg = (
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">😢</div>
            <div className="text-lg font-bold text-slate-600">Better luck next time!</div>
          </div>
        );
      }
      setResultMessage(msg);

      const updatedUser: any = {
        ...user,
        credits: user.credits - cost,
        [spinDateKey]: todayStr,
        [spinCountKey]: spinsUsed + 1,
        lastSpinTime: new Date().toISOString(),
      };

      if (wonReward.type === 'COINS') {
        updatedUser.credits += Number(wonReward.value);
      } else if (wonReward.type === 'SUBSCRIPTION') {
        const parts = String(wonReward.value).split('_');
        const tier = parts[0] as any;
        const level = parts[1] as any || 'BASIC';
        let days = 7;
        if (tier === 'MONTHLY') days = 30;
        if (tier === 'YEARLY') days = 365;
        if (tier === 'LIFETIME') days = 36500;
        updatedUser.subscriptionTier = tier;
        updatedUser.subscriptionLevel = level;
        updatedUser.subscriptionEndDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        updatedUser.isPremium = true;
        updatedUser.grantedByAdmin = true;
      } else if (wonReward.type === 'GIFT_CODE' && wonReward.giftCode) {
        const expiryMs = (wonReward.expiryHours || 48) * 60 * 60 * 1000;
        const expiresAt = new Date(Date.now() + expiryMs).toISOString();
        const codeMsg = {
          id: `giftcode-${Date.now()}`,
          text: `🎁 ${wonReward.label} — Aapka Gift Code: ${wonReward.giftCode}`,
          date: new Date().toISOString(),
          read: false,
          type: 'REWARD' as const,
          isClaimed: false,
          expiresAt,
          gift: { type: 'CREDITS' as const, value: 0 },
        };
        updatedUser.inbox = [codeMsg, ...(updatedUser.inbox || [])];
        msg = (
          <div className="flex flex-col items-center animate-bounce">
            <div className="text-4xl mb-2">🎁🎉🎁</div>
            <div className="text-xl font-black text-green-600">Gift Code jeeta! Mailbox check karo!</div>
          </div>
        );
      }

      onUpdateUser(updatedUser);
    }, 5000);
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in duration-500">
      <CustomAlert
        isOpen={alertConfig.isOpen}
        message={alertConfig.message}
        onClose={() => setAlertConfig({...alertConfig, isOpen: false})}
      />

      <div className="text-center mb-6 relative">
        <h2 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
          <span className="text-3xl">{typeEmoji || '🎰'}</span> {typeName}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase border ${cost === 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
            {cost === 0 ? 'Free Entry' : `Cost: ${cost} CR`}
          </span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase border border-blue-200">
            {remainingSpins} Spins Left
          </span>
        </div>
      </div>

      <div className="relative w-72 h-72 mb-8">
        <div className="absolute -inset-4 rounded-full bg-gradient-to-b from-slate-200 to-slate-50 border-4 border-slate-300 shadow-xl flex items-center justify-center">
          <div className="w-full h-full rounded-full border-4 border-dashed border-slate-300 opacity-50 animate-spin-slow" style={{ animationDuration: '20s' }}></div>
        </div>
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-10 h-12">
          <div className="w-full h-full bg-red-600 rounded-lg shadow-lg relative border-2 border-white">
            <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-red-600"></div>
          </div>
        </div>
        <div
          className="w-full h-full rounded-full border-8 border-slate-800 bg-slate-800 shadow-2xl relative overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? '5s' : '0s',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          {normalizedRewards.map((seg, idx) => {
            const rot = idx * SEGMENT_ANGLE;
            return (
              <div
                key={seg.id || idx}
                className="absolute top-0 left-1/2 w-[50%] h-[50%] origin-bottom-left"
                style={{ transform: `rotate(${rot}deg) skewY(-${90 - SEGMENT_ANGLE}deg)`, transformOrigin: '0% 100%' }}
              >
                <div
                  className="absolute inset-0 w-full h-full border-r border-slate-900/10"
                  style={{ backgroundColor: seg.color || '#3b82f6', transform: `skewY(${90 - SEGMENT_ANGLE}deg)`, transformOrigin: '0% 100%' }}
                >
                  <div
                    className="absolute top-[15%] left-[50%] -translate-x-1/2 font-black text-lg"
                    style={{ color: '#ffffff', transform: `rotate(${SEGMENT_ANGLE/2}deg)`, textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    <span className="text-sm whitespace-nowrap block rotate-90 mt-4">{seg.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute inset-0 m-auto w-16 h-16 bg-gradient-to-br from-white to-slate-200 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)] flex items-center justify-center z-10 border-4 border-slate-100">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shadow-inner">
            <Trophy className="text-yellow-400 drop-shadow-md" size={18} fill="currentColor" />
          </div>
        </div>
      </div>

      {resultMessage && (
        <div className="mb-6 p-6 rounded-2xl bg-white border-2 border-slate-100 shadow-xl text-center w-full max-w-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          {resultMessage}
        </div>
      )}

      {/* Probability Info */}
      {normalizedRewards.some(r => r.probability !== undefined) && (
        <div className="mb-4 w-full max-w-xs">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Win Chances</p>
          <div className="grid grid-cols-3 gap-1">
            {normalizedRewards.map((r, i) => (
              <div key={r.id || i} className="flex items-center gap-1 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color || '#ccc' }} />
                <span className="text-[9px] font-bold text-slate-600 truncate">{r.label}</span>
                <span className="text-[9px] font-black text-slate-400 ml-auto">{r.probability || 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {canSpin ? (
        <button
          onClick={handleSpin}
          disabled={isSpinning || (cost > 0 && user.credits < cost)}
          className="relative group bg-gradient-to-b from-yellow-400 to-orange-500 text-white text-xl font-black px-16 py-4 rounded-full shadow-[0_6px_0_#c2410c] active:shadow-[0_2px_0_#c2410c] active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <span className="relative z-10 drop-shadow-md tracking-wider flex items-center gap-2">
            {isSpinning ? 'GOOD LUCK...' : (cost > 0 ? `SPIN (${cost} CR)` : 'SPIN NOW')}
            {!isSpinning && <Zap fill="white" size={20} />}
          </span>
          <div className="absolute top-0 -left-full w-full h-full bg-white/30 -skew-x-12 group-hover:left-full transition-all duration-700 ease-in-out"></div>
        </button>
      ) : (
        <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-lg flex flex-col items-center border border-slate-700 w-full max-w-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1 tracking-widest">
            <Lock size={12} /> Daily Limit Reached
          </div>
          <div className="text-xl font-bold text-yellow-400 tracking-wider">{spinsUsed}/{dailyLimit} Used</div>
          <div className="mt-2 text-[10px] text-slate-600">Come back tomorrow!</div>
        </div>
      )}
    </div>
  );
};

export const SpinWheel: React.FC<Props> = ({ user, onUpdateUser, settings }) => {
  const spinGameTypes: SpinGameType[] = useMemo(() => {
    const types = settings?.spinGameTypes || [];
    if (types.length > 0) return types;

    // Fallback: single default type using legacy settings
    const raw = settings?.wheelRewards || [];
    const rewards: SpinReward[] = raw.length === 0
      ? DEFAULT_REWARDS
      : raw.map((r: any, idx: number) => {
          if (typeof r === 'number') {
            const colors = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#fbbf24'];
            return { id: `legacy-${idx}`, type: 'COINS', value: r, label: r === 0 ? '0' : `${r} CR`, color: colors[idx % colors.length] };
          }
          return r;
        });

    const cost = settings?.gameCost || 0;
    return [{
      id: 'default',
      name: cost === 0 ? 'Free Spin' : `${cost} CR Spin`,
      cost,
      emoji: cost === 0 ? '🆓' : '💎',
      description: cost === 0 ? 'Spin for free and win coins!' : `Spend ${cost} credits for a chance to win big!`,
      dailyLimitFree: settings?.spinLimitFree || 2,
      dailyLimitBasic: settings?.spinLimitBasic || 5,
      dailyLimitUltra: settings?.spinLimitUltra || 10,
      rewards,
      color: cost === 0 ? '#22c55e' : '#f97316',
    }];
  }, [settings]);

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  const selectedType = selectedTypeId
    ? spinGameTypes.find(t => t.id === selectedTypeId)
    : spinGameTypes.length === 1
      ? spinGameTypes[0]
      : null;

  const getDailyLimit = (type: SpinGameType) => {
    if (!user.isPremium) return type.dailyLimitFree ?? settings?.spinLimitFree ?? 2;
    if (user.grantedByAdmin) return type.dailyLimitFree ?? settings?.spinLimitFree ?? 2;
    if (user.subscriptionLevel === 'ULTRA') return type.dailyLimitUltra ?? settings?.spinLimitUltra ?? 10;
    return type.dailyLimitBasic ?? settings?.spinLimitBasic ?? 5;
  };

  if (spinGameTypes.length === 1 || selectedType) {
    const type = selectedType || spinGameTypes[0];
    return (
      <div>
        {spinGameTypes.length > 1 && (
          <button
            onClick={() => setSelectedTypeId(null)}
            className="mx-4 mb-2 flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            ← Back to Games
          </button>
        )}
        <SpinWheelCore
          user={user}
          onUpdateUser={onUpdateUser}
          rewards={type.rewards}
          cost={type.cost}
          dailyLimit={getDailyLimit(type)}
          spinKey={type.id}
          typeName={type.name}
          typeEmoji={type.emoji}
        />
      </div>
    );
  }

  // Game type selection grid
  return (
    <div className="px-4 py-4 animate-in fade-in duration-300">
      <h3 className="text-lg font-black text-slate-800 mb-1 text-center">Choose Your Game</h3>
      <p className="text-xs text-slate-500 text-center mb-5">Different games, different rewards!</p>
      <div className="grid grid-cols-1 gap-3">
        {spinGameTypes.map(type => {
          const limit = getDailyLimit(type);
          const todayStr = new Date().toISOString().split('T')[0];
          const storedDate = (user as any)[`dailySpinDate_${type.id}`];
          const storedCount = (user as any)[`dailySpinCount_${type.id}`];
          const spinsUsed = storedDate === todayStr ? (storedCount || 0) : 0;
          const remaining = Math.max(0, limit - spinsUsed);

          return (
            <button
              key={type.id}
              onClick={() => setSelectedTypeId(type.id)}
              className="flex items-center gap-4 p-4 rounded-2xl border-2 shadow-sm text-left transition-all active:scale-95 hover:shadow-md bg-white"
              style={{ borderColor: type.color || '#e2e8f0' }}
            >
              <div className="text-3xl shrink-0">{type.emoji || '🎰'}</div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 text-sm">{type.name}</p>
                {type.description && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{type.description}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${type.cost === 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                    {type.cost === 0 ? 'FREE' : `${type.cost} CR`}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">{remaining}/{limit} spins today</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
