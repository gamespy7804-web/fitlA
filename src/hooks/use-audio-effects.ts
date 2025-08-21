
'use client';

import { useCallback } from 'react';

type SoundType = 'success' | 'error' | 'click' | 'swoosh';

let audioContext: AudioContext | null = null;
let musicBuffer: AudioBuffer | null = null;
let musicSource: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;
let isPlaying = false;
let isInitialized = false;

// Must be called after a user interaction
export const initializeAudio = () => {
    if (isInitialized) return;
    if (typeof window !== 'undefined') {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            isInitialized = true;
        } catch (e) {
            console.error("AudioContext is not supported by this browser.", e);
        }
    }
};

const loadMusicBuffer = async (): Promise<AudioBuffer | null> => {
    if (musicBuffer) return musicBuffer;
    if (!audioContext) {
        console.warn("AudioContext not initialized. Cannot load music.");
        return null;
    }

    try {
        const response = await fetch('/sounds/music-1.mp3');
        if (!response.ok) {
            console.error(`Failed to fetch music file: ${response.status} ${response.statusText}`);
            return null;
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('audio/mpeg')) {
             console.error("Error: The fetched file is not a valid audio file. Make sure 'public/sounds/music-1.mp3' exists and is not corrupted.");
             return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        const decodedData = await audioContext.decodeAudioData(arrayBuffer);
        musicBuffer = decodedData;
        return musicBuffer;
    } catch (error) {
        console.error('Error loading or decoding music file:', error);
        return null;
    }
};

const useAudioEffects = () => {
  const playSound = useCallback((type: SoundType) => {
    if (!audioContext || audioContext.state === 'suspended') return;

    try {
      switch (type) {
        case 'success': {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          gain.gain.setValueAtTime(0.2, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        }
        case 'error': {
          const oscillator = audioContext.createOscillator();
          const gain = audioContext.createGain();
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
          gain.gain.setValueAtTime(0.2, audioContext.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        }
        case 'click': {
           const oscillator = audioContext.createOscillator();
           const gain = audioContext.createGain();
           oscillator.connect(gain);
           gain.connect(audioContext.destination);
           oscillator.type = 'sine';
           oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
           gain.gain.setValueAtTime(0.1, audioContext.currentTime);
           gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);
           oscillator.start(audioContext.currentTime);
           oscillator.stop(audioContext.currentTime + 0.1);
          break;
        }
         case 'swoosh': {
          const bufferSize = audioContext.sampleRate * 0.2;
          const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const output = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
          }
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          const gain = audioContext.createGain();
          gain.gain.setValueAtTime(0.1, audioContext.currentTime);
          source.connect(gain);
          gain.connect(audioContext.destination);
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

export const startMusic = async () => {
    if (!audioContext || isPlaying) return;
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    
    const buffer = await loadMusicBuffer();
    if (!buffer) return;

    stopMusic(); 

    musicSource = audioContext.createBufferSource();
    musicSource.buffer = buffer;
    musicSource.loop = true;

    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 1);

    musicSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    musicSource.start();
    isPlaying = true;
};

export const stopMusic = () => {
    if (musicSource && gainNode && isPlaying && audioContext) {
        try {
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
            musicSource.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Can throw if stop() is called multiple times.
        }
    }
    musicSource = null;
    gainNode = null;
    isPlaying = false;
};

export default useAudioEffects;
