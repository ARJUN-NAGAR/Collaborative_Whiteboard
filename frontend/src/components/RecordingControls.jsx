import { useState, useRef } from 'react';
import { Square, Download } from 'lucide-react';

export default function RecordingControls({ canvasRef }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedURL, setRecordedURL] = useState(null);
  const recRef    = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = () => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const stream = canvas.captureStream?.(30);
    if (!stream) return;

    const start = (s) => {
      let mr;
      try { mr = new MediaRecorder(s, { mimeType: 'video/webm; codecs=vp9' }); }
      catch { mr = new MediaRecorder(s); }
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedURL(URL.createObjectURL(blob));
        chunksRef.current = [];
      };
      mr.start();
      recRef.current = mr;
      setIsRecording(true);
      setRecordedURL(null);
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(audio => start(new MediaStream([...stream.getTracks(), ...audio.getTracks()])))
      .catch(() => start(stream));
  };

  const stopRecording = () => {
    recRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="rec-pill">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="btn btn-sm"
          style={{ background: 'var(--glass)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', borderRadius: 'var(--r-full)', backdropFilter: 'blur(12px)', gap: 5 }}
          title="Record board"
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
          Rec
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="btn btn-sm"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.45)', color: '#f87171', borderRadius: 'var(--r-full)' }}
        >
          <Square size={11} fill="#ef4444" />
          <span style={{ animation: 'pulse 1.5s infinite' }}>Stop</span>
        </button>
      )}
      {recordedURL && !isRecording && (
        <a
          href={recordedURL}
          download="board-recording.webm"
          className="btn btn-sm"
          style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.35)', color: 'var(--cyan)', borderRadius: 'var(--r-full)', textDecoration: 'none' }}
        >
          <Download size={11} /> Save
        </a>
      )}
    </div>
  );
}