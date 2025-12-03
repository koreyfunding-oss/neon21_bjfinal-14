import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonHeader } from '@/components/NeonHeader';
import { PlayingCard, CardSelector } from '@/components/PlayingCard';
import { ActionRecommendation } from '@/components/ActionRecommendation';
import { SessionStats, type SessionData } from '@/components/SessionStats';
import { CardTracker } from '@/components/CardTracker';
import { SideBetPrediction } from '@/components/SideBetPrediction';
import { TableCards } from '@/components/TableCards';
import { HeatIndex } from '@/components/HeatIndex';
import { AggressionSelector } from '@/components/AggressionSelector';
import { DealerVolatility } from '@/components/DealerVolatility';
import { BetSizing } from '@/components/BetSizing';
import { SoundToggle } from '@/components/SoundToggle';
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
import { analyzeCIS, calculateHeatIndex, type AggressionMode, type CISAnalysis } from '@/lib/cisEngine';
import { initializeSecurity, generateWatermark } from '@/lib/security';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { cn } from '@/lib/utils';
import { Shield, Eye, EyeOff, Settings } from 'lucide-react';

const initialSession: SessionData = {
  wins: 0, losses: 0, pushes: 0, blackjacks: 0, currentStreak: 0, handsPlayed: 0,
};

