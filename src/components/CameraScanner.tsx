import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Loader2, AlertCircle, Trophy, XCircle, Minus, Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SideBets {
  perfect_pair: boolean;
  colored_pair: boolean;
  mixed_pair: boolean;
  flush: boolean;
  straight: boolean;
  three_of_kind: boolean;
  straight_flush: boolean;
  suited_trips: boolean;
}

interface DetectedEvents {
  player_blackjack: boolean;
  dealer_blackjack: boolean;
  player_bust: boolean;
  push: boolean;
  win_detected: boolean;
  loss_detected: boolean;
}

export interface ScanResult {
  player_cards: string[];
  dealer_card: string | null;
  dealer_hole_card: string | null;
  other_cards: string[];
  confidence: 'high' | 'medium' | 'low' | 'none';
  notes: string;
  hand_outcome: 'win' | 'loss' | 'push' | 'blackjack' | 'bust' | null;
  side_bets: SideBets;
  detected_events: DetectedEvents;
}

interface CameraScannerProps {
  onCardsDetected: (result: ScanResult) => void;
  onOutcomeDetected?: (outcome: 'win' | 'loss' | 'push' | 'blackjack') => void;
  onSideBetWin?: (betType: string) => void;
  isActive: boolean;
  onToggle: () => void;
  isPremium?: boolean;
  turboMode?: boolean;
  onTurboToggle?: () => void;
}

