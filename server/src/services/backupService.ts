import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '../config';

const execAsync = promisify(exec);

/**
 * Service pour gérer les sauvegardes de la base de données
 */
export class BackupService {
  private static backupDir = process.env.BACKUP_DIR || './backups';

  /**
   * Crée une sauvegarde de la base de données
   */
  static async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    // Créer le dossier de sauvegarde s'il n'existe pas
    await fs.mkdir(this.backupDir, { recursive: true });

    // Extraire les informations de connexion depuis DATABASE_URL
    const dbUrl = config.databaseUrl;
    const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!urlMatch) {
      throw new Error('Format DATABASE_URL invalide');
    }

    const [, user, password, host, port, database] = urlMatch;

    // Commande pg_dump
    const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F c -f "${filepath}"`;

    try {
      await execAsync(command);
      
      // Chiffrer la sauvegarde si une clé est configurée
      if (process.env.BACKUP_ENCRYPTION_KEY) {
        await this.encryptBackup(filepath);
      }

      return filepath;
    } catch (error: any) {
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  }

  /**
   * Restaure une sauvegarde
   */
  static async restoreBackup(filepath: string): Promise<void> {
    const dbUrl = config.databaseUrl;
    const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!urlMatch) {
      throw new Error('Format DATABASE_URL invalide');
    }

    const [, user, password, host, port, database] = urlMatch;

    // Déchiffrer si nécessaire
    let backupFile = filepath;
    if (filepath.endsWith('.enc')) {
      backupFile = await this.decryptBackup(filepath);
    }

    const command = `PGPASSWORD="${password}" pg_restore -h ${host} -p ${port} -U ${user} -d ${database} -c "${backupFile}"`;

    try {
      await execAsync(command);
    } catch (error: any) {
      throw new Error(`Erreur lors de la restauration: ${error.message}`);
    }
  }

  /**
   * Liste les sauvegardes disponibles
   */
  static async listBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      return files.filter((f) => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.enc')));
    } catch (error) {
      return [];
    }
  }

  /**
   * Supprime les anciennes sauvegardes (garde les N dernières)
   */
  static async cleanupOldBackups(keep: number = 30): Promise<void> {
    const backups = await this.listBackups();
    const sorted = backups.sort().reverse(); // Plus récentes en premier

    if (sorted.length > keep) {
      const toDelete = sorted.slice(keep);
      for (const file of toDelete) {
        await fs.unlink(path.join(this.backupDir, file));
      }
    }
  }

  /**
   * Chiffre une sauvegarde (basique avec openssl)
   */
  private static async encryptBackup(filepath: string): Promise<void> {
    const key = process.env.BACKUP_ENCRYPTION_KEY;
    if (!key) return;

    const command = `openssl enc -aes-256-cbc -salt -in "${filepath}" -out "${filepath}.enc" -k "${key}"`;
    await execAsync(command);
    await fs.unlink(filepath); // Supprimer le fichier non chiffré
  }

  /**
   * Déchiffre une sauvegarde
   */
  private static async decryptBackup(filepath: string): Promise<string> {
    const key = process.env.BACKUP_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('Clé de chiffrement non configurée');
    }

    const outputFile = filepath.replace('.enc', '');
    const command = `openssl enc -aes-256-cbc -d -in "${filepath}" -out "${outputFile}" -k "${key}"`;
    await execAsync(command);
    return outputFile;
  }

  /**
   * Exporte les données au format CSV pour sauvegarde manuelle
   */
  static async exportToCSV(): Promise<string> {
    // Implémentation simplifiée - exporter les tables principales
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `export-${timestamp}.csv`;
    const filepath = path.join(this.backupDir, filename);

    // Exemple: exporter les factures
    // À compléter selon besoins

    return filepath;
  }
}

export default BackupService;

