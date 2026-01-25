import { supabase } from './supabase';
import { FacturationService } from './facturationService';
import { 
  TransactionManager, 
  withTransaction, 
  validateData, 
  verifyEntityExists, 
  isValidUUID 
} from './transactionUtils';
import { logger } from '../utils/logger';

// Types pour les dispensations
export interface DispensationLigne {
  id?: string;
  medicament_id: string;
  medicament_nom: string;
  medicament_code?: string;
  dosage?: string;
  forme?: string;
  quantite_prescite: number;
  quantite_delivree: number;
  lot_id: string;
  numero_lot: string;
  date_expiration: string;
  statut: 'delivre' | 'partiellement_delivre' | 'substitution' | 'rupture';
  medicament_substitue_id?: string;
  medicament_substitue_nom?: string;
  prix_unitaire: number;
  prix_total: number;
  observations?: string;
  prescription_line_id?: string;
}

export interface DispensationFormData {
  patient_id: string;
  patient_nom: string;
  patient_prenoms?: string;
  statut_prise_charge?: string;
  assurance_id?: string;
  assurance_nom?: string;
  taux_couverture?: number; // pourcentage (0..100)
  plafond_assurance?: number; // XOF/FCFA (optionnel)
  reference_prise_en_charge?: string;
  prescripteur_id?: string;
  prescripteur_nom: string;
  service_prescripteur?: string;
  consultation_id?: string;
  prescription_id?: string;
  type_dispensation: 'patient' | 'service';
  service_id?: string;
  service_nom?: string;
  lignes: DispensationLigne[];
  observations?: string;
}

