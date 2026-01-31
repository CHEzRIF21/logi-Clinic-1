import { supabase, MedicamentSupabase, LotSupabase, MouvementStockSupabase, TransfertSupabase, TransfertLigneSupabase, DispensationSupabase, DispensationLigneSupabase, AlerteStockSupabase, PerteRetourSupabase } from './stockSupabase';
import { getMyClinicId } from './clinicService';

// Service principal pour la gestion du stock
export class StockService {
  // ============================================
  // JOURNALISATION (stock_audit_log)
  // ============================================
  static async logStockAction(payload: {
    entity_type: 'transfert' | 'commande_fournisseur' | string;
    entity_id: string; // UUID
    action: string;
    actor_id: string;
    old_status?: string | null;
    new_status?: string | null;
    old_data?: any;
    new_data?: any;
  }) {
    try {
      const { error } = await supabase.from('stock_audit_log').insert({
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        action: payload.action,
        actor_id: payload.actor_id,
        old_status: payload.old_status ?? null,
        new_status: payload.new_status ?? null,
        old_data: payload.old_data ?? null,
        new_data: payload.new_data ?? null,
      });
      if (error) throw error;
    } catch (e) {
      // Ne pas bloquer les flux métier si la journalisation échoue
      console.warn('⚠️ Impossible d’écrire dans stock_audit_log:', e);
    }
  }
  
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

  // 1b. RÉCEPTION FOURNISSEUR MULTI-LIGNES → MAGASIN GROS
  // Permet d'enregistrer un ravitaillement fournisseur contenant plusieurs produits
  // (comprimé, flacon, réactif, gélule, etc.) avec un lot/quantité par ligne.
  static async receptionMedicamentMultiple(data: {
    fournisseur: string;
    date_reception: string;
    utilisateur_id: string;
    reference_document?: string;
    observations?: string;
    lignes: Array<{
      medicament_id: string;
      numero_lot: string;
      quantite_initiale: number;
      date_expiration: string;
      prix_achat: number;
      observations?: string;
    }>;
  }) {
    try {
      if (!data.lignes || data.lignes.length === 0) {
        throw new Error('Au moins une ligne de réception est requise');
      }
      if (!data.fournisseur?.trim()) {
        throw new Error('Le fournisseur est obligatoire');
      }

      const lotsCrees: any[] = [];

      // Traitement séquentiel (plus simple et évite la surcharge)
      for (const [idx, ligne] of data.lignes.entries()) {
        if (!ligne.medicament_id) throw new Error(`Ligne ${idx + 1}: médicament obligatoire`);
        if (!ligne.numero_lot?.trim()) throw new Error(`Ligne ${idx + 1}: numéro de lot obligatoire`);
        if (!ligne.date_expiration) throw new Error(`Ligne ${idx + 1}: date d'expiration obligatoire`);
        if (!ligne.quantite_initiale || ligne.quantite_initiale <= 0) throw new Error(`Ligne ${idx + 1}: quantité invalide`);
        if (ligne.prix_achat == null || ligne.prix_achat < 0) throw new Error(`Ligne ${idx + 1}: prix d'achat invalide`);

        const { data: lot, error: lotError } = await supabase
          .from('lots')
          .insert({
            medicament_id: ligne.medicament_id,
            numero_lot: ligne.numero_lot,
            quantite_initiale: ligne.quantite_initiale,
            quantite_disponible: ligne.quantite_initiale,
            date_reception: data.date_reception,
            date_expiration: ligne.date_expiration,
            prix_achat: ligne.prix_achat,
            fournisseur: data.fournisseur,
            statut: 'actif',
            magasin: 'gros'
          })
          .select()
          .single();

        if (lotError) throw lotError;

        const { error: mouvementError } = await supabase
          .from('mouvements_stock')
          .insert({
            type: 'reception',
            medicament_id: ligne.medicament_id,
            lot_id: lot.id,
            quantite: ligne.quantite_initiale,
            quantite_avant: 0,
            quantite_apres: ligne.quantite_initiale,
            motif: 'Réception fournisseur',
            utilisateur_id: data.utilisateur_id,
            date_mouvement: data.date_reception,
            magasin_source: 'externe',
            magasin_destination: 'gros',
            reference_document: data.reference_document,
            observations: [data.observations, ligne.observations].filter(Boolean).join('\n')
          });

        if (mouvementError) throw mouvementError;

        // Vérifier les alertes pour chaque médicament réceptionné
        await this.verifierAlertes(ligne.medicament_id);

        lotsCrees.push(lot);
      }

      return { success: true, lots: lotsCrees };
    } catch (error) {
      console.error('Erreur lors de la réception multiple:', error);
      throw error;
    }
  }

