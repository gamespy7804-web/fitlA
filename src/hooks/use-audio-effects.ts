
'use client';

import { useCallback } from 'react';

type SoundType = 'success' | 'error' | 'click' | 'swoosh' | 'startWorkout';
type MusicType = 'main' | 'game';

let audioContext: AudioContext | null = null;
const musicBuffers = new Map<MusicType, AudioBuffer>();

// Audio state
let currentSource: AudioBufferSourceNode | null = null;
let currentGain: GainNode | null = null;
let nextSource: AudioBufferSourceNode | null = null;
let nextGain: GainNode | null = null;

let currentMusicType: MusicType | null = null;
let loopTimeout: NodeJS.Timeout | null = null;
let isInitialized = false;
let isEnabled = false;
let musicVolume = 0.5; // Default volume (50%)

const FADE_TIME = 2; // seconds for crossfade

// Must be called after a user interaction
export const initializeAudio = () => {
    if (isInitialized || typeof window === 'undefined') return;
    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        isInitialized = true;
        // Check initial state from localStorage
        isEnabled = localStorage.getItem('musicEnabled') === 'true';
        const storedVolume = localStorage.getItem('musicVolume');
        if (storedVolume) {
            musicVolume = parseFloat(storedVolume);
        }
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
        const arrayBuffer = await response.arrayBuffer();
        const decodedData = await audioContext.decodeAudioData(arrayBuffer);
        musicBuffers.set(type, decodedData);
        return decodedData;
    } catch (error) {
        console.error(`Error loading or decoding music file for type "${type}":`, error);
        return null;
    }
};


const useAudioEffects = () => {
  const playSound = useCallback((type: SoundType) => {
    if (!audioContext || audioContext.state === 'suspended' || !isInitialized) return;

    try {
      let oscType: OscillatorType = 'sine';
      let freq = 440;
      let duration = 0.1;
      let gainVal = 0.15; // Increased default volume

      switch (type) {
        case 'success':
          freq = 600;
          duration = 0.5;
          gainVal = 0.25; // Increased volume
          break;
        case 'error':
          oscType = 'square';
          freq = 150;
          duration = 0.3;
          gainVal = 0.25; // Increased volume
          break;
        case 'click':
          gainVal = 0.15; // Increased volume
          break;
        case 'startWorkout': {
          const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
          const noteDuration = 0.15;
          const startTime = audioContext.currentTime;

          notes.forEach((noteFreq, i) => {
            const osc = audioContext!.createOscillator();
            const gain = audioContext!.createGain();
            osc.connect(gain);
            gain.connect(audioContext!.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(noteFreq, startTime + i * noteDuration);
            gain.gain.setValueAtTime(0.3, startTime + i * noteDuration); // Increased volume
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + (i + 1) * noteDuration);

            osc.start(startTime + i * noteDuration);
            osc.stop(startTime + (i + 1) * noteDuration);
          });
          return;
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
          gain.gain.setValueAtTime(0.2, audioContext.currentTime); // Increased volume
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

// --- Standalone Music Control Functions ---

const playTrack = async (type: MusicType, startTime = 0) => {
    if (!audioContext || !isInitialized || !isEnabled) return;
    
    const buffer = await loadMusicBuffer(type);
    if (!buffer) return;

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    
    if (loopTimeout) clearTimeout(loopTimeout);

    // Set up the new track (nextSource)
    nextSource = audioContext.createBufferSource();
    nextSource.buffer = buffer;
    nextGain = audioContext.createGain();
    nextSource.connect(nextGain);
    nextGain.connect(audioContext.destination);

    // Fade in the new track
    nextGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    nextGain.gain.linearRampToValueAtTime(musicVolume * 0.2, audioContext.currentTime + FADE_TIME); // Increased default music volume
    nextSource.start(audioContext.currentTime, startTime);

    // Fade out the old track
    if (currentSource && currentGain) {
        currentGain.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + FADE_TIME);
        const sourceToStop = currentSource;
        setTimeout(() => {
            try { sourceToStop.stop(); } catch(e) {}
        }, FADE_TIME * 1000);
    }

    // The new track becomes the current track
    currentSource = nextSource;
    currentGain = nextGain;
    currentMusicType = type;

    // Schedule the next crossfade for looping
    const trackDuration = buffer.duration;
    const timeUntilCrossfade = (trackDuration - startTime - FADE_TIME) * 1000;

    loopTimeout = setTimeout(() => {
        playTrack(type); // This will handle the crossfade
    }, timeUntilCrossfade > 0 ? timeUntilCrossfade : 0);
};

export const startMusic = (type: MusicType) => {
    isEnabled = localStorage.getItem('musicEnabled') === 'true';
    if (!isInitialized || !isEnabled) {
        return;
    }
    if (currentMusicType === type) return;

    playTrack(type);
};

export const stopMusic = () => {
    if (!audioContext || !isInitialized) return;
    
    if (loopTimeout) clearTimeout(loopTimeout);
    loopTimeout = null;

    if (currentSource && currentGain) {
        currentGain.gain.cancelScheduledValues(audioContext.currentTime);
        currentGain.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 1); // 1 sec fade out
        const sourceToStop = currentSource;
        setTimeout(() => {
            try { sourceToStop.stop(); } catch(e) {}
        }, 1000);
    }

    currentSource = null;
    currentGain = null;
    currentMusicType = null;
};

export const toggleMusic = (shouldBeEnabled: boolean) => {
    if (shouldBeEnabled) {
        isEnabled = true;
        localStorage.setItem('musicEnabled', 'true');
        if (!currentMusicType) {
            startMusic('main');
        }
    } else {
        isEnabled = false;
        localStorage.setItem('musicEnabled', 'false');
        stopMusic();
    }
}

export const setMusicVolume = (volume: number) => {
  musicVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
  localStorage.setItem('musicVolume', musicVolume.toString());
  if (currentGain && audioContext) {
    // We multiply by 0.2 to keep the max volume from being too loud
    currentGain.gain.linearRampToValueAtTime(musicVolume * 0.2, audioContext.currentTime + 0.1);
  }
};


export default useAudioEffects;
