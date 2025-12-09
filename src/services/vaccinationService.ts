import { supabase } from './supabase';

export interface Vaccine {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  voie_administration?: string;
  site_injection?: string;
  age_min_jours?: number;
  age_max_jours?: number | null;
  nb_doses: number;
  intervalle_min_jours?: number | null;
  intervalle_recommande_jours?: number | null;
  rappel_necessaire?: boolean;
  rappel_intervalle_jours?: number | null;
  medicament_id?: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface VaccineSchedule {
  id: string;
  vaccine_id: string;
  dose_ordre: number;
  libelle_dose: string;
  age_recommande_jours: number;
  age_min_jours?: number | null;
  age_max_jours?: number | null;
  delai_rappel_jours?: number | null;
  created_at: string;
  updated_at: string;
}

export interface PatientVaccination {
  id: string;
  patient_id: string;
  vaccine_id: string;
  schedule_id?: string | null;
  dose_ordre: number;
  date_administration: string; // date ISO
  lieu?: string | null;
  numero_lot?: string | null;
  date_peremption?: string | null;
  vaccinateur?: string | null;
  effets_secondaires?: string | null;
  statut: 'valide' | 'annule';
  created_at: string;
  updated_at: string;
}

export interface VaccinationReminder {
  id: string;
  patient_id: string;
  vaccine_id: string;
  schedule_id?: string | null;
  dose_ordre: number;
  planned_at: string;
  channel: 'sms' | 'notification' | 'email';
  statut: 'planifie' | 'envoye' | 'manque' | 'annule';
  details?: string | null;
  created_at: string;
  updated_at: string;
}

export class VaccinationService {
  private static async deductStockIfApplicable(vaccineId: string, providedLot?: { numero_lot?: string | null }): Promise<{ numero_lot?: string | null; date_peremption?: string | null }> {
    // Récupérer le vaccin pour obtenir le medicament_id
    const { data: vaccine, error: vErr } = await supabase
      .from('vaccines')
      .select('id, medicament_id')
      .eq('id', vaccineId)
      .single();
    if (vErr) throw vErr;
    if (!vaccine?.medicament_id) {
      return { numero_lot: providedLot?.numero_lot || undefined, date_peremption: undefined };
    }

    // Si un numéro de lot est fourni, tenter de déduire ce lot
    if (providedLot?.numero_lot) {
      const { data: lotRow, error: lotErr } = await supabase
        .from('lots')
        .select('id, numero_lot, quantite_disponible, date_expiration')
        .eq('numero_lot', providedLot.numero_lot)
        .eq('medicament_id', vaccine.medicament_id)
        .eq('statut', 'actif')
        .gt('quantite_disponible', 0)
        .limit(1)
        .maybeSingle();
      if (lotErr) throw lotErr;
      if (lotRow) {
        const newQty = (lotRow.quantite_disponible || 0) - 1;
        const { error: updErr } = await supabase
          .from('lots')
          .update({ quantite_disponible: newQty < 0 ? 0 : newQty })
          .eq('id', lotRow.id);
        if (updErr) throw updErr;
        // Enregistrer mouvement minimal (optionnel)
        await supabase.from('mouvements_stock').insert([{
          type: 'dispensation',
          medicament_id: vaccine.medicament_id,
          lot_id: lotRow.id,
          quantite: 1,
          quantite_avant: lotRow.quantite_disponible,
          quantite_apres: newQty,
          motif: 'Vaccination',
          utilisateur_id: 'system',
          date_mouvement: new Date().toISOString(),
          magasin_source: 'detail',
          magasin_destination: 'patient',
        }]);
        return { numero_lot: lotRow.numero_lot, date_peremption: lotRow.date_expiration } as any;
      }
    }

    // Trouver le lot FEFO (date d’expiration la plus proche) en magasin détail
    const { data: lots, error: lotsErr } = await supabase
      .from('lots')
      .select('id, numero_lot, quantite_disponible, date_expiration')
      .eq('medicament_id', vaccine.medicament_id)
      .eq('statut', 'actif')
      .eq('magasin', 'detail')
      .gt('quantite_disponible', 0)
      .order('date_expiration', { ascending: true })
      .limit(1);
    if (lotsErr) throw lotsErr;
    const lot = lots?.[0];
    if (!lot) return { numero_lot: providedLot?.numero_lot || undefined, date_peremption: undefined };

    const newQty = (lot.quantite_disponible || 0) - 1;
    const { error: updErr } = await supabase
      .from('lots')
      .update({ quantite_disponible: newQty < 0 ? 0 : newQty })
      .eq('id', lot.id);
    if (updErr) throw updErr;
    await supabase.from('mouvements_stock').insert([{
      type: 'dispensation',
      medicament_id: vaccine.medicament_id,
      lot_id: lot.id,
      quantite: 1,
      quantite_avant: lot.quantite_disponible,
      quantite_apres: newQty,
      motif: 'Vaccination',
      utilisateur_id: 'system',
      date_mouvement: new Date().toISOString(),
      magasin_source: 'detail',
      magasin_destination: 'patient',
    }]);
    return { numero_lot: lot.numero_lot, date_peremption: lot.date_expiration } as any;
  }
  static async listVaccines(): Promise<Vaccine[]> {
    const { data, error } = await supabase
      .from('vaccines')
      .select('*')
      .eq('actif', true)
      .order('libelle', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async getVaccineSchedules(vaccineId: string): Promise<VaccineSchedule[]> {
    const { data, error } = await supabase
      .from('vaccine_schedules')
      .select('*')
      .eq('vaccine_id', vaccineId)
      .order('dose_ordre', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async getPatientCard(patientId: string): Promise<{
    doses: PatientVaccination[];
  }> {
    const { data, error } = await supabase
      .from('patient_vaccinations')
      .select('*')
      .eq('patient_id', patientId)
      .order('date_administration', { ascending: true });
    if (error) throw error;
    return { doses: data || [] };
  }

  static async recordDose(payload: Omit<PatientVaccination, 'id' | 'created_at' | 'updated_at' | 'statut'> & { statut?: 'valide' | 'annule' }): Promise<PatientVaccination> {
    // Déduction de stock si applicable et enrichissement des champs lot/péremption
    const lotInfo = await this.deductStockIfApplicable(payload.vaccine_id, { numero_lot: payload.numero_lot });
    const toInsert = { ...payload } as any;
    if (!toInsert.numero_lot && lotInfo.numero_lot) toInsert.numero_lot = lotInfo.numero_lot;
    if (!toInsert.date_peremption && lotInfo.date_peremption) toInsert.date_peremption = lotInfo.date_peremption;

    const { data, error } = await supabase
      .from('patient_vaccinations')
      .insert([toInsert])
      .select('*')
      .single();
    if (error) throw error;
    return data as PatientVaccination;
  }

  static async cancelDose(id: string): Promise<void> {
    const { error } = await supabase
      .from('patient_vaccinations')
      .update({ statut: 'annule' })
      .eq('id', id);
    if (error) throw error;
  }

  static async scheduleReminder(payload: Omit<VaccinationReminder, 'id' | 'created_at' | 'updated_at' | 'statut'> & { statut?: VaccinationReminder['statut'] }): Promise<VaccinationReminder> {
    const { data, error } = await supabase
      .from('vaccination_reminders')
      .insert([{ ...payload }])
      .select('*')
      .single();
    if (error) throw error;

    // Tentative de création d'un rendez-vous côté backend (si disponible)
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch('/api/rendez-vous', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patient: payload.patient_id,
          service: 'Vaccination',
          motif: `Rappel ${data?.dose_ordre || ''}`.trim(),
          dateDebut: payload.planned_at,
          dateFin: new Date(new Date(payload.planned_at).getTime() + 20 * 60000).toISOString(),
          priorite: 'normal',
        })
      });
    } catch {}
    return data as VaccinationReminder;
  }