  // 2. DEMANDE INTERNE → RESPONSABLE GROS (un seul médicament)
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

      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant. Impossible de créer le transfert.');

      // Créer le transfert avec statut 'en_attente' pour attendre la validation du responsable gros
      const numero_transfert = `TRF-${Date.now()}`;
      const { data: transfert, error: transfertError } = await supabase
        .from('transferts')
        .insert({
          numero_transfert,
          date_transfert: new Date().toISOString(),
          magasin_source: 'gros',
          magasin_destination: 'detail',
          statut: 'en_attente', // En attente de validation par le responsable gros
          utilisateur_source_id: data.utilisateur_demandeur_id,
          motif: data.motif,
          observations: data.observations,
          clinic_id: clinicId,
        })
        .select()
        .single();

      if (transfertError) throw transfertError;

      // Créer la ligne de transfert
      const { error: ligneError } = await supabase
        .from('transfert_lignes')
        .insert({
          transfert_id: transfert.id,
          medicament_id: data.medicament_id,
          lot_id: data.lot_id,
          quantite: data.quantite_demandee
        });

      if (ligneError) throw ligneError;

      await this.logStockAction({
        entity_type: 'transfert',
        entity_id: transfert.id,
        action: 'CREATED',
        actor_id: data.utilisateur_demandeur_id,
        old_status: null,
        new_status: 'en_attente',
        old_data: null,
        new_data: transfert,
      });

