import { supabase } from './supabase';
import { IntegrationService } from './integrationService';
import { 
  TransactionManager, 
  withTransaction, 
  validateData, 
  verifyEntityExists, 
  isValidUUID 
} from './transactionUtils';
import { logger } from '../utils/logger';

export interface CloseConsultationResult {
  success: boolean;
  messages: string[];
  traceId?: string;
  consultationId?: string;
}

export const ConsultationIntegrationService = {
  /**
   * Clôture une consultation et exécute toutes les intégrations nécessaires
   * Utilise une transaction avec rollback automatique en cas d'erreur
   */
  async closeConsultationWithIntegrations(
    consultationId: string,
    patientId: string,
    userId: string,
    clinicId?: string
  ): Promise<CloseConsultationResult> {
    // Validation des entrées
    const validation = validateData(
      { consultationId, patientId, userId },
      ['consultationId', 'patientId', 'userId'],
      {
        consultationId: isValidUUID,
        patientId: isValidUUID,
        userId: isValidUUID,
      }
    );

    if (!validation.valid) {
      logger.warn('Validation échouée pour closeConsultationWithIntegrations', {
        errors: validation.errors,
        consultationId,
        patientId,
      });
      return { 
        success: false, 
        messages: validation.errors 
      };
    }

    // Vérifier que la consultation existe et appartient à la clinique
    const consultationCheck = await verifyEntityExists('consultations', consultationId, clinicId);
    if (!consultationCheck.exists) {
      return { 
        success: false, 
        messages: ['Consultation introuvable ou accès non autorisé'] 
      };
    }

    // Vérifier que le patient existe
    const patientCheck = await verifyEntityExists('patients', patientId, clinicId);
    if (!patientCheck.exists) {
      return { 
        success: false, 
        messages: ['Patient introuvable ou accès non autorisé'] 
      };
    }

    const result = await withTransaction(async (tx: TransactionManager) => {
      const messages: string[] = [];
      const traceId = tx.getTraceId();

      logger.info('Démarrage clôture consultation', {
        traceId,
        consultationId,
        patientId,
        userId,
      });

      // 1. Récupérer les détails de la consultation
      const { data: consultation, error: fetchError } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .single();

      if (fetchError) {
        logger.error('Échec récupération consultation', { traceId, error: fetchError });
        throw new Error(`Consultation introuvable: ${fetchError.message}`);
      }

      // Vérifier que la consultation n'est pas déjà clôturée
      if (consultation.status === 'CLOTURE') {
        return { messages: ['Cette consultation est déjà clôturée'], traceId };
      }

      // 2. Marquer comme clôturée avec rollback
      const { error: updateError } = await tx.updateWithRollback('consultations', consultationId, {
        status: 'CLOTURE',
        closed_at: new Date().toISOString(),
        closed_by: userId
      });

      if (updateError) {
        logger.error('Échec mise à jour statut consultation', { traceId, error: updateError });
        throw new Error(`Erreur lors de la clôture: ${updateError.message}`);
      }
      messages.push('Fiche verrouillée');
      logger.info('Consultation clôturée avec succès', { traceId, consultationId });

      // 3. Mettre à jour les prescriptions liées
      try {
        const { data: prescriptions } = await supabase
          .from('prescriptions')
          .select('id, statut')
          .eq('consultation_id', consultationId)
          .eq('statut', 'PRESCRIT');

        if (prescriptions && prescriptions.length > 0) {
          for (const presc of prescriptions) {
            await tx.updateWithRollback('prescriptions', presc.id, {
              statut: 'VALIDE',
              validated_at: new Date().toISOString(),
            });
          }
          messages.push(`${prescriptions.length} prescription(s) validée(s)`);
          logger.info('Prescriptions validées', { traceId, count: prescriptions.length });
        }
      } catch (prescError) {
        logger.warn('Erreur validation prescriptions (non bloquant)', { traceId, error: prescError });
        messages.push('Avertissement: certaines prescriptions n\'ont pas pu être validées');
      }

      // 4. Planifier le rendez-vous si nécessaire
      if (consultation.prochaine_consultation) {
        try {
          const dateProchaine = new Date(consultation.prochaine_consultation);
          const diffInDays = Math.ceil((dateProchaine.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          const rdvResult = await IntegrationService.scheduleFollowUpRendezVous({
            patientId: patientId,
            service: 'Médecine générale',
            motif: consultation.motifs?.[0] || 'Suivi consultation',
            daysOffset: diffInDays > 0 ? diffInDays : 7,
            praticien: userId
          });

          if (rdvResult.ok) {
            messages.push('Rendez-vous de suivi planifié');
            logger.info('Rendez-vous de suivi créé', { traceId, date: consultation.prochaine_consultation });
          } else {
            messages.push(`Avertissement RDV: ${rdvResult.message}`);
            logger.warn('Échec planification RDV', { traceId, error: rdvResult.message });
          }
        } catch (rdvError) {
          logger.warn('Erreur planification RDV (non bloquant)', { traceId, error: rdvError });
          messages.push('Avertissement: le rendez-vous n\'a pas pu être planifié');
        }
      }

      // 5. Notifier les modules concernés (laboratoire, imagerie)
      try {
        await this.notifyRelatedModules(consultationId, traceId);
        messages.push('Modules liés notifiés');
      } catch (notifyError) {
        logger.warn('Erreur notification modules (non bloquant)', { traceId, error: notifyError });
      }

      // 6. Enregistrer dans l'audit
      try {
        await supabase.from('audit_log').insert({
          action: 'CONSULTATION_CLOSED',
          table_name: 'consultations',
          record_id: consultationId,
          user_id: userId,
          clinic_id: clinicId,
          details: {
            patient_id: patientId,
            trace_id: traceId,
            messages,
          },
        });
      } catch (auditError) {
        logger.warn('Erreur audit log (non bloquant)', { traceId, error: auditError });
      }

      logger.info('Clôture consultation terminée avec succès', { 
        traceId, 
        consultationId, 
        messagesCount: messages.length 
      });

      return { messages, traceId };
    }, clinicId);

    if (result.success && result.data) {
      return { 
        success: true, 
        messages: result.data.messages,
        traceId: result.data.traceId,
        consultationId,
      };
    } else {
      logger.error('Échec clôture consultation avec rollback', { 
        consultationId, 
        error: result.error,
        rollbackErrors: result.rollbackActions,
      });
      return { 
        success: false, 
        messages: [result.error || 'Une erreur est survenue lors de la clôture'],
      };
    }
  },

  /**
   * Notifie les modules liés d'une consultation clôturée
   */
  async notifyRelatedModules(consultationId: string, traceId?: string): Promise<void> {
    // Vérifier s'il y a des prescriptions labo en attente
    const { data: labPrescriptions } = await supabase
      .from('lab_prescriptions')
      .select('id')
      .eq('consultation_id', consultationId)
      .eq('statut', 'prescrit');

    if (labPrescriptions && labPrescriptions.length > 0) {
      logger.info('Prescriptions labo liées à la consultation', { 
        traceId, 
        count: labPrescriptions.length 
      });
    }

    // Vérifier s'il y a des demandes d'imagerie en attente
    const { data: imagingRequests } = await supabase
      .from('imaging_requests')
      .select('id')
      .eq('consultation_id', consultationId)
      .eq('status', 'pending');

    if (imagingRequests && imagingRequests.length > 0) {
      logger.info('Demandes imagerie liées à la consultation', { 
        traceId, 
        count: imagingRequests.length 
      });
    }
  },

  /**
   * Récupère le statut des intégrations pour une consultation
   */
  async getIntegrationStatus(consultationId: string): Promise<{
    prescriptions: { total: number; dispensees: number };
    laboratoire: { total: number; terminees: number };
    imagerie: { total: number; realisees: number };
    facturation: { ticketsEnAttente: number; montantTotal: number };
  }> {
    // Prescriptions
    const { data: prescLines } = await supabase
      .from('prescription_lines')
      .select('quantite_totale, quantite_dispensee, prescriptions!inner(consultation_id)')
      .eq('prescriptions.consultation_id', consultationId);

    const prescStats = {
      total: prescLines?.length || 0,
      dispensees: prescLines?.filter(l => l.quantite_dispensee >= l.quantite_totale).length || 0,
    };

    // Laboratoire
    const { data: labPresc } = await supabase
      .from('lab_prescriptions')
      .select('id, statut')
      .eq('consultation_id', consultationId);

    const labStats = {
      total: labPresc?.length || 0,
      terminees: labPresc?.filter(l => l.statut === 'termine' || l.statut === 'valide').length || 0,
    };

    // Imagerie
    const { data: imaging } = await supabase
      .from('imaging_requests')
      .select('id, status')
      .eq('consultation_id', consultationId);

    const imagingStats = {
      total: imaging?.length || 0,
      realisees: imaging?.filter(i => i.status === 'completed').length || 0,
    };

    // Facturation
    const { data: tickets } = await supabase
      .from('tickets_facturation')
      .select('id, montant, statut')
      .eq('consultation_id', consultationId);

    const factStats = {
      ticketsEnAttente: tickets?.filter(t => t.statut === 'en_attente').length || 0,
      montantTotal: tickets?.reduce((sum, t) => sum + (t.montant || 0), 0) || 0,
    };

    return {
      prescriptions: prescStats,
      laboratoire: labStats,
      imagerie: imagingStats,
      facturation: factStats,
    };
  },
};