  static async listUpcomingReminders(patientId?: string): Promise<VaccinationReminder[]> {
    let query = supabase
      .from('vaccination_reminders')
      .select('*')
      .gte('planned_at', new Date().toISOString())
      .eq('statut', 'planifie')
      .order('planned_at', { ascending: true });
    if (patientId) query = query.eq('patient_id', patientId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async markReminderSent(id: string): Promise<void> {
    const { error } = await supabase
      .from('vaccination_reminders')
      .update({ statut: 'envoye' })
      .eq('id', id);
    if (error) throw error;
  }

  static async notifyReminder(reminder: VaccinationReminder): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch('/api/notifications/vaccination-reminder', {
        method: 'POST',
        headers,
        body: JSON.stringify({ reminder })
      });
    } catch {}
  }

  static computeCoverageStatus(allSchedules: VaccineSchedule[], received: PatientVaccination[]) {
    const byDose = new Map<string, PatientVaccination>();
    received.forEach(d => byDose.set(`${d.vaccine_id}:${d.dose_ordre}`, d));
    const pending: { vaccine_id: string; dose_ordre: number; due_date?: Date }[] = [];
    allSchedules.forEach(s => {
      const key = `${s.vaccine_id}:${s.dose_ordre}`;
      if (!byDose.has(key)) {
        // Estimation de date due à partir de l'âge recommandé non personnalisé
        pending.push({ vaccine_id: s.vaccine_id, dose_ordre: s.dose_ordre });
      }
    });
    const status: 'À jour' | 'Incomplet' | 'Inconnu' = pending.length === 0 ? 'À jour' : 'Incomplet';
    return { status, pending };
  }

