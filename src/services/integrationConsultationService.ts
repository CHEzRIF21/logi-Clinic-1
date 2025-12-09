/**
 * Service d'intégration pour le module Consultation
 * Gère les intégrations avec Facturation, Pharmacie, Laboratoire, Imagerie, Rendez-vous, DMP
 */

import { supabase } from './supabase';
import { FacturationService } from './facturationService';
import { LaboratoireService } from './laboratoireService';
import { ImagerieService } from './imagerieService';
import { StockService } from './stockService';

// ============================================
// TYPES
// ============================================

export interface OperationFacturable {
  consultationId: string;
  patientId: string;
  productId?: string;
  serviceId?: string;
  code?: string;
  libelle: string;
  qty: number;
  price: number;
  type: 'medicament' | 'acte' | 'examen' | 'consommable';
}

export interface NotificationEvent {
  type: 'lab:request:created' | 'pharmacy:prescription:new' | 'consultation:closed' | 'imaging:request:created';
  data: any;
  timestamp: string;
}

// ============================================
// INTÉGRATION FACTURATION
// ============================================

/**
 * Créer une opération facturable depuis un protocole/acte/examen
 * @param operation Données de l'opération
 * @param autoFacturer Si true, crée directement une facture, sinon push vers "Tickets en attente"
 */
