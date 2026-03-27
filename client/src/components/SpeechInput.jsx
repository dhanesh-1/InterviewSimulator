import { useState, useRef, useCallback } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';
import { isSpeechRecognitionSupported } from '../utils/speechUtils';

export default function SpeechInput({ onTranscript, disabled = false, initialTranscript = '' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(initialTranscript);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const baseTranscriptRef = useRef(initialTranscript);
  const manuallyStoppedRef = useRef(false);

  const startRecording = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    manuallyStoppedRef.current = false;
    baseTranscriptRef.current = transcript ? transcript.trim() + ' ' : '';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const newFullTranscript = (baseTranscriptRef.current + final).trim();

      setTranscript(newFullTranscript);
      setInterimText(interim);

      if (newFullTranscript) {
        onTranscript(newFullTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Ignore timeout silence errors. Rely on onend to gracefully restart the stream.
        return;
      }

      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      if (event.error === 'network') {
        alert('Speech recognition network error. This typically happens if you are offline, using Brave Browser (which blocks speech APIs), or a strict firewall. Please use Chrome/Edge or switch to Text mode.');
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert('Microphone access was denied. Please allow microphone permissions in your browser settings to use speech input.');
      }
    };

    recognition.onend = () => {
      if (!manuallyStoppedRef.current) {
        // Chrome automatically stops recognition after ~10 seconds of silence.
        // Silently restart to allow continuous thinking/talking.
        try {
          recognition.start();
        } catch (e) {
          setIsRecording(false);
          setInterimText('');
        }
      } else {
        setIsRecording(false);
        setInterimText('');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [transcript, onTranscript]);

  const stopRecording = useCallback(() => {
    manuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimText('');

    // Send final transcript
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Don't clear transcript! Let it accumulate instead.
      startRecording();
    }
  };

  if (!isSpeechRecognitionSupported()) {
    return (
      <div className="speech-container">
        <div className="empty-state">
          <FiMicOff size={48} style={{ opacity: 0.5 }} />
          <h3>Speech Not Supported</h3>
          <p>Your browser doesn't support speech recognition. Please use Chrome or Edge, or switch to text input mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="speech-container">
      <button
        className={`speech-btn ${isRecording ? 'recording' : 'idle'}`}
        onClick={toggleRecording}
        disabled={disabled}
        title={isRecording ? 'Stop recording' : 'Start recording'}
        id="speech-toggle-btn"
      >
        {isRecording ? <FiMicOff size={28} /> : <FiMic size={28} />}
      </button>

      <p className={`speech-status ${isRecording ? 'recording' : ''}`}>
        {isRecording ? '🔴 Listening... Speak your answer' : 'Click the microphone to start speaking'}
      </p>

      <div className="speech-transcript" id="speech-transcript">
        {transcript || interimText ? (
          <>
            {transcript && <span>{transcript} </span>}
            {interimText && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{interimText}</span>}
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Your spoken answer will appear here...</span>
        )}
      </div>
    </div>
  );
}
