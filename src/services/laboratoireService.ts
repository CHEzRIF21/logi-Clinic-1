import { supabase } from './supabase';

export interface LabPrescription {
  id: string;
  patient_id: string;
  prescripteur?: string;
  service_prescripteur?: string;
  type_examen: string;
  details?: string;
  date_prescription: string;
  origine: 'consultation' | 'urgence' | 'labo';
  statut: 'prescrit' | 'preleve' | 'annule';
  montant_total?: number;
  statut_paiement?: 'non_paye' | 'en_attente' | 'paye' | 'partiel';
  facture_id?: string;
  ticket_facturation_id?: string;
  consultation_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LabPrescriptionForm {
  patient_id: string;
  prescripteur?: string;
  service_prescripteur?: string;
  type_examen: string;
  details?: string;
  origine?: 'consultation' | 'urgence' | 'labo';
  date_prescription?: string;
  montant_total?: number;
  consultation_id?: string;
  analyses_selectionnees?: Array<{
    numero: string;
    nom: string;
    code?: string;
    prix: number;
    tube: string;
  }>;
}

export interface LabPrescriptionAnalyse {
  id: string;
  prescription_id: string;
  numero_analyse: string;
  nom_analyse: string;
  code_analyse?: string;
  prix: number;
  tube_requis?: string;
  quantite: number;
  montant_ligne: number;
  created_at: string;
  updated_at: string;
}

export interface LabPrelevement {
  id: string;
  prescription_id: string;
  code_unique: string;
  type_echantillon: string;
  date_prelevement: string;
  agent_preleveur?: string;
  commentaires?: string;
  statut_echantillon?: 'conforme' | 'non_conforme' | 'rejete';
  motif_rejet?: string;
  date_rejet?: string;
  agent_rejet?: string;
  created_at: string;
  updated_at: string;
}

export interface LabPrelevementForm {
  prescription_id: string;
  code_unique: string;
  type_echantillon: string;
  date_prelevement?: string;
  agent_preleveur?: string;
  commentaires?: string;
}

export interface LabAnalyse {
  id: string;
  prelevement_id: string;
  parametre: string;
  type_resultat: 'qualitatif' | 'quantitatif';
  unite?: string;
  valeur_numerique?: number | null;
  valeur_qualitative?: string | null;
  bornes_reference?: string | null;
  valeur_min_reference?: number | null;
  valeur_max_reference?: number | null;
  est_pathologique?: boolean;
  resultat_precedent_id?: string | null;
  valeur_precedente_numerique?: number | null;
  valeur_precedente_qualitative?: string | null;
  date_resultat_precedent?: string | null;
  evolution?: 'amelioration' | 'stabilite' | 'aggravation' | 'nouveau';
  statut: 'en_attente' | 'en_cours' | 'termine';
  technicien?: string | null;
  valide_par?: string | null;
  date_validation?: string | null;
  commentaires?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabAnalyseForm {
  prelevement_id: string;
  parametre: string;
  type_resultat: 'qualitatif' | 'quantitatif';
  unite?: string;
  valeur_numerique?: number;
  valeur_qualitative?: string;
  bornes_reference?: string;
  technicien?: string;
  commentaires?: string;
  consumable_medicament_id?: string;
  consumable_lot_numero?: string;
  consumable_quantite?: number;
}

export interface LabRapport {
  id: string;
  prelevement_id: string;
  numero_rapport: string;
  statut: 'brouillon' | 'signe' | 'transmis';
  signe_par?: string;
  signature_electronique?: string;
  date_generation: string;
  date_signature?: string;
  date_transmission?: string;
  destinataire?: string;
  created_at: string;
  updated_at: string;
}

export interface LabModeleExamen {
  id: string;
  code_examen: string;
  libelle_examen: string;
  type_examen: string;
  parametres: Array<{
    nom: string;
    unite?: string;
    type: 'qualitatif' | 'quantitatif';
    ref_min?: number;
    ref_max?: number;
    ref_selon_age_sexe?: boolean;
    valeurs_possibles?: string[];
    condition?: string;
  }>;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabValeurReference {
  id: string;
  parametre: string;
  sexe: 'Masculin' | 'Féminin' | 'Tous';
  age_min?: number;
  age_max?: number;
  valeur_min?: number;
  valeur_max?: number;
  unite?: string;
  commentaire?: string;
}

export interface LabStockReactif {
  id: string;
  medicament_id?: string;
  code_reactif: string;
  libelle: string;
  unite: string;
  quantite_disponible: number;
  seuil_alerte: number;
  date_peremption?: string;
  fournisseur?: string;
  numero_lot?: string;
  actif: boolean;
}

export interface LabAlerte {
  id: string;
  type_alerte: 'resultat_critique' | 'appareil_defaut' | 'stock_critique' | 'peremption' | 'autre';
  priorite: 'faible' | 'moyenne' | 'haute' | 'critique';
  titre: string;
  message: string;
  analyse_id?: string;
  reactif_id?: string;
  appareil?: string;
  statut: 'nouvelle' | 'en_cours' | 'resolue' | 'ignoree';
  date_alerte: string;
  date_resolution?: string;
  resolu_par?: string;
}

export class LaboratoireService {
  static async createPrescription(form: LabPrescriptionForm): Promise<LabPrescription> {
    const payload: any = { ...form };
    
    // Calculer le montant total si des analyses sont sélectionnées
    if (form.analyses_selectionnees && form.analyses_selectionnees.length > 0) {
      payload.montant_total = form.analyses_selectionnees.reduce((sum, a) => sum + a.prix, 0);
    } else if (form.montant_total) {
      payload.montant_total = form.montant_total;
    } else {
      payload.montant_total = 0;
    }
    
    // Valeurs par défaut
    if (!payload.origine) payload.origine = 'consultation';
    if (!payload.date_prescription) payload.date_prescription = new Date().toISOString();
    if (!payload.statut) payload.statut = 'prescrit';
    if (!payload.statut_paiement) payload.statut_paiement = 'non_paye';
    
    // Supprimer analyses_selectionnees du payload (on va les insérer séparément)
    const analyses = payload.analyses_selectionnees;
    delete payload.analyses_selectionnees;
    
    // Créer la prescription
    const { data: prescription, error } = await supabase
      .from('lab_prescriptions')
      .insert([payload])
      .select('*')
      .single();
    
    if (error) throw error;
    
    // Insérer les analyses sélectionnées si présentes
    if (analyses && analyses.length > 0 && prescription) {
      const analysesToInsert = analyses.map(a => ({
        prescription_id: prescription.id,
        numero_analyse: a.numero,
        nom_analyse: a.nom,
        code_analyse: a.code || a.nom.toUpperCase().replace(/\s+/g, '_'),
        prix: a.prix,
        tube_requis: a.tube,
        quantite: 1,
        montant_ligne: a.prix
      }));
      
      const { error: analysesError } = await supabase
        .from('lab_prescriptions_analyses')
        .insert(analysesToInsert);
      
      if (analysesError) {
        console.error('Erreur lors de l\'insertion des analyses:', analysesError);
        // Ne pas échouer la création de la prescription si les analyses échouent
      }
    }
    
    return prescription as LabPrescription;
  }
  
