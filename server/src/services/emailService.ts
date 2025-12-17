import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Service d'envoi d'emails pour Logi Clinic
 * Gère l'envoi de notifications pour les inscriptions et alertes techniques
 */
export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    try {
      // Vérifier si les variables SMTP sont configurées
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPassword = process.env.SMTP_PASSWORD;

      if (smtpHost && smtpUser && smtpPassword) {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true', // true pour port 465, false pour autres ports
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
        });
        this.isConfigured = true;
        console.log('✅ Service email configuré avec succès');
      } else {
        console.warn('⚠️ Service email non configuré. Configurez les variables SMTP dans config.env');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la configuration du service email:', error);
    }
  }

  /**
   * Vérifie si le service email est configuré
   */
  isEmailConfigured(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Envoie une notification pour une nouvelle demande d'inscription
   */
  async sendRegistrationNotification(data: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    roleSouhaite: string;
    adresse?: string;
    specialite?: string;
  }): Promise<boolean> {
    if (!this.isEmailConfigured()) {
      console.log('📧 Email non configuré - Notification d\'inscription non envoyée:', data.email);
      return false;
    }

    try {
      const techEmail = process.env.TECH_EMAIL || 'tech@logiclinic.org';
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

      await this.transporter!.sendMail({
        from: fromEmail,
        to: techEmail,
        subject: '🆕 Nouvelle demande d\'inscription - Logi Clinic',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
              .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
              .label { font-weight: bold; color: #2563eb; }
              .value { color: #333; }
              .footer { margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 4px; font-size: 0.9em; }
              .cta-button { display: inline-block; margin-top: 15px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">🆕 Nouvelle demande d'inscription</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Logi Clinic - Gestion de clinique</p>
              </div>
              <div class="content">
                <p>Une nouvelle demande d'inscription a été soumise et attend votre validation :</p>
                
                <div class="info-row">
                  <span class="label">👤 Nom complet :</span>
                  <span class="value">${data.prenom} ${data.nom}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">📧 Email :</span>
                  <span class="value">${data.email}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">📱 Téléphone :</span>
                  <span class="value">${data.telephone}</span>
                </div>
                
                ${data.adresse ? `
                <div class="info-row">
                  <span class="label">📍 Adresse :</span>
                  <span class="value">${data.adresse}</span>
                </div>
                ` : ''}
                
                <div class="info-row">
                  <span class="label">👔 Rôle souhaité :</span>
                  <span class="value">${this.formatRole(data.roleSouhaite)}</span>
                </div>
                
                ${data.specialite ? `
                <div class="info-row">
                  <span class="label">🏥 Spécialité :</span>
                  <span class="value">${data.specialite}</span>
                </div>
                ` : ''}
                
                <div class="footer">
                  <strong>⚡ Action requise :</strong>
                  <p>Veuillez vous connecter à l'interface d'administration de Logi Clinic pour examiner et valider cette demande d'inscription.</p>
                  <p style="margin: 10px 0;">Une fois validée, l'utilisateur recevra un email avec ses identifiants de connexion.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Nouvelle demande d'inscription - Logi Clinic

Nom complet: ${data.prenom} ${data.nom}
Email: ${data.email}
Téléphone: ${data.telephone}
${data.adresse ? `Adresse: ${data.adresse}` : ''}
Rôle souhaité: ${this.formatRole(data.roleSouhaite)}
${data.specialite ? `Spécialité: ${data.specialite}` : ''}

Veuillez vous connecter à l'interface admin pour traiter cette demande.
        `,
      });

      console.log('✅ Email de notification d\'inscription envoyé à', techEmail);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de notification d\'inscription:', error);
      return false;
    }
  }

  /**
   * Envoie une alerte technique
   */
  async sendTechnicalAlert(data: {
    type: string;
    timestamp: string;
    details: any;
  }): Promise<boolean> {
    if (!this.isEmailConfigured()) {
      console.log('📧 Email non configuré - Alerte technique non envoyée:', data.type);
      return false;
    }

    try {
      const alertEmail = process.env.ALERT_EMAIL || process.env.TECH_EMAIL || 'tech@logiclinic.org';
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

      await this.transporter!.sendMail({
        from: fromEmail,
        to: alertEmail,
        subject: `⚠️ Alerte Technique - ${data.type}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; }
              .alert-box { background: white; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0; }
              .details { background: #1f2937; color: #f3f4f6; padding: 15px; border-radius: 4px; overflow-x: auto; }
              pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
              .label { font-weight: bold; color: #dc2626; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">⚠️ Alerte Technique Détectée</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Logi Clinic - Système de surveillance</p>
              </div>
              <div class="content">
                <div class="alert-box">
                  <p><span class="label">Type d'alerte :</span> ${data.type}</p>
                  <p><span class="label">Date et heure :</span> ${new Date(data.timestamp).toLocaleString('fr-FR')}</p>
                </div>
                
                <h3>Détails de l'alerte :</h3>
                <div class="details">
                  <pre>${JSON.stringify(data.details, null, 2)}</pre>
                </div>
                
                <p style="margin-top: 20px;"><strong>⚡ Action recommandée :</strong> Veuillez examiner cette alerte et prendre les mesures nécessaires.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Alerte Technique - Logi Clinic

Type: ${data.type}
Date et heure: ${new Date(data.timestamp).toLocaleString('fr-FR')}

Détails:
${JSON.stringify(data.details, null, 2)}

Veuillez examiner cette alerte et prendre les mesures nécessaires.
        `,
      });

      console.log('✅ Alerte technique envoyée à', alertEmail);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'alerte technique:', error);
      return false;
    }
  }

  /**
   * Envoie un email de validation de compte
   */
  async sendAccountValidationEmail(data: {
    nom: string;
    prenom: string;
    email: string;
    username: string;
    temporaryPassword: string;
    clinicCode: string;
  }): Promise<boolean> {
    if (!this.isEmailConfigured()) {
      console.log('📧 Email non configuré - Email de validation non envoyé:', data.email);
      return false;
    }

    try {
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

      await this.transporter!.sendMail({
        from: fromEmail,
        to: data.email,
        subject: '✅ Votre compte Logi Clinic a été validé',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f0fdf4; padding: 20px; border-radius: 0 0 8px 8px; }
              .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #16a34a; }
              .credential-row { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
              .label { font-weight: bold; color: #16a34a; }
              .value { font-family: monospace; color: #1f2937; font-size: 1.1em; }
              .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; border-radius: 4px; }
              .footer { margin-top: 20px; padding: 15px; background: #e5e7eb; border-radius: 4px; font-size: 0.9em; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">✅ Bienvenue sur Logi Clinic !</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Votre compte a été validé</p>
              </div>
              <div class="content">
                <p>Bonjour ${data.prenom} ${data.nom},</p>
                <p>Nous sommes heureux de vous informer que votre demande d'inscription à Logi Clinic a été validée avec succès ! 🎉</p>
                
                <div class="credentials">
                  <h3 style="margin-top: 0; color: #16a34a;">🔑 Vos identifiants de connexion :</h3>
                  
                  <div class="credential-row">
                    <span class="label">Code clinique :</span><br>
                    <span class="value">${data.clinicCode}</span>
                  </div>
                  
                  <div class="credential-row">
                    <span class="label">Nom d'utilisateur :</span><br>
                    <span class="value">${data.username}</span>
                  </div>
                  
                  <div class="credential-row">
                    <span class="label">Mot de passe temporaire :</span><br>
                    <span class="value">${data.temporaryPassword}</span>
                  </div>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Important :</strong>
                  <ul style="margin: 10px 0;">
                    <li>Vous devrez changer votre mot de passe lors de votre première connexion</li>
                    <li>Conservez ces identifiants en lieu sûr</li>
                    <li>Ne partagez jamais votre mot de passe</li>
                  </ul>
                </div>
                
                <div class="footer">
                  <p><strong>Prochaines étapes :</strong></p>
                  <ol>
                    <li>Connectez-vous à Logi Clinic avec vos identifiants</li>
                    <li>Changez votre mot de passe temporaire</li>
                    <li>Complétez votre profil</li>
                    <li>Commencez à utiliser l'application !</li>
                  </ol>
                  
                  <p>Si vous avez des questions, n'hésitez pas à contacter notre support à <a href="mailto:tech@logiclinic.org">tech@logiclinic.org</a></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Bienvenue sur Logi Clinic !

Bonjour ${data.prenom} ${data.nom},

Votre demande d'inscription a été validée avec succès !

Vos identifiants de connexion :
- Code clinique: ${data.clinicCode}
- Nom d'utilisateur: ${data.username}
- Mot de passe temporaire: ${data.temporaryPassword}

IMPORTANT:
- Vous devrez changer votre mot de passe lors de votre première connexion
- Conservez ces identifiants en lieu sûr
- Ne partagez jamais votre mot de passe

Support: tech@logiclinic.org
        `,
      });

      console.log('✅ Email de validation de compte envoyé à', data.email);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de validation:', error);
      return false;
    }
  }

  /**
   * Formate le nom du rôle pour l'affichage
   */
  private formatRole(role: string): string {
    const roles: { [key: string]: string } = {
      'admin': 'Administrateur',
      'medecin': 'Médecin',
      'receptionniste': 'Réceptionniste',
      'pharmacien': 'Pharmacien',
      'infirmier': 'Infirmier',
      'laborantin': 'Laborantin',
      'radiologue': 'Radiologue',
    };
    return roles[role] || role;
  }
}

// Export d'une instance singleton
export const emailService = new EmailService();

