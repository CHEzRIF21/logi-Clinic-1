/**
 * Utilitaire de logging structuré pour les emails
 * 
 * Ce module permet de tracer toutes les tentatives d'envoi d'email
 * pour faciliter le debugging et le monitoring de la délivrabilité.
 */

export interface EmailLog {
  timestamp: string;
  type: 'reset-password' | 'account-validation' | 'registration-notification' | 'technical-alert';
  email: string;
  source: 'supabase-auth' | 'smtp-backend';
  status: 'success' | 'error' | 'timeout' | 'pending';
  error?: {
    message: string;
    status?: number;
    code?: string;
    details?: any;
  };
  metadata?: {
    redirect_to?: string;
    delivery_time_ms?: number;
    supabase_response?: any;
    smtp_response?: any;
    [key: string]: any;
  };
}

/**
 * Log une tentative d'envoi d'email
 */
export function logEmailAttempt(log: EmailLog): void {
  // Log structuré en JSON pour faciliter le parsing
  const logLine = JSON.stringify(log);
  
  // Console log avec formatage lisible
  const emoji = getStatusEmoji(log.status);
  console.log(`${emoji} [EMAIL] ${log.type} → ${log.email} (${log.status})`);
  
  // Log détaillé si erreur
  if (log.status === 'error' && log.error) {
    console.error(`   Erreur: ${log.error.message}`);
    if (log.error.status) console.error(`   Status: ${log.error.status}`);
    if (log.error.code) console.error(`   Code: ${log.error.code}`);
  }
  
  // Log métadonnées si présentes
  if (log.metadata?.delivery_time_ms) {
    console.log(`   Temps: ${log.metadata.delivery_time_ms}ms`);
  }
  
  // TODO: Envoyer à un service de logging externe (Sentry, LogRocket, etc.)
  // sendToLoggingService(logLine);
  
  // Sauvegarder dans un fichier de log local (optionnel)
  if (process.env.EMAIL_LOG_FILE) {
    try {
      const fs = require('fs');
      const path = require('path');
      const logFile = path.join(process.cwd(), process.env.EMAIL_LOG_FILE);
      fs.appendFileSync(logFile, logLine + '\n');
    } catch (err) {
      // Ignorer les erreurs de fichier (peut ne pas être disponible)
    }
  }
}

/**
 * Log un succès d'envoi d'email
 */
export function logEmailSuccess(
  type: EmailLog['type'],
  email: string,
  source: EmailLog['source'],
  metadata?: EmailLog['metadata']
): void {
  logEmailAttempt({
    timestamp: new Date().toISOString(),
    type,
    email,
    source,
    status: 'success',
    metadata,
  });
}

/**
 * Log une erreur d'envoi d'email
 */
export function logEmailError(
  type: EmailLog['type'],
  email: string,
  source: EmailLog['source'],
  error: EmailLog['error'],
  metadata?: EmailLog['metadata']
): void {
  logEmailAttempt({
    timestamp: new Date().toISOString(),
    type,
    email,
    source,
    status: 'error',
    error,
    metadata,
  });
}

/**
 * Log un timeout d'envoi d'email
 */
export function logEmailTimeout(
  type: EmailLog['type'],
  email: string,
  source: EmailLog['source'],
  metadata?: EmailLog['metadata']
): void {
  logEmailAttempt({
    timestamp: new Date().toISOString(),
    type,
    email,
    source,
    status: 'timeout',
    error: {
      message: 'Request timeout',
    },
    metadata,
  });
}

/**
 * Obtenir l'emoji correspondant au statut
 */
function getStatusEmoji(status: EmailLog['status']): string {
  switch (status) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'timeout':
      return '⏱️';
    case 'pending':
      return '⏳';
    default:
      return '📧';
  }
}

/**
 * Formater les logs pour l'affichage dans un tableau
 */
export function formatEmailLogsForTable(logs: EmailLog[]): string {
  const lines: string[] = [];
  lines.push('| Timestamp | Type | Email | Source | Status | Temps (ms) |');
  lines.push('|-----------|------|-------|--------|--------|------------|');
  
  logs.forEach(log => {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    const time = log.metadata?.delivery_time_ms?.toString() || '-';
    lines.push(`| ${timestamp} | ${log.type} | ${log.email} | ${log.source} | ${log.status} | ${time} |`);
  });
  
  return lines.join('\n');
}
