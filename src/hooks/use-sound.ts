
'use client';

import { useCallback } from 'react';

type SoundType = 'success' | 'error' | 'click' | 'swoosh';

let audioContext: AudioContext | null = null;
let musicSource: AudioBufferSourceNode | null = null;
let musicBuffer: AudioBuffer | null = null;
let musicGainNode: GainNode | null = null;
let isMusicPlaying = false;
let hasAttemptedLoad = false;
let isMusicEnabledGlobally = false;

// Function to initialize AudioContext safely on the client side after user interaction
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

// Function to load the music file
const loadMusic = async () => {
    initAudioContext();
    if (!audioContext || musicBuffer || hasAttemptedLoad) return;
    hasAttemptedLoad = true; // Mark that we are trying to load

    try {
        const response = await fetch('/sounds/music-1.mp3');
        
        // Check if the response is successful and the content type is correct
        if (!response.ok || !response.headers.get('content-type')?.includes('audio')) {
             console.error("Error: El archivo de música no es un archivo de audio válido. Asegúrate de que 'public/sounds/music-1.mp3' existe y no está dañado.");
            return;
        }

        const arrayBuffer = await response.arrayBuffer();
        audioContext.decodeAudioData(arrayBuffer, (buffer) => {
            musicBuffer = buffer;
            // If music should be playing, start it now that it's loaded
            if (isMusicEnabledGlobally) {
                playMusicInternal();
            }
        }, (error) => {
            console.error('Error decoding audio data:', error);
        });
    } catch (error) {
        console.error('Error fetching or decoding music file:', error);
    }
};

const playMusicInternal = () => {
    const context = initAudioContext();
    if (!context || !musicBuffer || isMusicPlaying) return;

    if (context.state === 'suspended') {
        context.resume();
    }

    musicSource = context.createBufferSource();
    musicSource.buffer = musicBuffer;
    musicSource.loop = true;

    musicGainNode = context.createGain();
    musicGainNode.gain.setValueAtTime(0.3, context.currentTime);

    musicSource.connect(musicGainNode);
    musicGainNode.connect(context.destination);

    musicSource.start();
    isMusicPlaying = true;
};

export const startMusic = () => {
    isMusicEnabledGlobally = true;
    if (!musicBuffer) {
        loadMusic();
    } else {
        playMusicInternal();
    }
};

export const stopMusic = () => {
    isMusicEnabledGlobally = false;
    if (musicSource && isMusicPlaying) {
        musicSource.stop();
        musicSource.disconnect();
        musicSource = null;
        isMusicPlaying = false;
    }
};


const useSound = () => {
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

export default useSound;
