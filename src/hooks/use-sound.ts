'use client';

import { useCallback, useEffect, useRef } from 'react';

type SoundType = 'success' | 'error' | 'click' | 'swoosh';

// Create a single AudioContext to be reused.
let audioContext: AudioContext | null = null;
if (typeof window !== 'undefined') {
  audioContext = new window.AudioContext();
}

const useSound = () => {
  const playSound = useCallback((type: SoundType) => {
    if (!audioContext || audioContext.state === 'suspended') {
      audioContext?.resume();
    }
    if (!audioContext) return;

    try {
      switch (type) {
        case 'success': {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          
          gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        }
        case 'error': {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);

          gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        }
        case 'click': {
           const oscillator = audioContext.createOscillator();
           const gainNode = audioContext.createGain();
           oscillator.connect(gainNode);
           gainNode.connect(audioContext.destination);

           oscillator.type = 'sine';
           oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
           gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
           
           gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);
           oscillator.start(audioContext.currentTime);
           oscillator.stop(audioContext.currentTime + 0.1);
          break;
        }
         case 'swoosh': {
          const bufferSize = audioContext.sampleRate * 0.2; // 0.2 second swoosh
          const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const output = buffer.getChannelData(0);

          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
          }

          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          
          const gainNode = audioContext.createGain();
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
          source.start();
          break;
        }
      }
    } catch (error) {
      console.error(`Error playing sound type "${type}":`, error);
    }
  }, []);

  // On first interaction, resume the audio context if it's suspended.
  useEffect(() => {
    const resumeAudio = () => {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };

    window.addEventListener('click', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);

    return () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
  }, []);

  return playSound;
};

export default useSound;