export function CameraScanner({ 
  onCardsDetected, 
  onOutcomeDetected, 
  onSideBetWin, 
  isActive, 
  onToggle,
  isPremium = false,
  turboMode = false,
  onTurboToggle
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastOutcomeRef = useRef<string | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [detectedSideBets, setDetectedSideBets] = useState<string[]>([]);

  // Scan interval: 500ms for turbo, 1500ms for normal
  const scanInterval = turboMode ? 500 : 1500;

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastOutcomeRef.current = null;
  }, []);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== 4) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    setIsScanning(true);
    setScanCount(prev => prev + 1);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scan-cards', {
        body: { image: imageData }
      });

      if (fnError) throw fnError;

      if (data && data.confidence !== 'none') {
        setLastResult(data);
        onCardsDetected(data);

        // Handle outcome detection (prevent duplicate triggers)
        const outcomeKey = `${data.hand_outcome}-${data.player_cards.join(',')}-${data.dealer_card}`;
        if (data.hand_outcome && outcomeKey !== lastOutcomeRef.current && onOutcomeDetected) {
          lastOutcomeRef.current = outcomeKey;
          
          if (data.detected_events?.player_blackjack || data.hand_outcome === 'blackjack') {
            onOutcomeDetected('blackjack');
          } else if (data.hand_outcome === 'win' || data.detected_events?.win_detected) {
            onOutcomeDetected('win');
          } else if (data.hand_outcome === 'loss' || data.detected_events?.loss_detected || data.detected_events?.player_bust) {
            onOutcomeDetected('loss');
          } else if (data.hand_outcome === 'push' || data.detected_events?.push) {
            onOutcomeDetected('push');
          }
        }

        // Handle side bet wins
        if (data.side_bets && onSideBetWin) {
          const newSideBets: string[] = [];
          
          if (data.side_bets.perfect_pair) newSideBets.push('Perfect Pair');
          if (data.side_bets.colored_pair) newSideBets.push('Colored Pair');
          if (data.side_bets.mixed_pair) newSideBets.push('Mixed Pair');
          if (data.side_bets.suited_trips) newSideBets.push('Suited Trips');
          if (data.side_bets.straight_flush) newSideBets.push('Straight Flush');
          if (data.side_bets.three_of_kind) newSideBets.push('Three of a Kind');
          if (data.side_bets.straight) newSideBets.push('Straight');
          if (data.side_bets.flush) newSideBets.push('Flush');
          
          // Only trigger if new side bets detected
          const newDetections = newSideBets.filter(bet => !detectedSideBets.includes(bet));
          if (newDetections.length > 0) {
            setDetectedSideBets(prev => [...prev, ...newDetections]);
            newDetections.forEach(bet => onSideBetWin(bet));
          }
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, onCardsDetected, onOutcomeDetected, onSideBetWin, detectedSideBets]);

  // Reset detected side bets when camera is toggled off
  useEffect(() => {
    if (!isActive) {
      setDetectedSideBets([]);
      lastOutcomeRef.current = null;
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      startCamera();
      intervalRef.current = setInterval(captureAndScan, scanInterval);
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isActive, startCamera, stopCamera, captureAndScan, scanInterval]);

  const getActiveSideBets = (sideBets: SideBets | undefined) => {
    if (!sideBets) return [];
    const active: { name: string; color: string }[] = [];
    
    if (sideBets.suited_trips) active.push({ name: 'Suited Trips', color: 'text-yellow-400 bg-yellow-500/20' });
    if (sideBets.straight_flush) active.push({ name: 'Straight Flush', color: 'text-purple-400 bg-purple-500/20' });
    if (sideBets.three_of_kind) active.push({ name: '3 of a Kind', color: 'text-orange-400 bg-orange-500/20' });
    if (sideBets.straight) active.push({ name: 'Straight', color: 'text-blue-400 bg-blue-500/20' });
    if (sideBets.flush) active.push({ name: 'Flush', color: 'text-cyan-400 bg-cyan-500/20' });
    if (sideBets.perfect_pair) active.push({ name: 'Perfect Pair', color: 'text-green-400 bg-green-500/20' });
    if (sideBets.colored_pair) active.push({ name: 'Colored Pair', color: 'text-pink-400 bg-pink-500/20' });
    if (sideBets.mixed_pair) active.push({ name: 'Mixed Pair', color: 'text-gray-400 bg-gray-500/20' });
    
    return active;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg font-display text-sm uppercase tracking-wider transition-all',
              isActive 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-primary text-primary-foreground shadow-neon'
            )}
          >
            {isActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {isActive ? 'Stop' : 'Scan'}
          </button>
          
          {/* Turbo Mode Toggle - Premium Only */}
          {isPremium && onTurboToggle && (
            <button
              onClick={onTurboToggle}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-2 rounded-lg font-display text-xs uppercase tracking-wider transition-all',
                turboMode 
                  ? 'bg-yellow-500 text-yellow-950 shadow-[0_0_15px_hsl(40_100%_50%/0.5)]' 
                  : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
              )}
            >
              <Zap className={cn('w-3.5 h-3.5', turboMode && 'animate-pulse')} />
              Turbo
            </button>
          )}
          
          {isScanning && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              {turboMode ? 'TURBO' : 'Scanning'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {turboMode && isActive && (
            <span className="text-[10px] text-yellow-400 uppercase tracking-wider animate-pulse">
              ⚡ 500ms
            </span>
          )}
          {isActive && (
            <span className="text-xs text-muted-foreground">
              #{scanCount}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative rounded-lg overflow-hidden border border-border bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-primary/50 rounded-lg">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
                </div>
                {isScanning && (
                  <motion.div
                    initial={{ top: '10%' }}
                    animate={{ top: '90%' }}
                    transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                    className="absolute left-4 right-4 h-0.5 bg-primary shadow-neon"
                  />
                )}
              </div>
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-2 text-destructive text-xs">
                <AlertCircle className="w-3 h-3" />
                {error}
              </div>
            )}

            {lastResult && lastResult.confidence !== 'none' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/30 space-y-2"
              >
                {/* Card Detection */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Cards Detected:</span>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                    lastResult.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                    lastResult.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  )}>
                    {lastResult.confidence}
                  </span>
                </div>
                <div className="text-xs">
                  {lastResult.player_cards.length > 0 && (
                    <span className="text-foreground">
                      Player: <span className="text-primary font-bold">{lastResult.player_cards.join(', ')}</span>
                    </span>
                  )}
                  {lastResult.dealer_card && (
                    <span className="text-foreground ml-2">
                      Dealer: <span className="text-primary font-bold">{lastResult.dealer_card}</span>
                    </span>
                  )}
                </div>

                {/* Hand Outcome */}
                {lastResult.hand_outcome && (
                  <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                    {lastResult.hand_outcome === 'win' || lastResult.hand_outcome === 'blackjack' ? (
                      <Trophy className="w-4 h-4 text-green-400" />
                    ) : lastResult.hand_outcome === 'loss' || lastResult.hand_outcome === 'bust' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Minus className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className={cn(
                      'text-xs font-bold uppercase',
                      lastResult.hand_outcome === 'win' || lastResult.hand_outcome === 'blackjack' ? 'text-green-400' :
                      lastResult.hand_outcome === 'loss' || lastResult.hand_outcome === 'bust' ? 'text-red-400' :
                      'text-yellow-400'
                    )}>
                      {lastResult.hand_outcome === 'blackjack' ? 'BLACKJACK!' : lastResult.hand_outcome.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Side Bets Detected */}
                {getActiveSideBets(lastResult.side_bets).length > 0 && (
                  <div className="pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Side Bets Won:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {getActiveSideBets(lastResult.side_bets).map(({ name, color }) => (
                        <span key={name} className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', color)}>
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