export async function createOperationFromConsultation(
  operation: OperationFacturable,
  autoFacturer: boolean = false
): Promise<{ success: boolean; operationId?: string; ticketId?: string; factureId?: string; message: string }> {
  try {
    // Créer un ticket de facturation
    const ticketData = {
      patient_id: operation.patientId,
      consultation_id: operation.consultationId,
      type: 'consultation',
      libelle: operation.libelle,
      quantite: operation.qty,
      prix_unitaire: operation.price,
      montant_total: operation.qty * operation.price,
      statut: autoFacturer ? 'facture' : 'en_attente',
    };

    const ticket = await FacturationService.creerTicketFacturation(
      operation.patientId,
      'consultation', // serviceOrigine
      operation.consultationId || null, // referenceOrigine
      operation.libelle, // typeActe
      operation.qty * operation.price // montant
    );

    if (autoFacturer && ticket) {
      // Créer automatiquement une facture
      // TODO: Implémenter la création automatique de facture
      return {
        success: true,
        ticketId: ticket.id,
        message: 'Opération créée et facturée automatiquement',
      };
    }

    return {
      success: true,
      ticketId: ticket?.id,
      message: 'Opération créée et ajoutée aux tickets en attente',
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'opération facturable:', error);
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

// ============================================
// INTÉGRATION PHARMACIE
// ============================================

/**
 * Notifier la pharmacie d'une nouvelle prescription
 */
export async function notifyPharmacyNewPrescription(prescriptionId: string, patientId: string): Promise<void> {
  try {
    // Envoyer une notification WebSocket
    await emitWebSocketEvent('pharmacy:prescription:new', {
      prescriptionId,
      patientId,
      timestamp: new Date().toISOString(),
    });

    // Optionnel: Créer une notification dans la base de données
    await supabase.from('notifications').insert([
      {
        type: 'prescription_new',
        module: 'pharmacie',
        reference_id: prescriptionId,
        patient_id: patientId,
        message: 'Nouvelle prescription disponible',
        lu: false,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error('Erreur lors de la notification pharmacie:', error);
  }
}

/**
 * Dispenser une prescription et créer une ligne facturable si paiement requis
 */
export async function dispensePrescriptionWithBilling(
  prescriptionId: string,
  linesToDispense: Array<{ 
    lineId: string; 
    lotId: string; 
    quantite: number; 
    prixUnitaire: number;
    nomMedicament?: string;
  }>,
  userId: string,
  requirePayment: boolean = false
): Promise<{ success: boolean; factureId?: string; message: string }> {
  try {
    // Dispenser via StockService
    // Note: Cette fonction devrait être appelée depuis le backend pour garantir l'atomicité
    // Ici on simule l'appel

    if (requirePayment) {
      // Récupérer la prescription pour obtenir le patient_id et consultation_id
      const { data: prescription } = await supabase
        .from('prescriptions')
        .select('patient_id, consultation_id')
        .eq('id', prescriptionId)
        .single();

      if (prescription) {
        // Créer des tickets de facturation pour chaque ligne dispensée
        for (const line of linesToDispense) {
          const nomMedicament = line.nomMedicament || 'Médicament';
          await FacturationService.creerTicketFacturation(
            prescription.patient_id,
            'pharmacie', // serviceOrigine
            prescription.consultation_id || null, // referenceOrigine
            `Dispensation médicament: ${nomMedicament}`, // typeActe
            line.quantite * line.prixUnitaire // montant
          );
        }
      }
    }

    return {
      success: true,
      message: requirePayment ? 'Prescription dispensée et facturation créée' : 'Prescription dispensée',
    };
  } catch (error) {
    console.error('Erreur lors de la dispensation avec facturation:', error);
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

// ============================================
// INTÉGRATION LABORATOIRE / IMAGERIE
// ============================================

/**
 * Signaler la création d'une demande labo au module Laboratoire
 */
export async function notifyLabRequestCreated(labRequestId: string, consultationId: string, patientId: string): Promise<void> {
  try {
    // Récupérer la demande complète
    const { data: labRequest } = await supabase
      .from('lab_requests')
      .select('*')
      .eq('id', labRequestId)
      .single();

    if (!labRequest) {
      throw new Error('Demande labo non trouvée');
    }

    // Créer une prescription labo dans le module Laboratoire
    if (labRequest.type === 'INTERNE') {
      const tests = Array.isArray(labRequest.tests) ? labRequest.tests : [];
      for (const rawTest of tests) {
        const test =
          typeof rawTest === 'string'
            ? { nom: rawTest, code: rawTest }
            : rawTest || { nom: 'Examen', code: 'EXAM' };

        await LaboratoireService.createPrescription({
          patient_id: patientId,
          type_examen: test.code || test.nom,
          details: labRequest.clinical_info,
          date_prescription: new Date().toISOString(),
          origine: 'consultation',
        });
      }
    }

    // Envoyer une notification WebSocket
    await emitWebSocketEvent('lab:request:created', {
      labRequestId,
      consultationId,
      patientId,
      type: labRequest.type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la notification labo:', error);
  }
}

/**
 * Signaler la création d'une demande imagerie au module Imagerie
 */
export async function notifyImagingRequestCreated(
  imagingRequestId: string,
  consultationId: string,
  patientId: string
): Promise<void> {
  try {
    // Récupérer la demande complète
    const { data: imagingRequest } = await supabase
      .from('imaging_requests')
      .select('*')
      .eq('id', imagingRequestId)
      .single();

    if (!imagingRequest) {
      throw new Error('Demande imagerie non trouvée');
    }

    // Créer un examen dans le module Imagerie
    if (imagingRequest.type === 'INTERNE') {
      const examens = Array.isArray(imagingRequest.examens) ? imagingRequest.examens : [];
      for (const rawExamen of examens) {
        const examen =
          typeof rawExamen === 'string'
            ? { nom: rawExamen, code: rawExamen }
            : rawExamen || { nom: 'Examen', code: 'EXAM' };

        await ImagerieService.creerExamen({
          patient_id: patientId,
          type_examen: examen.code || examen.nom,
          date_examen: new Date().toISOString(),
          statut: 'en_attente',
        });
      }
    }

    // Envoyer une notification WebSocket
    await emitWebSocketEvent('imaging:request:created', {
      imagingRequestId,
      consultationId,
      patientId,
      type: imagingRequest.type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur lors de la notification imagerie:', error);
  }
}

/**
 * Attacher un résultat (PDF/JSON) à une consultation dans l'historique
 */
export async function attachResultToConsultation(
  consultationId: string,
  resultType: 'lab' | 'imaging',
  resultData: {
    requestId: string;
    pdfUrl?: string;
    resultJson?: any;
    dateResultat: string;
    createdBy: string;
  }
): Promise<void> {
  try {
    // Créer une entrée d'historique avec le résultat
    await supabase.from('consultation_entries').insert([
      {
        consultation_id: consultationId,
        section: resultType === 'lab' ? 'lab_results' : 'imaging_results',
        data: {
          request_id: resultData.requestId,
          pdf_url: resultData.pdfUrl,
          result_json: resultData.resultJson,
          date_resultat: resultData.dateResultat,
        },
        action: 'CREATE',
        created_by: resultData.createdBy,
      },
    ]);
  } catch (error) {
    console.error('Erreur lors de l\'attachement du résultat:', error);
  }
}

// ============================================
// INTÉGRATION RENDEZ-VOUS
// ============================================

/**
 * Marquer un rendez-vous comme complété lors de la clôture d'une consultation
 */
export async function markAppointmentCompleted(consultationId: string): Promise<void> {
  try {
    // Récupérer la consultation pour obtenir le patient_id et la date
    const { data: consultation } = await supabase
      .from('consultations')
      .select('patient_id, started_at')
      .eq('id', consultationId)
      .single();

    if (!consultation) {
      throw new Error('Consultation non trouvée');
    }

    // Chercher le rendez-vous correspondant
    // Note: On suppose qu'il y a un champ consultation_id dans rendez_vous ou qu'on peut matcher par patient_id et date
    const { data: rendezVous } = await supabase
      .from('rendez_vous')
      .select('id')
      .eq('patient_id', consultation.patient_id)
      .eq('statut', 'confirmé')
      .gte('date_debut', new Date(new Date(consultation.started_at).getTime() - 30 * 60 * 1000).toISOString()) // 30 min avant
      .lte('date_debut', new Date(new Date(consultation.started_at).getTime() + 30 * 60 * 1000).toISOString()) // 30 min après
      .limit(1)
      .single();

    if (rendezVous) {
      // Marquer le rendez-vous comme terminé
      await supabase
        .from('rendez_vous')
        .update({ statut: 'terminé' })
        .eq('id', rendezVous.id);
    }
  } catch (error) {
    console.error('Erreur lors du marquage du rendez-vous:', error);
    // Ne pas faire échouer la clôture de consultation si le RDV n'est pas trouvé
  }
}

// ============================================
// EXPORT PDF POUR DMP
// ============================================

/**
 * Exporter une consultation complète en PDF pour le DMP
 */
export async function exportConsultationToPDF(consultationId: string): Promise<{ pdfUrl: string; success: boolean }> {
  try {
    // Récupérer la consultation complète avec toutes les données
    const { data: consultation } = await supabase
      .from('consultations')
      .select(`
        *,
        consultation_entries (*),
        protocols (*),
        prescriptions (*, prescription_lines (*)),
        lab_requests (*),
        imaging_requests (*)
      `)
      .eq('id', consultationId)
      .single();

    if (!consultation) {
      throw new Error('Consultation non trouvée');
    }

    // Générer le PDF (utiliser une bibliothèque comme jsPDF ou puppeteer)
    // Pour l'instant, on simule en créant un fichier dans Supabase Storage
    const pdfContent = generatePDFContent(consultation);

    // Upload vers Supabase Storage
    const fileName = `consultation_${consultationId}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('consultations-pdf')
      .upload(fileName, pdfContent, {
        contentType: 'application/pdf',
      });

    if (uploadError) {
      throw uploadError;
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage.from('consultations-pdf').getPublicUrl(fileName);

    // Attacher le PDF au dossier patient dans le DMP
    await supabase.from('patient_documents').insert([
      {
        patient_id: consultation.patient_id,
        type: 'consultation',
        titre: `Consultation du ${new Date(consultation.started_at).toLocaleDateString('fr-FR')}`,
        fichier_url: urlData.publicUrl,
        consultation_id: consultationId,
        created_at: new Date().toISOString(),
      },
    ]);

    return {
      success: true,
      pdfUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    return {
      success: false,
      pdfUrl: '',
    };
  }
}

/**
 * Générer le contenu PDF d'une consultation
 * TODO: Implémenter avec jsPDF ou puppeteer
 */
function generatePDFContent(consultation: any): Blob {
  // Simulation - à remplacer par une vraie génération PDF
  const content = `
    CONSULTATION MÉDICALE
    Date: ${new Date(consultation.started_at).toLocaleDateString('fr-FR')}
    Patient: ${consultation.patient_id}
    Type: ${consultation.type}
    Statut: ${consultation.status}
    
    HISTORIQUE:
    ${JSON.stringify(consultation.consultation_entries, null, 2)}
  `;
  return new Blob([content], { type: 'application/pdf' });
}

// ============================================
// WEBSOCKET / NOTIFICATIONS
// ============================================

/**
 * Émettre un événement WebSocket
 * TODO: Implémenter avec Socket.io ou Supabase Realtime
 */
export async function emitWebSocketEvent(eventType: NotificationEvent['type'], data: any): Promise<void> {
  try {
    // Utiliser Supabase Realtime pour les notifications
    const channel = supabase.channel('consultation-events');
    
    await channel.send({
      type: 'broadcast',
      event: eventType,
      payload: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    });

    // Alternative: Utiliser un service de notifications externe
    // await fetch(process.env.WEBSOCKET_SERVER_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ type: eventType, data }),
    // });
  } catch (error) {
    console.error('Erreur lors de l\'émission WebSocket:', error);
  }
}

// ============================================
// EXPORTS
// ============================================

export const IntegrationConsultationService = {
  createOperationFromConsultation,
  notifyPharmacyNewPrescription,
  dispensePrescriptionWithBilling,
  notifyLabRequestCreated,
  notifyImagingRequestCreated,
  attachResultToConsultation,
  markAppointmentCompleted,
  exportConsultationToPDF,
};

