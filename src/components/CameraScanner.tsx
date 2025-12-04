import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ScanResult {
  player_cards: string[];
  dealer_card: string | null;
  other_cards: string[];
  confidence: 'high' | 'medium' | 'low' | 'none';
  notes: string;
}

interface CameraScannerProps {
  onCardsDetected: (result: ScanResult) => void;
  isActive: boolean;
  onToggle: () => void;
}

export function CameraScanner({ onCardsDetected, isActive, onToggle }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scanCount, setScanCount] = useState(0);

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
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, onCardsDetected]);

  useEffect(() => {
    if (isActive) {
      startCamera();
      // Scan every 2 seconds for continuous mode
      intervalRef.current = setInterval(captureAndScan, 2000);
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isActive, startCamera, stopCamera, captureAndScan]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg font-display text-sm uppercase tracking-wider transition-all',
              isActive 
                ? 'bg-destructive text-destructive-foreground shadow-neon-red' 
                : 'bg-primary text-primary-foreground shadow-neon'
            )}
          >
            {isActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {isActive ? 'Stop Scan' : 'Start Scan'}
          </button>
          {isScanning && (
            <div className="flex items-center gap-1.5 text-xs text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              Scanning...
            </div>
          )}
        </div>
        {isActive && (
          <span className="text-xs text-muted-foreground">
            Scans: {scanCount}
          </span>
        )}
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
                className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/30"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Last Detection:</span>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                    lastResult.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                    lastResult.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  )}>
                    {lastResult.confidence}
                  </span>
                </div>
                <div className="mt-1 text-xs">
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
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
