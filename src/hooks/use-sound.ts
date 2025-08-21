
'use client';

import { useCallback, useEffect, useRef } from 'react';

type SoundType = 'success' | 'error' | 'click' | 'swoosh';

let audioContext: AudioContext | null = null;
let musicSource: AudioBufferSourceNode | null = null;
let musicBuffer: AudioBuffer | null = null;
let musicGainNode: GainNode | null = null;
let isMusicPlaying = false;

// Function to initialize AudioContext safely on the client
const initAudioContext = () => {
  if (typeof window !== 'undefined' && !audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("AudioContext not supported", e);
    }
  }
};
initAudioContext();

// Function to load the music file
const loadMusic = async () => {
    if (!audioContext || musicBuffer) return;
    try {
        const response = await fetch('/sounds/music-1.mp3');
        const arrayBuffer = await response.arrayBuffer();
        audioContext.decodeAudioData(arrayBuffer, (buffer) => {
            musicBuffer = buffer;
        }, (error) => {
            console.error('Error decoding audio data:', error);
        });
    } catch (error) {
        console.error('Error fetching music file:', error);
    }
};

// Load music as soon as the app starts
loadMusic();

export const playMusic = () => {
  if (!audioContext || !musicBuffer || isMusicPlaying) return;

  // If context is suspended, it needs to be resumed by a user gesture.
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  musicSource = audioContext.createBufferSource();
  musicSource.buffer = musicBuffer;
  musicSource.loop = true;

  musicGainNode = audioContext.createGain();
  musicGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

  musicSource.connect(musicGainNode);
  musicGainNode.connect(audioContext.destination);

  musicSource.start();
  isMusicPlaying = true;
};

export const stopMusic = () => {
  if (musicSource && isMusicPlaying) {
    musicSource.stop();
    isMusicPlaying = false;
    musicSource = null;
  }
};


const useSound = () => {
  const playSound = useCallback((type: SoundType) => {
    if (!audioContext) return;
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

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
          if(!audioContext) return;
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

  return playSound;
};

export default useSound;
