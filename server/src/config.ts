import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger .env depuis le répertoire server
dotenv.config({ path: resolve(__dirname, '../.env') });
// Charger aussi config.env comme fallback
dotenv.config({ path: resolve(__dirname, '../config.env') });

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Configuration transcription vocale
  speechToText: {
    apiKey: process.env.SPEECH_TO_TEXT_API_KEY || null,
    provider: process.env.SPEECH_TO_TEXT_PROVIDER || 'openai',
    apiUrl: process.env.SPEECH_TO_TEXT_API_URL || null,
    azureRegion: process.env.AZURE_SPEECH_REGION || 'francecentral',
  },
};

