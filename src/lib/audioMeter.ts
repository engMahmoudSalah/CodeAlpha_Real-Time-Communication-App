/**
 * Real-time audio volume meter using Web Audio API
 */

export interface AudioMeter {
  stop: () => void;
}

export function attachAudioMeter(
  stream: MediaStream,
  onLevel: (level: number, isSpeaking: boolean) => void
): AudioMeter {
  let isRunning = true;
  let audioContext: AudioContext | null = null;
  let animationFrameId: number | null = null;

  try {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      return { stop: () => {} };
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return { stop: () => {} };
    }

    audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkVolume = () => {
      if (!isRunning) return;

      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedLevel = Math.min(100, Math.round((average / 128) * 100));
      const isSpeaking = normalizedLevel > 14;

      onLevel(normalizedLevel, isSpeaking);
      animationFrameId = requestAnimationFrame(checkVolume);
    };

    animationFrameId = requestAnimationFrame(checkVolume);
  } catch (err) {
    console.warn('AudioMeter setup notice:', err);
  }

  return {
    stop: () => {
      isRunning = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    },
  };
}
