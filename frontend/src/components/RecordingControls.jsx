import React, { useState, useRef } from 'react';
import { Play, Square, Download } from 'lucide-react';

export default function RecordingControls({ canvasRef }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedURL, setRecordedURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = () => {
    if (!canvasRef.current) return;
    
    // Capture the canvas stream at 30 fps
    const canvasStream = canvasRef.current.captureStream(30);
    
    // Try to get audio as well
    navigator.mediaDevices.getUserMedia({ audio: true }).then(audioStream => {
      // Combine video and audio tracks
      const tracks = [...canvasStream.getTracks(), ...audioStream.getTracks()];
      const combinedStream = new MediaStream(tracks);
      
      const options = { mimeType: 'video/webm; codecs=vp9' };
      mediaRecorderRef.current = new MediaRecorder(combinedStream, options);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedURL(url);
        chunksRef.current = [];
        
        // Stop audio tracks
        audioStream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordedURL(null);
    }).catch(err => {
      console.error("Could not get audio, recording canvas only", err);
      // Fallback: Record video only
      const options = { mimeType: 'video/webm; codecs=vp9' };
      mediaRecorderRef.current = new MediaRecorder(canvasStream, options);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedURL(url);
        chunksRef.current = [];
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordedURL(null);
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div style={{ position: 'absolute', top: '20px', left: '200px', zIndex: 150, display: 'flex', gap: '10px', alignItems: 'center' }}>
      {!isRecording ? (
        <button onClick={startRecording} className="btn btn-danger btn-sm" style={{ backdropFilter: 'blur(10px)', borderRadius: '100px' }}>
          <Play size={14} /> Record Board
        </button>
      ) : (
        <button onClick={stopRecording} className="btn btn-secondary btn-sm" style={{ backdropFilter: 'blur(10px)', borderRadius: '100px', border: '1px solid #ef4444', color: '#ef4444' }}>
          <Square size={14} fill="currentColor" /> Stop
          <span style={{ marginLeft: '6px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
        </button>
      )}

      {recordedURL && !isRecording && (
        <a href={recordedURL} download="collab-board-recording.webm" className="btn btn-cyan btn-sm" style={{ borderRadius: '100px' }}>
          <Download size={14} /> Download
        </a>
      )}
    </div>
  );
}
