import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LicenseData {
  licenseKey: string;
  domain: string;
  expiresAt?: Date;
  maxDeployments?: number;
  clinicId?: string;
  metadata?: Record<string, any>;
}

export interface LicenseValidationResult {
  valid: boolean;
  message: string;
  license?: {
    id: string;
    domain: string;
    expiresAt?: Date;
    active: boolean;
  };
}

export interface DeploymentAttempt {
  domain: string;
  ip: string;
  userAgent: string;
  licenseKey?: string;
  success: boolean;
  reason?: string;
}

class LicenseService {
  private readonly secretKey: string;
  private readonly licenseServerUrl?: string;

  constructor() {
    this.secretKey = process.env.LICENSE_SECRET_KEY || 'change-this-secret-key-in-production';
    this.licenseServerUrl = process.env.LICENSE_SERVER_URL;
  }

  /**
   * Génère une clé de licence unique
   */
  generateLicenseKey(domain: string, expiresAt?: Date, metadata?: Record<string, any>): string {
    const payload = {
      domain,
      expiresAt: expiresAt?.toISOString(),
      metadata,
      timestamp: Date.now(),
    };

    const payloadString = JSON.stringify(payload);
    const hash = crypto.createHmac('sha256', this.secretKey).update(payloadString).digest('hex');
    
    // Créer une clé de licence formatée
    const licenseKey = `${domain.substring(0, 8).toUpperCase()}-${hash.substring(0, 16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    
    return licenseKey;
  }

  /**
   * Valide une clé de licence
   */
  async validateLicense(licenseKey: string, domain: string, ip?: string): Promise<LicenseValidationResult> {
    try {
      // Vérifier dans la base de données locale
      const license = await prisma.license.findUnique({
        where: { licenseKey },
      });

      if (!license) {
        await this.logDeploymentAttempt({
          domain,
          ip: ip || 'unknown',
          userAgent: 'unknown',
          licenseKey,
          success: false,
          reason: 'License key not found',
        });
        return {
          valid: false,
          message: 'Clé de licence invalide',
        };
      }

      // Vérifier si la licence est active
      if (!license.active) {
        await this.logDeploymentAttempt({
          domain,
          ip: ip || 'unknown',
          userAgent: 'unknown',
          licenseKey,
          success: false,
          reason: 'License is inactive',
        });
        return {
          valid: false,
          message: 'Licence désactivée',
        };
      }

      // Vérifier le domaine
      const allowedDomains = license.allowedDomains || [];
      const domainMatch = allowedDomains.some((allowedDomain) => {
        // Support des wildcards et sous-domaines
        if (allowedDomain.startsWith('*.')) {
          const baseDomain = allowedDomain.substring(2);
          return domain.endsWith(baseDomain) || domain === baseDomain;
        }
        return domain === allowedDomain;
      });

      if (!domainMatch) {
        await this.logDeploymentAttempt({
          domain,
          ip: ip || 'unknown',
          userAgent: 'unknown',
          licenseKey,
          success: false,
          reason: `Domain ${domain} not allowed. Allowed: ${allowedDomains.join(', ')}`,
        });
        return {
          valid: false,
          message: `Domaine non autorisé: ${domain}`,
        };
      }

      // Vérifier l'expiration
      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        await this.logDeploymentAttempt({
          domain,
          ip: ip || 'unknown',
          userAgent: 'unknown',
          licenseKey,
          success: false,
          reason: 'License expired',
        });
        return {
          valid: false,
          message: 'Licence expirée',
        };
      }

      // Vérifier le nombre de déploiements
      if (license.maxDeployments) {
        const deploymentCount = await prisma.deploymentAttempt.count({
          where: {
            licenseKey,
            success: true,
            createdAt: {
              gte: license.createdAt,
            },
          },
        });

        if (deploymentCount >= license.maxDeployments) {
          await this.logDeploymentAttempt({
            domain,
            ip: ip || 'unknown',
            userAgent: 'unknown',
            licenseKey,
            success: false,
            reason: `Maximum deployments reached: ${license.maxDeployments}`,
          });
          return {
            valid: false,
            message: `Nombre maximum de déploiements atteint: ${license.maxDeployments}`,
          };
        }
      }

      // Enregistrer le déploiement réussi (avec licenseId)
      await this.logDeploymentAttempt({
        domain,
        ip: ip || 'unknown',
        userAgent: 'unknown',
        licenseKey,
        success: true,
      });

      return {
        valid: true,
        message: 'Licence valide',
        license: {
          id: license.id,
          domain: license.domain,
          expiresAt: license.expiresAt || undefined,
          active: license.active,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la validation de la licence:', error);
      return {
        valid: false,
        message: 'Erreur lors de la validation de la licence',
      };
    }
  }

  /**
   * Enregistre une tentative de déploiement
   */
  async logDeploymentAttempt(attempt: DeploymentAttempt): Promise<void> {
    try {
      // Trouver la licence si une clé est fournie
      let licenseId = null;
      if (attempt.licenseKey) {
        const license = await prisma.license.findUnique({
          where: { licenseKey: attempt.licenseKey },
          select: { id: true },
        });
        licenseId = license?.id || null;
      }

      const deploymentAttempt = await prisma.deploymentAttempt.create({
        data: {
          domain: attempt.domain,
          ip: attempt.ip,
          userAgent: attempt.userAgent,
          licenseKey: attempt.licenseKey || null,
          licenseId,
          success: attempt.success,
          reason: attempt.reason || null,
        },
      });

      // Si c'est un succès et qu'on a une licence, mettre à jour la relation
      if (attempt.success && licenseId && !deploymentAttempt.licenseId) {
        await prisma.deploymentAttempt.update({
          where: { id: deploymentAttempt.id },
          data: { licenseId },
        });
      }

      // Envoyer une alerte si c'est une tentative non autorisée
      if (!attempt.success && this.licenseServerUrl) {
        await this.sendAlert(attempt);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la tentative de déploiement:', error);
    }
  }

  /**
   * Envoie une alerte pour une tentative non autorisée
   */
  private async sendAlert(attempt: DeploymentAttempt): Promise<void> {
    try {
      const alertEmail = process.env.ALERT_EMAIL;
      const alertWebhookUrl = process.env.ALERT_WEBHOOK_URL;

      const alertData = {
        type: 'UNAUTHORIZED_DEPLOYMENT_ATTEMPT',
        timestamp: new Date().toISOString(),
        domain: attempt.domain,
        ip: attempt.ip,
        userAgent: attempt.userAgent,
        licenseKey: attempt.licenseKey,
        reason: attempt.reason,
      };

      // Envoyer par webhook si configuré
      if (alertWebhookUrl) {
        try {
          await fetch(alertWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(alertData),
          });
        } catch (error) {
          console.error('Erreur lors de l\'envoi de l\'alerte webhook:', error);
        }
      }

      // Envoyer par email si configuré (nécessite un service d'email)
      if (alertEmail) {
        console.log('Alerte email à envoyer:', alertEmail, alertData);
        // TODO: Implémenter l'envoi d'email avec nodemailer ou un service similaire
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte:', error);
    }
  }

  /**
   * Génère un App ID unique
   */
  generateAppId(): string {
    const prefix = 'APP';
    const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${randomPart}-${timestamp}`;
  }

