import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonHeader } from '@/components/NeonHeader';
import { PlayingCard, CardSelector } from '@/components/PlayingCard';
import { ActionRecommendation } from '@/components/ActionRecommendation';
import { SessionStats, type SessionData } from '@/components/SessionStats';
import { CardTracker } from '@/components/CardTracker';
import { HitProbability } from '@/components/HitProbability';
import { SideBetPrediction } from '@/components/SideBetPrediction';
import { TableCards } from '@/components/TableCards';
import { CameraScanner, type ScanResult } from '@/components/CameraScanner';
import { ScreenScanner } from '@/components/ScreenScanner';
import { QuickAction } from '@/components/QuickAction';
import { HeatIndex } from '@/components/HeatIndex';
import { AggressionSelector } from '@/components/AggressionSelector';
import { DealerVolatility } from '@/components/DealerVolatility';
import { InsuranceAnalysis } from '@/components/InsuranceAnalysis';
import { BetSizing } from '@/components/BetSizing';
import { ProfitStrategy, type BettingStrategy } from '@/components/ProfitStrategy';
import { SoundToggle } from '@/components/SoundToggle';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { TrialCountdown } from '@/components/TrialCountdown';
import { UsageIndicator } from '@/components/UsageIndicator';
import { useAuth } from '@/hooks/useAuth';
import { analyzeHand, calculateHandTotal, getDealerBustProbability, type HandAnalysis } from '@/lib/blackjackStrategy';
import { 
  createDeckState, 
  trackCard, 
  untrackCard, 
  getSideBetPredictions,
  getTrueCount,
  getHighCardProbability,
  getLowCardProbability,
  getTotalRemaining,
  type DeckState 
} from '@/lib/cardTracker';
import { calculateHeatIndex, type AggressionMode, type CISAnalysis } from '@/lib/cisEngine';
import { initializeSecurity, generateWatermark } from '@/lib/security';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';
import { Shield, Eye, EyeOff, Settings, LogOut, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const initialSession: SessionData = {
  wins: 0, losses: 0, pushes: 0, blackjacks: 0, currentStreak: 0, handsPlayed: 0,
};

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, getUsageLimits, canUseCIS, refetchProfile } = useAuth();
  
  const [playerCards, setPlayerCards] = useState<string[]>([]);
  const [dealerUpcard, setDealerUpcard] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<HandAnalysis | null>(null);
  const [cisAnalysis, setCisAnalysis] = useState<CISAnalysis | null>(null);
  const [session, setSession] = useState<SessionData>(initialSession);
  const [activeInput, setActiveInput] = useState<'player' | 'dealer'>('player');
  const [deckState, setDeckState] = useState<DeckState>(() => createDeckState(6));
  const [numDecks, setNumDecks] = useState(6);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [aggressionMode, setAggressionMode] = useState<AggressionMode>('standard');
  const [baseUnit, setBaseUnit] = useState(25);
  const [securityBadge] = useState(() => generateWatermark());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [screenCaptureActive, setScreenCaptureActive] = useState(false);
  const [turboMode, setTurboMode] = useState(false);
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [allSeenCards, setAllSeenCards] = useState<Set<string>>(new Set()); // Track all cards seen during session
  const [bettingStrategy, setBettingStrategy] = useState<BettingStrategy>('flat');
  const [bankroll, setBankroll] = useState(500);
  const { playSound, playWinFanfare, playBlackjackFanfare, setEnabled, announceAction, announceNewCards, setSpeechEnabled } = useSoundEffects();
  const [speechEnabled, setSpeechEnabledState] = useState(true);
  const lastAnnouncedActionRef = useRef<string | null>(null);

  // Calculate current bet based on strategy
  const currentBet = useMemo(() => {
    const streak = session.currentStreak;
    switch (bettingStrategy) {
      case 'martingale':
        if (streak < 0) return baseUnit * Math.min(Math.pow(2, Math.abs(streak)), 8);
        return baseUnit;
      case 'paroli':
        if (streak > 0 && streak < 3) return baseUnit * Math.pow(2, streak);
        return baseUnit;
      case '1-3-2-6':
        const sequence = [1, 3, 2, 6];
        if (streak > 0 && streak <= 4) return baseUnit * sequence[(streak - 1) % 4];
        return baseUnit;
      default:
        return baseUnit;
    }
  }, [bettingStrategy, baseUnit, session.currentStreak]);

  const isPremium = profile?.tier !== 'free';

  useEffect(() => { initializeSecurity(); }, []);
  // Speech only enabled for premium users
  useEffect(() => { 
    setEnabled(soundEnabled); 
    setSpeechEnabled(soundEnabled && speechEnabled && isPremium); 
  }, [soundEnabled, speechEnabled, isPremium, setEnabled, setSpeechEnabled]);
  
  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, user, navigate]);

  const usageLimits = getUsageLimits();

  const tableState = useMemo(() => ({
    trueCount: getTrueCount(deckState),
    penetration: deckState.penetration,
    highCardRatio: getHighCardProbability(deckState),
    lowCardRatio: getLowCardProbability(deckState),
    decksRemaining: getTotalRemaining(deckState) / 52,
  }), [deckState]);

  const heatIndex = useMemo(() => calculateHeatIndex(tableState), [tableState]);
  const sideBetPrediction = getSideBetPredictions(deckState, playerCards[0]);

  // Call server-side CIS evaluation (enforces usage limits)
  const callCISEvaluate = useCallback(async (cards: string[], dealer: string) => {
    if (!canUseCIS()) {
      toast.error('Daily CIS limit reached. Upgrade for unlimited access.');
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('cis-evaluate', {
        body: {
          player_cards: cards,
          dealer_card: dealer,
          aggression_mode: aggressionMode,
          true_count: tableState.trueCount,
          cards_seen: Math.round((1 - deckState.penetration) * numDecks * 52)
        }
      });
      
      if (error) throw error;
      
      if (data.error === 'Daily CIS limit reached') {
        toast.error('Daily CIS limit reached. Upgrade for unlimited access.');
        refetchProfile();
        return;
      }
      
      setCisAnalysis(data as CISAnalysis);
      refetchProfile(); // Update usage display
    } catch (err) {
      console.error('CIS evaluation error:', err);
    }
  }, [aggressionMode, tableState.trueCount, deckState.penetration, numDecks, canUseCIS, refetchProfile]);

  useEffect(() => {
    if (analysis && playerCards.length >= 2 && dealerUpcard) {
      callCISEvaluate(playerCards, dealerUpcard);
    } else {
      setCisAnalysis(null);
    }
  }, [analysis, playerCards, dealerUpcard]);

  // Show quick action overlay in turbo mode
  useEffect(() => {
    if (turboMode && (cameraActive || screenCaptureActive) && analysis) {
      setShowQuickAction(true);
      const timer = setTimeout(() => setShowQuickAction(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowQuickAction(false);
    }
  }, [turboMode, cameraActive, screenCaptureActive, analysis?.action]);

  // Announce action recommendation when it changes during scanning
  useEffect(() => {
    if ((cameraActive || screenCaptureActive) && analysis?.action) {
      const action = cisAnalysis?.action || analysis.action;
      if (action && action !== lastAnnouncedActionRef.current) {
        lastAnnouncedActionRef.current = action;
        announceAction(action, analysis.confidence);
      }
    }
  }, [cameraActive, screenCaptureActive, analysis?.action, cisAnalysis?.action, analysis?.confidence, announceAction]);

  const handleCardSelect = useCallback((value: string) => {
    playSound('cardSelect');
    if (activeInput === 'player' && playerCards.length < 6) {
      const newCards = [...playerCards, value];
      setPlayerCards(newCards);
      setDeckState(prev => trackCard(prev, value));
      if (dealerUpcard && newCards.length >= 2) setAnalysis(analyzeHand(newCards, dealerUpcard));
    } else if (activeInput === 'dealer') {
      if (dealerUpcard) setDeckState(prev => untrackCard(prev, dealerUpcard));
      setDealerUpcard(value);
      setDeckState(prev => trackCard(prev, value));
      if (playerCards.length >= 2) setAnalysis(analyzeHand(playerCards, value));
    }
  }, [activeInput, playerCards, dealerUpcard, playSound]);

  const handleRemoveCard = useCallback((index: number) => {
    playSound('cardDeselect');
    const card = playerCards[index];
    const newCards = playerCards.filter((_, i) => i !== index);
    setPlayerCards(newCards);
    setDeckState(prev => untrackCard(prev, card));
    if (dealerUpcard && newCards.length >= 2) setAnalysis(analyzeHand(newCards, dealerUpcard));
    else setAnalysis(null);
  }, [playerCards, dealerUpcard, playSound]);

  const handleClearHand = useCallback(() => {
    // Clear current hand display only, keep deck state for card counting
    setPlayerCards([]); setDealerUpcard(null); setAnalysis(null); setCisAnalysis(null); setActiveInput('player');
  }, []);

  const handleResetDeck = useCallback(() => { setDeckState(createDeckState(numDecks)); setAllSeenCards(new Set()); }, [numDecks]);
  const handleDeckChange = useCallback((d: number) => { setNumDecks(d); setDeckState(createDeckState(d)); setAllSeenCards(new Set()); }, []);
  const handleTableCardPlayed = useCallback((card: string) => setDeckState(prev => trackCard(prev, card)), []);
  const handleTableCardRemoved = useCallback((card: string) => setDeckState(prev => untrackCard(prev, card)), []);

  const handleCardsDetected = useCallback((result: ScanResult) => {
    // Accumulative card tracking - only track NEW cards that haven't been seen
    const currentScanCards: string[] = [];
    
    // Collect all cards from this scan
    if (result.player_cards) currentScanCards.push(...result.player_cards);
    if (result.dealer_card) currentScanCards.push(result.dealer_card);
    if (result.dealer_hole_card) currentScanCards.push(result.dealer_hole_card);
    if (result.other_cards) currentScanCards.push(...result.other_cards);
    
    // Find cards that are NEW (not seen before in this session)
    const newCards = currentScanCards.filter(card => !allSeenCards.has(card));
    
    if (newCards.length > 0) {
      playSound('cardSelect');
      
      // Announce new cards being tracked
      announceNewCards(newCards);
      
      // Add new cards to the seen set
      setAllSeenCards(prev => {
        const updated = new Set(prev);
        newCards.forEach(card => updated.add(card));
        return updated;
      });
      
      // Track new cards in deck state
      newCards.forEach(card => setDeckState(prev => trackCard(prev, card)));
    }
    
    // Always update current hand display (player cards + dealer card for strategy)
    const newPlayerCards = result.player_cards || [];
    if (newPlayerCards.length > 0 || result.dealer_card) {
      // Only update displayed hand if we have cards
      if (newPlayerCards.length > 0) {
        setPlayerCards(newPlayerCards);
      }
      
      if (result.dealer_card) {
        setDealerUpcard(result.dealer_card);
      }
      
      // Analyze if we have enough cards
      if (newPlayerCards.length >= 2 && result.dealer_card) {
        setAnalysis(analyzeHand(newPlayerCards, result.dealer_card));
      }
    }
  }, [allSeenCards, playSound, announceNewCards]);

  const handleRecordResult = useCallback((result: 'win' | 'loss' | 'push' | 'blackjack') => {
    if (result === 'blackjack') playBlackjackFanfare();
    else if (result === 'win') playWinFanfare();
    else if (result === 'loss') playSound('lose');
    else playSound('push');
    
    setSession(prev => {
      const n = { ...prev, handsPlayed: prev.handsPlayed + 1 };
      if (result === 'win') { n.wins++; n.currentStreak = prev.currentStreak >= 0 ? prev.currentStreak + 1 : 1; }
      else if (result === 'loss') { n.losses++; n.currentStreak = prev.currentStreak <= 0 ? prev.currentStreak - 1 : -1; }
      else if (result === 'push') n.pushes++;
      else { n.blackjacks++; n.currentStreak = prev.currentStreak >= 0 ? prev.currentStreak + 1 : 1; }
      return n;
    });
    handleClearHand();
  }, [handleClearHand, playSound, playWinFanfare, playBlackjackFanfare]);

  const handleScanOutcome = useCallback((outcome: 'win' | 'loss' | 'push' | 'blackjack') => {
    handleRecordResult(outcome);
    toast.success(`Hand recorded: ${outcome.toUpperCase()}`, {
      description: 'Detected from camera scan'
    });
  }, [handleRecordResult]);

  const handleSideBetWin = useCallback((betType: string) => {
    toast.success(`Side Bet Win: ${betType}!`, {
      description: 'Detected from table scan',
      duration: 4000,
    });
    playSound('cardSelect');
  }, [playSound]);

  const handleResetSession = useCallback(() => { setSession(initialSession); setDeckState(createDeckState(numDecks)); setAllSeenCards(new Set()); }, [numDecks]);
  const { total, soft } = playerCards.length >= 1 ? calculateHandTotal(playerCards) : { total: 0, soft: false };
  const bustProbability = dealerUpcard ? getDealerBustProbability(dealerUpcard) : 0;

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      {/* Quick Action Overlay for Turbo Mode */}
      <QuickAction 
        action={cisAnalysis?.action || analysis?.action || null}
        isVisible={showQuickAction && turboMode && (cameraActive || screenCaptureActive)}
        confidence={analysis?.confidence}
      />
      
      <div className="fixed inset-0 pointer-events-none"><div className="scan-line absolute inset-0" /></div>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {profile && <SubscriptionBadge tier={profile.tier} />}
        {profile?.tier === 'free' && <TrialCountdown createdAt={profile.created_at} />}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
          <Shield className="w-3 h-3 text-green-400" /><span className="text-[10px] text-green-400 font-mono">{securityBadge}</span>
        </div>
        {user && (
          <button 
            onClick={() => { signOut(); navigate('/auth'); }} 
            className="p-2 rounded-full bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="relative z-10 container mx-auto px-3 py-3 max-w-7xl">
        <NeonHeader />

        <div className="flex items-center justify-between mt-3 mb-3 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Decks:</span>
            <div className="flex gap-1">
              {[1, 2, 4, 6, 8].map(d => (
                <button key={d} onClick={() => handleDeckChange(d)} className={cn('w-7 h-7 rounded text-xs font-display transition-all', numDecks === d ? 'bg-primary text-primary-foreground shadow-neon' : 'bg-secondary text-muted-foreground hover:text-foreground')}>{d}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 max-w-sm"><AggressionSelector value={aggressionMode} onChange={setAggressionMode} /></div>
          <div className="flex items-center gap-2">
            <SoundToggle enabled={soundEnabled} onToggle={() => { playSound('click'); setSoundEnabled(!soundEnabled); }} />
            <button 
              onClick={() => { 
                if (!isPremium) return;
                playSound('click'); 
                setSpeechEnabledState(!speechEnabled); 
              }} 
              className={cn(
                'p-1.5 rounded-lg border transition-all relative',
                !isPremium 
                  ? 'border-border bg-secondary text-muted-foreground opacity-50 cursor-not-allowed' 
                  : speechEnabled 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              )}
              title={!isPremium ? 'Voice announcements (Premium feature)' : speechEnabled ? 'Voice announcements on' : 'Voice announcements off'}
            >
              {speechEnabled && isPremium ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {!isPremium && (
                <span className="absolute -top-1 -right-1 text-[6px] bg-yellow-500 text-yellow-950 px-1 rounded font-bold">PRO</span>
              )}
            </button>
            <button onClick={() => { playSound('click'); setShowSettings(!showSettings); }} className={cn('p-1.5 rounded-lg border transition-all', showSettings ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground')}><Settings className="w-4 h-4" /></button>
            <button onClick={() => { playSound('click'); setShowAdvanced(!showAdvanced); }} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border bg-secondary text-xs text-muted-foreground hover:text-primary transition-colors">
              {showAdvanced ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}{showAdvanced ? 'Simple' : 'Advanced'}
            </button>
          </div>
        </div>

        <AnimatePresence>{showSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden">
            <div className="p-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
              <BetSizing heatIndex={heatIndex} trueCount={tableState.trueCount} baseUnit={baseUnit} aggressionMode={aggressionMode} onBaseUnitChange={setBaseUnit} />
            </div>
          </motion.div>
        )}</AnimatePresence>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm card-glow">
              {profile?.tier === 'free' && (
                <div className="px-2 py-1 mb-3 rounded border border-yellow-500/30 bg-yellow-500/10 text-[10px] text-yellow-400 uppercase tracking-wider">
                  Trial Feature — Requires paid subscription
                </div>
              )}
              <div className="flex gap-2 flex-wrap mb-4">
                <CameraScanner 
                  onCardsDetected={handleCardsDetected} 
                  onOutcomeDetected={handleScanOutcome}
                  onSideBetWin={handleSideBetWin}
                  isActive={cameraActive} 
                  onToggle={() => { setCameraActive(!cameraActive); if (screenCaptureActive) setScreenCaptureActive(false); }}
                  isPremium={isPremium}
                  turboMode={turboMode}
                  onTurboToggle={() => setTurboMode(!turboMode)}
                />
                <ScreenScanner 
                  onCardsDetected={handleCardsDetected} 
                  onOutcomeDetected={handleScanOutcome}
                  onSideBetWin={handleSideBetWin}
                  isActive={screenCaptureActive} 
                  onToggle={() => { setScreenCaptureActive(!screenCaptureActive); if (cameraActive) setCameraActive(false); }}
                  isPremium={isPremium}
                  turboMode={turboMode}
                  onTurboToggle={() => setTurboMode(!turboMode)}
                />
              </div>
              <div className="flex gap-2 mb-4 mt-4">
                <button onClick={() => setActiveInput('player')} className={cn('flex-1 py-2 px-3 rounded-lg font-display text-sm uppercase tracking-wider transition-all', activeInput === 'player' ? 'bg-primary text-primary-foreground shadow-neon' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}>Your Hand {playerCards.length > 0 && `(${playerCards.length})`}</button>
                <button onClick={() => setActiveInput('dealer')} className={cn('flex-1 py-2 px-3 rounded-lg font-display text-sm uppercase tracking-wider transition-all', activeInput === 'dealer' ? 'bg-primary text-primary-foreground shadow-neon' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}>Dealer {dealerUpcard && `(${dealerUpcard})`}</button>
              </div>
              <CardSelector onSelect={handleCardSelect} selectedCards={[]} />
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Cards {total > 0 && <span className="text-primary">({total}{soft && ' soft'})</span>}</p>
                    <div className="flex gap-1.5 flex-wrap min-h-[60px]">
                      <AnimatePresence mode="popLayout">{playerCards.map((card, i) => (<motion.div key={`${card}-${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} layout><PlayingCard value={card} size="sm" onClick={() => handleRemoveCard(i)} /></motion.div>))}</AnimatePresence>
                      {playerCards.length === 0 && <div className="flex items-center justify-center w-10 h-14 rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs">+</div>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Dealer Shows</p>
                    <div className="flex gap-1.5 min-h-[60px]">
                      {dealerUpcard ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><PlayingCard value={dealerUpcard} size="sm" selected onClick={() => { setDeckState(prev => untrackCard(prev, dealerUpcard)); setDealerUpcard(null); }} /></motion.div> : <div className="flex items-center justify-center w-10 h-14 rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs">?</div>}
                      <PlayingCard value="?" faceDown size="sm" />
                    </div>
                  </div>
                </div>
                {(playerCards.length > 0 || dealerUpcard) && <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleClearHand} className="mt-3 text-xs text-muted-foreground hover:text-destructive transition-colors uppercase tracking-wider">Clear Hand</motion.button>}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm card-glow">
              <ActionRecommendation analysis={analysis} playerTotal={total} isSoft={soft} cisOverride={cisAnalysis?.cisOverride} heatIndex={heatIndex} riskLevel={cisAnalysis?.riskLevel || 'medium'} />
            </motion.div>

            {/* Insurance Analysis - shows when dealer has Ace */}
            <InsuranceAnalysis 
              deckState={deckState} 
              dealerUpcard={dealerUpcard} 
              isPremium={profile?.tier !== 'free' || true}
            />

            <AnimatePresence>{showAdvanced && (<>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-display font-bold text-primary uppercase tracking-wider">Side Bet Predictions</h3>
                    {profile?.tier === 'free' && <span className="text-[8px] text-yellow-400 uppercase">Trial Feature</span>}
                  </div>
                  <SideBetPrediction prediction={sideBetPrediction} />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm"><TableCards onCardPlayed={handleTableCardPlayed} onCardRemoved={handleTableCardRemoved} /></div>
              </motion.div>
            </>)}</AnimatePresence>
          </div>

          <div className="space-y-3">
            {profile && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
                <h3 className="text-xs font-display font-bold text-primary mb-2 uppercase tracking-wider">Usage</h3>
                <UsageIndicator 
                  used={profile.daily_cis_used} 
                  limit={usageLimits.daily_cis} 
                  type="CIS"
                  xp={profile.xp}
                  rank={profile.rank}
                />
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm"><h3 className="text-xs font-display font-bold text-primary mb-2 uppercase tracking-wider">Heat Index</h3><HeatIndex heat={heatIndex} trueCount={tableState.trueCount} /></motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="p-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-display font-bold text-primary uppercase tracking-wider">Dealer Analysis</h3>
                {profile?.tier === 'free' && <span className="text-[8px] text-yellow-400 uppercase">Trial</span>}
              </div>
              <DealerVolatility dealerUpcard={dealerUpcard} bustProbability={bustProbability} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }} className="p-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-display font-bold text-primary uppercase tracking-wider">Hit Probability</h3>
                {profile?.tier === 'free' && <span className="text-[8px] text-yellow-400 uppercase">Trial</span>}
              </div>
              <HitProbability 
                deckState={deckState} 
                currentTotal={total > 0 ? total : null} 
                isSoft={soft} 
                isPremium={profile?.tier !== 'free' || true} 
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="p-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm"><h3 className="text-xs font-display font-bold text-primary mb-2 uppercase tracking-wider">Card Counter</h3><CardTracker deckState={deckState} onReset={handleResetDeck} /></motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }} className="p-3 rounded-xl border border-primary/30 bg-card/80 backdrop-blur-sm">
              <h3 className="text-xs font-display font-bold text-primary mb-2 uppercase tracking-wider">Profit Strategy</h3>
              <ProfitStrategy
                baseUnit={baseUnit}
                currentBet={currentBet}
                session={session}
                trueCount={tableState.trueCount}
                heatIndex={heatIndex}
                activeStrategy={bettingStrategy}
                onStrategyChange={setBettingStrategy}
                bankroll={bankroll}
                onBankrollChange={setBankroll}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }} className="p-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm"><SessionStats session={session} onRecordResult={handleRecordResult} onReset={handleResetSession} /></motion.div>
          </div>
        </div>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-center">
          <p className="text-muted-foreground/50 text-xs uppercase tracking-wider">Syndicate Supremacy • Neon21 CIS Intelligence • Play Responsibly</p>
        </motion.footer>
      </div>
    </div>
  );
}
