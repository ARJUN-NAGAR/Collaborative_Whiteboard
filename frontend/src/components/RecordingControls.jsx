import React, { useState, useRef } from 'react';
import { Play, Square, Download } from 'lucide-react';

export default function RecordingControls({ canvasRef }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedURL, setRecordedURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = () => {
    const canvas = typeof canvasRef?.current === 'function'
      ? canvasRef.current()
      : canvasRef?.current;
    if (!canvas) return;

    const canvasStream = canvas.captureStream(30);

    const startWithStream = (stream) => {
      const options = { mimeType: 'video/webm; codecs=vp9' };
      try {
        mediaRecorderRef.current = new MediaRecorder(stream, options);
      } catch {
        mediaRecorderRef.current = new MediaRecorder(stream);
      }

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedURL(URL.createObjectURL(blob));
        chunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordedURL(null);
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(audioStream => {
        const combined = new MediaStream([...canvasStream.getTracks(), ...audioStream.getTracks()]);
        startWithStream(combined);
      })
      .catch(() => startWithStream(canvasStream));
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 150,
      display: 'flex',
      gap: 6,
      alignItems: 'center',
    }}>
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="btn btn-sm"
          style={{
            background: 'rgba(14,14,26,0.75)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#f87171',
            borderRadius: 100,
            backdropFilter: 'blur(12px)',
            gap: 5,
          }}
          title="Start recording the board"
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
          Record
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="btn btn-sm"
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.5)',
            color: '#f87171',
            borderRadius: 100,
            backdropFilter: 'blur(12px)',
          }}
        >
          <Square size={12} fill="#ef4444" />
          <span style={{ animation: 'pulse 1.5s infinite' }}>Recording…</span>
        </button>
      )}

      {recordedURL && !isRecording && (
        <a
          href={recordedURL}
          download="board-recording.webm"
          className="btn btn-sm"
          style={{
            background: 'rgba(6,182,212,0.15)',
            border: '1px solid rgba(6,182,212,0.4)',
            color: '#06b6d4',
            borderRadius: 100,
            backdropFilter: 'blur(12px)',
            textDecoration: 'none',
          }}
        >
          <Download size={12} /> Save
        </a>
      )}
    </div>
  );
}