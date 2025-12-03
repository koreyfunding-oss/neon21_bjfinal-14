import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonHeader } from '@/components/NeonHeader';
import { PlayingCard, CardSelector } from '@/components/PlayingCard';
import { ActionRecommendation } from '@/components/ActionRecommendation';
import { SessionStats, type SessionData } from '@/components/SessionStats';
import { DealerProbability } from '@/components/DealerProbability';
import { CardTracker } from '@/components/CardTracker';
import { SideBetPrediction } from '@/components/SideBetPrediction';
import { TableCards } from '@/components/TableCards';
import { analyzeHand, calculateHandTotal, type HandAnalysis } from '@/lib/blackjackStrategy';
import { 
  createDeckState, 
  trackCard, 
  untrackCard, 
  getSideBetPredictions,
  type DeckState 
} from '@/lib/cardTracker';
import { initializeSecurity, generateWatermark } from '@/lib/security';
import { cn } from '@/lib/utils';
import { Shield, Eye, EyeOff } from 'lucide-react';

const initialSession: SessionData = {
  wins: 0,
  losses: 0,
  pushes: 0,
  blackjacks: 0,
  currentStreak: 0,
  handsPlayed: 0,
};

export default function Index() {
  const [playerCards, setPlayerCards] = useState<string[]>([]);
  const [dealerUpcard, setDealerUpcard] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<HandAnalysis | null>(null);
  const [session, setSession] = useState<SessionData>(initialSession);
  const [activeInput, setActiveInput] = useState<'player' | 'dealer'>('player');
  const [deckState, setDeckState] = useState<DeckState>(() => createDeckState(6));
  const [numDecks, setNumDecks] = useState(6);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [securityBadge] = useState(() => generateWatermark());

  // Initialize security on mount
  useEffect(() => {
    initializeSecurity();
  }, []);

  const sideBetPrediction = getSideBetPredictions(deckState, playerCards[0]);

  const handleCardSelect = useCallback((value: string) => {
    if (activeInput === 'player') {
      if (playerCards.length < 6) {
        const newCards = [...playerCards, value];
        setPlayerCards(newCards);
        setDeckState(prev => trackCard(prev, value));
        
        if (dealerUpcard && newCards.length >= 2) {
          setAnalysis(analyzeHand(newCards, dealerUpcard));
        }
      }
    } else {
      if (dealerUpcard) {
        setDeckState(prev => untrackCard(prev, dealerUpcard));
      }
      setDealerUpcard(value);
      setDeckState(prev => trackCard(prev, value));
      if (playerCards.length >= 2) {
        setAnalysis(analyzeHand(playerCards, value));
      }
    }
  }, [activeInput, playerCards, dealerUpcard]);

  const handleRemoveCard = useCallback((index: number) => {
    const card = playerCards[index];
    const newCards = playerCards.filter((_, i) => i !== index);
    setPlayerCards(newCards);
    setDeckState(prev => untrackCard(prev, card));
    
    if (dealerUpcard && newCards.length >= 2) {
      setAnalysis(analyzeHand(newCards, dealerUpcard));
    } else {
      setAnalysis(null);
    }
  }, [playerCards, dealerUpcard]);

  const handleClearHand = useCallback(() => {
    // Untrack player cards
    playerCards.forEach(card => {
      setDeckState(prev => untrackCard(prev, card));
    });
    // Untrack dealer card
    if (dealerUpcard) {
      setDeckState(prev => untrackCard(prev, dealerUpcard));
    }
    
    setPlayerCards([]);
    setDealerUpcard(null);
    setAnalysis(null);
    setActiveInput('player');
  }, [playerCards, dealerUpcard]);

  const handleResetDeck = useCallback(() => {
    setDeckState(createDeckState(numDecks));
  }, [numDecks]);

  const handleDeckChange = useCallback((newDecks: number) => {
    setNumDecks(newDecks);
    setDeckState(createDeckState(newDecks));
  }, []);

  const handleTableCardPlayed = useCallback((card: string) => {
    setDeckState(prev => trackCard(prev, card));
  }, []);

  const handleTableCardRemoved = useCallback((card: string) => {
    setDeckState(prev => untrackCard(prev, card));
  }, []);

  const handleRecordResult = useCallback((result: 'win' | 'loss' | 'push' | 'blackjack') => {
    setSession(prev => {
      const newSession = { ...prev, handsPlayed: prev.handsPlayed + 1 };
      
      switch (result) {
        case 'win':
          newSession.wins = prev.wins + 1;
          newSession.currentStreak = prev.currentStreak >= 0 ? prev.currentStreak + 1 : 1;
          break;
        case 'loss':
          newSession.losses = prev.losses + 1;
          newSession.currentStreak = prev.currentStreak <= 0 ? prev.currentStreak - 1 : -1;
          break;
        case 'push':
          newSession.pushes = prev.pushes + 1;
          break;
        case 'blackjack':
          newSession.blackjacks = prev.blackjacks + 1;
          newSession.currentStreak = prev.currentStreak >= 0 ? prev.currentStreak + 1 : 1;
          break;
      }
      
      return newSession;
    });
    handleClearHand();
  }, [handleClearHand]);

  const handleResetSession = useCallback(() => {
    setSession(initialSession);
    setDeckState(createDeckState(numDecks));
  }, [numDecks]);

  const { total, soft } = playerCards.length >= 1 
    ? calculateHandTotal(playerCards) 
    : { total: 0, soft: false };

  return (
    <div className="min-h-screen bg-background cyber-grid relative overflow-hidden">
      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="scan-line absolute inset-0" />
      </div>

      {/* Security Badge */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
        <Shield className="w-3 h-3 text-green-400" />
        <span className="text-[10px] text-green-400 font-mono">{securityBadge}</span>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        <NeonHeader />

        {/* Deck Settings */}
        <div className="flex items-center justify-between mt-6 mb-2">
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Decks:</span>
            <div className="flex gap-1">
              {[1, 2, 4, 6, 8].map(d => (
                <button
                  key={d}
                  onClick={() => handleDeckChange(d)}
                  className={cn(
                    'w-8 h-8 rounded text-xs font-display transition-all',
                    numDecks === d
                      ? 'bg-primary text-primary-foreground shadow-neon'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 mt-4">
          {/* Main Game Area */}
          <div className="space-y-6">
            {/* Card Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm card-glow"
            >
              {/* Input Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveInput('player')}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg font-display text-sm uppercase tracking-wider transition-all duration-300',
                    activeInput === 'player'
                      ? 'bg-primary text-primary-foreground shadow-neon'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  Your Hand {playerCards.length > 0 && `(${playerCards.length})`}
                </button>
                <button
                  onClick={() => setActiveInput('dealer')}
                  className={cn(
                    'flex-1 py-2 px-4 rounded-lg font-display text-sm uppercase tracking-wider transition-all duration-300',
                    activeInput === 'dealer'
                      ? 'bg-primary text-primary-foreground shadow-neon'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  Dealer {dealerUpcard && `(${dealerUpcard})`}
                </button>
              </div>

              {/* Card Selector */}
              <CardSelector onSelect={handleCardSelect} selectedCards={[]} />

              {/* Display Cards */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-6">
                  {/* Player Cards */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      Your Cards {total > 0 && <span className="text-primary">({total}{soft && ' soft'})</span>}
                    </p>
                    <div className="flex gap-2 flex-wrap min-h-[72px]">
                      <AnimatePresence mode="popLayout">
                        {playerCards.map((card, index) => (
                          <motion.div
                            key={`${card}-${index}`}
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 10 }}
                            layout
                          >
                            <PlayingCard
                              value={card}
                              size="sm"
                              onClick={() => handleRemoveCard(index)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {playerCards.length === 0 && (
                        <div className="flex items-center justify-center w-12 h-16 rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs">
                          +
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dealer Card */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                      Dealer Shows
                    </p>
                    <div className="flex gap-2 min-h-[72px]">
                      {dealerUpcard ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                        >
                          <PlayingCard
                            value={dealerUpcard}
                            size="sm"
                            selected
                            onClick={() => {
                              setDeckState(prev => untrackCard(prev, dealerUpcard));
                              setDealerUpcard(null);
                            }}
                          />
                        </motion.div>
                      ) : (
                        <div className="flex items-center justify-center w-12 h-16 rounded-lg border-2 border-dashed border-border text-muted-foreground text-xs">
                          ?
                        </div>
                      )}
                      <PlayingCard value="?" faceDown size="sm" />
                    </div>
                  </div>
                </div>

                {/* Clear Button */}
                {(playerCards.length > 0 || dealerUpcard) && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleClearHand}
                    className="mt-4 text-xs text-muted-foreground hover:text-destructive transition-colors uppercase tracking-wider"
                  >
                    Clear Hand
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Action Recommendation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm card-glow"
            >
              <ActionRecommendation
                analysis={analysis}
                playerTotal={total}
                isSoft={soft}
              />
            </motion.div>

            {/* Side Bet Predictions */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
                    <h3 className="text-sm font-display font-bold text-primary mb-4 uppercase tracking-wider">
                      Side Bet Predictions
                    </h3>
                    <SideBetPrediction prediction={sideBetPrediction} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table Cards Tracking */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
                    <TableCards
                      onCardPlayed={handleTableCardPlayed}
                      onCardRemoved={handleTableCardRemoved}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Card Tracker */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"
            >
              <h3 className="text-sm font-display font-bold text-primary mb-4 uppercase tracking-wider">
                Card Counter
              </h3>
              <CardTracker deckState={deckState} onReset={handleResetDeck} />
            </motion.div>

            {/* Dealer Probability */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"
            >
              <h3 className="text-sm font-display font-bold text-primary mb-4 uppercase tracking-wider">
                Dealer Analysis
              </h3>
              <DealerProbability dealerUpcard={dealerUpcard} />
            </motion.div>

            {/* Session Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"
            >
              <SessionStats
                session={session}
                onRecordResult={handleRecordResult}
                onReset={handleResetSession}
              />
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground/50 text-xs uppercase tracking-wider">
            Syndicate Supremacy • Decision Support Tool • Play Responsibly
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
