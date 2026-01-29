import { supabase } from './supabase';
import { PaymentMethod, getPaymentMethodLabel } from '../constants/paymentMethods';

// ============================================
// TYPES ET INTERFACES
// ============================================

export interface ServiceFacturable {
  id: string;
  code: string;
  nom: string;
  type_service: 'consultation' | 'pharmacie' | 'laboratoire' | 'maternite' | 'vaccination' | 'imagerie' | 'autre';
  tarif_base: number;
  unite: string;
  description?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface LigneFacture {
  id?: string;
  facture_id?: string;
  service_facturable_id?: string;
  code_service?: string;
  libelle: string;
  quantite: number;
  prix_unitaire: number;
  remise_ligne: number;
  montant_ligne: number;
  ordre?: number;
}

export interface Facture {
  id: string;
  numero_facture: string;
  patient_id: string;
  date_facture: string;
  date_echeance?: string;
  montant_ht: number;
  montant_tva: number;
  montant_remise: number;
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  statut: 'brouillon' | 'en_attente' | 'payee' | 'partiellement_payee' | 'en_credit' | 'annulee' | 'exoneree';
  type_facture: 'normale' | 'credit' | 'avoir';
  numero_fiscal?: string;
  qr_code?: string;
  identifiant_contribuable?: string;
  consultation_id?: string;
  service_origine?: string;
  reference_externe?: string;
  caissier_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  lignes?: LigneFacture[];
  paiements?: Paiement[];
}

export interface Paiement {
  id?: string;
  facture_id: string;
  numero_paiement?: string;
  date_paiement: string;
  montant: number;
  mode_paiement: PaymentMethod;
  numero_transaction?: string;
  banque?: string;
  numero_cheque?: string;
  reference_prise_en_charge?: string;
  caissier_id?: string;
  notes?: string;
}

export interface RemiseExoneration {
  id?: string;
  facture_id?: string;
  type_remise: 'pourcentage' | 'montant_fixe' | 'exoneration_totale';
  valeur: number;
  motif: string;
  categorie_beneficiaire?: string;
  autorise_par?: string;
  date_application?: string;
}

export interface CreditFacturation {
  id?: string;
  facture_id: string;
  patient_id?: string;
  partenaire_id?: string;
  type_partenaire?: string;
  nom_partenaire?: string;
  montant_credit: number;
  date_echeance?: string;
  statut: 'en_attente' | 'partiellement_paye' | 'paye' | 'impaye';
  notes?: string;
}

export interface TicketFacturation {
  id: string;
  patient_id: string;
  service_origine: string;
  reference_origine?: string;
  type_acte: string;
  montant: number;
  payeur_type?: 'patient' | 'assurance';
  payeur_id?: string;
  payeur_nom?: string;
  statut: 'en_attente' | 'facture' | 'annule';
  facture_id?: string;
  date_creation: string;
  date_facturation?: string;
}

export interface Devise {
  code: 'FCFA' | 'USD' | 'EUR';
  libelle: string;
  symbole: string;
  taux_change?: number;
}

export interface AlerteCaisse {
  id?: string;
  seuil: number;
  devise: 'FCFA' | 'USD' | 'EUR';
  active: boolean;
  notification_envoyee: boolean;
  date_derniere_notification?: string;
}

export interface ConfigDGI {
  actif: boolean;
  numero_ifu?: string;
  numero_autorisation_dgi?: string;
  generer_qr_code: boolean;
}

export interface RapportFinancier {
  periode: {
    dateDebut: string;
    dateFin: string;
  };
  recettesParService: Record<string, number>;
  recettesParUtilisateur: Record<string, number>;
  statistiquesMensuelles: {
    mois: string;
    totalFacture: number;
    totalPaye: number;
    nombreFactures: number;
  }[];
  etatPaiements: {
    especes: number;
    mobile_money: number;
    orange_money: number;
    mtn_mobile_money: number;
    moov_money: number;
    wave: number;
    flooz: number;
    t_money: number;
    carte_bancaire: number;
    virement: number;
    cheque: number;
    prise_en_charge: number;
  };
  facturesImpayees: Facture[];
  bilanTresorerie: {
    entree: number;
    sortie: number;
    solde: number;
  };
}

export interface JournalCaisse {
  id: string;
  date_journal: string;
  caissier_id: string;
  recettes_especes: number;
  recettes_orange_money?: number;
  recettes_mtn_mobile_money?: number;
  recettes_moov_money?: number;
  recettes_wave?: number;
  recettes_flooz?: number;
  recettes_t_money?: number;
  recettes_carte: number;
  recettes_virement: number;
  recettes_cheque?: number;
  recettes_prise_en_charge?: number;
  recettes_autres: number;
  total_recettes: number;
  depenses_especes: number;
  depenses_autres: number;
  total_depenses: number;
  solde_ouverture: number;
  solde_fermeture: number;
  statut: 'ouvert' | 'ferme' | 'cloture';
  notes?: string;
}

export interface FactureFormData {
  patient_id: string;
  date_facture?: string;
  date_echeance?: string;
  lignes: LigneFacture[];
  remises?: RemiseExoneration[];
  type_facture?: 'normale' | 'credit' | 'avoir';
  notes?: string;
  service_origine?: string;
  reference_externe?: string;
  consultation_id?: string;
  montant_paye?: number;
  credit_partenaire?: {
    partenaire_id?: string;
    type_partenaire?: string; // ex: 'assurance'
    nom_partenaire?: string;
    date_echeance?: string;
    notes?: string;
  };
}

// ============================================
// SERVICE PRINCIPAL
// ============================================

export class FacturationService {
  
