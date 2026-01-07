/**
 * Service de transcription vocale utilisant une API externe
 * Supporte : OpenAI Whisper, Google Speech-to-Text, Azure Speech, etc.
 */

interface TranscriptionOptions {
  language?: string;
  model?: string;
}

interface TranscriptionResult {
  text: string;
  language?: string;
  confidence?: number;
}

class SpeechToTextService {
  private apiKey: string | null;
  private provider: 'openai' | 'google' | 'azure' | 'custom';
  private apiUrl: string | null;

  constructor() {
    // Configuration depuis les variables d'environnement
    this.apiKey = process.env.SPEECH_TO_TEXT_API_KEY || null;
    this.provider = (process.env.SPEECH_TO_TEXT_PROVIDER as any) || 'openai';
    this.apiUrl = process.env.SPEECH_TO_TEXT_API_URL || null;

    // URLs par défaut selon le provider
    if (!this.apiUrl) {
      switch (this.provider) {
        case 'openai':
          this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
          break;
        case 'google':
          this.apiUrl = 'https://speech.googleapis.com/v1/speech:recognize';
          break;
        case 'azure':
          // Azure nécessite une région spécifique
          const azureRegion = process.env.AZURE_SPEECH_REGION || 'francecentral';
          this.apiUrl = `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
          break;
      }
    }
  }

  /**
   * Vérifie si le service est configuré
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.apiUrl;
  }

  /**
   * Transcrit un fichier audio en texte
   */
  async transcribe(
    audioBuffer: Buffer,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'Service de transcription non configuré. Veuillez définir SPEECH_TO_TEXT_API_KEY et SPEECH_TO_TEXT_PROVIDER.'
      );
    }

    try {
      switch (this.provider) {
        case 'openai':
          return await this.transcribeWithOpenAI(audioBuffer, options);
        case 'google':
          return await this.transcribeWithGoogle(audioBuffer, options);
        case 'azure':
          return await this.transcribeWithAzure(audioBuffer, options);
        case 'custom':
          return await this.transcribeWithCustom(audioBuffer, options);
        default:
          throw new Error(`Provider non supporté: ${this.provider}`);
      }
    } catch (error: any) {
      throw new Error(`Erreur de transcription: ${error.message}`);
    }
  }

  /**
   * Transcription avec OpenAI Whisper
   */
  private async transcribeWithOpenAI(
    audioBuffer: Buffer,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    // Import dynamique de form-data
    const FormDataModule = await import('form-data');
    const FormDataClass = FormDataModule.default || FormDataModule;
    const formData = new (FormDataClass as any)();

    // Créer un fichier temporaire pour l'audio
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    });
    formData.append('model', options.model || 'whisper-1');
    if (options.language) {
      formData.append('language', options.language);
    }

    // Obtenir les headers (méthode compatible avec toutes les versions)
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };
    
    // Ajouter les headers de form-data si la méthode existe
    if (typeof formData.getHeaders === 'function') {
      Object.assign(headers, formData.getHeaders());
    } else if (formData.getBoundary) {
      // Fallback pour certaines versions
      headers['Content-Type'] = `multipart/form-data; boundary=${formData.getBoundary()}`;
    }

    const response = await fetch(this.apiUrl!, {
      method: 'POST',
      headers: headers,
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error?.message || 'Erreur API OpenAI');
    }

    const data = await response.json() as any;
    return {
      text: data.text || '',
      language: data.language,
    };
  }

  /**
   * Transcription avec Google Speech-to-Text
   */
  private async transcribeWithGoogle(
    audioBuffer: Buffer,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const audioContent = audioBuffer.toString('base64');

    const requestBody = {
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: options.language || 'fr-FR',
        alternativeLanguageCodes: ['en-US'],
        enableAutomaticPunctuation: true,
      },
      audio: {
        content: audioContent,
      },
    };

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json() as any;
      throw new Error(error.error?.message || 'Erreur API Google');
    }

    const data = await response.json() as any;
    const result = data.results?.[0]?.alternatives?.[0];

    if (!result) {
      throw new Error('Aucun résultat de transcription');
    }

    return {
      text: result.transcript || '',
      confidence: result.confidence,
    };
  }

  /**
   * Transcription avec Azure Speech Services
   */
  private async transcribeWithAzure(
    audioBuffer: Buffer,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    // Azure nécessite un token d'accès OAuth
    const tokenUrl = `https://${process.env.AZURE_SPEECH_REGION || 'francecentral'}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey!,
      },
    });

    if (!tokenResponse.ok) {
      throw new Error('Erreur d\'authentification Azure');
    }

    const accessToken = await tokenResponse.text();

    const response = await fetch(this.apiUrl!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'audio/webm; codecs=opus',
        'Accept': 'application/json',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur API Azure: ${error}`);
    }

    const data = await response.json() as any;
    return {
      text: data.DisplayText || data.RecognitionStatus || '',
    };
  }

  /**
   * Transcription avec une API personnalisée
   */
  private async transcribeWithCustom(
    audioBuffer: Buffer,
    options: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    if (!this.apiUrl) {
      throw new Error('URL API personnalisée non configurée');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/webm',
        Authorization: `Bearer ${this.apiKey}`,
        ...(options.language && { 'X-Language': options.language }),
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur API personnalisée: ${error}`);
    }

    const data = await response.json() as any;
    return {
      text: data.text || data.transcript || '',
      confidence: data.confidence,
      language: data.language,
    };
  }

  /**
   * Transcrit un flux audio en temps réel (streaming)
   * Note: Cette fonctionnalité nécessite une implémentation spécifique selon le provider
   */
  async transcribeStream(
    audioStream: NodeJS.ReadableStream,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    // Convertir le stream en buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk as Buffer);
    }
    const audioBuffer = Buffer.concat(chunks);

    return this.transcribe(audioBuffer, options);
  }
}

export default new SpeechToTextService();

