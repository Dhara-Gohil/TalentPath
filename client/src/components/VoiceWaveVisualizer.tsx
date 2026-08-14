import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

interface VoiceWaveVisualizerProps {
  isListening: boolean;
  barCount?: number;
  height?: number;
  color?: string;
}

export const VoiceWaveVisualizer: React.FC<VoiceWaveVisualizerProps> = ({
  isListening,
  barCount = 12,
  height = 20,
  color = '#60a5fa'
}) => {
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(barCount).fill(18));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const smoothedLevelsRef = useRef<number[]>(new Array(barCount).fill(18));

  useEffect(() => {
    if (!isListening) {
      cleanupAudio();
      setAudioLevels(new Array(barCount).fill(18));
      return;
    }

    let isMounted = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.6;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateWave = () => {
          if (!analyserRef.current || !isListening || !isMounted) return;

          analyserRef.current.getByteFrequencyData(dataArray);

          const step = Math.max(1, Math.floor(bufferLength / barCount));
          const nextLevels: number[] = [];

          for (let i = 0; i < barCount; i++) {
            const dataIdx = Math.min(i * step, bufferLength - 1);
            const rawVal = dataArray[dataIdx];

            // Bell curve multiplier so middle bars bounce smoothly higher
            const centerFactor = 1 - Math.abs((i - (barCount - 1) / 2) / ((barCount - 1) / 2)) * 0.35;
            const targetPercent = Math.max(18, Math.min(100, Math.round((rawVal / 255) * 100 * 1.6 * centerFactor)));

            // Smooth transitions
            const prev = smoothedLevelsRef.current[i] || 18;
            const smoothed = Math.round(prev * 0.3 + targetPercent * 0.7);
            nextLevels.push(smoothed);
          }

          smoothedLevelsRef.current = nextLevels;
          setAudioLevels(nextLevels);
          animFrameRef.current = requestAnimationFrame(updateWave);
        };

        updateWave();
      } catch (err) {
        console.warn('Microphone access for visualizer failed, using animated fallback:', err);
        runFallbackAnimation();
      }
    }

    function runFallbackAnimation() {
      let stepCounter = 0;
      const updateFallback = () => {
        if (!isListening || !isMounted) return;
        stepCounter += 0.18;
        const fallbackLevels = Array.from({ length: barCount }, (_, idx) => {
          const bell = 1 - Math.abs((idx - (barCount - 1) / 2) / ((barCount - 1) / 2)) * 0.3;
          const wave = Math.sin(stepCounter + idx * 0.4) * 30 + 45;
          return Math.max(18, Math.min(95, Math.round(wave * bell)));
        });
        setAudioLevels(fallbackLevels);
        animFrameRef.current = window.setTimeout(updateFallback, 60) as unknown as number;
      };
      updateFallback();
    }

    initAudio();

    return () => {
      isMounted = false;
      cleanupAudio();
    };
  }, [isListening, barCount]);

  const cleanupAudio = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  if (!isListening) return null;

  return (
    <Box display="flex" alignItems="center" gap="3px" height={height} px={1} py={0.25}>
      {audioLevels.map((lvl, idx) => (
        <Box
          key={idx}
          sx={{
            width: 3,
            height: `${lvl}%`,
            maxHeight: '100%',
            minHeight: '20%',
            bgcolor: color,
            borderRadius: '999px',
            transition: 'height 0.05s ease-out',
            boxShadow: lvl > 35 ? `0 0 6px ${color}aa` : 'none'
          }}
        />
      ))}
    </Box>
  );
};
