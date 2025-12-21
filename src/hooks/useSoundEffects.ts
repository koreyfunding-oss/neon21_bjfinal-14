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
  | 'success'
  | 'probabilityShift';

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
  probabilityShift: { frequency: 1100, duration: 0.08, type: 'sine', gain: 0.12, decay: 0.05 },
};

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);
  const speechEnabledRef = useRef(true);
  const lastAnnouncementRef = useRef<string>('');
  const lastAnnouncementTimeRef = useRef<number>(0);

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

  // Quick two-tone chime for probability shift
  const playProbabilityShift = useCallback(() => {
    if (!enabledRef.current) return;

    try {
      const ctx = getAudioContext();
      
      // First tone - rising
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.12);

      // Second tone - confirmation ping
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, ctx.currentTime + 0.08);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.08);
      osc2.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext]);

  // Speech synthesis for announcements
  const announce = useCallback((text: string, priority: boolean = false) => {
    if (!enabledRef.current || !speechEnabledRef.current) return;
    if (!('speechSynthesis' in window)) return;

    const now = Date.now();
    // Debounce: skip if same message within 2 seconds (unless priority)
    if (!priority && text === lastAnnouncementRef.current && now - lastAnnouncementTimeRef.current < 2000) {
      return;
    }

    // Cancel any ongoing speech for priority announcements
    if (priority) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.3; // Faster for quick updates
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
    lastAnnouncementRef.current = text;
    lastAnnouncementTimeRef.current = now;
  }, []);

  // Announce action recommendation
  const announceAction = useCallback((action: string | null, confidence?: number) => {
    if (!action) return;
    
    const actionText = action.toUpperCase();
    let message = actionText;
    
    if (confidence !== undefined) {
      if (confidence >= 0.9) {
        message = `${actionText}!`;
      } else if (confidence >= 0.7) {
        message = actionText;
      } else {
        message = `Consider ${actionText.toLowerCase()}`;
      }
    }
    
    announce(message, true);
  }, [announce]);

  // Announce probability changes
  const announceProbability = useCallback((bustProb: number, improveProb: number) => {
    if (bustProb >= 60) {
      announce(`High bust risk: ${Math.round(bustProb)} percent`);
    } else if (improveProb >= 70) {
      announce(`Good odds to improve: ${Math.round(improveProb)} percent`);
    }
  }, [announce]);

  // Announce detected cards
  const announceCards = useCallback((playerCards: string[], dealerCard: string | null) => {
    if (playerCards.length === 0) return;
    
    const playerText = playerCards.join(' ');
    const dealerText = dealerCard ? `, dealer shows ${dealerCard}` : '';
    announce(`${playerText}${dealerText}`);
  }, [announce]);

  // Announce new cards detected
  const announceNewCards = useCallback((newCards: string[]) => {
    if (newCards.length === 0) return;
    announce(`Tracking ${newCards.join(', ')}`);
  }, [announce]);

  // Announce hot seat for side bets
  const announceHotSeat = useCallback((seatNumber: number, seatName: string, bestBet: string) => {
    const message = `Hot seat! ${seatName} for ${bestBet}`;
    announce(message, true);
  }, [announce]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  const setSpeechEnabled = useCallback((enabled: boolean) => {
    speechEnabledRef.current = enabled;
    if (!enabled) {
      window.speechSynthesis?.cancel();
    }
  }, []);

  return {
    playSound,
    playChord,
    playWinFanfare,
    playBlackjackFanfare,
    playProbabilityShift,
    setEnabled,
    // Speech synthesis
    announce,
    announceAction,
    announceProbability,
    announceCards,
    announceNewCards,
    announceHotSeat,
    setSpeechEnabled,
  };
}
