import { supabase } from './supabase';
import { FacturationService } from './facturationService';

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
  lignes?: DispensationLigne[];
  created_at: string;
  updated_at: string;
}

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
          statut
        `)
        .in('consultation_id', consultationIds)
        .in('statut', ['PRESCRIT', 'PARTIELLEMENT_DISPENSE'])
        .order('date_prescription', { ascending: false });

      if (error) throw error;

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
            forme
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
        return {
          id: lot.id,
          numero_lot: lot.numero_lot,
          quantite_disponible: lot.quantite_disponible,
          date_expiration: lot.date_expiration,
          prix_unitaire: lot.prix_achat || 0,
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
   * Crée une nouvelle dispensation
   */
  static async creerDispensation(
    data: DispensationFormData,
    utilisateurId: string
  ): Promise<Dispensation> {
    try {
      // Valider les données
      if (!data.patient_id && data.type_dispensation === 'patient') {
        throw new Error('ID patient requis');
      }
      if (data.lignes.length === 0) {
        throw new Error('Au moins une ligne de dispensation est requise');
      }

      // Vérifier le stock pour chaque ligne
      for (const ligne of data.lignes) {
        const verification = await this.verifierStock(ligne.lot_id, ligne.quantite_delivree);
        if (!verification.disponible) {
          throw new Error(`Stock insuffisant pour ${ligne.medicament_nom}: ${verification.message}`);
        }
      }

      // Créer la dispensation
      const { data: dispensation, error: dispError } = await supabase
        .from('dispensations')
        .insert({
          date_dispensation: new Date().toISOString(),
          patient_id: data.type_dispensation === 'patient' ? data.patient_id : null,
          service_id: data.type_dispensation === 'service' ? data.service_id : null,
          type_dispensation: data.type_dispensation,
          statut: 'en_cours',
          utilisateur_id: utilisateurId,
          prescripteur_id: data.prescripteur_id,
          prescripteur_nom: data.prescripteur_nom,
          service_prescripteur: data.service_prescripteur,
          consultation_id: data.consultation_id,
          prescription_id: data.prescription_id,
          statut_prise_charge: data.statut_prise_charge,
          observations: data.observations,
        })
        .select()
        .single();

      if (dispError) throw dispError;

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

      // Mettre à jour le stock (décrémenter les lots)
      for (const ligne of data.lignes) {
        const { error: stockError } = await supabase.rpc('decrementer_stock_lot', {
          lot_id_param: ligne.lot_id,
          quantite_param: ligne.quantite_delivree,
        });

        if (stockError) {
          // Si la fonction RPC n'existe pas, faire manuellement
          const { data: lot } = await supabase
            .from('lots')
            .select('quantite_disponible')
            .eq('id', ligne.lot_id)
            .single();

          if (lot) {
            await supabase
              .from('lots')
              .update({ quantite_disponible: lot.quantite_disponible - ligne.quantite_delivree })
              .eq('id', ligne.lot_id);
          }
        }
      }

      // Enregistrer le mouvement de stock
      for (const ligne of data.lignes) {
        const { data: lot } = await supabase
          .from('lots')
          .select('quantite_disponible')
          .eq('id', ligne.lot_id)
          .single();

        await supabase.from('mouvements_stock').insert({
          type: 'dispensation',
          medicament_id: ligne.medicament_id,
          lot_id: ligne.lot_id,
          quantite: ligne.quantite_delivree,
          quantite_avant: (lot?.quantite_disponible || 0) + ligne.quantite_delivree,
          quantite_apres: lot?.quantite_disponible || 0,
          motif: `Dispensation ${dispensation.numero_dispensation}`,
          utilisateur_id: utilisateurId,
          date_mouvement: new Date().toISOString(),
          magasin_source: 'detail',
          magasin_destination: data.type_dispensation === 'patient' ? 'patient' : 'service',
          reference_document: dispensation.numero_dispensation,
        });
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

      // Création automatique du ticket de facturation vers le module Caisse
      // Uniquement pour les dispensations patient (pas les services internes)
      if (data.type_dispensation === 'patient' && data.patient_id) {
        const montantTotal = data.lignes.reduce((sum, ligne) => sum + ligne.prix_total, 0);
        
        if (montantTotal > 0) {
          try {
            // Construire la description des médicaments
            const descriptionMedicaments = data.lignes
              .map(l => `${l.medicament_nom} (x${l.quantite_delivree})`)
              .join(', ');

            await FacturationService.creerTicketFacturation(
              data.patient_id,
              'pharmacie', // serviceOrigine
              dispensation.id, // referenceOrigine
              `Dispensation: ${descriptionMedicaments}`, // typeActe
              montantTotal // montant
            );
          } catch (ticketError) {
            // Log mais ne pas bloquer la dispensation si le ticket échoue
            console.error('Erreur création ticket facturation dispensation:', ticketError);
          }
        }
      }

      // Récupérer la dispensation complète avec ses lignes
      return await this.getDispensationById(dispensation.id);
    } catch (error) {
      console.error('Erreur lors de la création de la dispensation:', error);
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