export interface Dispensation {
  id: string;
  numero_dispensation: string;
  date_dispensation: string;
  patient_id?: string;
  patient_nom?: string;
  service_id?: string;
  service_nom?: string;
  type_dispensation: 'patient' | 'service';
  statut: 'en_cours' | 'terminee' | 'annulee' | 'validee';
  prescripteur_id?: string;
  prescripteur_nom?: string;
  service_prescripteur?: string;
  consultation_id?: string;
  prescription_id?: string;
  utilisateur_id: string;
  observations?: string;
  assurance_id?: string;
  taux_couverture?: number;
  montant_total?: number;
  montant_assurance?: number;
  montant_patient?: number;
  reference_prise_en_charge?: string;
  lignes?: DispensationLigne[];
  created_at: string;
  updated_at: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
// Arrondi XOF/FCFA (sans centimes)
const roundXof = (value: number) => Math.round(value);

export interface LotDisponible {
  id: string;
  numero_lot: string;
  quantite_disponible: number;
  date_expiration: string;
  prix_unitaire: number;
  medicament_id: string;
  medicament_nom: string;
  medicament_code: string;
  dosage: string;
  forme: string;
}

export interface PrescriptionActive {
  id: string;
  numero_prescription: string;
  date_prescription: string;
  consultation_id: string;
  prescripteur_nom: string;
  service_prescripteur?: string;
  facture_id?: string | null;
  facture_statut?: string | null;
  montant_restant?: number | null;
  paiement_requis?: boolean;
  peut_delivrer?: boolean;
  lignes: {
    id: string;
    medicament_id?: string;
    nom_medicament: string;
    posologie: string;
    quantite_totale: number;
    quantite_dispensee: number;
    quantite_restante: number;
    dosage?: string;
    forme?: string;
  }[];
}

// Service de dispensation
export class DispensationService {
  /**
   * Récupère les prescriptions actives d'un patient
   */
  static async getPrescriptionsActives(patientId: string): Promise<PrescriptionActive[]> {
    try {
      // Récupérer les consultations du patient d'abord
      const { data: consultations, error: consultationsError } = await supabase
        .from('consultations')
        .select('id')
        .eq('patient_id', patientId);

      if (consultationsError) throw consultationsError;
      if (!consultations || consultations.length === 0) {
        return [];
      }

      const consultationIds = consultations.map(c => c.id);

      // Récupérer les prescriptions pour ces consultations
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select(`
          id,
          numero_prescription,
          date_prescription,
          consultation_id,
          created_by,
          statut,
          facture_id
        `)
        .in('consultation_id', consultationIds)
        .in('statut', ['PRESCRIT', 'PARTIELLEMENT_DISPENSE'])
        .order('date_prescription', { ascending: false });

      if (error) throw error;

      // Charger les factures associées (si présentes) pour déterminer le statut de paiement
      const factureIds = Array.from(
        new Set((prescriptions || []).map((p: any) => p.facture_id).filter((id: any): id is string => Boolean(id)))
      );
      const facturesMap = new Map<string, { statut: string | null; montant_restant: number | null }>();
      if (factureIds.length > 0) {
        const { data: facturesData, error: facturesError } = await supabase
          .from('factures')
          .select('id, statut, montant_restant')
          .in('id', factureIds);
        if (!facturesError) {
          (facturesData || []).forEach((f: any) =>
            facturesMap.set(f.id, { statut: f.statut ?? null, montant_restant: f.montant_restant ?? null })
          );
        }
      }

      // Récupérer les lignes de prescription
      const prescriptionsWithLines: PrescriptionActive[] = [];

      for (const presc of prescriptions || []) {
        const { data: lines, error: linesError } = await supabase
          .from('prescription_lines')
          .select('*')
          .eq('prescription_id', presc.id)
          .order('ordre', { ascending: true });

        if (linesError) continue;

        const lignesAvecRestantes = (lines || []).map(line => ({
          id: line.id,
          medicament_id: line.medicament_id,
          nom_medicament: line.nom_medicament,
          posologie: line.posologie,
          quantite_totale: line.quantite_totale,
          quantite_dispensee: line.quantite_dispensee || 0,
          quantite_restante: line.quantite_totale - (line.quantite_dispensee || 0),
          dosage: line.mode_administration,
          forme: line.mode_administration,
        })).filter(l => l.quantite_restante > 0);

        if (lignesAvecRestantes.length > 0) {
          // Récupérer les informations du prescripteur
          const { data: consultation } = await supabase
            .from('consultations')
            .select('created_by')
            .eq('id', presc.consultation_id)
            .single();

          prescriptionsWithLines.push({
            id: presc.id,
            numero_prescription: presc.numero_prescription,
            date_prescription: presc.date_prescription,
            consultation_id: presc.consultation_id,
            prescripteur_nom: 'Dr. ' + (presc.created_by || 'Inconnu'),
            facture_id: presc.facture_id || null,
            facture_statut: presc.facture_id ? (facturesMap.get(presc.facture_id)?.statut ?? null) : null,
            montant_restant: presc.facture_id ? (facturesMap.get(presc.facture_id)?.montant_restant ?? null) : null,
            paiement_requis: Boolean(presc.facture_id),
            peut_delivrer: presc.facture_id
              ? (facturesMap.get(presc.facture_id)?.statut === 'payee' &&
                Number(facturesMap.get(presc.facture_id)?.montant_restant ?? 1) <= 0)
              : true,
            lignes: lignesAvecRestantes,
          });
        }
      }

      return prescriptionsWithLines;
    } catch (error) {
      console.error('Erreur lors de la récupération des prescriptions:', error);
      throw error;
    }
  }

