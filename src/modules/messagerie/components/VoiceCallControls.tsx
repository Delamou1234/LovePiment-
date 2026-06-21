'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, PhoneIncoming } from 'lucide-react';
import type { CallSignalDto } from '../services/call-signal.service';
import { WEBRTC_ICE_SERVERS } from '../lib/support';
import { chatSessionHeaders } from '@/shared/lib/chat-session';

export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'active';

type ChatMode = 'client' | 'admin';

type Props = {
  conversationId: string;
  mode: ChatMode;
  peerLabel: string;
};

function apiBase(mode: ChatMode, conversationId: string) {
  return mode === 'admin'
    ? `/api/admin/messagerie/conversations/${conversationId}/call/signals`
    : `/api/messagerie/conversations/${conversationId}/call/signals`;
}

export function VoiceCallControls({ conversationId, mode, peerLabel }: Props) {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const lastSignalAt = useRef(new Date(0).toISOString());
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const myRole = mode === 'client' ? 'CLIENT' : 'VENDEUR';

  const headers = useCallback((): HeadersInit => {
    if (mode === 'client') {
      return { 'Content-Type': 'application/json', ...chatSessionHeaders() };
    }
    return { 'Content-Type': 'application/json' };
  }, [mode]);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    pendingOfferRef.current = null;
  }, []);

  const sendSignal = useCallback(
    async (type: CallSignalDto['type'], payload?: unknown) => {
      await fetch(apiBase(mode, conversationId), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ type, payload }),
      });
    },
    [conversationId, headers, mode],
  );

  const setupPeerConnection = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    const pc = new RTCPeerConnection({ iceServers: WEBRTC_ICE_SERVERS });
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      const audio = remoteAudioRef.current;
      if (audio && event.streams[0]) {
        audio.srcObject = event.streams[0];
        void audio.play().catch(() => {});
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        void sendSignal('ICE', { candidate: event.candidate.toJSON() });
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sendSignal]);

  const endCall = useCallback(async () => {
    await sendSignal('END');
    cleanup();
    setStatus('idle');
    setError(null);
  }, [cleanup, sendSignal]);

  const rejectCall = useCallback(async () => {
    await sendSignal('REJECT');
    cleanup();
    setStatus('idle');
    pendingOfferRef.current = null;
  }, [cleanup, sendSignal]);

  const startCall = useCallback(async () => {
    if (status !== 'idle') return;
    setError(null);
    try {
      const pc = await setupPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal('OFFER', { sdp: offer });
      setStatus('outgoing');
    } catch {
      cleanup();
      setError('Microphone requis pour appeler.');
    }
  }, [cleanup, sendSignal, setupPeerConnection, status]);

  const acceptCall = useCallback(async () => {
    const offer = pendingOfferRef.current;
    if (!offer) return;
    setError(null);
    try {
      const pc = await setupPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal('ANSWER', { sdp: answer });
      pendingOfferRef.current = null;
      setStatus('active');
    } catch {
      cleanup();
      setError('Impossible de rejoindre l\'appel.');
      setStatus('idle');
    }
  }, [cleanup, sendSignal, setupPeerConnection]);

  const handleRemoteSignal = useCallback(
    async (signal: CallSignalDto) => {
      if (signal.fromRole === myRole) return;

      const payload = signal.payload as Record<string, unknown>;

      if (signal.type === 'OFFER' && status === 'idle') {
        const sdp = payload.sdp as RTCSessionDescriptionInit | undefined;
        if (sdp) {
          pendingOfferRef.current = sdp;
          setStatus('incoming');
        }
        return;
      }

      if (signal.type === 'ANSWER' && (status === 'outgoing' || status === 'active')) {
        const sdp = payload.sdp as RTCSessionDescriptionInit | undefined;
        if (sdp && pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          setStatus('active');
        }
        return;
      }

      if (signal.type === 'ICE' && pcRef.current) {
        const candidate = payload.candidate as RTCIceCandidateInit | undefined;
        if (candidate) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            /* candidat déjà ajouté */
          }
        }
        return;
      }

      if (signal.type === 'REJECT' || signal.type === 'END') {
        cleanup();
        setStatus('idle');
        pendingOfferRef.current = null;
      }
    },
    [cleanup, myRole, status],
  );

  useEffect(() => {
    let active = true;

    const poll = async () => {
      if (!active || document.hidden) return;
      try {
        const res = await fetch(
          `${apiBase(mode, conversationId)}?since=${encodeURIComponent(lastSignalAt.current)}`,
          { headers: headers() },
        );
        if (!res.ok) return;
        const data = await res.json();
        const signals = (data.signals ?? []) as CallSignalDto[];
        for (const signal of signals) {
          lastSignalAt.current = signal.createdAt;
          await handleRemoteSignal(signal);
        }
      } catch {
        /* ignore */
      }
    };

    const pollMs = status === 'idle' ? 12_000 : 1500;

    poll();
    const interval = setInterval(poll, pollMs);

    const onVisibility = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [conversationId, handleRemoteSignal, headers, mode, status]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {status === 'idle' && (
        <button
          type="button"
          onClick={startCall}
          className="rounded-full p-2 text-olive hover:bg-olive/10 transition"
          title="Appeler sur le site"
        >
          <Phone className="h-4 w-4" />
        </button>
      )}

      {(status === 'outgoing' || status === 'active') && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-emerald-600">
            {status === 'outgoing' ? 'Appel en cours…' : 'En communication'}
          </span>
          <button
            type="button"
            onClick={endCall}
            className="rounded-full p-2 bg-red-100 text-red-600 hover:bg-red-200 transition"
            title="Raccrocher"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>
      )}

      {status === 'incoming' && (
        <div className="absolute inset-x-0 top-full z-20 mx-4 mt-2 rounded-xl border border-beige-border bg-white p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <PhoneIncoming className="h-4 w-4 text-olive animate-pulse" />
            <p className="text-xs font-semibold text-zinc-800">
              Appel entrant de {peerLabel}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={acceptCall}
              className="flex-1 rounded-full bg-olive py-2 text-xs font-bold text-white hover:bg-olive-dark"
            >
              Répondre
            </button>
            <button
              type="button"
              onClick={rejectCall}
              className="flex-1 rounded-full border border-red-200 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
            >
              Refuser
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="absolute top-full right-0 mt-1 text-[10px] text-red-500 whitespace-nowrap">
          {error}
        </p>
      )}
    </>
  );
}
