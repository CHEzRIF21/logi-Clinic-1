import { supabase, MedicamentSupabase, LotSupabase, MouvementStockSupabase, TransfertSupabase, TransfertLigneSupabase, DispensationSupabase, DispensationLigneSupabase, AlerteStockSupabase, PerteRetourSupabase } from './stockSupabase';

// Service principal pour la gestion du stock
export class StockService {
  
  // 1. RÉCEPTION MÉDICAMENTS → MAGASIN GROS (enregistrement + stockage)
  static async receptionMedicament(data: {
    medicament_id: string;
    numero_lot: string;
    quantite_initiale: number;
    date_reception: string;
    date_expiration: string;
    prix_achat: number;
    fournisseur: string;
    utilisateur_id: string;
    reference_document?: string;
    observations?: string;
  }) {
    try {
      // Créer le lot dans le magasin gros
      const { data: lot, error: lotError } = await supabase
        .from('lots')
        .insert({
          medicament_id: data.medicament_id,
          numero_lot: data.numero_lot,
          quantite_initiale: data.quantite_initiale,
          quantite_disponible: data.quantite_initiale,
          date_reception: data.date_reception,
          date_expiration: data.date_expiration,
          prix_achat: data.prix_achat,
          fournisseur: data.fournisseur,
          statut: 'actif',
          magasin: 'gros'
        })
        .select()
        .single();

      if (lotError) throw lotError;

      // Enregistrer le mouvement de réception
      const { error: mouvementError } = await supabase
        .from('mouvements_stock')
        .insert({
          type: 'reception',
          medicament_id: data.medicament_id,
          lot_id: lot.id,
          quantite: data.quantite_initiale,
          quantite_avant: 0,
          quantite_apres: data.quantite_initiale,
          motif: 'Réception fournisseur',
          utilisateur_id: data.utilisateur_id,
          date_mouvement: data.date_reception,
          magasin_source: 'externe',
          magasin_destination: 'gros',
          reference_document: data.reference_document,
          observations: data.observations
        });

      if (mouvementError) throw mouvementError;

      // Vérifier les alertes
      await this.verifierAlertes(data.medicament_id);

      return { success: true, lot };
    } catch (error) {
      console.error('Erreur lors de la réception:', error);
      throw error;
    }
  }

  // 2. DEMANDE INTERNE → RESPONSABLE GROS
  static async creerDemandeTransfert(data: {
    medicament_id: string;
    lot_id: string;
    quantite_demandee: number;
    utilisateur_demandeur_id: string;
    motif: string;
    observations?: string;
  }) {
    try {
      // Vérifier la disponibilité du stock
      const { data: lot, error: lotError } = await supabase
        .from('lots')
        .select('*')
        .eq('id', data.lot_id)
        .eq('magasin', 'gros')
        .single();

      if (lotError) throw lotError;
      if (lot.quantite_disponible < data.quantite_demandee) {
        throw new Error('Stock insuffisant dans le magasin gros');
      }

      // Créer le transfert
      const numero_transfert = `TRF-${Date.now()}`;
      const { data: transfert, error: transfertError } = await supabase
        .from('transferts')
        .insert({
          numero_transfert,
          date_transfert: new Date().toISOString(),
          magasin_source: 'gros',
          magasin_destination: 'detail',
          statut: 'en_cours',
          utilisateur_source_id: data.utilisateur_demandeur_id,
          observations: data.observations
        })
        .select()
        .single();

      if (transfertError) throw transfertError;

      // Créer la ligne de transfert
      const { error: ligneError } = await supabase
        .from('transferts_lignes')
        .insert({
          transfert_id: transfert.id,
          medicament_id: data.medicament_id,
          lot_id: data.lot_id,
          quantite: data.quantite_demandee
        });

      if (ligneError) throw ligneError;

      return { success: true, transfert };
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      throw error;
    }
  }

