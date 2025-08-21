
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
      const newSrc = musicFileMap[track];
      // Check if the source needs to be updated
      if (!audio.src.endsWith(newSrc)) {
        audio.src = newSrc;
      }
      audio.volume = volume / 100;
      audio.loop = true;
      // Attempt to play. This might fail due to autoplay policies.
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        // Playback was prevented. We'll wait for user interaction.
        setIsPlaying(false);
        console.warn("Audio play prevented by browser policy. Waiting for user interaction.");
      });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    updateMusicState();

    window.addEventListener('music-settings-changed', updateMusicState);

    // This effect tries to resume playback upon user interaction.
    const resumePlayback = () => {
      const settings = JSON.parse(localStorage.getItem('musicSettings') || '{}');
      if (audioRef.current && audioRef.current.paused && settings.enabled && settings.track !== 'none') {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
            // Still couldn't play, maybe another reason.
        });
      }
    };
    
    document.addEventListener('click', resumePlayback, { once: true });
    document.addEventListener('keydown', resumePlayback, { once: true });

    return () => {
      window.removeEventListener('music-settings-changed', updateMusicState);
      document.removeEventListener('click', resumePlayback);
      document.removeEventListener('keydown', resumePlayback);
    };
  }, [updateMusicState]);

  return <audio ref={audioRef} />;
}
