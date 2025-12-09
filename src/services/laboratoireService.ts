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
}

export interface LabPrelevement {
  id: string;
  prescription_id: string;
  code_unique: string;
  type_echantillon: string;
  date_prelevement: string;
  agent_preleveur?: string;
  commentaires?: string;
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

export class LaboratoireService {
  static async createPrescription(form: LabPrescriptionForm): Promise<LabPrescription> {
    const payload = { ...form } as any;
    if (!payload.origine) payload.origine = 'consultation';
    if (!payload.date_prescription) payload.date_prescription = new Date().toISOString();
    if (!payload.statut) payload.statut = 'prescrit';
    const { data, error } = await supabase
      .from('lab_prescriptions')
      .insert([payload])
      .select('*')
      .single();
    if (error) throw error;
    return data as LabPrescription;
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
}


