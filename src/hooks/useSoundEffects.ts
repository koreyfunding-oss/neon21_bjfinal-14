import { useCallback, useRef } from 'react';

type SoundType = 
  | 'click' 
  | 'cardSelect' 
  | 'cardDeselect'
  | 'cisReady' 
  | 'actionHit' 
  | 'actionStand' 
  | 'actionDouble' 
  | 'actionSplit'
  | 'actionSurrender'
  | 'win'
  | 'lose'
  | 'push'
  | 'blackjack'
  | 'warning'
  | 'success';

const SOUND_CONFIGS: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; gain: number; decay?: number }> = {
  click: { frequency: 800, duration: 0.05, type: 'square', gain: 0.1 },
  cardSelect: { frequency: 1200, duration: 0.08, type: 'sine', gain: 0.15 },
  cardDeselect: { frequency: 600, duration: 0.06, type: 'sine', gain: 0.1 },
  cisReady: { frequency: 880, duration: 0.15, type: 'sine', gain: 0.2, decay: 0.1 },
  actionHit: { frequency: 523, duration: 0.1, type: 'square', gain: 0.15 },
  actionStand: { frequency: 392, duration: 0.15, type: 'sine', gain: 0.15 },
  actionDouble: { frequency: 659, duration: 0.12, type: 'sawtooth', gain: 0.12 },
  actionSplit: { frequency: 784, duration: 0.1, type: 'triangle', gain: 0.15 },
  actionSurrender: { frequency: 294, duration: 0.2, type: 'sine', gain: 0.1 },
  win: { frequency: 1047, duration: 0.3, type: 'sine', gain: 0.2, decay: 0.2 },
  lose: { frequency: 196, duration: 0.4, type: 'sine', gain: 0.15, decay: 0.3 },
  push: { frequency: 440, duration: 0.2, type: 'triangle', gain: 0.1 },
  blackjack: { frequency: 1319, duration: 0.4, type: 'sine', gain: 0.25, decay: 0.3 },
  warning: { frequency: 350, duration: 0.15, type: 'square', gain: 0.1 },
  success: { frequency: 988, duration: 0.12, type: 'sine', gain: 0.18 },
};

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;

    try {
      const ctx = getAudioContext();
      const config = SOUND_CONFIGS[type];
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(config.gain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001, 
        ctx.currentTime + config.duration + (config.decay || 0)
      );
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration + (config.decay || 0));
    } catch (e) {
      // Audio not supported or blocked
    }
  }, [getAudioContext]);

  const playChord = useCallback((frequencies: number[], duration: number = 0.3) => {
    if (!enabledRef.current) return;

    try {
      const ctx = getAudioContext();
      
      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime + (i * 0.05));
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(ctx.currentTime + (i * 0.05));
        oscillator.stop(ctx.currentTime + duration);
      });
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext]);

  const playWinFanfare = useCallback(() => {
    playChord([523, 659, 784, 1047], 0.5);
  }, [playChord]);

  const playBlackjackFanfare = useCallback(() => {
    playChord([659, 784, 988, 1319], 0.6);
  }, [playChord]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return {
    playSound,
    playChord,
    playWinFanfare,
    playBlackjackFanfare,
    setEnabled,
  };
}