  /**
   * Récupère les lots disponibles pour un médicament dans le magasin détail
   */
  static async getLotsDisponibles(medicamentId: string): Promise<LotDisponible[]> {
    try {
      const { data: lots, error } = await supabase
        .from('lots')
        .select(`
          id,
          numero_lot,
          quantite_disponible,
          date_expiration,
          prix_achat,
          medicament_id,
          medicaments!inner(
            id,
            nom,
            code,
            dosage,
            forme,
            prix_unitaire,
            prix_unitaire_detail
          )
        `)
        .eq('medicament_id', medicamentId)
        .eq('magasin', 'detail')
        .gt('quantite_disponible', 0)
        .eq('statut', 'actif')
        .order('date_expiration', { ascending: true }); // FEFO (First Expired First Out)

      if (error) throw error;

      return (lots || []).map(lot => {
        const medicament = Array.isArray(lot.medicaments) && lot.medicaments.length > 0 
          ? lot.medicaments[0] 
          : (lot.medicaments as any);
        // Utiliser le prix_unitaire_detail du médicament pour la dispensation (pharmacie)
        // Si non défini, utiliser prix_unitaire comme fallback
        const prixVente = medicament?.prix_unitaire_detail || medicament?.prix_unitaire || 0;
        return {
          id: lot.id,
          numero_lot: lot.numero_lot,
          quantite_disponible: lot.quantite_disponible,
          date_expiration: lot.date_expiration,
          prix_unitaire: prixVente, // Prix de vente au détail (pharmacie)
          medicament_id: lot.medicament_id,
          medicament_nom: medicament?.nom || '',
          medicament_code: medicament?.code || '',
          dosage: medicament?.dosage || '',
          forme: medicament?.forme || '',
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des lots:', error);
      throw error;
    }
  }

  /**
   * Vérifie la disponibilité du stock pour une dispensation
   */
  static async verifierStock(lotId: string, quantiteDemandee: number): Promise<{
    disponible: boolean;
    quantiteDisponible: number;
    message?: string;
  }> {
    try {
      const { data: lot, error } = await supabase
        .from('lots')
        .select('quantite_disponible, date_expiration, numero_lot')
        .eq('id', lotId)
        .single();

      if (error) throw error;
      if (!lot) {
        return { disponible: false, quantiteDisponible: 0, message: 'Lot introuvable' };
      }

      // Vérifier la date d'expiration
      const dateExpiration = new Date(lot.date_expiration);
      const aujourdhui = new Date();
      const joursAvantExpiration = Math.floor((dateExpiration.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24));

      if (joursAvantExpiration < 0) {
        return {
          disponible: false,
          quantiteDisponible: lot.quantite_disponible,
          message: `Le lot ${lot.numero_lot} est expiré`,
        };
      }

      if (joursAvantExpiration < 30) {
        // Alerte si expiration dans moins de 30 jours
        console.warn(`Alerte: Le lot ${lot.numero_lot} expire dans ${joursAvantExpiration} jours`);
      }

      if (lot.quantite_disponible < quantiteDemandee) {
        return {
          disponible: false,
          quantiteDisponible: lot.quantite_disponible,
          message: `Stock insuffisant. Disponible: ${lot.quantite_disponible}, Demandé: ${quantiteDemandee}`,
        };
      }

      return {
        disponible: true,
        quantiteDisponible: lot.quantite_disponible,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du stock:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle dispensation avec transaction et rollback
   */
  static async creerDispensation(
    data: DispensationFormData,
    utilisateurId: string,
    clinicId?: string
  ): Promise<Dispensation> {
    // Validation stricte des entrées
    const validation = validateData(
      { 
        utilisateurId, 
        type_dispensation: data.type_dispensation,
        lignes: data.lignes,
      },
      ['utilisateurId', 'type_dispensation'],
      {
        utilisateurId: isValidUUID,
      }
    );

    if (!validation.valid) {
      logger.warn('Validation échouée pour creerDispensation', { errors: validation.errors });
      throw new Error(validation.errors.join(', '));
    }

    if (data.type_dispensation === 'patient') {
      if (!data.patient_id || !isValidUUID(data.patient_id)) {
        throw new Error('ID patient valide requis pour une dispensation patient');
      }
      // Vérifier que le patient existe
      const patientCheck = await verifyEntityExists('patients', data.patient_id, clinicId);
      if (!patientCheck.exists) {
        throw new Error('Patient introuvable ou accès non autorisé');
      }
    }

    if (!data.lignes || data.lignes.length === 0) {
      throw new Error('Au moins une ligne de dispensation est requise');
    }

    // Vérifier que la prescription existe si fournie
    if (data.prescription_id) {
      const prescCheck = await verifyEntityExists('prescriptions', data.prescription_id, clinicId);
      if (!prescCheck.exists) {
        throw new Error('Prescription introuvable');
      }
      // Vérifier que la prescription est active
      if (prescCheck.data?.statut === 'ANNULE') {
        throw new Error('Cette prescription a été annulée');
      }

      // Payment gate (Pharmacie): si une facture est liée, la délivrance est autorisée uniquement si payée
      try {
        const { data: prescRow, error: prescRowError } = await supabase
          .from('prescriptions')
          .select('id, facture_id')
          .eq('id', data.prescription_id)
          .single();

        if (prescRowError) throw prescRowError;

        if (prescRow?.facture_id) {
          const { data: facture, error: factureError } = await supabase
            .from('factures')
            .select('id, statut, montant_restant')
            .eq('id', prescRow.facture_id)
            .single();

          if (factureError) throw factureError;

          const statut = facture?.statut;
          const restant = Number(facture?.montant_restant ?? 0);

          if (statut !== 'payee' || restant > 0) {
            throw new Error(
              `Paiement requis: la facture liée à cette ordonnance est en attente (reste ${restant.toLocaleString('fr-FR')} XOF).`
            );
          }
        }
      } catch (e: any) {
        // Bloquer par sécurité si on ne peut pas vérifier le paiement
        if (e instanceof Error) throw e;
        throw new Error('Paiement requis: impossible de vérifier le statut de la facture liée à cette ordonnance.');
      }
    }

    // Vérifier le stock pour chaque ligne (en parallèle)
    const stockChecks = await Promise.all(
      data.lignes.map(async (ligne) => {
        const verification = await this.verifierStock(ligne.lot_id, ligne.quantite_delivree);
        return { ligne, verification };
      })
    );

    const stockErrors = stockChecks
      .filter((check) => !check.verification.disponible)
      .map((check) => `Stock insuffisant pour ${check.ligne.medicament_nom}: ${check.verification.message}`);

    if (stockErrors.length > 0) {
      throw new Error(stockErrors.join('; '));
    }

    const traceId = `DISP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    logger.info('Démarrage création dispensation', { 
      traceId, 
      patientId: data.patient_id, 
      lignesCount: data.lignes.length 
    });

    try {
      // Créer la dispensation
      const { data: dispensation, error: dispError } = await supabase
        .from('dispensations')
        .insert({
          date_dispensation: new Date().toISOString(),
          patient_id: data.type_dispensation === 'patient' ? data.patient_id : null,
          patient_nom: data.type_dispensation === 'patient' ? data.patient_nom : null,
          patient_prenoms: data.type_dispensation === 'patient' ? data.patient_prenoms : null,
          service_id: data.type_dispensation === 'service' ? data.service_id : null,
          service_nom: data.type_dispensation === 'service' ? data.service_nom : null,
          type_dispensation: data.type_dispensation,
          statut: 'en_cours',
          utilisateur_id: utilisateurId,
          prescripteur_id: data.prescripteur_id,
          prescripteur_nom: data.prescripteur_nom,
          service_prescripteur: data.service_prescripteur,
          consultation_id: data.consultation_id,
          prescription_id: data.prescription_id,
          statut_prise_charge: data.statut_prise_charge,
          assurance_id: data.assurance_id || null,
          taux_couverture: data.assurance_id ? clamp(Number(data.taux_couverture || 0), 0, 100) : null,
          reference_prise_en_charge: data.reference_prise_en_charge || null,
          observations: data.observations,
          clinic_id: clinicId,
        })
        .select()
        .single();

      if (dispError) {
        logger.error('Échec création dispensation', { traceId, error: dispError });
        throw dispError;
      }

      logger.info('Dispensation créée', { traceId, dispensationId: dispensation.id });

      // Créer les lignes de dispensation
      const lignesAInserer = data.lignes.map(ligne => ({
        dispensation_id: dispensation.id,
        medicament_id: ligne.medicament_id,
        lot_id: ligne.lot_id,
        quantite: ligne.quantite_delivree,
        quantite_prescite: ligne.quantite_prescite,
        quantite_delivree: ligne.quantite_delivree,
        numero_lot: ligne.numero_lot,
        date_expiration: ligne.date_expiration,
        statut: ligne.statut,
        medicament_substitue_id: ligne.medicament_substitue_id,
        prix_unitaire: ligne.prix_unitaire,
        prix_total: ligne.prix_total,
        observations: ligne.observations,
        prescription_line_id: ligne.prescription_line_id,
      }));

      const { error: lignesError } = await supabase
        .from('dispensation_lignes')
        .insert(lignesAInserer);

      if (lignesError) throw lignesError;

      // Mettre à jour le stock (décrémenter les lots) et enregistrer les mouvements
      for (const ligne of data.lignes) {
        // Récupérer le lot AVANT la décrémentation pour avoir la quantité initiale
        const { data: lotAvant, error: lotAvantError } = await supabase
          .from('lots')
          .select('quantite_disponible, magasin')
          .eq('id', ligne.lot_id)
          .single();

        if (lotAvantError) throw lotAvantError;

        // Vérifier que le lot est bien dans le magasin détail
        if (lotAvant.magasin !== 'detail') {
          throw new Error(`Le lot ${ligne.lot_id} n'est pas dans le magasin détail`);
        }

        const quantiteAvant = lotAvant.quantite_disponible;
        const quantiteApres = quantiteAvant - ligne.quantite_delivree;

        // Vérifier que le stock est suffisant
        if (quantiteAvant < ligne.quantite_delivree) {
          throw new Error(`Stock insuffisant pour le médicament. Disponible: ${quantiteAvant}, Demandé: ${ligne.quantite_delivree}`);
        }

        // Décrémenter le stock via la fonction RPC (avec fallback manuel)
        const { error: stockError } = await supabase.rpc('decrementer_stock_lot', {
          lot_id_param: ligne.lot_id,
          quantite_param: ligne.quantite_delivree,
        });

        if (stockError) {
          // Si la fonction RPC n'existe pas ou échoue, faire manuellement
          const { error: updateError } = await supabase
            .from('lots')
            .update({ 
              quantite_disponible: quantiteApres,
              updated_at: new Date().toISOString()
            })
            .eq('id', ligne.lot_id);

          if (updateError) throw updateError;

          // Mettre à jour le statut si le stock est épuisé
          if (quantiteApres === 0) {
            await supabase
              .from('lots')
              .update({ statut: 'epuise' })
              .eq('id', ligne.lot_id);
          }
        }

        // Enregistrer le mouvement de stock avec les valeurs correctes
        const { error: mouvementError } = await supabase.from('mouvements_stock').insert({
          type: 'dispensation',
          medicament_id: ligne.medicament_id,
          lot_id: ligne.lot_id,
          quantite: ligne.quantite_delivree,
          quantite_avant: quantiteAvant,
          quantite_apres: quantiteApres,
          motif: `Dispensation ${dispensation.numero_dispensation} - ${data.type_dispensation === 'patient' ? 'Patient' : 'Service'}`,
          utilisateur_id: utilisateurId,
          date_mouvement: new Date().toISOString(),
          magasin_source: 'detail',
          magasin_destination: data.type_dispensation === 'patient' ? 'patient' : 'service',
          reference_document: dispensation.numero_dispensation,
        });

        if (mouvementError) {
          logger.error('Erreur enregistrement mouvement stock', { 
            lotId: ligne.lot_id, 
            error: mouvementError 
          });
          throw mouvementError;
        }
      }

      // Mettre à jour les quantités dispensées dans les prescriptions
      for (const ligne of data.lignes) {
        if (ligne.prescription_line_id) {
          const { data: prescLine } = await supabase
            .from('prescription_lines')
            .select('quantite_dispensee')
            .eq('id', ligne.prescription_line_id)
            .single();

          if (prescLine) {
            await supabase
              .from('prescription_lines')
              .update({
                quantite_dispensee: (prescLine.quantite_dispensee || 0) + ligne.quantite_delivree,
              })
              .eq('id', ligne.prescription_line_id);
          }
        }
      }

      // Enregistrer dans l'audit
      await supabase.from('dispensation_audit').insert({
        dispensation_id: dispensation.id,
        action: 'creation',
        utilisateur_id: utilisateurId,
        details: { type: 'creation', lignes: data.lignes.length },
      });

      // ======================================================
      // Tiers-payant (Phase 3): création de 2 tickets
      // - Ticket patient (reste à charge)
      // - Ticket assurance (créance assureur)
      // ======================================================
      if (data.type_dispensation === 'patient' && data.patient_id) {
        const montantTotalRaw = data.lignes.reduce((sum, ligne) => sum + (ligne.prix_total || 0), 0);
        const montantTotal = roundXof(Math.max(0, montantTotalRaw));

        const taux = data.assurance_id ? clamp(Number(data.taux_couverture || 0), 0, 100) : 0;
        const plafond = data.assurance_id ? Number(data.plafond_assurance || 0) : 0;

        let montantAssurance = 0;
        if (data.assurance_id && taux > 0) {
          montantAssurance = montantTotal * (taux / 100);
          if (plafond && plafond > 0) montantAssurance = Math.min(montantAssurance, plafond);
          montantAssurance = roundXof(Math.max(0, montantAssurance));
        }
        const montantPatient = roundXof(Math.max(0, montantTotal - montantAssurance));

        // Persist montants sur la dispensation (best-effort)
        try {
          await supabase
            .from('dispensations')
            .update({
              montant_total: montantTotal,
              montant_assurance: montantAssurance,
              montant_patient: montantPatient,
              updated_at: new Date().toISOString(),
            })
            .eq('id', dispensation.id);
        } catch (e) {
          console.warn('Mise à jour montants dispensation (non bloquant):', e);
        }

        const descriptionMedicaments = data.lignes
          .map((l) => `${l.medicament_nom} (x${l.quantite_delivree})`)
          .join(', ');

        // Ticket patient
        if (montantPatient > 0) {
          try {
            await FacturationService.creerTicketFacturation(
              data.patient_id,
              'pharmacie',
              dispensation.id,
              `Dispensation (Patient): ${descriptionMedicaments}`,
              montantPatient,
              {
                payeur_type: 'patient',
                payeur_id: data.patient_id,
                payeur_nom: `${data.patient_nom || ''} ${data.patient_prenoms || ''}`.trim() || null,
              }
            );
          } catch (ticketError) {
            console.error('Erreur création ticket patient (dispensation):', ticketError);
          }
        }

        // Ticket assurance
        if (data.assurance_id && montantAssurance > 0) {
          try {
            await FacturationService.creerTicketFacturation(
              data.patient_id,
              'pharmacie',
              dispensation.id,
              `Dispensation (Assurance): ${descriptionMedicaments}`,
              montantAssurance,
              {
                payeur_type: 'assurance',
                payeur_id: data.assurance_id,
                payeur_nom: data.assurance_nom || null,
              }
            );
          } catch (ticketError) {
            console.error('Erreur création ticket assurance (dispensation):', ticketError);
          }
        }
      }

      // Récupérer la dispensation complète avec ses lignes
      logger.info('Dispensation terminée avec succès', { 
        traceId, 
        dispensationId: dispensation.id,
        montantTotal: data.lignes.reduce((sum, l) => sum + (l.prix_total || 0), 0),
      });

      return await this.getDispensationById(dispensation.id);
    } catch (error) {
      logger.error('Erreur lors de la création de la dispensation', { 
        patientId: data.patient_id,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
      throw error;
    }
  }

  /**
   * Valide une dispensation
   */
  static async validerDispensation(
    dispensationId: string,
    utilisateurId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('dispensations')
        .update({
          statut: 'validee',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dispensationId);

      if (error) throw error;

      // Enregistrer dans l'audit
      await supabase.from('dispensation_audit').insert({
        dispensation_id: dispensationId,
        action: 'validation',
        utilisateur_id: utilisateurId,
        details: { type: 'validation' },
      });
    } catch (error) {
      console.error('Erreur lors de la validation de la dispensation:', error);
      throw error;
    }
  }

  /**
   * Récupère une dispensation par son ID
   */
  static async getDispensationById(dispensationId: string): Promise<Dispensation> {
    try {
      const { data: dispensation, error } = await supabase
        .from('dispensations')
        .select('*')
        .eq('id', dispensationId)
        .single();

      if (error) throw error;

      const { data: lignes } = await supabase
        .from('dispensation_lignes')
        .select('*')
        .eq('dispensation_id', dispensationId);

      return {
        ...dispensation,
        lignes: lignes || [],
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la dispensation:', error);
      throw error;
    }
  }

  /**
   * Recherche un patient par ID, nom ou prénom
   */
  static async rechercherPatient(searchTerm: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, identifiant, nom, prenom, date_naissance, sexe')
        .or(`identifiant.ilike.%${searchTerm}%,nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la recherche de patient:', error);
      throw error;
    }
  }
}

