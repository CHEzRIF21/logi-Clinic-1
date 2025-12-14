import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  isUsingAPI: boolean;
}

/**
 * Hook amélioré pour la reconnaissance vocale
 * Utilise l'API backend si disponible, sinon utilise l'API Web Speech Recognition du navigateur
 */
export const useSpeechRecognitionAPI = (
  language: string = 'fr-FR',
  continuous: boolean = true,
  interimResults: boolean = true,
  useBackendAPI: boolean = true // Par défaut, essayer d'utiliser le backend
): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isUsingAPI, setIsUsingAPI] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
    '';

  // Vérifier si le backend API est disponible
  useEffect(() => {
    if (useBackendAPI) {
      checkBackendStatus();
    }
  }, [useBackendAPI]);

  const checkBackendStatus = async () => {
    if (!API_BASE_URL) {
      console.warn('VITE_API_URL n\'est pas configuré, utilisation de l\'API du navigateur');
      initializeBrowserAPI();
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/speech-to-text/status`);
      const data = await response.json();
      if (data.configured) {
        setBackendAvailable(true);
        setIsUsingAPI(true);
        setIsSupported(true);
      } else {
        // Fallback sur l'API du navigateur
        initializeBrowserAPI();
      }
    } catch (err) {
      console.warn('Backend API non disponible, utilisation de l\'API du navigateur');
      initializeBrowserAPI();
    }
  };

  const initializeBrowserAPI = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError(
        'La reconnaissance vocale n\'est pas supportée par votre navigateur. Veuillez utiliser Chrome, Edge ou Safari.'
      );
      return;
    }

    setIsSupported(true);
    setIsUsingAPI(false);

    // Créer une instance de SpeechRecognition
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    // Gérer les résultats
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
    };

    // Gérer les erreurs
    recognition.onerror = (event: any) => {
      let errorMessage = 'Erreur de reconnaissance vocale';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Aucune parole détectée. Veuillez réessayer.';
          break;
        case 'audio-capture':
          errorMessage = 'Aucun microphone détecté. Veuillez vérifier votre microphone.';
          break;
        case 'not-allowed':
          errorMessage = 'Permission d\'accès au microphone refusée. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.';
          break;
        case 'network':
          errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
          break;
        case 'aborted':
          errorMessage = 'Reconnaissance vocale interrompue.';
          break;
        default:
          errorMessage = `Erreur: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
    };

    // Gérer la fin de la reconnaissance
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  };

  // Initialiser l'API du navigateur si le backend n'est pas disponible
  useEffect(() => {
    if (!useBackendAPI || !backendAvailable) {
      initializeBrowserAPI();
    }
  }, [language, continuous, interimResults, useBackendAPI, backendAvailable]);

  const startListeningWithBackend = async () => {
    try {
      setError(null);
      setIsListening(true);

      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Créer un MediaRecorder pour enregistrer l'audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Envoyer l'audio au backend pour transcription
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Nettoyer
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Démarrer l'enregistrement
      mediaRecorder.start(1000); // Enregistrer par chunks de 1 seconde

      // Si continuous, envoyer périodiquement pour transcription
      if (continuous) {
        intervalRef.current = setInterval(async () => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            mediaRecorder.start(1000);
          }
        }, 5000); // Envoyer toutes les 5 secondes
      }
    } catch (err: any) {
      setError(err.message || 'Impossible d\'accéder au microphone');
      setIsListening(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    if (!API_BASE_URL) {
      setError('VITE_API_URL n\'est pas configuré. Veuillez configurer la variable d\'environnement VITE_API_URL.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);

      const response = await fetch(`${API_BASE_URL}/speech-to-text/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur de transcription');
      }

      const data = await response.json();
      if (data.transcription) {
        setTranscript((prev) => prev + data.transcription + ' ');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la transcription');
      console.error('Erreur de transcription:', err);
    }
  };

  const startListening = () => {
    if (!isSupported) {
      setError('La reconnaissance vocale n\'est pas supportée.');
      return;
    }

    if (isUsingAPI && backendAvailable) {
      startListeningWithBackend();
    } else if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        setError(
          err.message || 'Impossible de démarrer la reconnaissance vocale.'
        );
      }
    }
  };

  const stopListening = () => {
    if (isUsingAPI && mediaRecorderRef.current) {
      // Arrêter l'enregistrement
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Arrêter le stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Nettoyer l'intervalle
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setIsListening(false);
    } else if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setError(null);
  };

  // Nettoyer lors du démontage
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    isUsingAPI,
  };
};

