
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const musicFileMap: Record<string, string> = {
  'music-1': '/sounds/music-1.mp3',
  'music-2': '/sounds/music-2.mp3',
  'music-3': '/sounds/music-3.mp3',
};

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const updateMusicState = useCallback(() => {
    const settings = JSON.parse(localStorage.getItem('musicSettings') || '{}');
    const { enabled = false, track = 'none', volume = 50 } = settings;
    
    const audio = audioRef.current;
    if (!audio) return;

    if (enabled && track !== 'none' && musicFileMap[track]) {
      if (audio.src.split('/').pop() !== musicFileMap[track].split('/').pop()) {
        audio.src = musicFileMap[track];
      }
      audio.volume = volume / 100;
      audio.loop = true;
      audio.play().catch(error => console.error("Audio play failed:", error));
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    updateMusicState();

    window.addEventListener('music-settings-changed', updateMusicState);

    // Intentar reanudar la reproducción en la interacción del usuario
    const resumePlayback = () => {
      if (audioRef.current && audioRef.current.paused && isPlaying) {
        audioRef.current.play().catch(e => {});
      }
    };
    document.addEventListener('click', resumePlayback);

    return () => {
      window.removeEventListener('music-settings-changed', updateMusicState);
      document.removeEventListener('click', resumePlayback);
    };
  }, [updateMusicState, isPlaying]);

  return <audio ref={audioRef} />;
}
