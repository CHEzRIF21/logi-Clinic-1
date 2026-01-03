/**
 * Système de logging structuré avec support pour trace ID
 * Permet le suivi des opérations inter-modules
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  traceId?: string;
  userId?: string;
  clinicId?: string;
  module?: string;
  action?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Configuration du logger
 */
const loggerConfig = {
  // Niveau minimum de log (debug < info < warn < error)
  minLevel: (import.meta.env?.VITE_LOG_LEVEL as LogLevel) || 'info',
  // Activer les logs en console
  consoleEnabled: true,
  // Activer l'envoi vers un service distant (future)
  remoteEnabled: false,
  // Formater en JSON
  jsonFormat: import.meta.env?.PROD || false,
};

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Vérifie si un niveau de log doit être affiché
 */
function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[loggerConfig.minLevel];
}

/**
 * Formate une entrée de log
 */
function formatLogEntry(entry: LogEntry): string {
  if (loggerConfig.jsonFormat) {
    return JSON.stringify(entry);
  }

  const { timestamp, level, message, context, error } = entry;
  const traceStr = context?.traceId ? `[${context.traceId}]` : '';
  const moduleStr = context?.module ? `[${context.module}]` : '';
  const contextStr = context 
    ? Object.entries(context)
        .filter(([k]) => !['traceId', 'module'].includes(k))
        .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(' ')
    : '';

  let logStr = `${timestamp} ${level.toUpperCase().padEnd(5)} ${traceStr}${moduleStr} ${message}`;
  
  if (contextStr) {
    logStr += ` | ${contextStr}`;
  }
  
  if (error) {
    logStr += ` | Error: ${error.message}`;
    if (error.code) logStr += ` (code: ${error.code})`;
  }

  return logStr;
}

/**
 * Envoie un log vers la console
 */
function logToConsole(entry: LogEntry): void {
  if (!loggerConfig.consoleEnabled) return;

  const formatted = formatLogEntry(entry);
  
  switch (entry.level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      if (entry.error?.stack) {
        console.error(entry.error.stack);
      }
      break;
  }
}

/**
 * Crée une entrée de log
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext | Error,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  // Si context est une erreur, le traiter comme tel
  if (context instanceof Error) {
    entry.error = {
      message: context.message,
      stack: context.stack,
      code: (context as any).code,
    };
  } else if (context) {
    entry.context = context;
  }

  // Ajouter l'erreur si fournie séparément
  if (error) {
    entry.error = {
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    };
  }

  return entry;
}

/**
 * Logger principal
 */
export const logger = {
  /**
   * Log de niveau debug
   */
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return;
    const entry = createLogEntry('debug', message, context);
    logToConsole(entry);
  },

  /**
   * Log de niveau info
   */
  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return;
    const entry = createLogEntry('info', message, context);
    logToConsole(entry);
  },

  /**
   * Log de niveau warn
   */
  warn(message: string, context?: LogContext | Error): void {
    if (!shouldLog('warn')) return;
    const entry = createLogEntry('warn', message, context);
    logToConsole(entry);
  },

  /**
   * Log de niveau error
   */
  error(message: string, context?: LogContext | Error, error?: Error): void {
    if (!shouldLog('error')) return;
    const entry = createLogEntry('error', message, context, error);
    logToConsole(entry);
  },

  /**
   * Crée un logger enfant avec un contexte prédéfini
   */
  child(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext | Error) =>
        logger.warn(message, context instanceof Error ? context : { ...baseContext, ...context }),
      error: (message: string, context?: LogContext | Error, error?: Error) =>
        logger.error(message, context instanceof Error ? context : { ...baseContext, ...context }, error),
    };
  },

  /**
   * Crée un logger avec un traceId automatique
   */
  withTraceId(traceId?: string) {
    const id = traceId || `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return this.child({ traceId: id });
  },

  /**
   * Log d'une opération d'intégration inter-modules
   */
  integration(
    sourceModule: string,
    targetModule: string,
    action: string,
    context?: LogContext
  ): void {
    this.info(`[INTEGRATION] ${sourceModule} → ${targetModule}: ${action}`, {
      module: 'integration',
      sourceModule,
      targetModule,
      action,
      ...context,
    });
  },

  /**
   * Mesure le temps d'exécution d'une opération
   */
  async measureTime<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = Math.round(performance.now() - startTime);
      this.info(`${operationName} terminé`, { ...context, durationMs: duration });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.error(`${operationName} échoué`, { ...context, durationMs: duration }, error as Error);
      throw error;
    }
  },
};

// Export par défaut
export default logger;

