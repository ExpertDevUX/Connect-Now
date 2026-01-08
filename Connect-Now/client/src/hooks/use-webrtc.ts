import { useEffect, useRef, useState, useCallback } from 'react';
import { type SignalMessage } from '@shared/routes';
import { useToast } from '@/hooks/use-toast';

const STUN_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

const MEDIA_CONSTRAINTS = {
  video: {
    width: { min: 1280, ideal: 1920, max: 3840 },
    height: { min: 720, ideal: 1080, max: 2160 },
    frameRate: { ideal: 30, max: 60 },
    facingMode: "user",
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 2,
    sampleRate: 48000,
    sampleSize: 16,
  },
};

export function useWebRTC(roomId: string) {
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'new' | 'connecting' | 'connected' | 'disconnected' | 'failed'>('new');
  const [isBoss, setIsBoss] = useState(false);
  const [meetingFinished, setMeetingFinished] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null); // Ref for immediate access in callbacks

  const initializePeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(STUN_CONFIG);

    // Bandwidth management
    pc.addEventListener('track', (event) => {
      const transceiver = pc.getTransceivers().find(t => t.receiver.track === event.track);
      if (transceiver && transceiver.sender.track) {
        const parameters = transceiver.sender.getParameters();
        if (!parameters.encodings) parameters.encodings = [{}];
        // Set higher bitrate for 1080p/4K support
        parameters.encodings[0].maxBitrate = 8000000; // 8 Mbps for high quality
        parameters.encodings[0].networkPriority = 'high';
        transceiver.sender.setParameters(parameters);
      }
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'candidate',
          payload: event.candidate,
          roomId
        } as SignalMessage));
      }
    };

    pc.ontrack = (event) => {
      console.log('Remote track received:', event.track.kind);
      // Ensure the remote audio track is enabled
      if (event.track.kind === 'audio') {
        event.track.enabled = true;
      }
      
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      
      // Crucial: Play the audio track directly via a hidden audio element if it's an audio track
      if (event.track.kind === 'audio') {
        const remoteAudio = new Audio();
        remoteAudio.srcObject = new MediaStream([event.track]);
        remoteAudio.autoplay = true;
        remoteAudio.play().catch(e => console.error("Remote audio play failed:", e));
        // Keep a reference to prevent garbage collection
        (window as any)._remoteAudio = remoteAudio;
      }
      
      setRemoteStream(stream);
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log('ICE Connection State:', state);
      if (state === 'failed') {
        console.log('ICE failed, attempting restart...');
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('Connection State:', state);
      if (state === 'closed') {
        setConnectionStatus('disconnected');
      } else if (state === 'connected' || state === 'connecting' || state === 'failed' || state === 'disconnected') {
        setConnectionStatus(state);
      }
      
      // Attempt recovery on failure
      if (state === 'failed') {
        console.log('Connection failed, attempting ICE restart');
        try {
          pc.restartIce();
        } catch (e) {
          console.error("ICE restart failed:", e);
        }
      }
    };

    // Add local tracks if stream exists
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [roomId]);

  useEffect(() => {
    // 1. Get User Media
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        // Ensure tracks are enabled based on initial state
        stream.getAudioTracks().forEach(track => track.enabled = true);
        stream.getVideoTracks().forEach(track => track.enabled = true);
      } catch (err) {
        console.error("Error accessing media devices:", err);
        toast({
          title: "Camera/Microphone Error",
          description: "Could not access camera or microphone. Please check permissions.",
          variant: "destructive"
        });
      }
    };

    startMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  useEffect(() => {
    if (!roomId || !localStream) return;

    // 2. Connect WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WS Connected');
      ws.send(JSON.stringify({ type: 'join', roomId } as SignalMessage));
    };

    ws.onmessage = async (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        console.error("Failed to parse message:", event.data);
        return;
      }

      let pc = peerConnectionRef.current;

      try {
        switch (msg.type) {
          case 'participants-list':
            if (msg.payload && Array.isArray(msg.payload)) {
              (window as any).dispatchEvent(new CustomEvent('participants-updated', { detail: msg.payload }));
            }
            break;

          case 'init':
            setIsBoss(msg.isBoss);
            break;

          case 'meeting-finished':
            setMeetingFinished(true);
            toast({
              title: "Meeting Finished",
              description: "The host has left the room. The meeting is now over.",
              variant: "destructive",
            });
            break;

          case 'join':
            // Another peer joined, I am the initiator
            console.log("Peer joined, creating offer");
            
            // Play notification sound
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
              audio.volume = 0.5;
              audio.play().catch(e => console.log("Sound play failed (interaction required):", e));
            } catch (e) {
              console.error("Audio error:", e);
            }

            toast({
              title: "User Joined",
              description: "A new participant has entered the room.",
            });

            if (!pc) pc = initializePeerConnection();
            
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            });
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({
              type: 'offer',
              payload: offer,
              roomId
            } as SignalMessage));
            break;

          case 'offer':
            // I received an offer, I am the receiver
            if (!pc) pc = initializePeerConnection();
            
            await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            ws.send(JSON.stringify({
              type: 'answer',
              payload: answer,
              roomId
            } as SignalMessage));
            break;

          case 'answer':
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
            }
            break;

          case 'candidate':
            if (pc) {
              await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
            }
            break;
        }
      } catch (error) {
        console.error("Signaling error:", error);
      }
    };

    return () => {
      ws.close();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [roomId, localStream, initializePeerConnection]);

  const toggleAudio = (enabled: boolean) => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
        // Some browsers need explicit mute/unmute of the track
        if (enabled) {
          track.applyConstraints({ echoCancellation: true, noiseSuppression: true });
        }
      });
    }
  };

  const toggleVideo = (enabled: boolean) => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  };

  const updateNickname = (name: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'update-name',
        payload: name,
        roomId
      } as any));
    }
  };

  return {
    localStream,
    remoteStream,
    connectionStatus,
    toggleAudio,
    toggleVideo,
    updateNickname,
    isBoss
  };
}