      return { success: true, transfert };
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      throw error;
    }
  }

  // 2b. DEMANDE INTERNE MULTIPLE → RESPONSABLE GROS (plusieurs médicaments)
  static async creerDemandeTransfertMultiple(data: {
    lignes: Array<{
      medicament_id: string;
      lot_id: string;
      quantite_demandee: number;
    }>;
    utilisateur_demandeur_id: string;
    motif: string;
    observations?: string;
  }) {
    try {
      if (!data.lignes || data.lignes.length === 0) {
        throw new Error('Au moins une ligne de transfert est requise');
      }

      // Vérifier la disponibilité du stock pour toutes les lignes
      for (const ligne of data.lignes) {
        const { data: lot, error: lotError } = await supabase
          .from('lots')
          .select('*')
          .eq('id', ligne.lot_id)
          .eq('magasin', 'gros')
          .single();

        if (lotError) throw lotError;
        if (lot.quantite_disponible < ligne.quantite_demandee) {
          const { data: medicament } = await supabase
            .from('medicaments')
            .select('nom')
            .eq('id', ligne.medicament_id)
            .single();
          throw new Error(`Stock insuffisant pour ${medicament?.nom || 'ce médicament'} (Lot: ${lot.numero_lot}, Disponible: ${lot.quantite_disponible}, Demandé: ${ligne.quantite_demandee})`);
        }
      }

      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant. Impossible de créer le transfert.');

      // Créer le transfert avec statut 'en_attente' pour attendre la validation du responsable gros
      const numero_transfert = `TRF-${Date.now()}`;
      const { data: transfert, error: transfertError } = await supabase
        .from('transferts')
        .insert({
          numero_transfert,
          date_transfert: new Date().toISOString(),
          magasin_source: 'gros',
          magasin_destination: 'detail',
          statut: 'en_attente', // En attente de validation par le responsable gros
          utilisateur_source_id: data.utilisateur_demandeur_id,
          motif: data.motif,
          observations: data.observations,
          clinic_id: clinicId,
        })
        .select()
        .single();

      if (transfertError) throw transfertError;

      // Créer toutes les lignes de transfert
      const lignesAInserer = data.lignes.map(ligne => ({
        transfert_id: transfert.id,
        medicament_id: ligne.medicament_id,
        lot_id: ligne.lot_id,
        quantite: ligne.quantite_demandee
      }));

      const { error: lignesError } = await supabase
        .from('transfert_lignes')
        .insert(lignesAInserer);

      if (lignesError) throw lignesError;

      await this.logStockAction({
        entity_type: 'transfert',
        entity_id: transfert.id,
        action: 'CREATED',
        actor_id: data.utilisateur_demandeur_id,
        old_status: null,
        new_status: 'en_attente',
        old_data: null,
        new_data: { transfert, lignes: lignesAInserer },
      });

      return { success: true, transfert };
    } catch (error) {
      console.error('Erreur lors de la création de la demande multiple:', error);
      throw error;
    }
  }

  // 2c. TRANSFERT MANUEL DIRECT (Gros → Détail) - Création et validation en une seule opération
  static async creerTransfertManuel(data: {
    lignes: Array<{
      medicament_id: string;
      lot_id: string;
      quantite: number;
    }>;
    utilisateur_id: string;
    motif?: string;
    observations?: string;
  }) {
    try {
      if (!data.lignes || data.lignes.length === 0) {
        throw new Error('Au moins une ligne de transfert est requise');
      }

      // Vérifier la disponibilité de tous les lots
      for (const ligne of data.lignes) {
        const { data: lot, error: lotError } = await supabase
          .from('lots')
          .select('*')
          .eq('id', ligne.lot_id)
          .eq('magasin', 'gros')
          .single();

        if (lotError) throw lotError;
        if (lot.quantite_disponible < ligne.quantite) {
          throw new Error(`Stock insuffisant pour le lot ${lot.numero_lot} (disponible: ${lot.quantite_disponible}, demandé: ${ligne.quantite})`);
        }
      }

      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant. Impossible de créer le transfert.');

      // Créer le transfert avec statut 'valide' directement (pas besoin de validation)
      const numero_transfert = `TRF-MAN-${Date.now()}`;
      const { data: transfert, error: transfertError } = await supabase
        .from('transferts')
        .insert({
          numero_transfert,
          date_transfert: new Date().toISOString(),
          magasin_source: 'gros',
          magasin_destination: 'detail',
          statut: 'valide', // Transfert manuel validé directement
          utilisateur_source_id: data.utilisateur_id,
          utilisateur_destination_id: data.utilisateur_id, // Même utilisateur pour transfert manuel
          motif: data.motif || 'Transfert manuel direct Gros → Détail',
          observations: data.observations,
          clinic_id: clinicId,
        })
        .select()
        .single();

      if (transfertError) throw transfertError;

      // Créer les lignes de transfert et exécuter le transfert immédiatement
      for (const ligne of data.lignes) {
        // Récupérer le lot gros
        const { data: lotGros, error: lotGrosError } = await supabase
          .from('lots')
          .select('*')
          .eq('id', ligne.lot_id)
          .eq('magasin', 'gros')
          .single();

        if (lotGrosError) throw lotGrosError;

        // Créer la ligne de transfert avec quantite_validee = quantite (validation immédiate)
        const { data: ligneTransfert, error: ligneError } = await supabase
          .from('transfert_lignes')
          .insert({
            transfert_id: transfert.id,
            medicament_id: ligne.medicament_id,
            lot_id: ligne.lot_id,
            quantite: ligne.quantite,
            quantite_validee: ligne.quantite // Validation immédiate
          })
          .select()
          .single();

        if (ligneError) throw ligneError;

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
          .maybeSingle();

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

          if (createDetailError) {
            // Si erreur de duplication, essayer de mettre à jour
            if (createDetailError.code === '23505' || createDetailError.message?.includes('duplicate')) {
              const { data: lotDetailRetry, error: retryError } = await supabase
                .from('lots')
                .select('*')
                .eq('medicament_id', ligne.medicament_id)
                .eq('numero_lot', lotGros.numero_lot)
                .eq('magasin', 'detail')
                .maybeSingle();

              if (!retryError && lotDetailRetry) {
                const { error: updateRetryError } = await supabase
                  .from('lots')
                  .update({
                    quantite_disponible: lotDetailRetry.quantite_disponible + ligne.quantite
                  })
                  .eq('id', lotDetailRetry.id);

                if (updateRetryError) throw updateRetryError;
              } else {
                throw new Error(`Le lot ${lotGros.numero_lot} existe déjà. Veuillez réessayer.`);
              }
            } else {
              throw createDetailError;
            }
          }
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
            motif: 'Transfert manuel direct Gros → Détail',
            utilisateur_id: data.utilisateur_id,
            date_mouvement: new Date().toISOString(),
            magasin_source: 'gros',
            magasin_destination: 'detail',
            reference_document: transfert.numero_transfert,
            observations: data.observations
          });

        if (mouvementError) throw mouvementError;
      }

      // Journalisation
      await this.logStockAction({
        entity_type: 'transfert',
        entity_id: transfert.id,
        action: 'CREATED_AND_VALIDATED',
        actor_id: data.utilisateur_id,
        old_status: null,
        new_status: 'valide',
        old_data: null,
        new_data: transfert,
      });

      return { success: true, transfert };
    } catch (error) {
      console.error('Erreur lors du transfert manuel:', error);
      throw error;
    }
  }

  // 3. VALIDATION + TRANSFERT (quantités accordées) → Gros (-) et Détail (+)
  // Permet la validation partielle par ligne via quantite_validee.
  static async validerTransfert(transfert_id: string, utilisateur_validateur_id: string, opts?: {
    lignes?: Array<{ id: string; quantite_validee: number }>;
    observations?: string;
  }) {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant.');

      let transfertQuery = supabase
        .from('transferts')
        .select(`
          *,
          transfert_lignes (
            *,
            lots (
              *
            )
          )
        `)
        .eq('id', transfert_id);
      if (clinicId) transfertQuery = transfertQuery.eq('clinic_id', clinicId);
      const { data: transfert, error: transfertError } = await transfertQuery.single();

      if (transfertError) throw transfertError;
      // Accepter les transferts en_attente OU en_cours pour la validation
      if (transfert.statut !== 'en_attente' && transfert.statut !== 'en_cours') {
        throw new Error('Le transfert ne peut pas être validé (statut actuel: ' + transfert.statut + ')');
      }

      const beforeTransfert = transfert;
      const lignesInput = new Map<string, number>(
        (opts?.lignes || []).map(l => [l.id, l.quantite_validee])
      );

      // Déterminer les quantités accordées par ligne
      const lignesAvecAccord = (transfert.transfert_lignes || []).map((ligne: any) => {
        const demandee = Number(ligne.quantite || 0);
        const qv = lignesInput.has(ligne.id) ? Number(lignesInput.get(ligne.id)) : (ligne.quantite_validee != null ? Number(ligne.quantite_validee) : demandee);
        const accordee = Math.max(0, Math.min(demandee, Number.isFinite(qv) ? qv : demandee));
        return { ...ligne, quantite_demandee: demandee, quantite_accordee: accordee };
      });

      if (lignesAvecAccord.every((l: any) => (l.quantite_accordee || 0) <= 0)) {
        throw new Error('Validation impossible: toutes les quantités accordées sont à 0. Utilisez plutôt "Refuser".');
      }

      // Traiter chaque ligne de transfert
      for (const ligne of lignesAvecAccord) {
        const lotGros = ligne.lots;
        const qte = ligne.quantite_accordee;

        // Rien à transférer sur cette ligne (validation partielle)
        if (!qte || qte <= 0) {
          // quand même stocker quantite_validee=0 pour traçabilité
          const { error: upLine0 } = await supabase
            .from('transfert_lignes')
            .update({ quantite_validee: 0 })
            .eq('id', ligne.id);
          if (upLine0) throw upLine0;
          continue;
        }
        
        // Vérifier la disponibilité
        if (lotGros.quantite_disponible < qte) {
          throw new Error(`Stock insuffisant pour le lot ${lotGros.numero_lot}`);
        }

        // Décrémenter le stock du magasin gros
        const { error: updateGrosError } = await supabase
          .from('lots')
          .update({
            quantite_disponible: lotGros.quantite_disponible - qte
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
              quantite_disponible: lotDetail.quantite_disponible + qte
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
              quantite_initiale: qte,
              quantite_disponible: qte,
              date_reception: lotGros.date_reception,
              date_expiration: lotGros.date_expiration,
              prix_achat: lotGros.prix_achat,
              fournisseur: lotGros.fournisseur,
              statut: 'actif',
              magasin: 'detail'
            });

          if (createDetailError) {
            // Vérifier si c'est une erreur de contrainte unique
            if (createDetailError.code === '23505' || createDetailError.message?.includes('duplicate key')) {
              // Réessayer de récupérer le lot (peut-être créé entre-temps par une autre validation)
              const { data: lotDetailRetry, error: retryError } = await supabase
                .from('lots')
                .select('*')
                .eq('medicament_id', ligne.medicament_id)
                .eq('numero_lot', lotGros.numero_lot)
                .eq('magasin', 'detail')
                .single();

              if (!retryError && lotDetailRetry) {
                // Le lot existe maintenant, le mettre à jour
                const { error: updateRetryError } = await supabase
                  .from('lots')
                  .update({
                    quantite_disponible: lotDetailRetry.quantite_disponible + qte
                  })
                  .eq('id', lotDetailRetry.id);

                if (updateRetryError) throw updateRetryError;
              } else {
                throw new Error(`Le lot ${lotGros.numero_lot} existe déjà. Veuillez réessayer ou contacter l'administrateur.`);
              }
            } else {
              throw createDetailError;
            }
          }
        }

        // Mettre à jour la quantité validée sur la ligne
        const { error: updateLineError } = await supabase
          .from('transfert_lignes')
          .update({ quantite_validee: qte })
          .eq('id', ligne.id);
        if (updateLineError) throw updateLineError;

        // Enregistrer le mouvement de transfert
        const { error: mouvementError } = await supabase
          .from('mouvements_stock')
          .insert({
            type: 'transfert',
            medicament_id: ligne.medicament_id,
            lot_id: lotGros.id,
            quantite: qte,
            quantite_avant: lotGros.quantite_disponible,
            quantite_apres: lotGros.quantite_disponible - qte,
            motif: 'Transfert interne Gros → Détail',
            utilisateur_id: utilisateur_validateur_id,
            date_mouvement: new Date().toISOString(),
            magasin_source: 'gros',
            magasin_destination: 'detail',
            reference_document: transfert.numero_transfert
          });

        if (mouvementError) throw mouvementError;
      }

      const isPartial = lignesAvecAccord.some((l: any) => (l.quantite_accordee || 0) < (l.quantite_demandee || 0));
      const newStatut = isPartial ? 'partiel' : 'valide';

      // Marquer le transfert comme validé/partiel
      const { error: updateTransfertError } = await supabase
        .from('transferts')
        .update({
          statut: newStatut,
          date_validation: new Date().toISOString(),
          utilisateur_destination_id: utilisateur_validateur_id,
          observations: [transfert.observations, opts?.observations ? `VALIDATION: ${opts.observations}` : null].filter(Boolean).join('\n')
        })
        .eq('id', transfert_id);

      if (updateTransfertError) throw updateTransfertError;

      await this.logStockAction({
        entity_type: 'transfert',
        entity_id: transfert_id,
        action: isPartial ? 'APPROVED_PARTIAL' : 'APPROVED',
        actor_id: utilisateur_validateur_id,
        old_status: beforeTransfert.statut,
        new_status: newStatut,
        old_data: beforeTransfert,
        new_data: { ...beforeTransfert, statut: newStatut, lignes: lignesAvecAccord.map((l: any) => ({ id: l.id, quantite: l.quantite_demandee, quantite_validee: l.quantite_accordee })) },
      });

      return { success: true, transfert };
    } catch (error) {
      console.error('Erreur lors de la validation du transfert:', error);
      throw error;
    }
  }

  // 3b. REFUS DE TRANSFERT → Le responsable gros refuse la demande
  static async refuserTransfert(transfert_id: string, utilisateur_id: string, motif_refus: string) {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant.');

      let transfertQuery = supabase
        .from('transferts')
        .select('*')
        .eq('id', transfert_id);
      if (clinicId) transfertQuery = transfertQuery.eq('clinic_id', clinicId);
      const { data: transfert, error: transfertError } = await transfertQuery.single();

      if (transfertError) throw transfertError;
      if (transfert.statut !== 'en_attente') {
        throw new Error('Seuls les transferts en attente peuvent être refusés');
      }

      const before = transfert;
      // Mettre à jour le statut du transfert
      const { error: updateError } = await supabase
        .from('transferts')
        .update({
          statut: 'refuse',
          date_validation: new Date().toISOString(),
          utilisateur_destination_id: utilisateur_id,
          motif_refus: motif_refus,
          observations: transfert.observations 
            ? `${transfert.observations}\n\nREFUSÉ: ${motif_refus}` 
            : `REFUSÉ: ${motif_refus}`
        })
        .eq('id', transfert_id);

      if (updateError) throw updateError;

      await this.logStockAction({
        entity_type: 'transfert',
        entity_id: transfert_id,
        action: 'REJECTED',
        actor_id: utilisateur_id,
        old_status: before.statut,
        new_status: 'refuse',
        old_data: before,
        new_data: { ...before, statut: 'refuse', motif_refus },
      });

      return { success: true, message: 'Transfert refusé' };
    } catch (error) {
      console.error('Erreur lors du refus du transfert:', error);
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
          .from('dispensation_lignes')
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
      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant. Impossible de créer l\'alerte.');

      let alerteQuery = supabase
        .from('alertes_stock')
        .select('*')
        .eq('medicament_id', data.medicament_id)
        .eq('type', data.type)
        .eq('statut', 'active');
      if (clinicId) alerteQuery = alerteQuery.eq('clinic_id', clinicId);
      const { data: alerteExistante, error: checkError } = await alerteQuery.maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (alerteExistante) {
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
        const { error: createError } = await supabase
          .from('alertes_stock')
          .insert({
            medicament_id: data.medicament_id,
            type: data.type,
            niveau: data.niveau,
            message: data.message,
            date_creation: new Date().toISOString(),
            statut: 'active',
            clinic_id: clinicId,
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
      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant.');

      let medicamentsQuery = supabase.from('medicaments').select('*');
      if (clinicId) medicamentsQuery = medicamentsQuery.eq('clinic_id', clinicId);
      const { data: medicaments, error: medicamentsError } = await medicamentsQuery;
      if (medicamentsError) throw medicamentsError;

      const medicamentIds = (medicaments || []).map((m: { id: string }) => m.id);
      let lotsQuery = supabase.from('lots').select('*');
      if (medicamentIds.length > 0) {
        lotsQuery = lotsQuery.in('medicament_id', medicamentIds);
      } else {
        lotsQuery = lotsQuery.eq('medicament_id', '00000000-0000-0000-0000-000000000000');
      }
      const { data: lots, error: lotsError } = await lotsQuery;
      if (lotsError) throw lotsError;

      let alertesQuery = supabase.from('alertes_stock').select('*').eq('statut', 'active');
      if (clinicId) alertesQuery = alertesQuery.eq('clinic_id', clinicId);
      const { data: alertes, error: alertesError } = await alertesQuery;
      if (alertesError) throw alertesError;

      let transfertsQuery = supabase.from('transferts').select('*').eq('statut', 'en_cours');
      if (clinicId) transfertsQuery = transfertsQuery.eq('clinic_id', clinicId);
      const { data: transferts, error: transfertsError } = await transfertsQuery;
      if (transfertsError) throw transfertsError;

      const totalMedicaments = (medicaments || []).length;
      const totalLots = (lots || []).length;
      const totalStock = (lots || []).reduce((sum: number, lot: { quantite_disponible: number }) => sum + lot.quantite_disponible, 0);
      const valeurStock = (lots || []).reduce((sum: number, lot: { quantite_disponible: number; prix_achat?: number }) => sum + (lot.quantite_disponible * (lot.prix_achat || 0)), 0);
      const totalAlertes = (alertes || []).length;
      const transfertsEnCours = (transferts || []).length;

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
      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant.');

      let query = supabase
        .from('lots')
        .select(`
          id,
          medicament_id,
          numero_lot,
          quantite_initiale,
          quantite_disponible,
          date_reception,
          date_expiration,
          prix_achat,
          fournisseur,
          statut,
          magasin,
          created_at,
          updated_at,
          medicaments (
            id,
            code,
            nom,
            dci,
            forme,
            dosage,
            unite,
            prix_unitaire,
            prix_unitaire_entree,
            prix_unitaire_detail,
            seuil_alerte,
            seuil_maximum,
            emplacement,
            observations
          )
        `)
        .eq('magasin', magasin)
        .eq('statut', 'actif');
      
      if (clinicId) query = query.eq('clinic_id', clinicId);
      
      query = query.order('date_expiration', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des lots:', error);
      throw error;
    }
  }

  // Récupérer les transferts actifs (en_attente et en_cours) scopés par clinique
  static async getTransfertsEnCours() {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant.');

      let query = supabase
        .from('transferts')
        .select(`
          *,
          transfert_lignes (
            *,
            medicaments (
              *
            ),
            lots (
              *
            )
          )
        `)
        .in('statut', ['en_attente', 'en_cours'])
        .order('date_transfert', { ascending: false });
      if (clinicId) query = query.eq('clinic_id', clinicId);
      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des transferts:', error);
      throw error;
    }
  }

  // 3c. RÉCEPTION TRANSFERT → Accusé de réception côté Magasin Détail (sans re-déplacer le stock)
  static async receptionnerTransfert(transfert_id: string, utilisateur_reception_id: string, observations?: string) {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant.');

      let transfertQuery = supabase
        .from('transferts')
        .select('*')
        .eq('id', transfert_id);
      if (clinicId) transfertQuery = transfertQuery.eq('clinic_id', clinicId);
      const { data: transfert, error: transfertError } = await transfertQuery.single();

      if (transfertError) throw transfertError;
      if (transfert.statut !== 'valide') {
        // On accepte aussi "partiel" (réception après validation partielle)
        if (transfert.statut !== 'partiel') {
          throw new Error('Seuls les transferts validés/partiels peuvent être réceptionnés');
        }
      }

      const before = transfert;
      const { error: updateError } = await supabase
        .from('transferts')
        .update({
          statut: 'recu',
          date_reception: new Date().toISOString(),
          utilisateur_reception_id,
          observations: [transfert.observations, observations ? `RECEPTION: ${observations}` : null].filter(Boolean).join('\n')
        })
        .eq('id', transfert_id);

      if (updateError) throw updateError;

      await this.logStockAction({
        entity_type: 'transfert',
        entity_id: transfert_id,
        action: 'RECEIVED',
        actor_id: utilisateur_reception_id,
        old_status: before.statut,
        new_status: 'recu',
        old_data: before,
        new_data: { ...before, statut: 'recu' },
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la réception du transfert:', error);
      throw error;
    }
  }

  // Récupérer les transferts par statut spécifique (scopés par clinique)
  static async getTransfertsByStatut(statut: 'en_attente' | 'en_cours' | 'valide' | 'refuse' | 'annule' | 'recu') {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant.');

      let query = supabase
        .from('transferts')
        .select(`
          *,
          transfert_lignes (
            *,
            medicaments (
              *
            ),
            lots (
              *
            )
          )
        `)
        .eq('statut', statut)
        .order('date_transfert', { ascending: false });
      if (clinicId) query = query.eq('clinic_id', clinicId);
      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des transferts:', error);
      throw error;
    }
  }

  // Récupérer l'historique des transferts (validés, reçus, refusés, annulés) scopés par clinique
  static async getTransfertsHistorique() {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant.');

      let query = supabase
        .from('transferts')
        .select(`
          *,
          transfert_lignes (
            *,
            medicaments (
              *
            ),
            lots (
              *
            )
          )
        `)
        .in('statut', ['valide', 'recu', 'refuse', 'annule'])
        .order('date_transfert', { ascending: false })
        .limit(100);
      if (clinicId) query = query.eq('clinic_id', clinicId);
      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }

  static async getAlertesActives() {
    try {
      const clinicId = await getMyClinicId();
      if (!clinicId) throw new Error('Contexte de clinique manquant.');

      let query = supabase
        .from('alertes_stock')
        .select(`
          id,
          medicament_id,
          type,
          niveau,
          message,
          date_creation,
          date_resolution,
          statut,
          utilisateur_resolution_id,
          medicaments (
            id,
            code,
            nom,
            dci,
            forme,
            dosage
          )
        `)
        .eq('statut', 'active')
        .order('niveau', { ascending: false })
        .order('date_creation', { ascending: false });
      if (clinicId) query = query.eq('clinic_id', clinicId);
      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      throw error;
    }
  }
}
