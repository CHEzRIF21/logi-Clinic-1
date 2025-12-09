import { Router } from 'express';
import multer from 'multer';
import speechToTextController from '../controllers/speechToTextController';

const router = Router();

// Configuration de multer pour gérer les fichiers audio en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter les formats audio courants
    const allowedMimes = [
      'audio/webm',
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/ogg',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format audio non supporté. Formats acceptés: webm, wav, mp3, ogg, m4a'));
    }
  },
});

/**
 * @route   GET /api/speech-to-text/status
 * @desc    Vérifier le statut du service de transcription
 * @access  Public
 */
router.get('/status', speechToTextController.checkStatus.bind(speechToTextController));

/**
 * @route   POST /api/speech-to-text/transcribe
 * @desc    Transcrit un fichier audio en texte
 * @access  Public (peut être protégé avec auth middleware si nécessaire)
 * @body    audio: Buffer (multipart/form-data) ou base64 string
 *          language: string (optionnel, défaut: fr-FR)
 *          model: string (optionnel, dépend du provider)
 */
router.post(
  '/transcribe',
  upload.single('audio'),
  speechToTextController.transcribe.bind(speechToTextController)
);

export default router;