  /**
   * Génère un App Secret sécurisé
   */
  generateAppSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Crée une nouvelle licence dans la base de données
   */
  async createLicense(data: LicenseData): Promise<any> {
    const licenseKey = this.generateLicenseKey(data.domain, data.expiresAt, data.metadata);
    const appId = this.generateAppId();
    const appSecret = this.generateAppSecret();

    return await prisma.license.create({
      data: {
        licenseKey,
        appId,
        appSecret,
        domain: data.domain,
        allowedDomains: [data.domain],
        expiresAt: data.expiresAt,
        maxDeployments: data.maxDeployments,
        clinicId: data.clinicId,
        active: true,
        revoked: false,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Révoque une licence
   */
  async revokeLicense(licenseId: string, reason?: string): Promise<any> {
    return await prisma.license.update({
      where: { id: licenseId },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: reason || 'Révoquée par l\'administrateur',
        active: false,
      },
    });
  }

  /**
   * Régénère les credentials d'une licence (en cas de compromission)
   */
  async regenerateCredentials(licenseId: string): Promise<{ appId: string; appSecret: string }> {
    const newAppId = this.generateAppId();
    const newAppSecret = this.generateAppSecret();

    await prisma.license.update({
      where: { id: licenseId },
      data: {
        appId: newAppId,
        appSecret: newAppSecret,
        updatedAt: new Date(),
      },
    });

    return { appId: newAppId, appSecret: newAppSecret };
  }

  /**
   * Récupère les informations d'une licence par son App ID
   */
  async getLicenseByAppId(appId: string): Promise<any> {
    return await prisma.license.findUnique({
      where: { appId },
      select: {
        id: true,
        licenseKey: true,
        appId: true,
        domain: true,
        allowedDomains: true,
        expiresAt: true,
        active: true,
        revoked: true,
        clinicId: true,
        createdAt: true,
        // Ne pas retourner appSecret pour des raisons de sécurité
      },
    });
  }

  /**
   * Vérifie périodiquement la validité de la licence
   */
  async checkLicensePeriodically(licenseKey: string, domain: string, intervalMs: number = 3600000): Promise<void> {
    setInterval(async () => {
      const result = await this.validateLicense(licenseKey, domain);
      if (!result.valid) {
        console.warn('Vérification périodique de licence échouée:', result.message);
        // Optionnel: arrêter l'application ou désactiver certaines fonctionnalités
      }
    }, intervalMs);
  }
}

export default new LicenseService();

