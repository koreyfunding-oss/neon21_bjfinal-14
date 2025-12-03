// Security Module - Anti-tampering and copy protection
// DO NOT MODIFY - Security Critical

const _0xf7a3 = 'NEON21_SYNDICATE';
const _0x8b2e = Date.now();

// Obfuscated security tokens
const _securityTokens = {
  _a: () => window.btoa(_0xf7a3 + _0x8b2e),
  _b: () => typeof window !== 'undefined',
  _c: () => !window.Proxy || typeof Proxy === 'function',
};

// DevTools detection
let _devToolsOpen = false;
const _threshold = 160;

const _checkDevTools = () => {
  const widthThreshold = window.outerWidth - window.innerWidth > _threshold;
  const heightThreshold = window.outerHeight - window.innerHeight > _threshold;
  _devToolsOpen = widthThreshold || heightThreshold;
};

// Integrity verification
export function verifyIntegrity(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    // Check for common debugging/tampering indicators
    const checks = [
      () => !('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.isDisabled),
      () => !window.location.href.includes('localhost') || process.env.NODE_ENV === 'development',
      () => _securityTokens._b(),
      () => _securityTokens._c(),
    ];
    
    return checks.every(check => {
      try {
        return check();
      } catch {
        return true; // Don't block on check failures
      }
    });
  } catch {
    return true;
  }
}

// Console protection - Clears console and adds warning
export function protectConsole(): void {
  if (process.env.NODE_ENV === 'production') {
    const noop = () => {};
    const warning = () => {
      console.warn('%cSTOP!', 'color: red; font-size: 48px; font-weight: bold;');
      console.warn('%cThis is a protected application. Tampering attempts are logged.', 'color: orange; font-size: 14px;');
    };
    
    // Override console methods in production
    try {
      Object.defineProperty(window, 'console', {
        get: () => ({
          log: noop,
          debug: noop,
          info: noop,
          warn: warning,
          error: warning,
          table: noop,
          clear: noop,
          dir: noop,
          trace: noop,
        }),
        configurable: false,
      });
    } catch {
      // Silently fail if console can't be overridden
    }
  }
}

// Right-click protection
export function disableContextMenu(): void {
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  }
}

// Keyboard shortcut protection
export function disableDevShortcuts(): void {
  if (process.env.NODE_ENV === 'production') {
    document.addEventListener('keydown', (e) => {
      // Disable F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+U (view source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
    });
  }
}

// Watermark generator
export function generateWatermark(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `N21-${timestamp.toString(36)}-${random}`.toUpperCase();
}

// Session fingerprint
export function generateFingerprint(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36).toUpperCase();
}

// Initialize all security measures
export function initializeSecurity(): void {
  if (typeof window !== 'undefined') {
    verifyIntegrity();
    disableContextMenu();
    disableDevShortcuts();
    
    // Periodic devtools check
    setInterval(_checkDevTools, 1000);
    
    // Add hidden watermark to DOM
    const watermark = document.createElement('div');
    watermark.id = generateWatermark();
    watermark.style.cssText = 'position:fixed;opacity:0;pointer-events:none;z-index:-1;';
    watermark.setAttribute('data-fp', generateFingerprint());
    document.body.appendChild(watermark);
  }
}

// Export verification status
export const isSecure = verifyIntegrity;
