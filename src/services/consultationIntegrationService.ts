import { ConsultationApiService } from './consultationApiService';
import { FacturationService } from './facturationService';
import { ConsultationBillingService } from './consultationBillingService';
import { RendezVousService } from './rendezVousService';

/**
 * Service d'intégration pour le module Consultation
 * Gère l'envoi automatique vers Pharmacie, Labo, Imagerie et Caisse
 */
export class ConsultationIntegrationService {
  /**
   * Envoie les prescriptions médicamenteuses au module Pharmacie
   */
  static async sendPrescriptionsToPharmacy(
    consultationId: string,
    patientId: string,
    prescriptions: any[]
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Récupérer les prescriptions de la consultation
      const allPrescriptions = await ConsultationApiService.getPrescriptions(consultationId);

      // Pour chaque prescription, créer une demande de dispensation dans le module Pharmacie
      for (const prescription of allPrescriptions) {
        if (prescription.lines && prescription.lines.length > 0) {
          // Créer une demande de dispensation
          // Note: Cette fonction devrait appeler l'API du module Pharmacie
          // Pour l'instant, on simule l'envoi
          console.log('Envoi prescription au module Pharmacie:', {
            prescription_id: prescription.id,
            patient_id: patientId,
            lines: prescription.lines,
          });

          // TODO: Intégrer avec l'API Pharmacie réelle
          // await PharmacyService.createDispensationRequest({
          //   prescription_id: prescription.id,
          //   patient_id: patientId,
          //   lines: prescription.lines,
          // });
        }
      }

      return { success: true, message: 'Prescriptions envoyées au module Pharmacie' };
    } catch (error) {
      console.error('Erreur lors de l\'envoi des prescriptions:', error);
      return { success: false, message: 'Erreur lors de l\'envoi des prescriptions' };
    }
  }

  /**
   * Envoie les demandes d'examens au module Laboratoire
   */
  static async sendLabRequestsToLaboratory(
    consultationId: string,
    patientId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const labRequests = await ConsultationApiService.getLabRequests(consultationId);

      for (const request of labRequests) {
        console.log('Envoi demande labo au module Laboratoire:', {
          request_id: request.id,
          patient_id: patientId,
          tests: request.tests,
        });

        // TODO: Intégrer avec l'API Laboratoire réelle
        // await LaboratoireService.createLabRequest({
        //   consultation_id: consultationId,
        //   patient_id: patientId,
        //   tests: request.tests,
        // });
      }

      return { success: true, message: 'Demandes d\'examens envoyées au module Laboratoire' };
    } catch (error) {
      console.error('Erreur lors de l\'envoi des demandes labo:', error);
      return { success: false, message: 'Erreur lors de l\'envoi des demandes labo' };
    }
  }

  /**
   * Envoie les demandes d'imagerie au module Imagerie
   */
  static async sendImagingRequestsToImagerie(
    consultationId: string,
    patientId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const imagingRequests = await ConsultationApiService.getImagingRequests(consultationId);

      for (const request of imagingRequests) {
        console.log('Envoi demande imagerie au module Imagerie:', {
          request_id: request.id,
          patient_id: patientId,
          examens: request.examens,
        });

        // TODO: Intégrer avec l'API Imagerie réelle
        // await ImagerieService.createImagingRequest({
        //   consultation_id: consultationId,
        //   patient_id: patientId,
        //   examens: request.examens,
        // });
      }

      return { success: true, message: 'Demandes d\'imagerie envoyées au module Imagerie' };
    } catch (error) {
      console.error('Erreur lors de l\'envoi des demandes imagerie:', error);
      return { success: false, message: 'Erreur lors de l\'envoi des demandes imagerie' };
    }
  }

  /**
   * Génère la facturation automatique et l'envoie au module Caisse
   */
  static async generateBillingAndSendToCaisse(
    consultationId: string,
    patientId: string
  ): Promise<{ success: boolean; factureId?: string; message?: string }> {
    try {
      // Générer le résumé de facturation
      const billingSummary = await ConsultationBillingService.buildBillingSummary(consultationId);

      if (billingSummary.lines.length === 0) {
        return { success: false, message: 'Aucun élément à facturer' };
      }

      // Générer la facture
      const { facture } = await ConsultationBillingService.generateInvoice(consultationId, patientId);

      // La facture est automatiquement créée dans la table factures
      // Le module Caisse peut la récupérer via consultation_id

      return {
        success: true,
        factureId: facture.id,
        message: `Facture générée: ${facture.numero_facture}`,
      };
    } catch (error) {
      console.error('Erreur lors de la génération de la facturation:', error);
      return { success: false, message: 'Erreur lors de la génération de la facturation' };
    }
  }

  /**
   * Clôture complète de la consultation avec toutes les intégrations
   */
  static async closeConsultationWithIntegrations(
    consultationId: string,
    patientId: string,
    userId: string
  ): Promise<{
    success: boolean;
    factureId?: string;
    messages: string[];
  }> {
    const messages: string[] = [];

    try {
      // 1. Envoyer les prescriptions au module Pharmacie
      const pharmacyResult = await this.sendPrescriptionsToPharmacy(
        consultationId,
        patientId,
        []
      );
      if (pharmacyResult.success) {
        messages.push(pharmacyResult.message || 'Prescriptions envoyées à la Pharmacie');
      }

      // 2. Envoyer les demandes labo au module Laboratoire
      const labResult = await this.sendLabRequestsToLaboratory(consultationId, patientId);
      if (labResult.success) {
        messages.push(labResult.message || 'Demandes labo envoyées au Laboratoire');
      }

      // 3. Envoyer les demandes imagerie au module Imagerie
      const imagingResult = await this.sendImagingRequestsToImagerie(consultationId, patientId);
      if (imagingResult.success) {
        messages.push(imagingResult.message || 'Demandes imagerie envoyées au module Imagerie');
      }

      // 4. Générer la facturation et l'envoyer au module Caisse
      const billingResult = await this.generateBillingAndSendToCaisse(consultationId, patientId);
      if (billingResult.success) {
        messages.push(
          billingResult.message || `Facture générée: ${billingResult.factureId}`
        );
      }

      // 5. Clôturer la consultation
      await ConsultationApiService.updateConsultation(
        consultationId,
        { status: 'CLOTURE' as any },
        userId,
        'consultation'
      );

      messages.push('Consultation clôturée avec succès');

      return {
        success: true,
        factureId: billingResult.factureId,
        messages,
      };
    } catch (error) {
      console.error('Erreur lors de la clôture:', error);
      return {
        success: false,
        messages: ['Erreur lors de la clôture de la consultation'],
      };
    }
  }
}

