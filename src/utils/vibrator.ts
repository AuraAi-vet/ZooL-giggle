/**
 * Safe Vibration API caller for mobile devices.
 * Fallbacks gracefully if the Vibration API is unsupported in the current frame or user environment.
 */
export const safeVibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn("Haptic feedback error (could be blocked by iframe context):", e);
    }
  }
};

/**
 * Tap feedback for standard interactive clicks (e.g., toggles, Quick Log action triggers).
 */
export const vibrateLight = () => {
  safeVibrate(20);
};

/**
 * Tactile completion feedback for successful submissions.
 */
export const vibrateSuccess = () => {
  safeVibrate([30, 45, 30]);
};

/**
 * Heavier tick feedback for prominent actions.
 */
export const vibrateHeavy = () => {
  safeVibrate(65);
};

/**
 * SOS Morse Code vibration alert: S (...) O (---) S (...)
 * Short: 120ms, Gap: 60ms; Long: 280ms
 */
export const vibrateSOS = () => {
  safeVibrate([
    120, 60, 120, 60, 120, 150, // S
    280, 80, 280, 80, 280, 150, // O
    120, 60, 120, 60, 120       // S
  ]);
};
