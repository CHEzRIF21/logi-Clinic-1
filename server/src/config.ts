import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger .env depuis le répertoire server
dotenv.config({ path: resolve(__dirname, '../.env') });
// Charger aussi config.env comme fallback
dotenv.config({ path: resolve(__dirname, '../config.env') });

// Parse CORS origins (supporte plusieurs origines séparées par des virgules)
const parseCorsOrigins = (): string | string[] => {
  const origins = process.env.CORS_ORIGIN || 'http://localhost:5173';
  if (origins.includes(',')) {
    return origins.split(',').map(o => o.trim());
  }
  return origins;
};

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  // NOTE: jwtSecret n'est plus utilisé - on utilise Supabase Auth maintenant
  // jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production', // OBSOLÈTE
  corsOrigin: parseCorsOrigins(),
  // Configuration Supabase
  supabase: {
    url: process.env.SUPABASE_URL || 'https://bnfgemmlokvetmohiqch.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },
  // Configuration transcription vocale
  speechToText: {
    apiKey: process.env.SPEECH_TO_TEXT_API_KEY || null,
    provider: process.env.SPEECH_TO_TEXT_PROVIDER || 'openai',
    apiUrl: process.env.SPEECH_TO_TEXT_API_URL || null,
    azureRegion: process.env.AZURE_SPEECH_REGION || 'francecentral',
  },
};

