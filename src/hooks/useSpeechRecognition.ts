import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

// Déclaration des types pour l'API Web Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = (
  language: string = 'fr-FR',
  continuous: boolean = true,
  interimResults: boolean = true
): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Vérifier si l'API est supportée
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

    // Créer une instance de SpeechRecognition
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    // Gérer les résultats
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Mettre à jour le transcript avec les résultats finaux
      if (finalTranscript.trim()) {
        setTranscript((prev) => {
          const newTranscript = prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim();
          return newTranscript;
        });
      } else if (interimTranscript && interimResults) {
        // Pour les résultats intermédiaires, on peut les afficher temporairement
        // mais on ne les accumule pas dans le transcript final
        setTranscript((prev) => {
          // Garder seulement le transcript final accumulé
          return prev;
        });
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

    // Nettoyer lors du démontage
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults]);

  const startListening = () => {
    if (!isSupported) {
      setError('La reconnaissance vocale n\'est pas supportée.');
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        // Réinitialiser le transcript au début d'une nouvelle session
        setTranscript('');
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
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
};

