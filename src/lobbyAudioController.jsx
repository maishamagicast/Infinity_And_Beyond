import React, { useEffect, useRef } from 'react';
import { AmbientEngine } from './ambientEngine';

export default function LobbyAudioController() {
  const engineRef = useRef(null);

  useEffect(() => {
    // Pass your short files from public/assets/audio/
    const audioFiles = [
    '/assets/audio/578628main_hskquindar.mp3',
    '/assets/audio/574928main_houston_problem.mp3',
    '/assets/audio/590320main_ringtone_apollo11_countdown.mp3',
    '/assets/audio/590329main_ringtone_SDO_launchNats.mp3',
    '/assets/audio/590331main_ringtone_smallStep.mp3'
    ];

    engineRef.current = new AmbientEngine(audioFiles);

    // Auto-start on first user interaction (browser autoplay policy requirement)
    const handleFirstClick = () => {
      engineRef.current?.start();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);

    return () => {
      engineRef.current?.stop();
      window.removeEventListener('click', handleFirstClick);
    };
  }, []);

  return null; // Headless component managing background audio graph
}