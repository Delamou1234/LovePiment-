'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { formatDuration } from '../lib/format';

type Props = {
  src: string;
  durationMs?: number | null;
  isMine: boolean;
};

export function VoiceMessagePlayer({ src, durationMs, isMine }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMs, setCurrentMs] = useState(0);
  const [totalMs, setTotalMs] = useState(durationMs ?? 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) return;
      setCurrentMs(audio.currentTime * 1000);
      setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onMeta = () => {
      if (audio.duration && !Number.isNaN(audio.duration)) {
        setTotalMs(Math.round(audio.duration * 1000));
      }
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentMs(0);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      document.querySelectorAll('[data-voice-player]').forEach((el) => {
        if (el !== audio) (el as HTMLAudioElement).pause();
      });
      void audio.play();
      setPlaying(true);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  };

  const accent = isMine ? 'bg-white/30' : 'bg-olive/20';
  const fill = isMine ? 'bg-white' : 'bg-olive';
  const btn = isMine
    ? 'bg-white/20 text-white hover:bg-white/30'
    : 'bg-olive/10 text-olive hover:bg-olive/20';

  return (
    <div className="flex items-center gap-2.5 min-w-[220px] max-w-[280px]">
      <audio ref={audioRef} src={src} preload="metadata" data-voice-player className="hidden" />
      <button
        type="button"
        onClick={toggle}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${btn}`}
        aria-label={playing ? 'Pause' : 'Lire'}
      >
        {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          role="slider"
          tabIndex={0}
          onClick={seek}
          className={`relative h-1.5 rounded-full cursor-pointer ${accent}`}
        >
          <div className={`absolute inset-y-0 left-0 rounded-full ${fill}`} style={{ width: `${progress}%` }} />
        </div>
        <p className={`mt-1 text-[10px] tabular-nums ${isMine ? 'text-white/70' : 'text-zinc-500'}`}>
          {formatDuration(playing ? currentMs : totalMs || durationMs || 0)}
        </p>
      </div>
    </div>
  );
}