  // 3. VALIDATION + TRANSFERT → Mise à jour Magasin Gros (-) et Magasin Détail (+)
  static async validerTransfert(transfert_id: string, utilisateur_validateur_id: string) {
    try {
      // Récupérer le transfert et ses lignes
      const { data: transfert, error: transfertError } = await supabase
        .from('transferts')
        .select(`
          *,
          transferts_lignes (
            *,
            lots (
              *
            )
          )
        `)
        .eq('id', transfert_id)
        .single();

      if (transfertError) throw transfertError;
      if (transfert.statut !== 'en_cours') {
        throw new Error('Le transfert ne peut pas être validé');
      }

      // Traiter chaque ligne de transfert
      for (const ligne of transfert.transferts_lignes) {
        const lotGros = ligne.lots;
        
        // Vérifier la disponibilité
        if (lotGros.quantite_disponible < ligne.quantite) {
          throw new Error(`Stock insuffisant pour le lot ${lotGros.numero_lot}`);
        }

        // Décrémenter le stock du magasin gros
        const { error: updateGrosError } = await supabase
          .from('lots')
          .update({
            quantite_disponible: lotGros.quantite_disponible - ligne.quantite
          })
          .eq('id', lotGros.id);

        if (updateGrosError) throw updateGrosError;

        // Créer ou mettre à jour le lot dans le magasin détail
        const { data: lotDetail, error: lotDetailError } = await supabase
          .from('lots')
          .select('*')
          .eq('medicament_id', ligne.medicament_id)
          .eq('numero_lot', lotGros.numero_lot)
          .eq('magasin', 'detail')
          .single();

        if (lotDetailError && lotDetailError.code !== 'PGRST116') {
          throw lotDetailError;
        }

        if (lotDetail) {
          // Mettre à jour le lot existant
          const { error: updateDetailError } = await supabase
            .from('lots')
            .update({
              quantite_disponible: lotDetail.quantite_disponible + ligne.quantite
            })
            .eq('id', lotDetail.id);

          if (updateDetailError) throw updateDetailError;
        } else {
          // Créer un nouveau lot dans le magasin détail
          const { error: createDetailError } = await supabase
            .from('lots')
            .insert({
              medicament_id: ligne.medicament_id,
              numero_lot: lotGros.numero_lot,
              quantite_initiale: ligne.quantite,
              quantite_disponible: ligne.quantite,
              date_reception: lotGros.date_reception,
              date_expiration: lotGros.date_expiration,
              prix_achat: lotGros.prix_achat,
              fournisseur: lotGros.fournisseur,
              statut: 'actif',
              magasin: 'detail'
            });

          if (createDetailError) throw createDetailError;
        }

        // Enregistrer le mouvement de transfert
        const { error: mouvementError } = await supabase
          .from('mouvements_stock')
          .insert({
            type: 'transfert',
            medicament_id: ligne.medicament_id,
            lot_id: lotGros.id,
            quantite: ligne.quantite,
            quantite_avant: lotGros.quantite_disponible,
            quantite_apres: lotGros.quantite_disponible - ligne.quantite,
            motif: 'Transfert interne Gros → Détail',
            utilisateur_id: utilisateur_validateur_id,
            date_mouvement: new Date().toISOString(),
            magasin_source: 'gros',
            magasin_destination: 'detail',
            reference_document: transfert.numero_transfert
          });

        if (mouvementError) throw mouvementError;
      }

      // Marquer le transfert comme validé
      const { error: updateTransfertError } = await supabase
        .from('transferts')
        .update({
          statut: 'valide',
          date_validation: new Date().toISOString(),
          utilisateur_destination_id: utilisateur_validateur_id
        })
        .eq('id', transfert_id);

      if (updateTransfertError) throw updateTransfertError;

      return { success: true, transfert };
    } catch (error) {
      console.error('Erreur lors de la validation du transfert:', error);
      throw error;
    }
  }

