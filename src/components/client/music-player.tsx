
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
      
      // Only change src if it's different to prevent re-loading the same track
      if (!audio.src.endsWith(newSrc)) {
        audio.src = newSrc;
      }
      
      audio.volume = volume / 100;
      audio.loop = true;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          // Autoplay was prevented. We'll wait for user interaction.
          setIsPlaying(false);
          console.warn("Audio play prevented by browser policy. Waiting for user interaction to resume.");
        });
      }
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
        const audio = audioRef.current;
        const settings = JSON.parse(localStorage.getItem('musicSettings') || '{}');
        
        if (audio && audio.paused && settings.enabled && settings.track !== 'none') {
            audio.play().then(() => {
                setIsPlaying(true);
                // Once playback is successful, we can remove the listeners
                document.removeEventListener('click', resumePlayback);
                document.removeEventListener('keydown', resumePlayback);
                document.removeEventListener('touchstart', resumePlayback);
            }).catch(e => {
                // Still couldn't play, keep listening for the next interaction.
            });
        } else if (audio && !audio.paused) {
             // If it's already playing, we don't need the listeners anymore.
             document.removeEventListener('click', resumePlayback);
             document.removeEventListener('keydown', resumePlayback);
             document.removeEventListener('touchstart', resumePlayback);
        }
    };
    
    document.addEventListener('click', resumePlayback);
    document.addEventListener('keydown', resumePlayback);
    document.addEventListener('touchstart', resumePlayback);

    return () => {
      window.removeEventListener('music-settings-changed', updateMusicState);
      document.removeEventListener('click', resumePlayback);
      document.removeEventListener('keydown', resumePlayback);
      document.removeEventListener('touchstart', resumePlayback);
    };
  }, [updateMusicState]);

  return <audio ref={audioRef} />;
}
