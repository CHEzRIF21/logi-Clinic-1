/**
 * Système de logs intelligents pour le backend LogiClinic
 * Utilise des préfixes structurés pour faciliter le débogage avec Cursor
 * 
 * AMÉLIORATIONS:
 * - Support des trace IDs pour suivi inter-modules
 * - Logging des intégrations entre modules
 * - Mesure de performance
 * - Export vers table audit
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS';

interface LogContext {
  traceId?: string;
  userId?: string;
  clinicId?: string;
  module?: string;
  action?: string;
  durationMs?: number;
  [key: string]: any;
}

interface IntegrationLogData {
  sourceModule: string;
  targetModule: string;
  action: string;
  success: boolean;
  durationMs?: number;
  entityId?: string;
  error?: string;
}

class Logger {
  private currentTraceId?: string;

  /**
   * Génère un trace ID unique
   */
  generateTraceId(): string {
    return `TRC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Définit le trace ID courant
   */
  setTraceId(traceId: string): void {
    this.currentTraceId = traceId;
  }

  /**
   * Récupère le trace ID courant
   */
  getTraceId(): string | undefined {
    return this.currentTraceId;
  }

  /**
   * Crée un logger enfant avec un trace ID
   */
  withTraceId(traceId?: string): Logger {
    const childLogger = Object.create(this);
    childLogger.currentTraceId = traceId || this.generateTraceId();
    return childLogger;
  }

  private formatMessage(level: LogLevel, category: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const traceStr = context?.traceId || this.currentTraceId 
      ? `[${context?.traceId || this.currentTraceId}] ` 
      : '';
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${traceStr}[${category}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, category: string, message: string, context?: LogContext) {
    // Ajouter le traceId si disponible
    const enrichedContext = {
      ...context,
      traceId: context?.traceId || this.currentTraceId,
    };

    const formattedMessage = this.formatMessage(level, category, message, enrichedContext);
    
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

  /**
   * Log une opération d'intégration inter-modules
   */
  integration(data: IntegrationLogData) {
    const message = `${data.sourceModule} → ${data.targetModule}: ${data.action}`;
    const context: LogContext = {
      sourceModule: data.sourceModule,
      targetModule: data.targetModule,
      action: data.action,
      entityId: data.entityId,
      durationMs: data.durationMs,
    };

    if (data.success) {
      this.log('SUCCESS', 'INTEGRATION', message, context);
    } else {
      this.log('ERROR', 'INTEGRATION', `${message} - FAILED: ${data.error}`, context);
    }
  }

  /**
   * Mesure le temps d'exécution d'une opération async
   */
  async measureTime<T>(
    category: string,
    operationName: string,
    operation: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    const traceId = context?.traceId || this.currentTraceId || this.generateTraceId();

    try {
      const result = await operation();
      const durationMs = Date.now() - startTime;
      this.log('SUCCESS', category, `${operationName} (${durationMs}ms)`, { ...context, durationMs, traceId });
      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this.log('ERROR', category, `${operationName} FAILED (${durationMs}ms): ${error}`, { ...context, durationMs, traceId });
      throw error;
    }
  }

  /**
   * Log de transaction avec rollback potentiel
   */
  transaction(action: 'start' | 'commit' | 'rollback', context?: LogContext) {
    const messages: Record<string, string> = {
      start: 'Transaction démarrée',
      commit: 'Transaction validée',
      rollback: 'Transaction annulée (rollback)',
    };
    
    const level: LogLevel = action === 'rollback' ? 'WARN' : 'INFO';
    this.log(level, 'TRANSACTION', messages[action] || action, context);
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