  // 4. DISPENSATION AUX PATIENTS → Stock Magasin Détail décrémenté
  static async dispensationPatient(data: {
    patient_id?: string;
    service_id?: string;
    type_dispensation: 'patient' | 'service';
    lignes: Array<{
      medicament_id: string;
      lot_id: string;
      quantite: number;
      prix_unitaire: number;
    }>;
    utilisateur_id: string;
    prescription_id?: string;
    observations?: string;
  }) {
    try {
      // Créer la dispensation
      const numero_dispensation = `DISP-${Date.now()}`;
      const { data: dispensation, error: dispensationError } = await supabase
        .from('dispensations')
        .insert({
          numero_dispensation,
          date_dispensation: new Date().toISOString(),
          patient_id: data.patient_id,
          service_id: data.service_id,
          type_dispensation: data.type_dispensation,
          statut: 'en_cours',
          utilisateur_id: data.utilisateur_id,
          prescription_id: data.prescription_id,
          observations: data.observations
        })
        .select()
        .single();

      if (dispensationError) throw dispensationError;

      // Traiter chaque ligne de dispensation
      for (const ligne of data.lignes) {
        // Vérifier la disponibilité du stock
        const { data: lot, error: lotError } = await supabase
          .from('lots')
          .select('*')
          .eq('id', ligne.lot_id)
          .eq('magasin', 'detail')
          .single();

        if (lotError) throw lotError;
        if (lot.quantite_disponible < ligne.quantite) {
          throw new Error(`Stock insuffisant pour le lot ${lot.numero_lot}`);
        }

        // Décrémenter le stock
        const { error: updateStockError } = await supabase
          .from('lots')
          .update({
            quantite_disponible: lot.quantite_disponible - ligne.quantite
          })
          .eq('id', lot.id);

        if (updateStockError) throw updateStockError;

        // Créer la ligne de dispensation
        const { error: ligneError } = await supabase
          .from('dispensations_lignes')
          .insert({
            dispensation_id: dispensation.id,
            medicament_id: ligne.medicament_id,
            lot_id: ligne.lot_id,
            quantite: ligne.quantite,
            prix_unitaire: ligne.prix_unitaire,
            prix_total: ligne.quantite * ligne.prix_unitaire
          });

        if (ligneError) throw ligneError;

        // Enregistrer le mouvement de dispensation
        const { error: mouvementError } = await supabase
          .from('mouvements_stock')
          .insert({
            type: 'dispensation',
            medicament_id: ligne.medicament_id,
            lot_id: ligne.lot_id,
            quantite: ligne.quantite,
            quantite_avant: lot.quantite_disponible,
            quantite_apres: lot.quantite_disponible - ligne.quantite,
            motif: `Dispensation ${data.type_dispensation}`,
            utilisateur_id: data.utilisateur_id,
            date_mouvement: new Date().toISOString(),
            magasin_source: 'detail',
            magasin_destination: data.type_dispensation === 'patient' ? 'patient' : 'service',
            reference_document: numero_dispensation
          });

        if (mouvementError) throw mouvementError;
      }

      // Marquer la dispensation comme terminée
      const { error: updateDispensationError } = await supabase
        .from('dispensations')
        .update({ statut: 'terminee' })
        .eq('id', dispensation.id);

      if (updateDispensationError) throw updateDispensationError;

      return { success: true, dispensation };
    } catch (error) {
      console.error('Erreur lors de la dispensation:', error);
      throw error;
    }
  }

