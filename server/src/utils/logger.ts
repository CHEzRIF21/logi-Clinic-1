/**
 * Système de logs intelligents pour le backend LogiClinic
 * Utilise des préfixes structurés pour faciliter le débogage avec Cursor
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: LogLevel, category: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] [${category}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, category: string, message: string, context?: LogContext) {
    const formattedMessage = this.formatMessage(level, category, message, context);
    
    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'SUCCESS':
        console.log(`✅ ${formattedMessage}`);
        break;
      case 'DEBUG':
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 ${formattedMessage}`);
        }
        break;
      default:
        console.log(formattedMessage);
    }
  }

  // Logs pour la création de clinique
  clinicCreateStart(data: { name: string; code?: string }) {
    this.log('INFO', 'CLINIC_CREATE', 'Début création clinique', data);
  }

  clinicCreateSuccess(data: { clinicId: string; code: string; name: string }) {
    this.log('SUCCESS', 'CLINIC_CREATE', 'Clinique créée avec succès', data);
  }

  clinicCreateError(error: Error | string, context?: LogContext) {
    this.log('ERROR', 'CLINIC_CREATE', `Erreur création clinique: ${error}`, context);
  }

  // Logs pour la création d'admin
  adminCreateStart(data: { email: string; clinicId: string }) {
    this.log('INFO', 'ADMIN_CREATE', 'Début création admin', data);
  }

  adminCreateSuccess(data: { userId: string; email: string; clinicId: string }) {
    this.log('SUCCESS', 'ADMIN_CREATE', 'Admin créé avec succès', data);
  }

  adminCreateError(error: Error | string, context?: LogContext) {
    this.log('ERROR', 'ADMIN_CREATE', `Erreur création admin: ${error}`, context);
  }

  // Logs pour l'association clinique-admin
  associationStart(data: { userId: string; clinicId: string }) {
    this.log('INFO', 'ASSOCIATION', 'Début liaison admin-clinique', data);
  }

  associationSuccess(data: { userId: string; clinicId: string; clinicCode: string }) {
    this.log('SUCCESS', 'ASSOCIATION', 'Liaison admin-clinique réussie', data);
  }

  associationError(error: Error | string, context?: LogContext) {
    this.log('ERROR', 'ASSOCIATION', `Erreur liaison admin-clinique: ${error}`, context);
  }

  // Logs pour l'authentification
  loginAttempt(data: { clinicCode: string; email: string }) {
    this.log('INFO', 'LOGIN', 'Tentative de connexion', data);
  }

  loginSuccess(data: { userId: string; email: string; role: string; clinicCode: string }) {
    this.log('SUCCESS', 'LOGIN', 'Connexion réussie', data);
  }

  loginError(error: string, context?: LogContext) {
    this.log('ERROR', 'LOGIN', `Échec connexion: ${error}`, context);
  }

  // Logs génériques
  info(category: string, message: string, context?: LogContext) {
    this.log('INFO', category, message, context);
  }

  warn(category: string, message: string, context?: LogContext) {
    this.log('WARN', category, message, context);
  }

  error(category: string, message: string, context?: LogContext) {
    this.log('ERROR', category, message, context);
  }

  debug(category: string, message: string, context?: LogContext) {
    this.log('DEBUG', category, message, context);
  }

  success(category: string, message: string, context?: LogContext) {
    this.log('SUCCESS', category, message, context);
  }
}

export const logger = new Logger();
export default logger;

