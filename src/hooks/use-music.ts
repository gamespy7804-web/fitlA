
'use client';

let audioContext: AudioContext | null = null;
let musicBuffer: AudioBuffer | null = null;
let musicSource: AudioBufferSourceNode | null = null;
let gainNode: GainNode | null = null;
let isPlaying = false;

// Function to initialize the AudioContext, must be called after a user interaction
export const initializeAudio = () => {
    if (typeof window !== 'undefined' && !audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            // If the context is in a suspended state, it will be resumed by user interaction.
            if (audioContext.state === 'suspended') {
                 audioContext.resume();
            }
        } catch (e) {
            console.error("AudioContext is not supported by this browser.", e);
        }
    } else if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
};

export const getAudioContext = () => audioContext;

export const loadMusicBuffer = async (): Promise<AudioBuffer | null> => {
    if (musicBuffer) return musicBuffer;
    if (!audioContext) {
        console.error("AudioContext not initialized. Cannot load music.");
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


export const startMusicPlayback = (buffer: AudioBuffer) => {
    if (!audioContext || isPlaying) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    stopMusicPlayback(); // Stop any existing playback first

    musicSource = audioContext.createBufferSource();
    musicSource.buffer = buffer;
    musicSource.loop = true;

    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 1); // Fade in

    musicSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    musicSource.start();
    isPlaying = true;
};

export const stopMusicPlayback = () => {
    if (musicSource && gainNode && isPlaying && audioContext) {
        try {
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
            musicSource.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // This can throw an error if stop() is called multiple times.
            console.warn("Could not stop music source:", e);
        }
    }
    musicSource = null;
    gainNode = null;
    isPlaying = false;
};
