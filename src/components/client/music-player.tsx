
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const musicFileMap: Record<string, string> = {
  'music-1': '/sounds/music-1.mp3', // Aventura Épica
  'music-2': '/sounds/music-2.mp3', // Electrónica Focus
  'music-3': '/sounds/music-3.mp3', // Ambiente Relajante
};

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pathname = usePathname();

  const updateMusicState = useCallback(() => {
    const isGamePage = pathname === '/games';
    let settings = JSON.parse(localStorage.getItem('musicSettings') || '{}');
    
    // Set default settings if none exist
    if (Object.keys(settings).length === 0) {
      settings = { enabled: true, track: 'music-1', volume: 50 };
      localStorage.setItem('musicSettings', JSON.stringify(settings));
    }
    
    const { enabled = true, track = 'music-1', volume = 50 } = settings;
    
    const audio = audioRef.current;
    if (!audio) return;

    const targetTrack = isGamePage ? 'music-2' : track;

    if (enabled && targetTrack !== 'none' && musicFileMap[targetTrack]) {
      const newSrc = musicFileMap[targetTrack];
      
      if (!audio.src || !audio.src.endsWith(newSrc)) {
        audio.src = newSrc;
      }
      
      audio.volume = volume / 100;
      audio.loop = true;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Audio play prevented by browser policy. Waiting for user interaction to resume.");
        });
      }
    } else {
      audio.pause();
    }
  }, [pathname]);

  useEffect(() => {
    updateMusicState();

    window.addEventListener('music-settings-changed', updateMusicState);
    
    const resumePlayback = () => {
        const audio = audioRef.current;
        if (audio && audio.paused && audio.src) {
            audio.play().catch(e => {});
        }
    };
    
    document.addEventListener('click', resumePlayback, { once: true });
    document.addEventListener('keydown', resumePlayback, { once: true });
    document.addEventListener('touchstart', resumePlayback, { once: true });

    return () => {
      window.removeEventListener('music-settings-changed', updateMusicState);
    };
  }, [updateMusicState]);

  return <audio ref={audioRef} />;
}
