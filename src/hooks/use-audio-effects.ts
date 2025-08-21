
'use client';

import { useCallback } from 'react';

type SoundType = 'success' | 'error' | 'click' | 'swoosh';

let audioContext: AudioContext | null = null;
let musicSource: AudioBufferSourceNode | null = null;
let musicGainNode: GainNode | null = null;
let isMusicPlaying = false;
let musicBuffer: AudioBuffer | null = null;

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

const loadMusic = async (context: AudioContext): Promise<AudioBuffer | null> => {
    if (musicBuffer) return musicBuffer;

    try {
        const response = await fetch('/sounds/music-1.mp3');
        if (!response.ok) {
            console.error(`Error loading music file: ${response.statusText}`);
            return null;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('audio/mpeg')) {
             console.error("Error: El archivo de música no es un archivo de audio válido. Asegúrate de que 'public/sounds/music-1.mp3' existe y no está dañado.");
             return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const decodedData = await context.decodeAudioData(arrayBuffer);
        musicBuffer = decodedData;
        return musicBuffer;
    } catch (error) {
        console.error('Error loading or decoding music file:', error);
        return null;
    }
};

const playMusicInternal = async () => {
    const context = initAudioContext();
    if (!context) return;

    if (context.state === 'suspended') {
        await context.resume();
    }

    if (isMusicPlaying) return;
    
    const buffer = await loadMusic(context);
    if (!buffer) return;

    musicSource = context.createBufferSource();
    musicSource.buffer = buffer;
    musicSource.loop = true;

    musicGainNode = context.createGain();
    musicGainNode.gain.setValueAtTime(0, context.currentTime);
    musicGainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 1); // Fade in

    musicSource.connect(musicGainNode);
    musicGainNode.connect(context.destination);
    
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