export default function Index() {
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
  const { playSound, playWinFanfare, playBlackjackFanfare, setEnabled } = useSoundEffects();

  useEffect(() => { initializeSecurity(); }, []);
  useEffect(() => { setEnabled(soundEnabled); }, [soundEnabled, setEnabled]);

  const tableState = useMemo(() => ({
    trueCount: getTrueCount(deckState),
    penetration: deckState.penetration,
    highCardRatio: getHighCardProbability(deckState),
    lowCardRatio: getLowCardProbability(deckState),
    decksRemaining: getTotalRemaining(deckState) / 52,
  }), [deckState]);

  const heatIndex = useMemo(() => calculateHeatIndex(tableState), [tableState]);
  const sideBetPrediction = getSideBetPredictions(deckState, playerCards[0]);

  useEffect(() => {
    if (analysis && playerCards.length >= 2 && dealerUpcard) {
      setCisAnalysis(analyzeCIS(playerCards, dealerUpcard, tableState, aggressionMode, analysis));
    } else {
      setCisAnalysis(null);
    }
  }, [analysis, playerCards, dealerUpcard, tableState, aggressionMode]);

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
    playerCards.forEach(card => setDeckState(prev => untrackCard(prev, card)));
    if (dealerUpcard) setDeckState(prev => untrackCard(prev, dealerUpcard));
    setPlayerCards([]); setDealerUpcard(null); setAnalysis(null); setCisAnalysis(null); setActiveInput('player');
  }, [playerCards, dealerUpcard]);

  const handleResetDeck = useCallback(() => setDeckState(createDeckState(numDecks)), [numDecks]);
  const handleDeckChange = useCallback((d: number) => { setNumDecks(d); setDeckState(createDeckState(d)); }, []);
  const handleTableCardPlayed = useCallback((card: string) => setDeckState(prev => trackCard(prev, card)), []);
  const handleTableCardRemoved = useCallback((card: string) => setDeckState(prev => untrackCard(prev, card)), []);

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

  const handleResetSession = useCallback(() => { setSession(initialSession); setDeckState(createDeckState(numDecks)); }, [numDecks]);
  const { total, soft } = playerCards.length >= 1 ? calculateHandTotal(playerCards) : { total: 0, soft: false };
  const bustProbability = dealerUpcard ? getDealerBustProbability(dealerUpcard) : 0;

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"><div className="scan-line absolute inset-0" /></div>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
        <Shield className="w-3 h-3 text-green-400" /><span className="text-[10px] text-green-400 font-mono">{securityBadge}</span>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        <NeonHeader />

        <div className="flex items-center justify-between mt-6 mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Decks:</span>
            <div className="flex gap-1">
              {[1, 2, 4, 6, 8].map(d => (
                <button key={d} onClick={() => handleDeckChange(d)} className={cn('w-8 h-8 rounded text-xs font-display transition-all', numDecks === d ? 'bg-primary text-primary-foreground shadow-neon' : 'bg-secondary text-muted-foreground hover:text-foreground')}>{d}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 max-w-md"><AggressionSelector value={aggressionMode} onChange={setAggressionMode} /></div>
          <div className="flex items-center gap-2">
            <SoundToggle enabled={soundEnabled} onToggle={() => { playSound('click'); setSoundEnabled(!soundEnabled); }} />
            <button onClick={() => { playSound('click'); setShowSettings(!showSettings); }} className={cn('p-2 rounded-lg border transition-all', showSettings ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground')}><Settings className="w-4 h-4" /></button>
            <button onClick={() => { playSound('click'); setShowAdvanced(!showAdvanced); }} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary text-xs text-muted-foreground hover:text-primary transition-colors">
              {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{showAdvanced ? 'Simple' : 'Advanced'}
            </button>
          </div>
        </div>

        <AnimatePresence>{showSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
              <BetSizing heatIndex={heatIndex} trueCount={tableState.trueCount} baseUnit={baseUnit} aggressionMode={aggressionMode} onBaseUnitChange={setBaseUnit} />
            </div>
          </motion.div>
        )}</AnimatePresence>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm card-glow">
              <div className="flex gap-2 mb-6">
                <button onClick={() => setActiveInput('player')} className={cn('flex-1 py-2 px-4 rounded-lg font-display text-sm uppercase tracking-wider transition-all', activeInput === 'player' ? 'bg-primary text-primary-foreground shadow-neon' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}>Your Hand {playerCards.length > 0 && `(${playerCards.length})`}</button>
                <button onClick={() => setActiveInput('dealer')} className={cn('flex-1 py-2 px-4 rounded-lg font-display text-sm uppercase tracking-wider transition-all', activeInput === 'dealer' ? 'bg-primary text-primary-foreground shadow-neon' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80')}>Dealer {dealerUpcard && `(${dealerUpcard})`}</button>
              </div>
              <CardSelector onSelect={handleCardSelect} selectedCards={[]} />
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Your Cards {total > 0 && <span className="text-primary">({total}{soft && ' soft'})</span>}</p>
                    <div className="flex gap-2 flex-wrap min-h-[72px]">
                      <AnimatePresence mode="popLayout">{playerCards.map((card, i) => (<motion.div key={`${card}-${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} layout><PlayingCard value={card} size="sm" onClick={() => handleRemoveCard(i)} /></motion.div>))}</AnimatePresence>
                      {playerCards.length === 0 && <div className="flex items-center justify-center w-12 h-16 rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs">+</div>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Dealer Shows</p>
                    <div className="flex gap-2 min-h-[72px]">
                      {dealerUpcard ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><PlayingCard value={dealerUpcard} size="sm" selected onClick={() => { setDeckState(prev => untrackCard(prev, dealerUpcard)); setDealerUpcard(null); }} /></motion.div> : <div className="flex items-center justify-center w-12 h-16 rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs">?</div>}
                      <PlayingCard value="?" faceDown size="sm" />
                    </div>
                  </div>
                </div>
                {(playerCards.length > 0 || dealerUpcard) && <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleClearHand} className="mt-4 text-xs text-muted-foreground hover:text-destructive transition-colors uppercase tracking-wider">Clear Hand</motion.button>}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm card-glow">
              <ActionRecommendation analysis={analysis} playerTotal={total} isSoft={soft} cisOverride={cisAnalysis?.cisOverride} heatIndex={heatIndex} riskLevel={cisAnalysis?.riskLevel || 'medium'} />
            </motion.div>

            <AnimatePresence>{showAdvanced && (<>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"><h3 className="text-sm font-display font-bold text-primary mb-4 uppercase tracking-wider">Side Bet Predictions</h3><SideBetPrediction prediction={sideBetPrediction} /></div>
              </motion.div>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"><TableCards onCardPlayed={handleTableCardPlayed} onCardRemoved={handleTableCardRemoved} /></div>
              </motion.div>
            </>)}</AnimatePresence>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"><h3 className="text-sm font-display font-bold text-primary mb-4 uppercase tracking-wider">Heat Index</h3><HeatIndex heat={heatIndex} trueCount={tableState.trueCount} /></motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"><h3 className="text-sm font-display font-bold text-primary mb-4 uppercase tracking-wider">Dealer Analysis</h3><DealerVolatility dealerUpcard={dealerUpcard} bustProbability={bustProbability} /></motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"><h3 className="text-sm font-display font-bold text-primary mb-4 uppercase tracking-wider">Card Counter</h3><CardTracker deckState={deckState} onReset={handleResetDeck} /></motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"><SessionStats session={session} onRecordResult={handleRecordResult} onReset={handleResetSession} /></motion.div>
          </div>
        </div>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 text-center">
          <p className="text-muted-foreground/50 text-xs uppercase tracking-wider">Syndicate Supremacy • Neon21 CIS Intelligence • Play Responsibly</p>
        </motion.footer>
      </div>
    </div>
  );
}
