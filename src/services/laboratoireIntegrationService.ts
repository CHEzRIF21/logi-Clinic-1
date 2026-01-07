import { supabase } from './supabase';
import { LaboratoireService, LabPrescription, LabAnalyse, LabRapport } from './laboratoireService';

/**
 * Service d'intégration du module Laboratoire avec les autres modules
 * 
 * CONNEXIONS IMPLÉMENTÉES:
 * - Gestion Patient (Entrée): Récupération âge/sexe pour valeurs normales
 * - Consultation (Bidirectionnel): Prescription électronique ↔ Résultats
 * - Maternité (Bidirectionnel): Bilans prénataux, résultats urgents sages-femmes
 * - Caisse (Entrée): Verrouillage si facture non payée
 * - Stock (Sortie): Déstockage automatique des réactifs
 * - Tableau de Bord (Sortie): KPI et indicateurs
 * - Bilan (Sortie): Données financières
 */
export class LaboratoireIntegrationService {
  
  // ============================================
  // 1. GESTION PATIENT → LABORATOIRE (Entrée)
  // Récupération de l'âge et du sexe pour valeurs normales
  // ============================================

  /**
   * Récupère les informations patient nécessaires pour le laboratoire
   */
  static async getPatientLabInfo(patientId: string): Promise<{
    id: string;
    identifiant: string;
    nom: string;
    prenom: string;
    sexe: string;
    age: number;
    tranche_age: string;
    groupe_sanguin?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, identifiant, nom, prenom, sexe, date_naissance, groupe_sanguin')
        .eq('id', patientId)
        .single();

      if (error || !data) return null;

      const age = Math.floor((new Date().getTime() - new Date(data.date_naissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      let tranche_age = 'adulte';
      if (age < 1) tranche_age = 'nouveau_ne';
      else if (age < 2) tranche_age = 'nourrisson';
      else if (age < 12) tranche_age = 'enfant';
      else if (age < 18) tranche_age = 'adolescent';

      return {
        id: data.id,
        identifiant: data.identifiant,
        nom: data.nom,
        prenom: data.prenom,
        sexe: data.sexe,
        age,
        tranche_age,
        groupe_sanguin: data.groupe_sanguin
      };
    } catch (error) {
      console.error('Erreur récupération info patient labo:', error);
      return null;
    }
  }

  /**
   * Récupère automatiquement les valeurs de référence selon l'âge et le sexe du patient
   */
  static async getValeursReferencePatient(
    patientId: string,
    parametre: string
  ): Promise<{
    valeur_min: number;
    valeur_max: number;
    unite: string;
    commentaire?: string;
  } | null> {
    try {
      // Récupérer les infos patient
      const patient = await this.getPatientLabInfo(patientId);
      if (!patient) return null;

      // Chercher les valeurs de référence
      const { data, error } = await supabase
        .from('lab_valeurs_reference')
        .select('valeur_min, valeur_max, unite, commentaire')
        .eq('parametre', parametre)
        .or(`sexe.eq.${patient.sexe},sexe.eq.Tous`)
        .order('sexe', { ascending: true })
        .limit(10);

      if (error || !data || data.length === 0) return null;

      // Filtrer par âge
      const matchingRef = data.find(ref => {
        const ageMin = (ref as any).age_min;
        const ageMax = (ref as any).age_max;
        if (ageMin !== null && patient.age < ageMin) return false;
        if (ageMax !== null && patient.age > ageMax) return false;
        return true;
      });

      if (!matchingRef) return data[0] as any;

      return {
        valeur_min: matchingRef.valeur_min,
        valeur_max: matchingRef.valeur_max,
        unite: matchingRef.unite,
        commentaire: matchingRef.commentaire
      };
    } catch (error) {
      console.error('Erreur récupération valeurs référence:', error);
      return null;
    }
  }

  // ============================================
  // 2. CONSULTATION ↔ LABORATOIRE (Bidirectionnel)
  // ============================================

  /**
   * Crée une prescription de laboratoire depuis une consultation
   * Crée automatiquement un ticket de facturation vers le module Caisse
   */
  static async createPrescriptionFromConsultation(
    consultationId: string,
    patientId: string,
    typeExamen: string,
    details?: string,
    prescripteur?: string,
    servicePrescripteur?: string,
    montant?: number,
    analyses?: Array<{ numero: string; nom: string; code?: string; prix: number; tube: string }>
  ): Promise<LabPrescription> {
    try {
      const prescription = await LaboratoireService.createPrescription({
        patient_id: patientId,
        type_examen: typeExamen,
        details: details || `Demande depuis consultation ${consultationId}`,
        prescripteur: prescripteur,
        service_prescripteur: servicePrescripteur || 'Consultation',
        origine: 'consultation',
        date_prescription: new Date().toISOString(),
        consultation_id: consultationId,
        analyses_selectionnees: analyses,
        montant_total: montant || (analyses ? analyses.reduce((sum, a) => sum + a.prix, 0) : 0)
      });

      // Le ticket de facturation est créé automatiquement par le trigger si montant_total > 0
      // Pas besoin de l'appeler manuellement ici

      return prescription;
    } catch (error) {
      console.error('Erreur création prescription depuis consultation:', error);
      throw error;
    }
  }

  /**
   * Récupère le tarif d'un examen depuis le catalogue
   */
  static async getTarifExamen(typeExamen: string): Promise<number> {
    try {
      // Chercher dans le catalogue des examens
      const { data: examen } = await supabase
        .from('lab_catalogue_examens')
        .select('tarif_base')
        .eq('code', typeExamen)
        .single();

      if (examen?.tarif_base) {
        return examen.tarif_base;
      }

      // Fallback: chercher dans les services facturables
      const { data: service } = await supabase
        .from('services_facturables')
        .select('tarif_base')
        .eq('code', typeExamen)
        .eq('type_service', 'laboratoire')
        .single();

      return service?.tarif_base || 0;
    } catch (error) {
      console.error('Erreur récupération tarif examen:', error);
      return 0;
    }
  }

  /**
   * Envoie les résultats au dossier de consultation du médecin
   */
  static async sendResultsToConsultation(
    rapportId: string,
    prelevementId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const rapports = await LaboratoireService.listRapports(prelevementId);
      const rapport = rapports.find(r => r.id === rapportId);
      
      if (!rapport || rapport.statut !== 'signe') {
        return { success: false, message: 'Le rapport doit être signé avant transmission' };
      }

      // Récupérer la prescription et son consultation_id
      const { data: prelevement } = await supabase
        .from('lab_prelevements')
        .select('prescription_id')
        .eq('id', prelevementId)
        .single();

      if (!prelevement) {
        return { success: false, message: 'Prélèvement introuvable' };
      }

      const { data: prescription } = await supabase
        .from('lab_prescriptions')
        .select('consultation_id, patient_id')
        .eq('id', prelevement.prescription_id)
        .single();

      if (!prescription) {
        return { success: false, message: 'Prescription introuvable' };
      }

      // Créer le lien dans la table de liaison
      await supabase.from('lab_resultats_consultation').insert([{
        consultation_id: prescription.consultation_id,
        prescription_id: prelevement.prescription_id,
        rapport_id: rapportId,
        date_envoi: new Date().toISOString()
      }]);

      // Mettre à jour le rapport comme transmis
      await LaboratoireService.transmitRapport(rapportId, 'Consultation');

      return { success: true, message: 'Résultats transmis à la consultation' };
    } catch (error) {
      console.error('Erreur transmission résultats:', error);
      return { 
        success: false, 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      };
    }
  }

  /**
   * Récupère les résultats de labo pour une consultation
   */
  static async getResultsForConsultation(consultationId: string): Promise<{
    prescriptions: any[];
    analyses: any[];
    rapports: any[];
  }> {
    try {
      // Récupérer les prescriptions liées à cette consultation
      const { data: prescriptions } = await supabase
        .from('lab_prescriptions')
        .select('*')
        .eq('consultation_id', consultationId);

      if (!prescriptions || prescriptions.length === 0) {
        return { prescriptions: [], analyses: [], rapports: [] };
      }

      // Récupérer les prélèvements et analyses
      const prescriptionIds = prescriptions.map(p => p.id);
      
      const { data: prelevements } = await supabase
        .from('lab_prelevements')
        .select('*')
        .in('prescription_id', prescriptionIds);

      const prelevementIds = (prelevements || []).map(p => p.id);
      
      const { data: analyses } = await supabase
        .from('lab_analyses')
        .select('*')
        .in('prelevement_id', prelevementIds);

      const { data: rapports } = await supabase
        .from('lab_rapports')
        .select('*')
        .in('prelevement_id', prelevementIds);

      return {
        prescriptions: prescriptions || [],
        analyses: analyses || [],
        rapports: rapports || []
      };
    } catch (error) {
      console.error('Erreur récupération résultats consultation:', error);
      return { prescriptions: [], analyses: [], rapports: [] };
    }
  }

  // ============================================
  // 3. MATERNITÉ ↔ LABORATOIRE (Bidirectionnel)
  // ============================================

  /**
   * Récupère les examens obligatoires pour une CPN
   */
  static async getExamensMaterniteObligatoires(numeroCPN: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lab_examens_maternite')
        .select('*')
        .eq('obligatoire_cpn', numeroCPN)
        .eq('actif', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération examens maternité:', error);
      return [];
    }
  }

  /**
   * Crée les prescriptions maternité pour une CPN
   */
  static async createPrescriptionsMaternite(
    patientId: string,
    numeroCPN: number,
    cpnId?: string,
    sageFemme?: string
  ): Promise<LabPrescription[]> {
    try {
      const examens = await this.getExamensMaterniteObligatoires(numeroCPN);
      const prescriptions: LabPrescription[] = [];

      for (const examen of examens) {
        const prescription = await LaboratoireService.createPrescription({
          patient_id: patientId,
          type_examen: examen.code_examen,
          details: `Bilan prénatal CPN${numeroCPN} - ${examen.libelle}`,
          prescripteur: sageFemme,
          service_prescripteur: 'Maternité',
          origine: 'consultation',
          date_prescription: new Date().toISOString()
        });

        prescriptions.push(prescription);
      }

      return prescriptions;
    } catch (error) {
      console.error('Erreur création prescriptions maternité:', error);
      throw error;
    }
  }

  /**
   * Notifie les sages-femmes d'un résultat urgent
   */
  static async notifySageFemmeResultatUrgent(
    analyseId: string,
    patientId: string,
    grossesseId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Récupérer l'analyse
      const { data: analyse } = await supabase
        .from('lab_analyses')
        .select('*')
        .eq('id', analyseId)
        .single();

      if (!analyse || !analyse.est_pathologique) {
        return { success: false, message: 'Analyse non pathologique ou introuvable' };
      }

      // Créer la notification
      const notification = {
        patient_id: patientId,
        grossesse_id: grossesseId,
        analyse_id: analyseId,
        type_notification: 'resultat_urgent',
        priorite: 'critique',
        titre: `Résultat urgent: ${analyse.parametre}`,
        message: `Résultat pathologique détecté pour ${analyse.parametre}: ${analyse.type_resultat === 'quantitatif' ? analyse.valeur_numerique : analyse.valeur_qualitative} ${analyse.unite || ''}`,
        parametre: analyse.parametre,
        valeur: String(analyse.type_resultat === 'quantitatif' ? analyse.valeur_numerique : analyse.valeur_qualitative),
        est_pathologique: true,
        statut: 'nouvelle'
      };

      const { error } = await supabase
        .from('lab_notifications_maternite')
        .insert([notification]);

      if (error) throw error;

      return { success: true, message: 'Notification envoyée aux sages-femmes' };
    } catch (error) {
      console.error('Erreur notification sage-femme:', error);
      return { 
        success: false, 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      };
    }
  }

