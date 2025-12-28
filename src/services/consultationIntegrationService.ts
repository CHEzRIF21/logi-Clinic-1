import { supabase } from './supabase';
import { IntegrationService } from './integrationService';

export const ConsultationIntegrationService = {
  /**
   * Clôture une consultation et exécute toutes les intégrations nécessaires
   */
  async closeConsultationWithIntegrations(
    consultationId: string,
    patientId: string,
    userId: string
  ): Promise<{ success: boolean; messages: string[] }> {
    const messages: string[] = [];
    
    try {
      // 1. Récupérer les détails de la consultation
      const { data: consultation, error: fetchError } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Marquer comme clôturée
      const { error: updateError } = await supabase
        .from('consultations')
        .update({
          status: 'CLOTURE',
          closed_at: new Date().toISOString(),
          closed_by: userId
        })
        .eq('id', consultationId);

      if (updateError) throw updateError;
      messages.push('Fiche verrouillée');

      // 3. Planifier le rendez-vous si nécessaire
      if (consultation.prochaine_consultation) {
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
        } else {
          messages.push(`Erreur planification RDV: ${rdvResult.message}`);
        }
      }

      // 4. Synchroniser les antécédents médicaux si modifiés
      // TODO: Implémenter la synchro vers le dossier patient global

      return { success: true, messages };
    } catch (error: any) {
      console.error('Erreur closeConsultationWithIntegrations:', error);
      return { 
        success: false, 
        messages: [error.message || 'Une erreur est survenue lors de la clôture'] 
      };
    }
  }
};

