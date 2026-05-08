import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer/simplepeer.min.js';
import { Video, VideoOff } from 'lucide-react';

export default function VideoOverlay({ isHost, currentUserId, remoteUsers, sendWebrtcSignal, incomingSignals }) {
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const myVideo = useRef();
  const partnerVideo = useRef();
  const peersRef = useRef({});

  // Fix simple-peer in Vite
  if (typeof global === 'undefined') {
    window.global = window;
  }
  if (typeof process === 'undefined') {
    window.process = { env: {} };
  }

  // Handle incoming signals
  useEffect(() => {
    if (!incomingSignals) return;
    
    // For Host: receiving answer from viewer
    if (isHost && incomingSignals.to === currentUserId) {
      const peer = peersRef.current[incomingSignals.from];
      if (peer && !peer.destroyed) {
        peer.signal(incomingSignals.signal);
      }
    } 
    // For Viewer: receiving offer from host
    else if (!isHost && incomingSignals.to === currentUserId) {
      if (!peersRef.current['host']) {
        const peer = new Peer({
          initiator: false,
          trickle: false,
        });

        peer.on('signal', signal => {
          sendWebrtcSignal({ to: incomingSignals.from, from: currentUserId, signal });
        });

        peer.on('stream', stream => {
          setRemoteStream(stream);
          if (partnerVideo.current) partnerVideo.current.srcObject = stream;
        });

        peer.signal(incomingSignals.signal);
        peersRef.current['host'] = peer;
      } else {
        peersRef.current['host'].signal(incomingSignals.signal);
      }
    }
  }, [incomingSignals]);

  // Host starting video
  const toggleVideo = async () => {
    if (videoEnabled) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setVideoEnabled(false);
      Object.values(peersRef.current).forEach(peer => peer.destroy());
      peersRef.current = {};
    } else {
      try {
        const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(currentStream);
        setVideoEnabled(true);
        if (myVideo.current) myVideo.current.srcObject = currentStream;

        // Create a peer for every remote user currently connected
        Object.keys(remoteUsers).forEach(userId => {
          const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: currentStream,
          });

          peer.on('signal', signal => {
            sendWebrtcSignal({ to: userId, from: currentUserId, signal });
          });

          peersRef.current[userId] = peer;
        });
      } catch (err) {
        console.error("Failed to get local stream", err);
      }
    }
  };

  // If new user joins while host is streaming, create a new peer for them
  useEffect(() => {
    if (isHost && videoEnabled && stream) {
      Object.keys(remoteUsers).forEach(userId => {
        if (!peersRef.current[userId]) {
          const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
          });
          peer.on('signal', signal => {
            sendWebrtcSignal({ to: userId, from: currentUserId, signal });
          });
          peersRef.current[userId] = peer;
        }
      });
    }
  }, [remoteUsers, isHost, videoEnabled, stream]);

  return (
    <div style={{ position: 'absolute', top: '80px', left: '20px', zIndex: 300, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {isHost && (
        <button onClick={toggleVideo} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', backdropFilter: 'blur(10px)' }}>
          {videoEnabled ? <><VideoOff size={14} /> Stop Video</> : <><Video size={14} /> Start Video</>}
        </button>
      )}

      {/* Host sees themselves */}
      {isHost && videoEnabled && stream && (
        <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--purple)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          <video playsInline muted ref={myVideo} autoPlay style={{ width: '200px', height: '150px', objectFit: 'cover' }} />
          <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}>Host (You)</div>
        </div>
      )}

      {/* Viewers see host */}
      {!isHost && remoteStream && (
        <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--purple)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          <video playsInline ref={partnerVideo} autoPlay style={{ width: '200px', height: '150px', objectFit: 'cover' }} />
          <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', fontSize: '12px', textAlign: 'center' }}>Host Broadcasting</div>
        </div>
      )}
    </div>
  );
}
