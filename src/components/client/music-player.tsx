
'use client';

import { useEffect, useRef } from 'react';

// This component will handle playing a single, non-interactive background track.
// It will attempt to play automatically and will resume on the first user interaction
// if the browser blocks the initial autoplay attempt.

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const userInteracted = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const playMusic = async () => {
      try {
        await audio.play();
      } catch (error) {
        // Autoplay was prevented. We'll wait for user interaction.
        console.warn("Background music autoplay was prevented. Waiting for user interaction.");
      }
    };

    // Set the source and properties
    audio.src = '/sounds/music-1.mp3'; // Default track
    audio.loop = true;
    audio.volume = 0.3; // A reasonable default volume

    playMusic();

    const handleInteraction = async () => {
        if (userInteracted.current) return;
        userInteracted.current = true;
        
        if (audio.paused) {
            await playMusic();
        }
    };

    // Listen for the first interaction to ensure playback
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      // Cleanup listeners when the component unmounts
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  return <audio ref={audioRef} />;
}
