
'use client';

import { useCallback } from 'react';
import { getAudioContext, loadMusicBuffer, startMusicPlayback, stopMusicPlayback } from './use-music';

type SoundType = 'success' | 'error' | 'click' | 'swoosh';

const useAudioEffects = () => {
  const playSound = useCallback((type: SoundType) => {
    const context = getAudioContext();
    if (!context || context.state === 'suspended') return;

    try {
      switch (type) {
        case 'success': {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, context.currentTime);
          gainNode.gain.setValueAtTime(0.2, context.currentTime);
          
          gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.5);
          break;
        }
        case 'error': {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);

          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(150, context.currentTime);
          gainNode.gain.setValueAtTime(0.2, context.currentTime);

          gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3);
          oscillator.start(context.currentTime);
          oscillator.stop(context.currentTime + 0.3);
          break;
        }
        case 'click': {
           const oscillator = context.createOscillator();
           const gainNode = context.createGain();
           oscillator.connect(gainNode);
           gainNode.connect(context.destination);

           oscillator.type = 'sine';
           oscillator.frequency.setValueAtTime(440, context.currentTime);
           gainNode.gain.setValueAtTime(0.1, context.currentTime);
           
           gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);
           oscillator.start(context.currentTime);
           oscillator.stop(context.currentTime + 0.1);
          break;
        }
         case 'swoosh': {
          const bufferSize = context.sampleRate * 0.2; // 0.2 second swoosh
          const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
          const output = buffer.getChannelData(0);

          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
          }

          const source = context.createBufferSource();
          source.buffer = buffer;
          
          const gainNode = context.createGain();
          gainNode.gain.setValueAtTime(0.1, context.currentTime);
          
          source.connect(gainNode);
          gainNode.connect(context.destination);
          source.start();
          break;
        }
      }
    } catch (error) {
      console.error(`Error playing sound type "${type}":`, error);
    }
  }, []);

  return playSound;
};

// Functions to be called from other parts of the app
export const startMusic = async () => {
  const context = getAudioContext();
  if (!context || context.state === 'suspended') {
      console.warn("AudioContext not ready or suspended. Music will not play.");
      return;
  }
  const buffer = await loadMusicBuffer();
  if (buffer) {
    startMusicPlayback(buffer);
  }
};

export const stopMusic = () => {
  stopMusicPlayback();
};


export default useAudioEffects;
