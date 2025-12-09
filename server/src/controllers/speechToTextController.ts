import { Request, Response } from 'express';
import speechToTextService from '../services/speechToTextService';
import { errorHandler } from '../middleware/errorHandler';

/**
 * Contrôleur pour la transcription vocale
 */
export class SpeechToTextController {
  /**
   * Transcrit un fichier audio envoyé dans la requête
   */
  async transcribe(req: Request, res: Response): Promise<void> {
    try {
      // Vérifier si le service est configuré
      if (!speechToTextService.isConfigured()) {
        res.status(503).json({
          error: 'Service de transcription non configuré',
          message:
            'Veuillez configurer SPEECH_TO_TEXT_API_KEY et SPEECH_TO_TEXT_PROVIDER dans les variables d\'environnement.',
        });
        return;
      }

      // Vérifier que le fichier audio est présent
      if (!req.file && !req.body.audio) {
        res.status(400).json({
          error: 'Fichier audio manquant',
          message: 'Veuillez envoyer un fichier audio (multipart/form-data) ou un buffer audio (base64).',
        });
        return;
      }

      // Récupérer le buffer audio
      let audioBuffer: Buffer;
      if (req.file) {
        // Fichier uploadé via multer
        audioBuffer = req.file.buffer;
      } else if (req.body.audio) {
        // Audio en base64
        audioBuffer = Buffer.from(req.body.audio, 'base64');
      } else {
        res.status(400).json({
          error: 'Format audio non supporté',
        });
        return;
      }

      // Options de transcription
      const options = {
        language: req.body.language || req.query.language || 'fr-FR',
        model: req.body.model || req.query.model,
      };

      // Effectuer la transcription
      const result = await speechToTextService.transcribe(audioBuffer, options);

      res.json({
        success: true,
        transcription: result.text,
        language: result.language,
        confidence: result.confidence,
      });
    } catch (error: any) {
      console.error('Erreur de transcription:', error);
      res.status(500).json({
        error: 'Erreur de transcription',
        message: error.message || 'Une erreur est survenue lors de la transcription.',
      });
    }
  }

  /**
   * Vérifie si le service est configuré et disponible
   */
  async checkStatus(req: Request, res: Response): Promise<void> {
    try {
      const isConfigured = speechToTextService.isConfigured();
      res.json({
        configured: isConfigured,
        provider: process.env.SPEECH_TO_TEXT_PROVIDER || 'none',
        message: isConfigured
          ? 'Service de transcription disponible'
          : 'Service de transcription non configuré',
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Erreur de vérification',
        message: error.message,
      });
    }
  }
}

export default new SpeechToTextController();