  /**
   * Récupère les notifications maternité non lues
   */
  static async getNotificationsMaterniteNonLues(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lab_notifications_maternite')
        .select(`
          *,
          patients:patient_id (nom, prenom, identifiant)
        `)
        .eq('statut', 'nouvelle')
        .order('date_notification', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération notifications maternité:', error);
      return [];
    }
  }

  // ============================================
  // 4. CAISSE → LABORATOIRE (Entrée)
  // Verrouillage si facture non payée
  // ============================================

  /**
   * Vérifie le statut de paiement avant une action
   */
  static async checkPaiementStatus(prescriptionId: string): Promise<{
    est_paye: boolean;
    peut_prelever: boolean;
    peut_valider: boolean;
    peut_imprimer: boolean;
    message: string;
  }> {
    try {
      // Récupérer la prescription avec consultation_id
      const { data: prescription } = await supabase
        .from('lab_prescriptions')
        .select('statut_paiement, consultation_id')
        .eq('id', prescriptionId)
        .single();

      if (!prescription) {
        return {
          est_paye: false,
          peut_prelever: false,
          peut_valider: false,
          peut_imprimer: false,
          message: 'Prescription introuvable'
        };
      }

      // Récupérer la configuration
      const { data: config } = await supabase
        .from('configurations_laboratoire')
        .select('valeur')
        .eq('cle', 'labo_paiement_obligatoire')
        .single();

      const paiementObligatoire = config?.valeur === 'true';

      // Si paiement non obligatoire, tout est autorisé
      if (!paiementObligatoire) {
        return {
          est_paye: true,
          peut_prelever: true,
          peut_valider: true,
          peut_imprimer: true,
          message: 'Paiement non obligatoire'
        };
      }

      // Vérifier le statut de paiement
      const statutPaiement = prescription.statut_paiement || 'non_facture';

      // Vérifier aussi les factures complémentaires si la prescription est liée à une consultation
      let facturesComplementairesPayees = true;
      if (prescription.consultation_id) {
        const { data: facturesNonPayees } = await supabase
          .from('factures')
          .select('id')
          .eq('consultation_id', prescription.consultation_id)
          .eq('type_facture_detail', 'complementaire')
          .in('statut', ['en_attente', 'partiellement_payee'])
          .gt('montant_restant', 0)
          .limit(1);

        if (facturesNonPayees && facturesNonPayees.length > 0) {
          facturesComplementairesPayees = false;
        }
      }

      if ((statutPaiement === 'paye' || statutPaiement === 'exonere') && facturesComplementairesPayees) {
        return {
          est_paye: true,
          peut_prelever: true,
          peut_valider: true,
          peut_imprimer: true,
          message: 'Paiement effectué'
        };
      } else if (statutPaiement === 'en_attente' && facturesComplementairesPayees) {
        return {
          est_paye: false,
          peut_prelever: true,
          peut_valider: true,
          peut_imprimer: false,
          message: 'Paiement en attente - Impression bloquée'
        };
      } else {
        return {
          est_paye: false,
          peut_prelever: true,
          peut_valider: false,
          peut_imprimer: false,
          message: facturesComplementairesPayees 
            ? 'Paiement requis avant validation'
            : 'Facture complémentaire non payée - Paiement requis'
        };
      }
    } catch (error) {
      console.error('Erreur vérification paiement:', error);
      return {
        est_paye: false,
        peut_prelever: false,
        peut_valider: false,
        peut_imprimer: false,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Enregistre le paiement d'une prescription
   */
  static async enregistrerPaiement(
    prescriptionId: string,
    factureId: string,
    montant: number,
    modePaiement: string,
    reference?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Mettre à jour le statut de paiement de la prescription
      const { error } = await supabase
        .from('lab_prescriptions')
        .update({
          statut_paiement: 'paye',
          facture_id: factureId
        })
        .eq('id', prescriptionId);

      if (error) throw error;

      // Mettre à jour le ticket de facturation si présent
      const { data: prescription } = await supabase
        .from('lab_prescriptions')
        .select('ticket_facturation_id')
        .eq('id', prescriptionId)
        .single();

      if (prescription?.ticket_facturation_id) {
        await supabase
          .from('tickets_facturation')
          .update({
            statut: 'paye',
            facture_id: factureId
          })
          .eq('id', prescription.ticket_facturation_id);
      }

      return { success: true, message: 'Paiement enregistré avec succès' };
    } catch (error) {
      console.error('Erreur enregistrement paiement:', error);
      return { 
        success: false, 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      };
    }
  }
  

  /**
   * Crée un ticket de facturation pour le laboratoire
   */
  static async createTicketFacturation(
    prescriptionId: string,
    patientId: string,
    typeExamen: string,
    montant: number
  ): Promise<{ success: boolean; ticketId?: string; message: string }> {
    try {
      // Récupérer ou créer le ticket de facturation
      const { data: existingTicket } = await supabase
        .from('tickets_facturation')
        .select('id')
        .eq('reference_origine', prescriptionId)
        .eq('service_origine', 'laboratoire')
        .maybeSingle();

      if (existingTicket) {
        return { 
          success: true, 
          ticketId: existingTicket.id, 
          message: 'Ticket existant trouvé' 
        };
      }

      const { data: ticket, error } = await supabase
        .from('tickets_facturation')
        .insert([{
          patient_id: patientId,
          service_origine: 'laboratoire',
          reference_origine: prescriptionId,
          type_acte: `Examen laboratoire: ${typeExamen}`,
          montant: montant,
          statut: 'en_attente',
          date_creation: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour la prescription avec le ticket_id
      await supabase
        .from('lab_prescriptions')
        .update({ 
          statut_paiement: 'en_attente',
          ticket_facturation_id: ticket.id
        })
        .eq('id', prescriptionId);

      return { 
        success: true, 
        ticketId: ticket?.id, 
        message: 'Ticket de facturation créé' 
      };
    } catch (error) {
      console.error('Erreur création ticket facturation:', error);
      return { 
        success: false, 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      };
    }
  }

  // ============================================
  // 5. LABORATOIRE → STOCK (Sortie)
  // Déstockage automatique des réactifs
  // ============================================

  /**
   * Enregistre la consommation de réactifs pour une analyse
   */
  static async enregistrerConsommationReactifs(
    analyseId: string,
    consommations: Array<{
      code_reactif: string;
      quantite: number;
      operateur?: string;
    }>
  ): Promise<{ success: boolean; message: string }> {
    try {
      for (const conso of consommations) {
        // Récupérer le réactif
        const { data: reactif } = await supabase
          .from('lab_stocks_reactifs')
          .select('*')
          .eq('code_reactif', conso.code_reactif)
          .single();

        if (!reactif) continue;

        // Vérifier le stock disponible
        if (reactif.quantite_disponible < conso.quantite) {
          console.warn(`Stock insuffisant pour ${conso.code_reactif}`);
          continue;
        }

        // Décrémenter le stock
        await supabase
          .from('lab_stocks_reactifs')
          .update({
            quantite_disponible: reactif.quantite_disponible - conso.quantite
          })
          .eq('id', reactif.id);

        // Enregistrer la consommation
        await supabase
          .from('lab_consommation_analyse')
          .insert([{
            analyse_id: analyseId,
            medicament_id: reactif.medicament_id,
            code_reactif: conso.code_reactif,
            libelle: reactif.libelle,
            quantite_utilisee: conso.quantite,
            unite: reactif.unite,
            operateur: conso.operateur
          }]);

        // Vérifier si alerte de stock nécessaire
        if (reactif.quantite_disponible - conso.quantite <= reactif.seuil_alerte) {
          await this.createAlerteStockBas(reactif.id, reactif.libelle, reactif.quantite_disponible - conso.quantite);
        }
      }

      return { success: true, message: 'Consommation de réactifs enregistrée' };
    } catch (error) {
      console.error('Erreur enregistrement consommation:', error);
      return { 
        success: false, 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      };
    }
  }

  /**
   * Récupère les réactifs nécessaires pour un type d'examen
   */
  static async getReactifsNecessaires(codeExamen: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lab_examen_reactifs')
        .select(`
          *,
          stock:lab_stocks_reactifs!code_reactif (quantite_disponible, seuil_alerte, date_peremption)
        `)
        .eq('code_examen', codeExamen)
        .eq('actif', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération réactifs nécessaires:', error);
      return [];
    }
  }

  /**
   * Crée une alerte de stock bas
   */
  static async createAlerteStockBas(reactifId: string, libelle: string, quantiteRestante: number): Promise<void> {
    try {
      await supabase.from('lab_alertes').insert([{
        type_alerte: 'stock_critique',
        priorite: 'haute',
        titre: `Stock bas: ${libelle}`,
        message: `Le stock de ${libelle} est critique. Quantité restante: ${quantiteRestante}`,
        reactif_id: reactifId,
        statut: 'nouvelle'
      }]);
    } catch (error) {
      console.error('Erreur création alerte stock:', error);
    }
  }

  /**
   * Envoie une commande de réactifs à la pharmacie
   */
  static async commanderReactifs(
    reactifId: string,
    quantite: number,
    raison: string,
    priorite: 'basse' | 'normale' | 'haute' | 'urgente' = 'normale'
  ): Promise<{ success: boolean; commandeId?: string; message: string }> {
    try {
      const { data: reactif } = await supabase
        .from('lab_stocks_reactifs')
        .select('*')
        .eq('id', reactifId)
        .single();

      if (!reactif) {
        return { success: false, message: 'Réactif introuvable' };
      }

      const { data: commande, error } = await supabase
        .from('commandes_achats')
        .insert([{
          type: 'reactif_laboratoire',
          service_demandeur: 'Laboratoire',
          medicament_id: reactif.medicament_id,
          code_reactif: reactif.code_reactif,
          libelle: reactif.libelle,
          quantite_demandee: quantite,
          unite: reactif.unite,
          raison: raison,
          priorite: priorite,
          statut: 'en_attente'
        }])
        .select()
        .single();

      if (error) throw error;

      return { 
        success: true, 
        commandeId: commande?.id, 
        message: `Commande de ${reactif.libelle} envoyée à la Pharmacie` 
      };
    } catch (error) {
      console.error('Erreur commande réactif:', error);
      return { 
        success: false, 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      };
    }
  }

  // ============================================
  // 6. LABORATOIRE → TABLEAU DE BORD (Sortie)
  // KPI: Temps d'attente, Examens/jour, Taux de positivité
  // ============================================

  /**
   * Récupère les KPI du laboratoire - OPTIMISÉ avec Promise.all
   */
  static async getLabKPI(): Promise<{
    examens_aujourd_hui: number;
    examens_semaine: number;
    examens_mois: number;
    analyses_terminees: number;
    analyses_en_cours: number;
    analyses_en_attente: number;
    resultats_pathologiques: number;
    delai_moyen_heures: number;
    taux_positivite_moyen: number;
    details_positivite: Array<{
      parametre: string;
      positifs: number;
      total: number;
      taux: number;
    }>;
  }> {
    try {
      const now = new Date();
      const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const debutSemaine = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const debutMois = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // OPTIMISATION: Exécuter toutes les requêtes en parallèle
      const [
        examensAujourdhuiResult,
        examensSemaineResult,
        examensMoisResult,
        analysesTermineesResult,
        analysesEnCoursResult,
        analysesEnAttenteResult,
        resultatsPathologiquesResult,
        delaisResult,
      ] = await Promise.all([
        // Examens par période
        supabase.from('lab_prescriptions').select('*', { count: 'exact', head: true }).gte('created_at', debutJour),
        supabase.from('lab_prescriptions').select('*', { count: 'exact', head: true }).gte('created_at', debutSemaine),
        supabase.from('lab_prescriptions').select('*', { count: 'exact', head: true }).gte('created_at', debutMois),
        // Analyses par statut
        supabase.from('lab_analyses').select('*', { count: 'exact', head: true }).eq('statut', 'termine'),
        supabase.from('lab_analyses').select('*', { count: 'exact', head: true }).eq('statut', 'en_cours'),
        supabase.from('lab_analyses').select('*', { count: 'exact', head: true }).eq('statut', 'en_attente'),
        supabase.from('lab_analyses').select('*', { count: 'exact', head: true }).eq('est_pathologique', true),
        // Délais
        supabase.from('lab_analyses').select('date_validation, created_at').not('date_validation', 'is', null).gte('created_at', debutMois),
      ]);

      const examensAujourdhui = examensAujourdhuiResult.count;
      const examensSemaine = examensSemaineResult.count;
      const examensMois = examensMoisResult.count;
      const analysesTerminees = analysesTermineesResult.count;
      const analysesEnCours = analysesEnCoursResult.count;
      const analysesEnAttente = analysesEnAttenteResult.count;
      const resultatsPathologiques = resultatsPathologiquesResult.count;
      const delais = delaisResult.data;

      let delaiMoyen = 0;
      if (delais && delais.length > 0) {
        const totalHeures = delais.reduce((sum, d) => {
          const heures = (new Date(d.date_validation).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60);
          return sum + heures;
        }, 0);
        delaiMoyen = totalHeures / delais.length;
      }

      // OPTIMISATION: Calculer les taux de positivité en parallèle
      const parametresCibles = ['Paludisme', 'VIH', 'Syphilis'];
      
      const positiviteResults = await Promise.all(
        parametresCibles.map(async (parametre) => {
          const [positifsResult, totalResult] = await Promise.all([
            supabase.from('lab_analyses').select('*', { count: 'exact', head: true })
              .eq('parametre', parametre).eq('est_pathologique', true).gte('created_at', debutMois),
            supabase.from('lab_analyses').select('*', { count: 'exact', head: true })
              .eq('parametre', parametre).gte('created_at', debutMois),
          ]);
          return { parametre, positifs: positifsResult.count || 0, total: totalResult.count || 0 };
        })
      );

      const detailsPositivite: any[] = positiviteResults
        .filter(r => r.total > 0)
        .map(r => ({
          parametre: r.parametre,
          positifs: r.positifs,
          total: r.total,
          taux: (r.positifs / r.total) * 100,
        }));

      const tauxPositiviteMoyen = detailsPositivite.length > 0
        ? detailsPositivite.reduce((sum, d) => sum + d.taux, 0) / detailsPositivite.length
        : 0;

      return {
        examens_aujourd_hui: examensAujourdhui || 0,
        examens_semaine: examensSemaine || 0,
        examens_mois: examensMois || 0,
        analyses_terminees: analysesTerminees || 0,
        analyses_en_cours: analysesEnCours || 0,
        analyses_en_attente: analysesEnAttente || 0,
        resultats_pathologiques: resultatsPathologiques || 0,
        delai_moyen_heures: Math.round(delaiMoyen * 10) / 10,
        taux_positivite_moyen: Math.round(tauxPositiviteMoyen * 10) / 10,
        details_positivite: detailsPositivite
      };
    } catch (error) {
      console.error('Erreur récupération KPI:', error);
      return {
        examens_aujourd_hui: 0,
        examens_semaine: 0,
        examens_mois: 0,
        analyses_terminees: 0,
        analyses_en_cours: 0,
        analyses_en_attente: 0,
        resultats_pathologiques: 0,
        delai_moyen_heures: 0,
        taux_positivite_moyen: 0,
        details_positivite: []
      };
    }
  }

  /**
   * Détecte une potentielle épidémie
   */
  static async detecterEpidemie(
    parametre: string,
    periodeJours: number = 7,
    seuilAugmentation: number = 50
  ): Promise<{
    is_epidemic: boolean;
    taux_augmentation: number;
    cas_actuels: number;
    cas_precedents: number;
    message: string;
  }> {
    try {
      const now = new Date();
      const debutPeriode = new Date(now.getTime() - periodeJours * 24 * 60 * 60 * 1000).toISOString();
      const debutPeriodePrecedente = new Date(now.getTime() - periodeJours * 2 * 24 * 60 * 60 * 1000).toISOString();

      // Cas actuels
      const { count: casActuels } = await supabase
        .from('lab_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('parametre', parametre)
        .eq('est_pathologique', true)
        .gte('created_at', debutPeriode);

      // Cas précédents
      const { count: casPrecedents } = await supabase
        .from('lab_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('parametre', parametre)
        .eq('est_pathologique', true)
        .gte('created_at', debutPeriodePrecedente)
        .lt('created_at', debutPeriode);

      const nombreActuels = casActuels || 0;
      const nombrePrecedents = casPrecedents || 0;

      let tauxAugmentation = 0;
      if (nombrePrecedents > 0) {
        tauxAugmentation = ((nombreActuels - nombrePrecedents) / nombrePrecedents) * 100;
      } else if (nombreActuels > 0) {
        tauxAugmentation = 100;
      }

      const isEpidemic = tauxAugmentation >= seuilAugmentation && nombreActuels >= 10;

      // Créer une alerte si épidémie détectée
      if (isEpidemic) {
        await supabase.from('alertes_epidemiques').insert([{
          parametre,
          periode_jours: periodeJours,
          nombre_cas_actuels: nombreActuels,
          nombre_cas_precedents: nombrePrecedents,
          taux_augmentation: tauxAugmentation,
          seuil_alerte: seuilAugmentation,
          statut: 'nouvelle'
        }]);
      }

      return {
        is_epidemic: isEpidemic,
        taux_augmentation: Math.round(tauxAugmentation * 10) / 10,
        cas_actuels: nombreActuels,
        cas_precedents: nombrePrecedents,
        message: isEpidemic 
          ? `Alerte épidémie: +${Math.round(tauxAugmentation)}% de cas de ${parametre}` 
          : `Pas d'alerte épidémique pour ${parametre}`
      };
    } catch (error) {
      console.error('Erreur détection épidémie:', error);
      return {
        is_epidemic: false,
        taux_augmentation: 0,
        cas_actuels: 0,
        cas_precedents: 0,
        message: 'Erreur lors de la détection'
      };
    }
  }

  // ============================================
  // 7. LABORATOIRE → BILAN FINANCIER (Sortie)
  // CA généré vs Coût des réactifs
  // ============================================

  /**
   * Récupère le bilan financier du laboratoire
   */
  static async getBilanFinancier(
    dateDebut?: string,
    dateFin?: string
  ): Promise<{
    chiffre_affaires: number;
    cout_reactifs: number;
    marge_brute: number;
    taux_marge: number;
    nombre_prescriptions: number;
    nombre_analyses: number;
    ca_moyen_par_analyse: number;
    top_examens: Array<{ type: string; nombre: number; ca: number }>;
    consommation_reactifs: Array<{ reactif: string; quantite: number; cout_estime: number }>;
  }> {
    try {
      const debut = dateDebut || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const fin = dateFin || new Date().toISOString();

      // Chiffre d'affaires
      const { data: prescriptionsPaye } = await supabase
        .from('lab_prescriptions')
        .select('montant_facture, type_examen')
        .eq('statut_paiement', 'paye')
        .gte('date_paiement', debut)
        .lte('date_paiement', fin);

      const chiffreAffaires = (prescriptionsPaye || []).reduce((sum, p) => sum + (p.montant_facture || 0), 0);

      // Top examens
      const topExamens: Record<string, { nombre: number; ca: number }> = {};
      (prescriptionsPaye || []).forEach(p => {
        if (!topExamens[p.type_examen]) {
          topExamens[p.type_examen] = { nombre: 0, ca: 0 };
        }
        topExamens[p.type_examen].nombre++;
        topExamens[p.type_examen].ca += p.montant_facture || 0;
      });

      // Consommation de réactifs
      const { data: consommations } = await supabase
        .from('lab_consommation_analyse')
        .select('code_reactif, libelle, quantite_utilisee')
        .gte('date_consommation', debut)
        .lte('date_consommation', fin);

      const consommationParReactif: Record<string, { quantite: number }> = {};
      (consommations || []).forEach(c => {
        if (!consommationParReactif[c.code_reactif]) {
          consommationParReactif[c.code_reactif] = { quantite: 0 };
        }
        consommationParReactif[c.code_reactif].quantite += c.quantite_utilisee;
      });

      // Estimer le coût (simplifié - en réalité, utiliser le prix d'achat)
      const coutReactifs = Object.values(consommationParReactif).reduce((sum, c) => sum + c.quantite * 500, 0); // Prix moyen estimé: 500 XOF par unité

      // Nombre de prescriptions et analyses
      const { count: nombrePrescriptions } = await supabase
        .from('lab_prescriptions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', debut)
        .lte('created_at', fin);

      const { count: nombreAnalyses } = await supabase
        .from('lab_analyses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', debut)
        .lte('created_at', fin);

      const margeBrute = chiffreAffaires - coutReactifs;
      const tauxMarge = chiffreAffaires > 0 ? (margeBrute / chiffreAffaires) * 100 : 0;
      const caMoyenParAnalyse = (nombreAnalyses || 0) > 0 ? chiffreAffaires / (nombreAnalyses || 1) : 0;

      return {
        chiffre_affaires: chiffreAffaires,
        cout_reactifs: coutReactifs,
        marge_brute: margeBrute,
        taux_marge: Math.round(tauxMarge * 10) / 10,
        nombre_prescriptions: nombrePrescriptions || 0,
        nombre_analyses: nombreAnalyses || 0,
        ca_moyen_par_analyse: Math.round(caMoyenParAnalyse),
        top_examens: Object.entries(topExamens)
          .map(([type, data]) => ({ type, ...data }))
          .sort((a, b) => b.ca - a.ca)
          .slice(0, 10),
        consommation_reactifs: Object.entries(consommationParReactif)
          .map(([reactif, data]) => ({ 
            reactif, 
            quantite: data.quantite, 
            cout_estime: data.quantite * 500 
          }))
          .sort((a, b) => b.cout_estime - a.cout_estime)
      };
    } catch (error) {
      console.error('Erreur récupération bilan financier:', error);
      return {
        chiffre_affaires: 0,
        cout_reactifs: 0,
        marge_brute: 0,
        taux_marge: 0,
        nombre_prescriptions: 0,
        nombre_analyses: 0,
        ca_moyen_par_analyse: 0,
        top_examens: [],
        consommation_reactifs: []
      };
    }
  }

  // ============================================
  // HOSPITALISATION (Notifications urgentes)
  // ============================================

  /**
   * Notifie le poste infirmier d'un résultat urgent pour un patient hospitalisé
   */
  static async notifyHospitalisationUrgentResult(
    analyseId: string,
    patientId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Récupérer l'analyse
      const { data: analyse } = await supabase
        .from('lab_analyses')
        .select('*')
        .eq('id', analyseId)
        .single();

      if (!analyse || !analyse.est_pathologique) {
        return { success: false, message: 'Analyse non pathologique' };
      }

      // Vérifier si le patient est hospitalisé
      const { data: hospitalisation } = await supabase
        .from('hospitalisations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('statut', 'en_cours')
        .single();

      if (!hospitalisation) {
        return { success: false, message: 'Patient non hospitalisé' };
      }

      // Créer la notification
      await supabase.from('notifications_hospitalisation').insert([{
        type: 'resultat_labo_urgent',
        patient_id: patientId,
        hospitalisation_id: hospitalisation.id,
        chambre: hospitalisation.chambre,
        analyse_id: analyseId,
        parametre: analyse.parametre,
        valeur: String(analyse.type_resultat === 'quantitatif' ? analyse.valeur_numerique : analyse.valeur_qualitative),
        est_pathologique: true,
        priorite: 'critique',
        message: `Résultat critique: ${analyse.parametre}`,
        statut: 'nouvelle'
      }]);

      return { 
        success: true, 
        message: `Notification envoyée au poste infirmier (chambre ${hospitalisation.chambre})` 
      };
    } catch (error) {
      console.error('Erreur notification hospitalisation:', error);
      return { 
        success: false, 
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      };
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Récupère toutes les alertes actives du laboratoire
   */
  static async getAlertesActives(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lab_alertes')
        .select('*')
        .in('statut', ['nouvelle', 'en_cours'])
        .order('priorite', { ascending: false })
        .order('date_alerte', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération alertes:', error);
      return [];
    }
  }

  /**
   * Récupère le tableau de synthèse des intégrations
   */
  static async getSyntheseIntegrations(): Promise<{
    consultation: { prescriptions_liees: number; resultats_transmis: number };
    maternite: { notifications_actives: number };
    caisse: { prescriptions_payees: number; prescriptions_en_attente: number };
    stock: { alertes_stock: number; commandes_en_cours: number };
    kpi_jour: { examens: number; analyses_terminees: number };
  }> {
    try {
      const { count: prescriptionsLiees } = await supabase
        .from('lab_prescriptions')
        .select('*', { count: 'exact', head: true })
        .not('consultation_id', 'is', null);

      const { count: resultatsTransmis } = await supabase
        .from('lab_resultats_consultation')
        .select('*', { count: 'exact', head: true });

      const { count: notificationsMaternite } = await supabase
        .from('lab_notifications_maternite')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'nouvelle');

      const { count: prescriptionsPayees } = await supabase
        .from('lab_prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('statut_paiement', 'paye');

      const { count: prescriptionsEnAttente } = await supabase
        .from('lab_prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('statut_paiement', 'en_attente');

      const { count: alertesStock } = await supabase
        .from('lab_alertes')
        .select('*', { count: 'exact', head: true })
        .eq('type_alerte', 'stock_critique')
        .eq('statut', 'nouvelle');

      const { count: commandesEnCours } = await supabase
        .from('commandes_achats')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'reactif_laboratoire')
        .in('statut', ['en_attente', 'approuvee', 'en_commande']);

      const debutJour = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

      const { count: examensJour } = await supabase
        .from('lab_prescriptions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', debutJour);

      const { count: analysesTermineesJour } = await supabase
        .from('lab_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'termine')
        .gte('date_validation', debutJour);

      return {
        consultation: {
          prescriptions_liees: prescriptionsLiees || 0,
          resultats_transmis: resultatsTransmis || 0
        },
        maternite: {
          notifications_actives: notificationsMaternite || 0
        },
        caisse: {
          prescriptions_payees: prescriptionsPayees || 0,
          prescriptions_en_attente: prescriptionsEnAttente || 0
        },
        stock: {
          alertes_stock: alertesStock || 0,
          commandes_en_cours: commandesEnCours || 0
        },
        kpi_jour: {
          examens: examensJour || 0,
          analyses_terminees: analysesTermineesJour || 0
        }
      };
    } catch (error) {
      console.error('Erreur récupération synthèse intégrations:', error);
      return {
        consultation: { prescriptions_liees: 0, resultats_transmis: 0 },
        maternite: { notifications_actives: 0 },
        caisse: { prescriptions_payees: 0, prescriptions_en_attente: 0 },
        stock: { alertes_stock: 0, commandes_en_cours: 0 },
        kpi_jour: { examens: 0, analyses_terminees: 0 }
      };
    }
  }
}
