
'use client';

// This file is deprecated and will be removed. Please use use-audio-effects.ts and use-music.ts instead.
// Keeping it to prevent breaking builds during transition.

import { useCallback } from 'react';

type SoundType = 'success' | 'error' | 'click' | 'swoosh';

const useAudioEffects = () => {
  const playSound = useCallback((type: SoundType) => {
    // No-op
  }, []);
  return playSound;
};

export const startMusic = () => {};
export const stopMusic = () => {};

export default useAudioEffects;