  // 5. RETOURS / PERTES → Mise à jour stocks avec justification
  static async enregistrerPerteRetour(data: {
    type: 'perte' | 'retour';
    medicament_id: string;
    lot_id: string;
    quantite: number;
    motif: string;
    utilisateur_id: string;
    observations?: string;
    reference_document?: string;
  }) {
    try {
      // Récupérer le lot
      const { data: lot, error: lotError } = await supabase
        .from('lots')
        .select('*')
        .eq('id', data.lot_id)
        .single();

      if (lotError) throw lotError;

      // Vérifier la disponibilité pour les retours
      if (data.type === 'retour' && lot.quantite_disponible < data.quantite) {
        throw new Error('Stock insuffisant pour le retour');
      }

      // Créer l'enregistrement de perte/retour
      const { data: perteRetour, error: perteRetourError } = await supabase
        .from('pertes_retours')
        .insert({
          type: data.type,
          medicament_id: data.medicament_id,
          lot_id: data.lot_id,
          quantite: data.quantite,
          motif: data.motif,
          utilisateur_id: data.utilisateur_id,
          date_creation: new Date().toISOString(),
          statut: 'en_cours',
          observations: data.observations,
          reference_document: data.reference_document
        })
        .select()
        .single();

      if (perteRetourError) throw perteRetourError;

      // Mettre à jour le stock selon le type
      let nouvelle_quantite = lot.quantite_disponible;
      let magasin_destination: 'gros' | 'detail' | 'patient' | 'service' = 'detail';

      if (data.type === 'perte') {
        nouvelle_quantite -= data.quantite;
        magasin_destination = 'detail'; // Perte dans le magasin actuel
      } else {
        // Retour vers le magasin gros
        nouvelle_quantite -= data.quantite;
        magasin_destination = 'gros';

        // Créer ou mettre à jour le lot dans le magasin gros
        const { data: lotGros, error: lotGrosError } = await supabase
          .from('lots')
          .select('*')
          .eq('medicament_id', data.medicament_id)
          .eq('numero_lot', lot.numero_lot)
          .eq('magasin', 'gros')
          .single();

        if (lotGrosError && lotGrosError.code !== 'PGRST116') {
          throw lotGrosError;
        }

        if (lotGros) {
          // Mettre à jour le lot existant
          const { error: updateGrosError } = await supabase
            .from('lots')
            .update({
              quantite_disponible: lotGros.quantite_disponible + data.quantite
            })
            .eq('id', lotGros.id);

          if (updateGrosError) throw updateGrosError;
        } else {
          // Créer un nouveau lot dans le magasin gros
          const { error: createGrosError } = await supabase
            .from('lots')
            .insert({
              medicament_id: data.medicament_id,
              numero_lot: lot.numero_lot,
              quantite_initiale: data.quantite,
              quantite_disponible: data.quantite,
              date_reception: lot.date_reception,
              date_expiration: lot.date_expiration,
              prix_achat: lot.prix_achat,
              fournisseur: lot.fournisseur,
              statut: 'actif',
              magasin: 'gros'
            });

          if (createGrosError) throw createGrosError;
        }
      }

      // Mettre à jour le stock du lot source
      const { error: updateStockError } = await supabase
        .from('lots')
        .update({
          quantite_disponible: nouvelle_quantite
        })
        .eq('id', lot.id);

      if (updateStockError) throw updateStockError;

      // Enregistrer le mouvement
      const { error: mouvementError } = await supabase
        .from('mouvements_stock')
        .insert({
          type: data.type,
          medicament_id: data.medicament_id,
          lot_id: data.lot_id,
          quantite: data.quantite,
          quantite_avant: lot.quantite_disponible,
          quantite_apres: nouvelle_quantite,
          motif: data.motif,
          utilisateur_id: data.utilisateur_id,
          date_mouvement: new Date().toISOString(),
          magasin_source: lot.magasin,
          magasin_destination,
          reference_document: data.reference_document,
          observations: data.observations
        });

      if (mouvementError) throw mouvementError;

      // Marquer comme validé
      const { error: updatePerteRetourError } = await supabase
        .from('pertes_retours')
        .update({ statut: 'valide' })
        .eq('id', perteRetour.id);

      if (updatePerteRetourError) throw updatePerteRetourError;

      // Vérifier les alertes
      await this.verifierAlertes(data.medicament_id);

      return { success: true, perteRetour };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la perte/retour:', error);
      throw error;
    }
  }

