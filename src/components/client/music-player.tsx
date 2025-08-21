
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMusic } from '@/hooks/use-music';

export function MusicPlayer() {
  const { isMusicEnabled } = useMusic();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  // Memoize the play/pause logic to prevent re-renders from creating new functions
  const managePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicEnabled && !isPlayingRef.current) {
      // Attempt to play, catching any errors (e.g., browser restrictions)
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isPlayingRef.current = true;
        }).catch(error => {
          console.warn("Music playback was prevented. User interaction is needed to start.", error);
          isPlayingRef.current = false;
        });
      }
    } else if (!isMusicEnabled && isPlayingRef.current) {
      audio.pause();
      isPlayingRef.current = false;
    }
  }, [isMusicEnabled]);

  useEffect(() => {
    // Ensure we have a client-side environment before creating the Audio element
    if (typeof window !== 'undefined' && !audioRef.current) {
        const audio = new Audio('/sounds/music-1.mp3'); // Simplified to one track
        audio.loop = true;
        audio.volume = 0.3;
        audioRef.current = audio;
    }
    
    // Call the playback logic when isMusicEnabled changes
    managePlayback();
    
  }, [isMusicEnabled, managePlayback]);

  // This effect handles the initial user interaction to unblock audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleFirstInteraction = () => {
      if (audio.paused && isMusicEnabled) {
        // This second attempt is crucial for when the browser blocks the initial autoplay
        managePlayback();
      }
      // Clean up the event listener after the first interaction
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      // Ensure music stops when the component unmounts
      audioRef.current?.pause();
      isPlayingRef.current = false;
    };
  }, [isMusicEnabled, managePlayback]);


  // This component does not render anything to the DOM
  return null;
}