  // ============================================
  // 1. GESTION DES SERVICES FACTURABLES
  // ============================================
  
  static async getServicesFacturables(type?: string): Promise<ServiceFacturable[]> {
    let query = supabase
      .from('services_facturables')
      .select('*')
      .eq('actif', true)
      .order('nom');
    
    if (type) {
      query = query.eq('type_service', type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  static async createServiceFacturable(service: Partial<ServiceFacturable>): Promise<ServiceFacturable> {
    const { data, error } = await supabase
      .from('services_facturables')
      .insert([service])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async updateServiceFacturable(id: string, updates: Partial<ServiceFacturable>): Promise<ServiceFacturable> {
    const { data, error } = await supabase
      .from('services_facturables')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============================================
  // 2. GESTION DES FACTURES
  // ============================================
  
  static async createFacture(formData: FactureFormData, caissierId?: string): Promise<Facture> {
    // Calculer les montants
    const montantHT = formData.lignes.reduce((sum, ligne) => sum + ligne.montant_ligne, 0);
    const montantRemise = formData.remises?.reduce((sum, remise) => {
      if (remise.type_remise === 'pourcentage') {
        return sum + (montantHT * remise.valeur / 100);
      } else if (remise.type_remise === 'montant_fixe') {
        return sum + remise.valeur;
      } else if (remise.type_remise === 'exoneration_totale') {
        return montantHT;
      }
      return sum;
    }, 0) || 0;
    
    const montantTotal = montantHT - montantRemise;
    const montantPayeInitial = formData.montant_paye || 0;
    const montantRestant = montantTotal - montantPayeInitial;
    
    // Déterminer le statut correct
    let statut: 'en_attente' | 'partiellement_payee' | 'payee' | 'en_credit' = 'en_attente';
    if (formData.type_facture === 'credit') {
      statut = 'en_credit';
    } else if (montantRestant <= 0 && montantPayeInitial > 0) {
      statut = 'payee';
    } else if (montantRestant > 0 && montantPayeInitial > 0) {
      statut = 'partiellement_payee';
    } else {
      statut = 'en_attente';
    }
    
    // Contexte clinique obligatoire pour l'écriture
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();
    if (!clinicId) {
      throw new Error('Contexte de clinique manquant. Impossible de créer la facture.');
    }

    // Préparer les données de la facture (avec clinic_id pour isolation multi-tenant)
    const factureData = {
      patient_id: formData.patient_id,
      clinic_id: clinicId,
      date_facture: formData.date_facture || new Date().toISOString(),
      date_echeance: formData.date_echeance,
      montant_ht: montantHT - montantRemise,
      montant_remise: montantRemise,
      montant_total: montantTotal,
      montant_paye: montantPayeInitial,
      montant_restant: montantRestant,
      statut: statut,
      type_facture: formData.type_facture || 'normale',
      service_origine: formData.service_origine || 'autre',
      reference_externe: formData.reference_externe,
      consultation_id: formData.consultation_id,
      caissier_id: caissierId,
      notes: formData.notes
    };

    console.log('📝 Création facture dans createFacture:', {
      patient_id: factureData.patient_id,
      consultation_id: factureData.consultation_id,
      service_origine: factureData.service_origine,
      statut: factureData.statut,
      montant_total: factureData.montant_total,
      montant_restant: factureData.montant_restant,
      nombre_lignes: formData.lignes.length,
    });

    // Créer la facture
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .insert([factureData])
      .select()
      .single();
    
    if (factureError) {
      console.error('❌ Erreur création facture:', factureError);
      throw factureError;
    }

    console.log('✅ Facture créée avec succès:', {
      id: facture.id,
      numero_facture: facture.numero_facture,
      statut: facture.statut,
      service_origine: facture.service_origine,
      consultation_id: facture.consultation_id,
      montant_restant: facture.montant_restant,
    });
    
    // Créer les lignes de facture
    const lignesAvecFactureId = formData.lignes.map((ligne, index) => ({
      ...ligne,
      facture_id: facture.id,
      ordre: index + 1
    }));
    
    const { error: lignesError } = await supabase
      .from('lignes_facture')
      .insert(lignesAvecFactureId);
    
    if (lignesError) throw lignesError;
    
    // Créer les remises si présentes
    if (formData.remises && formData.remises.length > 0) {
      const remisesAvecFactureId = formData.remises.map(remise => ({
        ...remise,
        facture_id: facture.id,
        date_application: remise.date_application || new Date().toISOString()
      }));
      
      const { error: remisesError } = await supabase
        .from('remises_exonerations')
        .insert(remisesAvecFactureId);
      
      if (remisesError) throw remisesError;
    }
    
    // Si facture à crédit, créer l'enregistrement de crédit
    if (formData.type_facture === 'credit') {
      await this.createCredit({
        facture_id: facture.id,
        patient_id: formData.patient_id,
        partenaire_id: formData.credit_partenaire?.partenaire_id,
        type_partenaire: formData.credit_partenaire?.type_partenaire || 'assurance',
        nom_partenaire: formData.credit_partenaire?.nom_partenaire,
        montant_credit: montantTotal,
        date_echeance: formData.credit_partenaire?.date_echeance || formData.date_echeance,
        notes: formData.credit_partenaire?.notes,
        statut: 'en_attente',
      });
    }
    
    // Récupérer la facture complète
    return this.getFactureById(facture.id);
  }
  
  static async getFactureById(id: string): Promise<Facture> {
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();

    let factureQuery = supabase.from('factures').select('*').eq('id', id);
    if (clinicId) {
      factureQuery = factureQuery.eq('clinic_id', clinicId);
    }
    const { data: facture, error: factureError } = await factureQuery.single();
    if (factureError) throw factureError;
    if (!facture) throw new Error('Facture non trouvée');

    // Récupérer les lignes
    const { data: lignes } = await supabase
      .from('lignes_facture')
      .select('*')
      .eq('facture_id', id)
      .order('ordre');

    // Récupérer les paiements (scope clinique déjà garanti par la facture)
    const { data: paiements } = await supabase
      .from('paiements')
      .select('*')
      .eq('facture_id', id)
      .order('date_paiement', { ascending: false });

    return {
      ...facture,
      lignes: lignes || [],
      paiements: paiements || []
    };
  }
  
  static async getFacturesByPatient(patientId: string): Promise<Facture[]> {
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();

    let query = supabase
      .from('factures')
      .select('*')
      .eq('patient_id', patientId)
      .order('date_facture', { ascending: false });
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  static async getFactures(filters?: {
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
    patientId?: string;
    clinicId?: string;
  }): Promise<Facture[]> {
    // ✅ CORRIGÉ: Récupérer clinicId automatiquement si non fourni
    const { getMyClinicId } = await import('./clinicService');
    const currentClinicId = filters?.clinicId || await getMyClinicId();
    
    // Utiliser la vue factures_en_attente si on cherche des factures en attente
    // Sinon utiliser la table factures directement
    const useView = filters?.statut && ['en_attente', 'partiellement_payee'].includes(filters.statut);
    
    let query = supabase
      .from(useView ? 'factures_en_attente' : 'factures')
      .select('*')
      .order('date_facture', { ascending: false });
    
    if (filters?.statut && !useView) {
      query = query.eq('statut', filters.statut);
    }
    if (filters?.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }
    
    // ✅ CORRIGÉ: Filtrer par clinic_id si disponible
    if (currentClinicId) {
      // Si la table factures a clinic_id directement
      query = query.eq('clinic_id', currentClinicId);
    }
    
    if (filters?.dateDebut) {
      query = query.gte('date_facture', filters.dateDebut);
    }
    if (filters?.dateFin) {
      query = query.lte('date_facture', filters.dateFin);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Erreur récupération factures:', error);
      // Si la vue n'existe pas, essayer avec la table directement
      if (useView && error.message?.includes('does not exist')) {
        console.warn('Vue factures_en_attente non trouvée, utilisation de la table factures');
        return this.getFactures({ ...filters, statut: filters.statut });
      }
      throw error;
    }
    
    // Filtrer par montant_restant > 0 pour s'assurer qu'on ne récupère que les factures à payer
    const factures = (data || []).filter((f: Facture) => {
      if (useView) return true; // La vue filtre déjà
      return !filters?.statut || f.montant_restant > 0;
    });
    
    return factures;
  }
  
  static async annulerFacture(id: string, motif?: string): Promise<void> {
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();

    let updateQuery = supabase
      .from('factures')
      .update({
        statut: 'annulee',
        notes: motif || 'Facture annulée',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (clinicId) {
      updateQuery = updateQuery.eq('clinic_id', clinicId);
    }
    const { error } = await updateQuery;
    if (error) throw error;
  }
  
  // ============================================
  // 3. GESTION DES PAIEMENTS
  // ============================================
  
  static async enregistrerPaiement(paiement: Paiement, caissierId?: string): Promise<Paiement> {
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();
    if (!clinicId) {
      throw new Error('Contexte de clinique manquant. Impossible d\'enregistrer le paiement.');
    }

    // Normaliser le mode de paiement pour s'assurer qu'il correspond aux valeurs autorisées
    const validModes: PaymentMethod[] = [
      'especes',
      'orange_money',
      'mtn_mobile_money',
      'moov_money',
      'wave',
      'flooz',
      't_money',
      'carte_bancaire',
      'virement',
      'cheque',
      'prise_en_charge'
    ];
    
    // Mapper les labels vers les valeurs si nécessaire
    const modeMapping: Record<string, PaymentMethod> = {
      'Espèces': 'especes',
      'Orange Money': 'orange_money',
      'MTN Mobile Money': 'mtn_mobile_money',
      'Moov Money': 'moov_money',
      'Wave': 'wave',
      'Flooz': 'flooz',
      'T-Money': 't_money',
      'Carte Bancaire': 'carte_bancaire',
      'Virement Bancaire': 'virement',
      'Chèque': 'cheque',
      'Prise en Charge': 'prise_en_charge',
      // Ajouter aussi les variantes possibles
      'mobile_money': 'mtn_mobile_money', // Fallback pour ancien système
    };
    
    let normalizedMode: PaymentMethod = (paiement.mode_paiement || 'especes') as PaymentMethod;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facturationService.ts:547',message:'Mode paiement reçu dans enregistrerPaiement',data:{mode_paiement:paiement.mode_paiement,type:typeof paiement.mode_paiement,length:paiement.mode_paiement?.length,charCode:paiement.mode_paiement?.split('').map(c=>c.charCodeAt(0)),validModes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Si la valeur n'est pas dans la liste valide, essayer de la mapper
    if (!validModes.includes(normalizedMode)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facturationService.ts:553',message:'Mode paiement non valide - avant mapping',data:{normalizedMode,modeMappingKeys:Object.keys(modeMapping),hasMapping:!!modeMapping[normalizedMode]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const mappedMode: PaymentMethod | undefined = modeMapping[normalizedMode];
      if (mappedMode && validModes.includes(mappedMode)) {
        normalizedMode = mappedMode;
      } else {
        // Si aucun mapping trouvé, utiliser 'especes' comme valeur par défaut
        normalizedMode = 'especes' as PaymentMethod;
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facturationService.ts:555',message:'Mode paiement après mapping',data:{normalizedMode,isValid:validModes.includes(normalizedMode)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }
    
    // Vérifier que le mode normalisé est valide
    if (!validModes.includes(normalizedMode)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facturationService.ts:560',message:'Mode paiement invalide après normalisation - ERREUR',data:{original:paiement.mode_paiement,normalized:normalizedMode,validModes},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw new Error(`Mode de paiement invalide: ${paiement.mode_paiement}. Valeurs autorisées: ${validModes.join(', ')}`);
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facturationService.ts:568',message:'Mode paiement validé - avant insertion DB',data:{normalizedMode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    // Générer le numéro de paiement (scope clinique)
    const annee = new Date().getFullYear();
    let dernierQuery = supabase
      .from('paiements')
      .select('numero_paiement')
      .like('numero_paiement', `PAY-${annee}-%`)
      .order('numero_paiement', { ascending: false })
      .limit(1);
    if (clinicId) {
      dernierQuery = dernierQuery.eq('clinic_id', clinicId);
    }
    const { data: dernierPaiement } = await dernierQuery.single();
    
    let numeroSeq = 1;
    if (dernierPaiement) {
      const match = dernierPaiement.numero_paiement.match(/\d+$/);
      if (match) {
        numeroSeq = parseInt(match[0]) + 1;
      }
    }
    
    const numeroPaiement = `PAY-${annee}-${String(numeroSeq).padStart(6, '0')}`;
    
    // Créer l'objet d'insertion (avec clinic_id pour isolation multi-tenant)
    const paiementToInsert = {
      ...paiement,
      clinic_id: clinicId,
      mode_paiement: normalizedMode, // DOIT être après le spread pour écraser
      numero_paiement: numeroPaiement,
      caissier_id: caissierId || paiement.caissier_id,
      date_paiement: paiement.date_paiement || new Date().toISOString()
    };
    
    // #region agent log
    console.log('🔍 DEBUG: Objet final avant insertion', { mode_paiement: paiementToInsert.mode_paiement, normalizedMode, allKeys: Object.keys(paiementToInsert), paiementToInsert: JSON.stringify(paiementToInsert) });
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facturationService.ts:605',message:'Objet final avant insertion DB',data:{mode_paiement:paiementToInsert.mode_paiement,normalizedMode,allKeys:Object.keys(paiementToInsert),paiementToInsertJSON:JSON.stringify(paiementToInsert)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch((e)=>{console.error('Log fetch error:',e);});
    // #endregion
    
    const { data, error } = await supabase
      .from('paiements')
      .insert([paiementToInsert])
      .select()
      .single();
    
    // #region agent log
    if (error) {
      console.error('🔍 DEBUG: Erreur insertion DB', { error: error.message, code: error.code, normalizedMode, mode_paiement_in_paiement: paiement.mode_paiement, paiementToInsert: JSON.stringify(paiementToInsert) });
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'facturationService.ts:620',message:'Erreur insertion DB',data:{error:error.message,code:error.code,normalizedMode,mode_paiement_in_paiement:paiement.mode_paiement,paiementToInsertJSON:JSON.stringify(paiementToInsert)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch((e)=>{console.error('Log fetch error:',e);});
    }
    // #endregion
    
    if (error) throw error;
    
    // Attendre que les triggers SQL s'exécutent et synchronisent tout
    // Les triggers SQL vont automatiquement :
    // 1. Mettre à jour le statut de la facture
    // 2. Mettre à jour le journal de caisse
    // 3. Mettre à jour le statut de la consultation
    // 4. Mettre à jour les tickets_facturation
    // 5. Décrémenter le stock (si prescription liée)
    
    // Attendre un peu pour que les triggers s'exécutent
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Vérifier la synchronisation (optionnel, pour debug)
    try {
      const { data: syncData } = await supabase.rpc('attendre_synchronisation_paiement', {
        p_facture_id: paiement.facture_id,
        p_timeout_seconds: 3
      });
      
      if (syncData && syncData.length > 0 && !syncData[0].synchronise) {
        console.warn('Synchronisation incomplète après paiement:', syncData[0]);
      }
    } catch (syncError) {
      // Si la fonction n'existe pas encore, ce n'est pas grave
      // Les triggers fonctionneront quand même
      console.log('Fonction de synchronisation non disponible (normal si migration 51 pas encore appliquée)');
    }
    
    return data;
  }
  
  static async getPaiementsByFacture(factureId: string): Promise<Paiement[]> {
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();

    let query = supabase
      .from('paiements')
      .select('*')
      .eq('facture_id', factureId)
      .order('date_paiement', { ascending: false });
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  // ============================================
  // 4. GESTION DES REMISES ET EXONÉRATIONS
  // ============================================
  
  static async appliquerRemise(factureId: string, remise: RemiseExoneration): Promise<RemiseExoneration> {
    const { data, error } = await supabase
      .from('remises_exonerations')
      .insert([{
        ...remise,
        facture_id: factureId,
        date_application: remise.date_application || new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Le trigger SQL recalculera automatiquement le montant de la facture
    return data;
  }
  
  static async getRemisesByFacture(factureId: string): Promise<RemiseExoneration[]> {
    const { data, error } = await supabase
      .from('remises_exonerations')
      .select('*')
      .eq('facture_id', factureId);
    
    if (error) throw error;
    return data || [];
  }
  
  // ============================================
  // 5. GESTION DES CRÉDITS
  // ============================================
  
  static async createCredit(credit: CreditFacturation): Promise<CreditFacturation> {
    const { data, error } = await supabase
      .from('credits_facturation')
      .insert([credit])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async getCreditsEnAttente(): Promise<CreditFacturation[]> {
    const { data, error } = await supabase
      .from('credits_facturation')
      .select('*')
      .in('statut', ['en_attente', 'partiellement_paye'])
      .order('date_echeance', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  static async getCreditsByPatient(patientId: string): Promise<CreditFacturation[]> {
    const { data, error } = await supabase
      .from('credits_facturation')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // ============================================
  // 6. GESTION DES TICKETS DE FACTURATION
  // ============================================
  
  static async creerTicketFacturation(
    patientId: string,
    serviceOrigine: string,
    referenceOrigine: string | null,
    typeActe: string,
    montant: number,
    options?: {
      payeur_type?: 'patient' | 'assurance';
      payeur_id?: string | null;
      payeur_nom?: string | null;
    }
  ): Promise<TicketFacturation> {
    const { data, error } = await supabase
      .from('tickets_facturation')
      .insert([{
        patient_id: patientId,
        service_origine: serviceOrigine,
        reference_origine: referenceOrigine,
        type_acte: typeActe,
        montant: montant,
        statut: 'en_attente',
        payeur_type: options?.payeur_type || 'patient',
        payeur_id: options?.payeur_id || patientId,
        payeur_nom: options?.payeur_nom || null,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async getTicketsEnAttente(patientId?: string): Promise<TicketFacturation[]> {
    let query = supabase
      .from('tickets_facturation')
      .select('*')
      .eq('statut', 'en_attente')
      .order('date_creation', { ascending: true });
    
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  static async facturerTickets(ticketIds: string[], factureId: string): Promise<void> {
    const { error } = await supabase
      .from('tickets_facturation')
      .update({
        statut: 'facture',
        facture_id: factureId,
        date_facturation: new Date().toISOString()
      })
      .in('id', ticketIds);
    
    if (error) throw error;
  }
  
  // ============================================
  // 7. GESTION DU JOURNAL DE CAISSE
  // ============================================
  
  static async getJournalCaisse(date: string, caissierId?: string): Promise<JournalCaisse | null> {
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();

    let query = supabase
      .from('journal_caisse')
      .select('*')
      .eq('date_journal', date);
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }
    if (caissierId) {
      query = query.eq('caissier_id', caissierId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  }
  
  static async ouvrirJournalCaisse(date: string, caissierId: string, soldeOuverture: number): Promise<JournalCaisse> {
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();
    if (!clinicId) {
      throw new Error('Contexte de clinique manquant. Impossible d\'ouvrir le journal de caisse.');
    }
    const { data, error } = await supabase
      .from('journal_caisse')
      .insert([{
        date_journal: date,
        caissier_id: caissierId,
        clinic_id: clinicId,
        solde_ouverture: soldeOuverture,
        statut: 'ouvert'
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  
  static async fermerJournalCaisse(date: string, caissierId: string, notes?: string): Promise<void> {
    const journal = await this.getJournalCaisse(date, caissierId);
    if (!journal) throw new Error('Journal de caisse introuvable');
    
    const soldeFermeture = journal.solde_ouverture + journal.total_recettes - journal.total_depenses;
    
    const { error } = await supabase
      .from('journal_caisse')
      .update({
        solde_fermeture: soldeFermeture,
        statut: 'ferme',
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', journal.id);
    
    if (error) throw error;
  }
  
  static async getRapportJournalier(date: string): Promise<any> {
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();

    let journalQuery = supabase
      .from('journal_caisse')
      .select('*')
      .eq('date_journal', date);
    if (clinicId) journalQuery = journalQuery.eq('clinic_id', clinicId);
    const { data: journal, error: journalError } = await journalQuery.maybeSingle();
    if (journalError) throw journalError;

    let facturesQuery = supabase
      .from('factures')
      .select('*')
      .gte('date_facture', `${date}T00:00:00`)
      .lt('date_facture', `${date}T23:59:59`);
    if (clinicId) facturesQuery = facturesQuery.eq('clinic_id', clinicId);
    const { data: factures, error: facturesError } = await facturesQuery;
    if (facturesError) throw facturesError;

    let paiementsQuery = supabase
      .from('paiements')
      .select('*')
      .gte('date_paiement', `${date}T00:00:00`)
      .lt('date_paiement', `${date}T23:59:59`);
    if (clinicId) paiementsQuery = paiementsQuery.eq('clinic_id', clinicId);
    const { data: paiements, error: paiementsError } = await paiementsQuery;
    if (paiementsError) throw paiementsError;
    
    return {
      journal: journal,
      factures: factures || [],
      paiements: paiements || [],
      statistiques: {
        nombreFactures: factures?.length || 0,
        nombrePaiements: paiements?.length || 0,
        totalFacture: factures?.reduce((sum, f) => sum + f.montant_total, 0) || 0,
        totalPaye: paiements?.reduce((sum, p) => sum + p.montant, 0) || 0
      }
    };
  }
  
  // ============================================
  // 8. STATISTIQUES ET RAPPORTS
  // ============================================
  
  static async getStatistiquesFacturation(periode: {
    dateDebut: string;
    dateFin: string;
  }): Promise<any> {
    const { data: factures, error: facturesError } = await supabase
      .from('factures')
      .select('*')
      .gte('date_facture', periode.dateDebut)
      .lte('date_facture', periode.dateFin);
    
    if (facturesError) throw facturesError;
    
    const { data: paiements, error: paiementsError } = await supabase
      .from('paiements')
      .select('*')
      .gte('date_paiement', periode.dateDebut)
      .lte('date_paiement', periode.dateFin);
    
    if (paiementsError) throw paiementsError;
    
    const totalFacture = factures?.reduce((sum, f) => sum + f.montant_total, 0) || 0;
    const totalPaye = paiements?.reduce((sum, p) => sum + p.montant, 0) || 0;
    const totalCredit = factures
      ?.filter(f => f.statut === 'en_credit')
      .reduce((sum, f) => sum + f.montant_restant, 0) || 0;
    
    // Répartition par service
    const repartitionService: Record<string, number> = {};
    factures?.forEach(f => {
      const service = f.service_origine || 'autre';
      repartitionService[service] = (repartitionService[service] || 0) + f.montant_total;
    });
    
    // Répartition par mode de paiement
    const repartitionPaiement: Record<string, number> = {};
    paiements?.forEach(p => {
      repartitionPaiement[p.mode_paiement] = (repartitionPaiement[p.mode_paiement] || 0) + p.montant;
    });
    
    return {
      periode,
      nombreFactures: factures?.length || 0,
      nombrePaiements: paiements?.length || 0,
      totalFacture,
      totalPaye,
      totalCredit,
      repartitionService,
      repartitionPaiement,
      facturesParStatut: {
        payees: factures?.filter(f => f.statut === 'payee').length || 0,
        en_attente: factures?.filter(f => f.statut === 'en_attente').length || 0,
        en_credit: factures?.filter(f => f.statut === 'en_credit').length || 0,
        annulees: factures?.filter(f => f.statut === 'annulee').length || 0
      }
    };
  }
  
  // ============================================
  // 9. EXPORT ET IMPRESSION
  // ============================================
  
  static async exporterFacturePDF(factureId: string): Promise<string> {
    // Cette fonction devrait appeler un service backend pour générer le PDF
    // Pour l'instant, on retourne juste l'URL de la facture
    return `/factures/${factureId}/pdf`;
  }
  
  static async imprimerFacture(factureId: string): Promise<void> {
    const { InvoicePrintService } = await import('./invoicePrintService');
    await InvoicePrintService.printInvoice(factureId);
  }

  // ============================================
  // 11. HISTORIQUE DE PAIEMENTS
  // ============================================

  static async getFacturesPayees(filters?: {
    dateDebut?: string;
    dateFin?: string;
    patientId?: string;
    patientNom?: string;
    montantMin?: number;
    montantMax?: number;
    modePaiement?: string;
    caissierId?: string;
    numeroFacture?: string;
    clinicId?: string;
  }): Promise<Facture[]> {
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = filters?.clinicId || await getMyClinicId();

    let query = supabase
      .from('factures')
      .select('*')
      .eq('statut', 'payee')
      .lte('montant_restant', 0)
      .order('date_facture', { ascending: false });
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }
    if (filters?.dateDebut) {
      query = query.gte('date_facture', filters.dateDebut);
    }
    if (filters?.dateFin) {
      query = query.lte('date_facture', filters.dateFin);
    }
    if (filters?.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }
    if (filters?.numeroFacture) {
      query = query.ilike('numero_facture', `%${filters.numeroFacture}%`);
    }
    if (filters?.montantMin) {
      query = query.gte('montant_total', filters.montantMin);
    }
    if (filters?.montantMax) {
      query = query.lte('montant_total', filters.montantMax);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async exporterHistoriqueCSV(filters?: {
    dateDebut?: string;
    dateFin?: string;
    patientId?: string;
    patientNom?: string;
    montantMin?: number;
    montantMax?: number;
    modePaiement?: string;
    caissierId?: string;
    numeroFacture?: string;
  }): Promise<string> {
    const factures = await this.getFacturesPayees(filters);
    
    // En-tête CSV
    const headers = [
      'Numéro Facture',
      'Date Facture',
      'Patient ID',
      'Montant Total',
      'Montant Payé',
      'Statut',
      'Mode de Paiement',
      'Date Paiement',
    ];
    
    const rows = factures.map(facture => {
      // Récupérer le dernier paiement
      const dernierPaiement = facture.paiements?.[0];
      return [
        facture.numero_facture,
        new Date(facture.date_facture).toLocaleDateString('fr-FR'),
        facture.patient_id,
        facture.montant_total.toString(),
        facture.montant_paye.toString(),
        facture.statut,
        dernierPaiement?.mode_paiement || 'N/A',
        dernierPaiement ? new Date(dernierPaiement.date_paiement).toLocaleDateString('fr-FR') : 'N/A',
      ];
    });
    
    // Convertir en CSV
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';')),
    ].join('\n');
    
    return csvContent;
  }

  static async imprimerReçuPaiement(factureId: string): Promise<void> {
    const facture = await this.getFactureById(factureId);
    const paiements = await this.getPaiementsByFacture(factureId);
    
    if (paiements.length === 0) {
      throw new Error('Aucun paiement trouvé pour cette facture');
    }
    
    // La logique d'impression est gérée dans le composant HistoriquePaiements
    // Cette méthode peut être étendue si nécessaire
  }

  // ============================================
  // 10. RAPPORTS FINANCIERS COMPLETS
  // ============================================

  static async getRapportFinancierComplet(periode: {
    dateDebut: string;
    dateFin: string;
  }): Promise<RapportFinancier> {
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();

    let facturesQuery = supabase
      .from('factures')
      .select('*')
      .gte('date_facture', periode.dateDebut)
      .lte('date_facture', periode.dateFin);
    if (clinicId) facturesQuery = facturesQuery.eq('clinic_id', clinicId);
    const { data: factures, error: facturesError } = await facturesQuery;
    if (facturesError) throw facturesError;

    let paiementsQuery = supabase
      .from('paiements')
      .select('*')
      .gte('date_paiement', periode.dateDebut)
      .lte('date_paiement', periode.dateFin);
    if (clinicId) paiementsQuery = paiementsQuery.eq('clinic_id', clinicId);
    const { data: paiements, error: paiementsError } = await paiementsQuery;
    if (paiementsError) throw paiementsError;

    // Recettes par service
    const recettesParService: Record<string, number> = {};
    factures?.forEach(f => {
      const service = f.service_origine || 'autre';
      recettesParService[service] = (recettesParService[service] || 0) + f.montant_total;
    });

    // Recettes par utilisateur (caissier)
    const recettesParUtilisateur: Record<string, number> = {};
    factures?.forEach(f => {
      if (f.caissier_id) {
        recettesParUtilisateur[f.caissier_id] = (recettesParUtilisateur[f.caissier_id] || 0) + f.montant_total;
      }
    });

    // Statistiques mensuelles
    const statsMensuelles: Record<string, { totalFacture: number; totalPaye: number; nombreFactures: number }> = {};
    factures?.forEach(f => {
      const mois = f.date_facture.substring(0, 7); // YYYY-MM
      if (!statsMensuelles[mois]) {
        statsMensuelles[mois] = { totalFacture: 0, totalPaye: 0, nombreFactures: 0 };
      }
      statsMensuelles[mois].totalFacture += f.montant_total;
      statsMensuelles[mois].nombreFactures += 1;
    });

    paiements?.forEach(p => {
      const mois = p.date_paiement.substring(0, 7);
      if (statsMensuelles[mois]) {
        statsMensuelles[mois].totalPaye += p.montant;
      }
    });

    // État des paiements (regroupement par type)
    const orangeMoney = paiements?.filter(p => p.mode_paiement === 'orange_money').reduce((sum, p) => sum + p.montant, 0) || 0;
    const mtnMobileMoney = paiements?.filter(p => p.mode_paiement === 'mtn_mobile_money').reduce((sum, p) => sum + p.montant, 0) || 0;
    const moovMoney = paiements?.filter(p => p.mode_paiement === 'moov_money').reduce((sum, p) => sum + p.montant, 0) || 0;
    const waveMoney = paiements?.filter(p => p.mode_paiement === 'wave').reduce((sum, p) => sum + p.montant, 0) || 0;
    const floozMoney = paiements?.filter(p => p.mode_paiement === 'flooz').reduce((sum, p) => sum + p.montant, 0) || 0;
    const tMoney = paiements?.filter(p => p.mode_paiement === 't_money').reduce((sum, p) => sum + p.montant, 0) || 0;
    
    const etatPaiements = {
      especes: paiements?.filter(p => p.mode_paiement === 'especes').reduce((sum, p) => sum + p.montant, 0) || 0,
      mobile_money: orangeMoney + mtnMobileMoney + moovMoney + waveMoney + floozMoney + tMoney,
      orange_money: orangeMoney,
      mtn_mobile_money: mtnMobileMoney,
      moov_money: moovMoney,
      wave: waveMoney,
      flooz: floozMoney,
      t_money: tMoney,
      carte_bancaire: paiements?.filter(p => p.mode_paiement === 'carte_bancaire').reduce((sum, p) => sum + p.montant, 0) || 0,
      virement: paiements?.filter(p => p.mode_paiement === 'virement').reduce((sum, p) => sum + p.montant, 0) || 0,
      cheque: paiements?.filter(p => p.mode_paiement === 'cheque').reduce((sum, p) => sum + p.montant, 0) || 0,
      prise_en_charge: paiements?.filter(p => p.mode_paiement === 'prise_en_charge').reduce((sum, p) => sum + p.montant, 0) || 0,
    };

    // Factures impayées
    const facturesImpayees = factures?.filter(f => 
      f.statut === 'en_attente' || f.statut === 'en_credit' || f.statut === 'partiellement_payee'
    ) || [];

    // Bilan de trésorerie
    const entree = paiements?.reduce((sum, p) => sum + p.montant, 0) || 0;
    const sortie = 0; // À implémenter avec les dépenses
    const solde = entree - sortie;

    return {
      periode,
      recettesParService,
      recettesParUtilisateur,
      statistiquesMensuelles: Object.entries(statsMensuelles).map(([mois, stats]) => ({
        mois,
        ...stats
      })),
      etatPaiements,
      facturesImpayees,
      bilanTresorerie: {
        entree,
        sortie,
        solde
      }
    };
  }

  // ============================================
  // 11. ALERTES DE CAISSE
  // ============================================

  static async verifierAlerteCaisse(date: string, seuil: number): Promise<boolean> {
    const rapport = await this.getRapportJournalier(date);
    const totalRecettes = rapport.journal?.total_recettes || 0;
    return totalRecettes >= seuil;
  }

  // ============================================
  // 12. GESTION MULTIDEVISE
  // ============================================

  static convertirMontant(montant: number, deviseSource: 'FCFA' | 'USD' | 'EUR', deviseCible: 'FCFA' | 'USD' | 'EUR'): number {
    // Taux de change approximatifs (à mettre à jour avec des taux réels)
    const tauxChange: Record<string, number> = {
      'FCFA_USD': 0.0017, // 1 FCFA = 0.0017 USD
      'FCFA_EUR': 0.0015,  // 1 FCFA = 0.0015 EUR
      'USD_FCFA': 600,    // 1 USD = 600 FCFA
      'EUR_FCFA': 656,    // 1 EUR = 656 FCFA
    };

    if (deviseSource === deviseCible) return montant;

    const cle = `${deviseSource}_${deviseCible}`;
    const taux = tauxChange[cle] || 1;

    return montant * taux;
  }

  // ============================================
  // 13. FACTURATION NORMALISÉE DGI
  // ============================================

  static async genererQRCodeFacture(facture: Facture, configDGI: ConfigDGI): Promise<string> {
    if (!configDGI.actif || !configDGI.generer_qr_code) {
      return '';
    }

    // Structure des données pour le QR code DGI
    const donneesQR = {
      numero_facture: facture.numero_facture,
      date_facture: facture.date_facture,
      montant_total: facture.montant_total,
      numero_ifu: configDGI.numero_ifu,
      numero_autorisation: configDGI.numero_autorisation_dgi,
      identifiant_contribuable: facture.identifiant_contribuable
    };

    // En production, utiliser une bibliothèque de génération de QR code
    // Pour l'instant, on retourne une chaîne JSON encodée
    return JSON.stringify(donneesQR);
  }

  static async mettreAJourFactureDGI(factureId: string, configDGI: ConfigDGI): Promise<void> {
    const facture = await this.getFactureById(factureId);
    const { getMyClinicId } = await import('./clinicService');
    const clinicId = await getMyClinicId();

    if (configDGI.actif) {
      const qrCode = await this.genererQRCodeFacture(facture, configDGI);
      let updateQuery = supabase
        .from('factures')
        .update({
          numero_fiscal: configDGI.numero_ifu,
          qr_code: qrCode,
          identifiant_contribuable: configDGI.numero_autorisation_dgi,
          updated_at: new Date().toISOString()
        })
        .eq('id', factureId);
      if (clinicId) updateQuery = updateQuery.eq('clinic_id', clinicId);
      const { error } = await updateQuery;
      if (error) throw error;
    }
  }

  // ============================================
  // 14. EXPORT VERS COMPTABILITÉ
  // ============================================

  static async exporterVersComptabilite(mois: string): Promise<any> {
    const dateDebut = `${mois}-01`;
    const dateFin = `${mois}-31`;

    const { data: factures, error: facturesError } = await supabase
      .from('factures')
      .select('*')
      .gte('date_facture', dateDebut)
      .lte('date_facture', dateFin);

    if (facturesError) throw facturesError;

    const { data: paiements, error: paiementsError } = await supabase
      .from('paiements')
      .select('*')
      .gte('date_paiement', dateDebut)
      .lte('date_paiement', dateFin);

    if (paiementsError) throw paiementsError;

    // Format pour export comptable (CSV ou JSON)
    return {
      periode: { dateDebut, dateFin },
      factures: factures?.map(f => ({
        numero: f.numero_facture,
        date: f.date_facture,
        montant: f.montant_total,
        statut: f.statut
      })),
      paiements: paiements?.map(p => ({
        numero: p.numero_paiement,
        date: p.date_paiement,
        montant: p.montant,
        mode: p.mode_paiement
      })),
      totalFacture: factures?.reduce((sum, f) => sum + f.montant_total, 0) || 0,
      totalPaye: paiements?.reduce((sum, p) => sum + p.montant, 0) || 0
    };
  }
}