  // 6. RAPPORTS & ALERTES → Suivi conjoint des deux entités
  static async verifierAlertes(medicament_id: string) {
    try {
      // Récupérer le médicament et ses lots
      const { data: medicament, error: medicamentError } = await supabase
        .from('medicaments')
        .select('*')
        .eq('id', medicament_id)
        .single();

      if (medicamentError) throw medicamentError;

      const { data: lots, error: lotsError } = await supabase
        .from('lots')
        .select('*')
        .eq('medicament_id', medicament_id)
        .eq('statut', 'actif');

      if (lotsError) throw lotsError;

      // Calculer le stock total par magasin
      const stockGros = lots
        .filter(lot => lot.magasin === 'gros')
        .reduce((sum, lot) => sum + lot.quantite_disponible, 0);

      const stockDetail = lots
        .filter(lot => lot.magasin === 'detail')
        .reduce((sum, lot) => sum + lot.quantite_disponible, 0);

      const stockTotal = stockGros + stockDetail;

      // Vérifier les seuils
      if (stockTotal <= medicament.seuil_rupture) {
        await this.creerAlerte({
          medicament_id,
          type: 'rupture',
          niveau: 'critique',
          message: `Rupture de stock pour ${medicament.nom}`
        });
      } else if (stockTotal <= medicament.seuil_alerte) {
        await this.creerAlerte({
          medicament_id,
          type: 'seuil_bas',
          niveau: 'avertissement',
          message: `Stock faible pour ${medicament.nom} (${stockTotal} unités)`
        });
      }

      // Vérifier les péremptions
      const dateLimite = new Date();
      dateLimite.setDate(dateLimite.getDate() + 30);

      for (const lot of lots) {
        const dateExpiration = new Date(lot.date_expiration);
        if (dateExpiration <= new Date()) {
          await this.creerAlerte({
            medicament_id,
            type: 'peremption',
            niveau: 'critique',
            message: `Lot ${lot.numero_lot} de ${medicament.nom} expiré`
          });
        } else if (dateExpiration <= dateLimite) {
          await this.creerAlerte({
            medicament_id,
            type: 'peremption',
            niveau: 'avertissement',
            message: `Lot ${lot.numero_lot} de ${medicament.nom} expire le ${dateExpiration.toLocaleDateString()}`
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la vérification des alertes:', error);
      throw error;
    }
  }

  static async creerAlerte(data: {
    medicament_id: string;
    type: 'rupture' | 'seuil_bas' | 'peremption' | 'stock_surplus';
    niveau: 'critique' | 'avertissement' | 'information';
    message: string;
  }) {
    try {
      // Vérifier si une alerte similaire existe déjà
      const { data: alerteExistante, error: checkError } = await supabase
        .from('alertes_stock')
        .select('*')
        .eq('medicament_id', data.medicament_id)
        .eq('type', data.type)
        .eq('statut', 'active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (alerteExistante) {
        // Mettre à jour l'alerte existante
        const { error: updateError } = await supabase
          .from('alertes_stock')
          .update({
            message: data.message,
            niveau: data.niveau,
            date_creation: new Date().toISOString()
          })
          .eq('id', alerteExistante.id);

        if (updateError) throw updateError;
      } else {
        // Créer une nouvelle alerte
        const { error: createError } = await supabase
          .from('alertes_stock')
          .insert({
            medicament_id: data.medicament_id,
            type: data.type,
            niveau: data.niveau,
            message: data.message,
            date_creation: new Date().toISOString(),
            statut: 'active'
          });

        if (createError) throw createError;
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      throw error;
    }
  }

  // Méthodes utilitaires
  static async getStockStats() {
    try {
      const { data: medicaments, error: medicamentsError } = await supabase
        .from('medicaments')
        .select('*');

      if (medicamentsError) throw medicamentsError;

      const { data: lots, error: lotsError } = await supabase
        .from('lots')
        .select('*');

      if (lotsError) throw lotsError;

      const { data: alertes, error: alertesError } = await supabase
        .from('alertes_stock')
        .select('*')
        .eq('statut', 'active');

      if (alertesError) throw alertesError;

      const { data: transferts, error: transfertsError } = await supabase
        .from('transferts')
        .select('*')
        .eq('statut', 'en_cours');

      if (transfertsError) throw transfertsError;

      const totalMedicaments = medicaments.length;
      const totalLots = lots.length;
      const totalStock = lots.reduce((sum, lot) => sum + lot.quantite_disponible, 0);
      const valeurStock = lots.reduce((sum, lot) => sum + (lot.quantite_disponible * lot.prix_achat), 0);
      const totalAlertes = alertes.length;
      const transfertsEnCours = transferts.length;

      return {
        total_medicaments: totalMedicaments,
        total_lots: totalLots,
        total_stock: totalStock,
        valeur_stock: valeurStock,
        total_alertes: totalAlertes,
        transferts_en_cours: transfertsEnCours
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }

  static async getLotsByMagasin(magasin: 'gros' | 'detail') {
    try {
      const { data, error } = await supabase
        .from('lots')
        .select(`
          *,
          medicaments (
            *
          )
        `)
        .eq('magasin', magasin)
        .eq('statut', 'actif')
        .order('date_expiration', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des lots:', error);
      throw error;
    }
  }

  static async getTransfertsEnCours() {
    try {
      const { data, error } = await supabase
        .from('transferts')
        .select(`
          *,
          transferts_lignes (
            *,
            medicaments (
              *
            ),
            lots (
              *
            )
          )
        `)
        .eq('statut', 'en_cours')
        .order('date_transfert', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des transferts:', error);
      throw error;
    }
  }

  static async getAlertesActives() {
    try {
      const { data, error } = await supabase
        .from('alertes_stock')
        .select(`
          *,
          medicaments (
            *
          )
        `)
        .eq('statut', 'active')
        .order('niveau', { ascending: false })
        .order('date_creation', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      throw error;
    }
  }
}
