
'use client';

import { useCallback, useState } from 'react';

type Sound = 'button-press' | 'success-1' | 'success-2' | 'error-1' | 'swoosh';

export function useSound() {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const playSound = useCallback((sound: Sound) => {
    // Stop any currently playing sound to prevent overlap
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    const newAudio = new Audio(`/sounds/${sound}.mp3`);
    newAudio.play().catch(e => console.error("Error playing sound:", e));
    setAudio(newAudio);
  }, [audio]);

  return { playSound };
}