  /**
   * Récupère les analyses associées à une prescription
   */
  static async getPrescriptionAnalyses(prescriptionId: string): Promise<LabPrescriptionAnalyse[]> {
    const { data, error } = await supabase
      .from('lab_prescriptions_analyses')
      .select('*')
      .eq('prescription_id', prescriptionId)
      .order('numero_analyse');
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Ajoute une analyse à une prescription existante
   */
  static async addAnalyseToPrescription(
    prescriptionId: string,
    analyse: { numero: string; nom: string; code?: string; prix: number; tube: string }
  ): Promise<LabPrescriptionAnalyse> {
    const { data, error } = await supabase
      .from('lab_prescriptions_analyses')
      .insert([{
        prescription_id: prescriptionId,
        numero_analyse: analyse.numero,
        nom_analyse: analyse.nom,
        code_analyse: analyse.code || analyse.nom.toUpperCase().replace(/\s+/g, '_'),
        prix: analyse.prix,
        tube_requis: analyse.tube,
        quantite: 1,
        montant_ligne: analyse.prix
      }])
      .select('*')
      .single();
    
    if (error) throw error;
    return data as LabPrescriptionAnalyse;
  }
  
  /**
   * Supprime une analyse d'une prescription
   */
  static async removeAnalyseFromPrescription(prescriptionId: string, analyseId: string): Promise<void> {
    const { error } = await supabase
      .from('lab_prescriptions_analyses')
      .delete()
      .eq('id', analyseId)
      .eq('prescription_id', prescriptionId);
    
    if (error) throw error;
  }

  static async listPrescriptions(patientId?: string): Promise<LabPrescription[]> {
    let query = supabase.from('lab_prescriptions').select('*').order('date_prescription', { ascending: false });
    if (patientId) query = query.eq('patient_id', patientId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getPrescriptionById(id: string): Promise<LabPrescription | null> {
    const { data, error } = await supabase
      .from('lab_prescriptions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as LabPrescription | null;
  }

  static async updatePrescription(id: string, updates: Partial<LabPrescriptionForm>): Promise<LabPrescription> {
    const { data, error } = await supabase
      .from('lab_prescriptions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as LabPrescription;
  }

  static async cancelPrescription(id: string): Promise<LabPrescription> {
    const { data, error } = await supabase
      .from('lab_prescriptions')
      .update({ statut: 'annule' })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as LabPrescription;
  }

  static async getPrescriptionsByStatus(statut: 'prescrit' | 'preleve' | 'annule'): Promise<LabPrescription[]> {
    const { data, error } = await supabase
      .from('lab_prescriptions')
      .select('*')
      .eq('statut', statut)
      .order('date_prescription', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getPrescriptionsByType(type_examen: string): Promise<LabPrescription[]> {
    const { data, error } = await supabase
      .from('lab_prescriptions')
      .select('*')
      .eq('type_examen', type_examen)
      .order('date_prescription', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createPrelevement(form: LabPrelevementForm): Promise<LabPrelevement> {
    const toInsert = { ...form } as any;
    if (!toInsert.code_unique) {
      toInsert.code_unique = `PL-${Date.now().toString(36).toUpperCase()}`;
    }
    if (!toInsert.date_prelevement) {
      toInsert.date_prelevement = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('lab_prelevements')
      .insert([toInsert])
      .select('*')
      .single();
    if (error) throw error;

    // Mettre à jour le statut de la prescription
    await supabase.from('lab_prescriptions').update({ statut: 'preleve' }).eq('id', form.prescription_id);
    return data as LabPrelevement;
  }

  static async listPrelevements(prescriptionId?: string): Promise<LabPrelevement[]> {
    let query = supabase.from('lab_prelevements').select('*').order('date_prelevement', { ascending: false });
    if (prescriptionId) query = query.eq('prescription_id', prescriptionId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getPrelevementById(id: string): Promise<LabPrelevement | null> {
    const { data, error } = await supabase
      .from('lab_prelevements')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as LabPrelevement | null;
  }

  static async updatePrelevement(id: string, updates: Partial<LabPrelevementForm>): Promise<LabPrelevement> {
    const { data, error } = await supabase
      .from('lab_prelevements')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as LabPrelevement;
  }

  static async getPrelevementsByAgent(agent_preleveur: string): Promise<LabPrelevement[]> {
    const { data, error } = await supabase
      .from('lab_prelevements')
      .select('*')
      .eq('agent_preleveur', agent_preleveur)
      .order('date_prelevement', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getPrelevementsByTypeEchantillon(type_echantillon: string): Promise<LabPrelevement[]> {
    const { data, error } = await supabase
      .from('lab_prelevements')
      .select('*')
      .eq('type_echantillon', type_echantillon)
      .order('date_prelevement', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async searchPrelevementsByCode(code_unique: string): Promise<LabPrelevement[]> {
    const { data, error } = await supabase
      .from('lab_prelevements')
      .select('*')
      .ilike('code_unique', `%${code_unique}%`)
      .order('date_prelevement', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async generateUniqueCode(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PL-${timestamp}-${random}`;
  }

  static async validatePrelevementCode(code_unique: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('lab_prelevements')
      .select('id')
      .eq('code_unique', code_unique)
      .single();
    return !data; // true si le code n'existe pas (disponible)
  }

  // Phase 2 - Analyses
  static async createAnalyse(form: LabAnalyseForm): Promise<LabAnalyse> {
    const { data, error } = await supabase
      .from('lab_analyses')
      .insert([{ ...form }])
      .select('*')
      .single();
    if (error) throw error;
    // Déduction de consommables si fourni
    if (form.consumable_medicament_id && form.consumable_quantite && form.consumable_quantite > 0) {
      await this.deductConsumable(form.consumable_medicament_id, form.consumable_quantite, form.consumable_lot_numero);
    }
    return data as LabAnalyse;
  }

  static async updateAnalyse(id: string, patch: Partial<LabAnalyseForm & { statut: LabAnalyse['statut']; valeur_numerique?: number; valeur_qualitative?: string; valide_par?: string; date_validation?: string; }>): Promise<LabAnalyse> {
    const { data, error } = await supabase
      .from('lab_analyses')
      .update(patch as any)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as LabAnalyse;
  }

  static async listAnalyses(prelevementId: string): Promise<LabAnalyse[]> {
    const { data, error } = await supabase
      .from('lab_analyses')
      .select('*')
      .eq('prelevement_id', prelevementId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // Rapports
  static async generateRapport(prelevementId: string): Promise<LabRapport> {
    const numero = `LAB-${Date.now()}`;
    const { data, error } = await supabase
      .from('lab_rapports')
      .insert([{ prelevement_id: prelevementId, numero_rapport: numero }])
      .select('*')
      .single();
    if (error) throw error;
    return data as LabRapport;
  }

  static async signRapport(id: string, responsable: string): Promise<LabRapport> {
    const { data, error } = await supabase
      .from('lab_rapports')
      .update({ statut: 'signe', signe_par: responsable, date_signature: new Date().toISOString(), signature_electronique: 'HASH_PLACEHOLDER' })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as LabRapport;
  }

  static async transmitRapport(id: string, destinataire = 'Consultation'): Promise<LabRapport> {
    const { data, error } = await supabase
      .from('lab_rapports')
      .update({ statut: 'transmis', destinataire, date_transmission: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as LabRapport;
  }

  static async listRapports(prelevementId: string): Promise<LabRapport[]> {
    const { data, error } = await supabase
      .from('lab_rapports')
      .select('*')
      .eq('prelevement_id', prelevementId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Phase 3 - Consommables et alertes
  static async deductConsumable(medicament_id: string, quantite: number, numero_lot?: string) {
    // Utilise FEFO ou le lot fourni
    if (numero_lot) {
      const { data: lot, error } = await supabase
        .from('lots')
        .select('id, quantite_disponible, date_expiration')
        .eq('medicament_id', medicament_id)
        .eq('numero_lot', numero_lot)
        .eq('statut', 'actif')
        .maybeSingle();
      if (error) throw error;
      if (lot) {
        const newQty = Math.max(0, (lot.quantite_disponible || 0) - quantite);
        await supabase.from('lots').update({ quantite_disponible: newQty }).eq('id', lot.id);
        await supabase.from('mouvements_stock').insert([{
          type: 'dispensation', medicament_id, lot_id: lot.id, quantite,
          quantite_avant: lot.quantite_disponible, quantite_apres: newQty,
          motif: 'Consommable labo', utilisateur_id: 'system', date_mouvement: new Date().toISOString(),
          magasin_source: 'detail', magasin_destination: 'service'
        }]);
        return;
      }
    }
    const { data: lots, error: lerr } = await supabase
      .from('lots')
      .select('id, quantite_disponible, date_expiration')
      .eq('medicament_id', medicament_id)
      .eq('statut', 'actif')
      .eq('magasin', 'detail')
      .gt('quantite_disponible', 0)
      .order('date_expiration', { ascending: true });
    if (lerr) throw lerr;
    let remaining = quantite;
    for (const lot of lots || []) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, lot.quantite_disponible || 0);
      const newQty = (lot.quantite_disponible || 0) - take;
      await supabase.from('lots').update({ quantite_disponible: newQty }).eq('id', lot.id);
      await supabase.from('mouvements_stock').insert([{
        type: 'dispensation', medicament_id, lot_id: lot.id, quantite: take,
        quantite_avant: lot.quantite_disponible, quantite_apres: newQty,
        motif: 'Consommable labo', utilisateur_id: 'system', date_mouvement: new Date().toISOString(),
        magasin_source: 'detail', magasin_destination: 'service'
      }]);
      remaining -= take;
    }
  }

  static async getConsumableAlertsForVaccinesAndLab(): Promise<{ type: 'rupture' | 'seuil_bas' | 'peremption'; message: string }[]> {
    const alerts: { type: 'rupture' | 'seuil_bas' | 'peremption'; message: string }[] = [];
    // Péremption sous 30j
    const limit = new Date();
    limit.setDate(limit.getDate() + 30);
    const { data: expLots } = await supabase
      .from('lots')
      .select('numero_lot, date_expiration, quantite_disponible')
      .lte('date_expiration', limit.toISOString().slice(0,10))
      .gt('quantite_disponible', 0);
    (expLots || []).forEach(l => alerts.push({ type: 'peremption', message: `Lot ${l.numero_lot} expire le ${l.date_expiration}` }));
    return alerts;
  }

  static detectCriticalResult(a: LabAnalyse): string | null {
    // Règles simples:
    // - VIH positif, Paludisme positif => critique
    // - Glycémie > 3.0 g/L (300 mg/dL) => critique
    const param = (a.parametre || '').toLowerCase();
    if (a.type_resultat === 'qualitatif') {
      const val = (a.valeur_qualitative || '').toLowerCase();
      if ((param.includes('vih') || param.includes('palud') || param.includes('pal') || param.includes('malaria')) && (val.includes('positif') || val.includes('positive'))) {
        return `Résultat critique: ${a.parametre} ${a.valeur_qualitative}`;
      }
    } else if (a.type_resultat === 'quantitatif') {
      const val = a.valeur_numerique || 0;
      if (param.includes('glyc') && val > 3.0) {
        return `Résultat critique: ${a.parametre} ${val} ${a.unite || ''}`.trim();
      }
    }
    return null;
  }

  // Phase 4 - Rapports et statistiques
  static async getLabStats(params: { from?: string; to?: string }) {
    const from = params.from || '1900-01-01';
    const to = params.to || '2999-12-31';

    // Prescriptions dans la période
    const { data: rx, error: rxErr } = await supabase
      .from('lab_prescriptions')
      .select('id, service_prescripteur, type_examen, date_prescription')
      .gte('date_prescription', from)
      .lte('date_prescription', to);
    if (rxErr) throw rxErr;

    const prescriptionsTotal = rx?.length || 0;
    const byService: Record<string, number> = {};
    const byType: Record<string, number> = {};
    (rx || []).forEach(r => {
      if (r.service_prescripteur) byService[r.service_prescripteur] = (byService[r.service_prescripteur] || 0) + 1;
      byType[r.type_examen] = (byType[r.type_examen] || 0) + 1;
    });

    // Délais moyens = (validation - prélèvement)
    const { data: pl, error: plErr } = await supabase
      .from('lab_prelevements')
      .select('id, date_prelevement')
      .gte('date_prelevement', from)
      .lte('date_prelevement', to);
    if (plErr) throw plErr;
    const prelevementIds = (pl || []).map(p => p.id);
    let avgDelayHours = 0;
    if (prelevementIds.length > 0) {
      const { data: analyses, error: anErr } = await supabase
        .from('lab_analyses')
        .select('prelevement_id, date_validation')
        .in('prelevement_id', prelevementIds);
      if (anErr) throw anErr;
      const plMap = new Map<string, Date>();
      (pl || []).forEach(p => plMap.set(p.id, new Date(p.date_prelevement)));
      const delays: number[] = [];
      (analyses || []).forEach(a => {
        if (a.date_validation && a.prelevement_id && plMap.has(a.prelevement_id)) {
          const start = plMap.get(a.prelevement_id)!;
          const end = new Date(a.date_validation);
          delays.push((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        }
      });
      if (delays.length > 0) avgDelayHours = delays.reduce((s, v) => s + v, 0) / delays.length;
    }

    // Consommation de réactifs/tests rapides via mouvements_stock motif 'Consommable labo'
    const { data: moves } = await supabase
      .from('mouvements_stock')
      .select('medicament_id, quantite, motif, date_mouvement')
      .eq('motif', 'Consommable labo')
      .gte('date_mouvement', from)
      .lte('date_mouvement', to);
    const totalConsumptions = (moves || []).reduce((s, m) => s + (m.quantite || 0), 0);

    // Taux de positivité (paludisme, VIH) sur analyses qualitatives
    const { data: qa } = await supabase
      .from('lab_analyses')
      .select('parametre, valeur_qualitative, type_resultat, created_at')
      .eq('type_resultat', 'qualitatif')
      .gte('created_at', from)
      .lte('created_at', to);
    const diseases = ['palud', 'pal', 'malaria', 'vih'];
    let totalRelevant = 0;
    let totalPositive = 0;
    (qa || []).forEach(a => {
      const p = (a.parametre || '').toLowerCase();
      if (diseases.some(d => p.includes(d))) {
        totalRelevant++;
        const v = (a.valeur_qualitative || '').toLowerCase();
        if (v.includes('positif') || v.includes('positive')) totalPositive++;
      }
    });
    const positivityRate = totalRelevant > 0 ? (totalPositive / totalRelevant) * 100 : 0;

    // Analyses réalisées (terminées) par période
    const { data: analysesDone } = await supabase
      .from('lab_analyses')
      .select('id, statut, parametre, date_validation')
      .eq('statut', 'termine')
      .gte('created_at', from)
      .lte('created_at', to);
    const analysesCompleted = analysesDone?.length || 0;
    const byTypeAnalyses: Record<string, number> = {};
    (analysesDone || []).forEach(a => {
      const key = a.parametre || 'Autre';
      byTypeAnalyses[key] = (byTypeAnalyses[key] || 0) + 1;
    });

    return { prescriptionsTotal, byService, byType, avgDelayHours, totalConsumptions, positivityRate, analysesCompleted, byTypeAnalyses };
  }

  // Phase 3 - Nouvelles fonctionnalités améliorées

  // Gestion du rejet d'échantillons
  static async rejeterEchantillon(prelevementId: string, motif: string, agent: string): Promise<LabPrelevement> {
    const { data, error } = await supabase
      .from('lab_prelevements')
      .update({
        statut_echantillon: 'rejete',
        motif_rejet: motif,
        agent_rejet: agent,
        date_rejet: new Date().toISOString()
      })
      .eq('id', prelevementId)
      .select('*')
      .single();
    if (error) throw error;
    return data as LabPrelevement;
  }

  // Récupération des modèles d'examens
  static async getModelesExamens(): Promise<LabModeleExamen[]> {
    const { data, error } = await supabase
      .from('lab_modeles_examens')
      .select('*')
      .eq('actif', true)
      .order('libelle_examen');
    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      parametres: typeof d.parametres === 'string' ? JSON.parse(d.parametres) : d.parametres
    })) as LabModeleExamen[];
  }

  static async getModeleExamenByCode(code: string): Promise<LabModeleExamen | null> {
    const { data, error } = await supabase
      .from('lab_modeles_examens')
      .select('*')
      .eq('code_examen', code)
      .eq('actif', true)
      .single();
    if (error) return null;
    return {
      ...data,
      parametres: typeof data.parametres === 'string' ? JSON.parse(data.parametres) : data.parametres
    } as LabModeleExamen;
  }

  // Récupération des valeurs de référence selon âge et sexe
  static async getValeursReference(parametre: string, age?: number, sexe?: 'Masculin' | 'Féminin'): Promise<LabValeurReference | null> {
    let query = supabase
      .from('lab_valeurs_reference')
      .select('*')
      .eq('parametre', parametre);
    
    // Filtrer par sexe si fourni
    if (sexe) {
      query = query.or(`sexe.eq.${sexe},sexe.eq.Tous`);
    } else {
      query = query.eq('sexe', 'Tous');
    }
    
    // Filtrer par âge si fourni
    if (age !== undefined) {
      query = query.or(`age_min.is.null,age_min.lte.${age}`)
                   .or(`age_max.is.null,age_max.gte.${age}`);
    }
    
    const { data, error } = await query.order('age_min', { ascending: true }).limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0] as LabValeurReference;
  }

  // Création d'analyse avec valeurs de référence automatiques et Delta Check
  static async createAnalyseAvecReference(
    form: LabAnalyseForm,
    patientAge?: number,
    patientSexe?: 'Masculin' | 'Féminin'
  ): Promise<LabAnalyse> {
    // Récupérer les valeurs de référence si quantitatif
    let valeurMinRef: number | undefined;
    let valeurMaxRef: number | undefined;
    
    if (form.type_resultat === 'quantitatif' && form.parametre) {
      const ref = await this.getValeursReference(form.parametre, patientAge, patientSexe);
      if (ref) {
        valeurMinRef = ref.valeur_min || undefined;
        valeurMaxRef = ref.valeur_max || undefined;
      }
    }

    // Chercher le résultat précédent pour Delta Check
    let resultatPrecedent: LabAnalyse | null = null;
    if (form.prelevement_id) {
      // Récupérer le prélèvement pour obtenir le patient_id
      const prelevement = await this.getPrelevementById(form.prelevement_id);
      if (prelevement) {
        const prescription = await this.getPrescriptionById(prelevement.prescription_id);
        if (prescription) {
          // Chercher le dernier résultat pour ce paramètre chez ce patient
          const { data: analysesPrecedentes } = await supabase
            .from('lab_analyses')
            .select('*, lab_prelevements!inner(prescription_id), lab_prescriptions!inner(patient_id)')
            .eq('lab_prescriptions.patient_id', prescription.patient_id)
            .eq('parametre', form.parametre)
            .neq('prelevement_id', form.prelevement_id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (analysesPrecedentes && analysesPrecedentes.length > 0) {
            resultatPrecedent = analysesPrecedentes[0] as LabAnalyse;
          }
        }
      }
    }

    // Calculer l'évolution si résultat précédent existe
    let evolution: 'amelioration' | 'stabilite' | 'aggravation' | 'nouveau' = 'nouveau';
    let valeurPrecedenteNum: number | undefined;
    let valeurPrecedenteQual: string | undefined;
    
    if (resultatPrecedent) {
      valeurPrecedenteNum = resultatPrecedent.valeur_numerique || undefined;
      valeurPrecedenteQual = resultatPrecedent.valeur_qualitative || undefined;
      
      if (form.type_resultat === 'quantitatif' && form.valeur_numerique !== undefined && valeurPrecedenteNum !== undefined) {
        const diff = form.valeur_numerique - valeurPrecedenteNum;
        const tolerance = (valeurMaxRef && valeurMinRef) ? (valeurMaxRef - valeurMinRef) * 0.1 : 0;
        if (Math.abs(diff) <= tolerance) {
          evolution = 'stabilite';
        } else if (diff < 0) {
          evolution = 'amelioration';
        } else {
          evolution = 'aggravation';
        }
      }
    }

    // Créer l'analyse avec toutes les informations
    const analyseData: any = {
      ...form,
      valeur_min_reference: valeurMinRef,
      valeur_max_reference: valeurMaxRef,
      resultat_precedent_id: resultatPrecedent?.id || null,
      valeur_precedente_numerique: valeurPrecedenteNum,
      valeur_precedente_qualitative: valeurPrecedenteQual,
      date_resultat_precedent: resultatPrecedent?.created_at || null,
      evolution
    };

    const { data, error } = await supabase
      .from('lab_analyses')
      .insert([analyseData])
      .select('*')
      .single();
    
    if (error) throw error;
    
    // Déduction automatique de réactifs si fourni
    if (form.consumable_medicament_id && form.consumable_quantite && form.consumable_quantite > 0) {
      await this.deductConsumable(form.consumable_medicament_id, form.consumable_quantite, form.consumable_lot_numero);
    }
    
    return data as LabAnalyse;
  }

  // Récupération des alertes
  static async getAlertes(statut?: LabAlerte['statut']): Promise<LabAlerte[]> {
    let query = supabase.from('lab_alertes').select('*').order('date_alerte', { ascending: false });
    if (statut) query = query.eq('statut', statut);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async resoudreAlerte(alerteId: string, resoluPar: string): Promise<LabAlerte> {
    const { data, error } = await supabase
      .from('lab_alertes')
      .update({
        statut: 'resolue',
        resolu_par: resoluPar,
        date_resolution: new Date().toISOString()
      })
      .eq('id', alerteId)
      .select('*')
      .single();
    if (error) throw error;
    return data as LabAlerte;
  }

  // Gestion des stocks de réactifs
  static async getStocksReactifs(): Promise<LabStockReactif[]> {
    const { data, error } = await supabase
      .from('lab_stocks_reactifs')
      .select('*')
      .eq('actif', true)
      .order('libelle');
    if (error) throw error;
    return data || [];
  }

  static async getStocksReactifsAlerte(): Promise<LabStockReactif[]> {
    const { data, error } = await supabase
      .from('lab_stocks_reactifs')
      .select('*')
      .eq('actif', true)
      .or(`quantite_disponible.lte.seuil_alerte,date_peremption.lte.${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}`)
      .order('quantite_disponible');
    if (error) throw error;
    return data || [];
  }

  static async getStockReactifById(id: string): Promise<LabStockReactif | null> {
    const { data, error } = await supabase
      .from('lab_stocks_reactifs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as LabStockReactif | null;
  }

  static async createStockReactif(form: Omit<LabStockReactif, 'id'>): Promise<LabStockReactif> {
    const { data, error } = await supabase
      .from('lab_stocks_reactifs')
      .insert([{
        code_reactif: form.code_reactif,
        libelle: form.libelle,
        unite: form.unite,
        quantite_disponible: form.quantite_disponible || 0,
        seuil_alerte: form.seuil_alerte || 0,
        date_peremption: form.date_peremption || null,
        fournisseur: form.fournisseur || null,
        numero_lot: form.numero_lot || null,
        medicament_id: form.medicament_id || null,
        actif: form.actif !== undefined ? form.actif : true
      }])
      .select('*')
      .single();
    if (error) throw error;
    return data as LabStockReactif;
  }

  static async updateStockReactif(id: string, updates: Partial<LabStockReactif>): Promise<LabStockReactif> {
    const { data, error } = await supabase
      .from('lab_stocks_reactifs')
      .update({
        ...(updates.code_reactif !== undefined && { code_reactif: updates.code_reactif }),
        ...(updates.libelle !== undefined && { libelle: updates.libelle }),
        ...(updates.unite !== undefined && { unite: updates.unite }),
        ...(updates.quantite_disponible !== undefined && { quantite_disponible: updates.quantite_disponible }),
        ...(updates.seuil_alerte !== undefined && { seuil_alerte: updates.seuil_alerte }),
        ...(updates.date_peremption !== undefined && { date_peremption: updates.date_peremption }),
        ...(updates.fournisseur !== undefined && { fournisseur: updates.fournisseur }),
        ...(updates.numero_lot !== undefined && { numero_lot: updates.numero_lot }),
        ...(updates.actif !== undefined && { actif: updates.actif })
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as LabStockReactif;
  }

  static async deleteStockReactif(id: string): Promise<void> {
    // Soft delete - on désactive le réactif au lieu de le supprimer
    const { error } = await supabase
      .from('lab_stocks_reactifs')
      .update({ actif: false })
      .eq('id', id);
    if (error) throw error;
  }

  // File d'attente des prélèvements
  static async getFileAttentePrelevements(): Promise<LabPrelevement[]> {
    const { data: prescriptions, error: rxErr } = await supabase
      .from('lab_prescriptions')
      .select('id')
      .eq('statut', 'prescrit')
      .order('date_prescription', { ascending: true });
    
    if (rxErr) throw rxErr;
    const prescriptionIds = (prescriptions || []).map(p => p.id);
    
    if (prescriptionIds.length === 0) return [];
    
    const { data: prelevements, error: plErr } = await supabase
      .from('lab_prelevements')
      .select('*')
      .in('prescription_id', prescriptionIds)
      .order('date_prelevement', { ascending: true });
    
    if (plErr) throw plErr;
    return prelevements || [];
  }

  // Examens en cours (non validés)
  static async getExamensEnCours(): Promise<LabAnalyse[]> {
    const { data, error } = await supabase
      .from('lab_analyses')
      .select('*')
      .in('statut', ['en_attente', 'en_cours'])
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // Génération de code-barres pour étiquettes
  static generateBarcodeData(patientId: string, prelevementId: string): string {
    // Format: PATIENT_ID|PRELEVEMENT_ID|TIMESTAMP
    return `${patientId}|${prelevementId}|${Date.now()}`;
  }
}


