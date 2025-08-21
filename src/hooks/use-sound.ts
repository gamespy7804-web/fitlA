'use client';

import { useCallback } from 'react';

type SoundType = 'success' | 'error' | 'click' | 'swoosh';

let audioContext: AudioContext | null = null;
let musicSource: OscillatorNode | null = null;
let musicGainNode: GainNode | null = null;
let isMusicPlaying = false;

const initAudioContext = () => {
  if (typeof window !== 'undefined' && !audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("AudioContext not supported", e);
    }
  }
  return audioContext;
};

const playMusicInternal = () => {
    const context = initAudioContext();
    if (!context) return;
    
    // Ensure we can play audio
    if (context.state === 'suspended') {
        context.resume();
    }

    if (isMusicPlaying) return;

    musicSource = context.createOscillator();
    musicSource.type = 'sine';
    musicSource.frequency.setValueAtTime(110, context.currentTime); // A low 'A' note

    musicGainNode = context.createGain();
    musicGainNode.gain.setValueAtTime(0, context.currentTime);
    musicGainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 1); // Fade in

    musicSource.connect(musicGainNode);
    musicGainNode.connect(context.destination);
    
    musicSource.loop = true;
    musicSource.start();
    isMusicPlaying = true;
};

export const startMusic = () => {
  playMusicInternal();
};

export const stopMusic = () => {
  if (musicGainNode && musicSource && isMusicPlaying) {
    musicGainNode.gain.linearRampToValueAtTime(0, audioContext!.currentTime + 0.5);
    musicSource.stop(audioContext!.currentTime + 0.5);
    musicSource = null;
    musicGainNode = null;
    isMusicPlaying = false;
  }
};

const useAudioEffects = () => {
  const playSound = useCallback((type: SoundType) => {
    const context = initAudioContext();
    if (!context) return;
    if (context.state === 'suspended') {
      context.resume();
    }

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
          if(!context) return;
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

export default useAudioEffects;
