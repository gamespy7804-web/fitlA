
'use client';

import { useCallback } from 'react';

type SoundType = 'success' | 'error' | 'click' | 'swoosh' | 'startWorkout';
type MusicType = 'main' | 'game';

let audioContext: AudioContext | null = null;
const musicBuffers = new Map<MusicType, AudioBuffer>();
let musicSource: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;
let isPlaying: MusicType | null = null;
let isInitialized = false;

// Must be called after a user interaction
export const initializeAudio = () => {
    if (isInitialized || typeof window === 'undefined') return;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        isInitialized = true;
    } catch (e) {
        console.error("AudioContext is not supported by this browser.", e);
    }
};

const loadMusicBuffer = async (type: MusicType): Promise<AudioBuffer | null> => {
    if (musicBuffers.has(type)) return musicBuffers.get(type)!;
    if (!audioContext) {
        console.warn("AudioContext not initialized. Cannot load music.");
        return null;
    }

    const musicFile = type === 'main' ? '/sounds/music-1.mp3' : '/sounds/music-2.mp3';

    try {
        const response = await fetch(musicFile);
        if (!response.ok) {
            console.error(`Failed to fetch music file: ${response.status} ${response.statusText}`);
            return null;
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('audio/mpeg')) {
             console.error(`Error: The fetched file is not a valid audio file. Make sure '${musicFile}' exists and is not corrupted.`);
             return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        const decodedData = await audioContext.decodeAudioData(arrayBuffer);
        musicBuffers.set(type, decodedData);
        return decodedData;
    } catch (error) {
        console.error('Error loading or decoding music file:', error);
        return null;
    }
};

const useAudioEffects = () => {
  const playSound = useCallback((type: SoundType) => {
    if (!audioContext || audioContext.state === 'suspended') return;

    try {
      let oscType: OscillatorType = 'sine';
      let freq = 440;
      let duration = 0.1;
      let gainVal = 0.1;

      switch (type) {
        case 'success':
          freq = 600;
          duration = 0.5;
          gainVal = 0.2;
          break;
        case 'error':
          oscType = 'square';
          freq = 150;
          duration = 0.3;
          gainVal = 0.2;
          break;
        case 'click':
          // Use default values
          break;
        case 'startWorkout':
            oscType = 'sawtooth';
            freq = 200;
            duration = 0.8;
            gainVal = 0.2;
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(300, audioContext.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + duration);
            gain2.gain.setValueAtTime(gainVal, audioContext.currentTime);
            gain2.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + duration);
            osc2.start(audioContext.currentTime);
            osc2.stop(audioContext.currentTime + duration);
            break;
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
          return; // Exit to avoid oscillator logic
        }
      }

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.type = oscType;
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      gain.gain.setValueAtTime(gainVal, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

    } catch (error) {
      console.error(`Error playing sound type "${type}":`, error);
    }
  }, []);

  return playSound;
};

export const startMusic = async (type: MusicType) => {
    if (!audioContext || isPlaying === type) return;
    
    const isEnabled = localStorage.getItem('musicEnabled') === 'true';
    if (!isEnabled) return;
    
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    
    const buffer = await loadMusicBuffer(type);
    if (!buffer) return;

    await stopMusic(); 

    musicSource = audioContext.createBufferSource();
    musicSource.buffer = buffer;
    musicSource.loop = true;

    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Start at 0 for fade-in
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 2); // Fade in over 2 seconds

    musicSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    musicSource.start();
    isPlaying = type;
};

export const stopMusic = (): Promise<void> => {
    return new Promise((resolve) => {
        if (musicSource && gainNode && isPlaying && audioContext) {
            try {
                // Fade out over 1 second
                gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
                
                const sourceToStop = musicSource;
                setTimeout(() => {
                    try {
                      sourceToStop.stop();
                    } catch (e) {
                      // It might have been stopped already
                    }
                    if (musicSource === sourceToStop) {
                        musicSource = null;
                        gainNode = null;
                        isPlaying = null;
                    }
                    resolve();
                }, 1000); // Wait for the fade-out to complete

            } catch (e) {
                musicSource = null;
                gainNode = null;
                isPlaying = null;
                resolve();
            }
        } else {
          resolve();
        }
    });
};

export default useAudioEffects;