  static async getStats(params: { from?: string; to?: string }) {
    const filters: any = {};
    if (params.from) filters.from = params.from;
    if (params.to) filters.to = params.to;

    // Total doses par type de vaccin
    const { data: doses, error } = await supabase
      .from('patient_vaccinations')
      .select('vaccine_id, date_administration')
      .gte(params.from ? 'date_administration' : 'date_administration', params.from || '1900-01-01')
      .lte(params.to ? 'date_administration' : 'date_administration', params.to || '2999-12-31');
    if (error) throw error;

    const byVaccine: Record<string, number> = {};
    (doses || []).forEach((d) => {
      byVaccine[d.vaccine_id] = (byVaccine[d.vaccine_id] || 0) + 1;
    });

    // Rendez-vous honorés vs manqués: approximé via statut des reminders (envoye vs manque)
    const { data: rems, error: rErr } = await supabase
      .from('vaccination_reminders')
      .select('statut, planned_at')
      .gte(params.from ? 'planned_at' : 'planned_at', (params.from ? new Date(params.from) : new Date('1900-01-01')).toISOString())
      .lte(params.to ? 'planned_at' : 'planned_at', (params.to ? new Date(params.to) : new Date('2999-12-31')).toISOString());
    if (rErr) throw rErr;
    const honorés = (rems || []).filter(r => r.statut === 'envoye').length;
    const manqués = (rems || []).filter(r => r.statut === 'manque').length;

    return { byVaccine, honorés, manqués, totalDoses: (doses || []).length };
  }

  static async getAdvancedReport(params: { from?: string; to?: string }) {
    const fromDate = params.from ? params.from : '1900-01-01';
    const toDate = params.to ? params.to : '2999-12-31';

    // Doses par vaccin
    const { data: doses, error } = await supabase
      .from('patient_vaccinations')
      .select('vaccine_id, date_administration, patient_id')
      .gte('date_administration', fromDate)
      .lte('date_administration', toDate);
    if (error) throw error;

    const byVaccine: Record<string, number> = {};
    (doses || []).forEach(d => { byVaccine[d.vaccine_id] = (byVaccine[d.vaccine_id] || 0) + 1; });

    // Couverture par âge (0-11m, 12-23m, 2-4a, 5-14a, 15+)
    const patientIds = Array.from(new Set((doses || []).map(d => d.patient_id))).filter(Boolean) as string[];
    let patients: any[] = [];
    if (patientIds.length > 0) {
      const { data: pats, error: pErr } = await supabase
        .from('patients')
        .select('id, date_naissance')
        .in('id', patientIds);
      if (pErr) throw pErr;
      patients = pats || [];
    }
    const now = new Date();
    const ageBuckets = { '0-11m': 0, '12-23m': 0, '2-4a': 0, '5-14a': 0, '15+a': 0 } as Record<string, number>;
    patients.forEach(p => {
      const dob = p.date_naissance ? new Date(p.date_naissance) : null;
      if (!dob) return;
      const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
      if (months < 12) ageBuckets['0-11m']++;
      else if (months < 24) ageBuckets['12-23m']++;
      else if (months < 60) ageBuckets['2-4a']++;
      else if (months < 180) ageBuckets['5-14a']++;
      else ageBuckets['15+a']++;
    });

    // Alertes péremption lots (30 jours) pour vaccins seulement
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const { data: vaccines, error: vErr } = await supabase
      .from('vaccines')
      .select('id, libelle, medicament_id')
      .eq('actif', true);
    if (vErr) throw vErr;
    const medicamentIds = (vaccines || []).map(v => v.medicament_id).filter(Boolean);
    let expiryAlerts: Array<{ medicament_id: string; numero_lot: string; date_expiration: string; libelle?: string; quantite_disponible?: number }>= [];
    if (medicamentIds.length > 0) {
      const { data: lots, error: lErr } = await supabase
        .from('lots')
        .select('medicament_id, numero_lot, date_expiration, quantite_disponible')
        .in('medicament_id', medicamentIds as string[])
        .lte('date_expiration', in30.toISOString().slice(0,10))
        .gt('quantite_disponible', 0)
        .eq('statut', 'actif');
      if (lErr) throw lErr;
      expiryAlerts = (lots || []).map(l => ({ ...l, libelle: (vaccines || []).find(v => v.medicament_id === l.medicament_id)?.libelle }));
    }

    return { byVaccine, ageBuckets, expiryAlerts };
  }
}


