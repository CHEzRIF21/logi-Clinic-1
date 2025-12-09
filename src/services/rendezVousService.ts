import { supabase } from './supabase';

export type RendezVousPriority = 'normal' | 'urgent';
export type RendezVousStatus = 'programmé' | 'confirmé' | 'annulé' | 'terminé' | 'manqué';

export interface RendezVousRecord {
  id?: string;
  patient_id: string;
  consultation_id?: string | null;
  service: string;
  praticien_id?: string | null;
  praticien_name?: string | null;
  motif: string;
  date_debut: string;
  date_fin: string;
  duree_minutes?: number;
  statut?: RendezVousStatus;
  priorite?: RendezVousPriority;
  notes?: string | null;
  created_at?: string;
}

export interface FollowUpSuggestion {
  start: string;
  end: string;
  label: string;
  reason: string;
  priority: RendezVousPriority;
  praticienName?: string;
}

interface SuggestionParams {
  service: string;
  motif: string;
  severite?: 'faible' | 'moyen' | 'élevé';
  disponibiliteMedecin?: Record<string, string[]>;
}

const SERVICE_DELAYS: Record<string, number> = {
  'Médecine générale': 7,
  'Maternité': 14,
  'Pédiatrie': 10,
  'Vaccination': 30,
  default: 7,
};

const MOTIF_OVERRIDES: Record<string, number> = {
  urgence: 1,
  contrôle: 14,
  suivi: 30,
  postop: 3,
  diabète: 30,
  hypertension: 15,
};

const PRACTICIANS_BY_SERVICE: Record<string, string[]> = {
  'Médecine générale': ['Dr. Kouassi', 'Dr. Traoré'],
  'Maternité': ['Sage-femme Koné', 'Dr. Yao'],
  'Pédiatrie': ['Dr. Ouattara', 'Dr. Attié'],
  'Vaccination': ['Infirmier Akissi'],
};

const DEFAULT_HOURS = ['09:00', '10:30', '14:00', '15:30'];

const formatDate = (date: Date) => date.toISOString();

const addMinutes = (date: Date, minutes: number) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
};

const getBaseDelay = (service: string, motif: string): number => {
  const serviceDelay = SERVICE_DELAYS[service] ?? SERVICE_DELAYS.default;
  const motifKey = motif.toLowerCase();
  const overrideEntry = Object.entries(MOTIF_OVERRIDES).find(([key]) => motifKey.includes(key));
  return overrideEntry ? overrideEntry[1] : serviceDelay;
};

const inferPriority = (motif: string, severite?: SuggestionParams['severite']): RendezVousPriority => {
  if (severite === 'élevé') return 'urgent';
  const motifKey = motif.toLowerCase();
  if (motifKey.includes('urgence') || motifKey.includes('complication')) return 'urgent';
  return 'normal';
};

export class RendezVousService {
  static async suggestFollowUp(params: SuggestionParams): Promise<FollowUpSuggestion[]> {
    const baseDelay = getBaseDelay(params.service, params.motif);
    const priority = inferPriority(params.motif, params.severite);
    const slots: FollowUpSuggestion[] = [];

    const praticiens = PRACTICIANS_BY_SERVICE[params.service] || PRACTICIANS_BY_SERVICE['Médecine générale'];
    const heures = params.disponibiliteMedecin || {
      matin: ['08:30', '10:00'],
      apresMidi: ['14:00', '15:30'],
    };

    const offsets = priority === 'urgent' ? [1, 2, 3] : [baseDelay, baseDelay + 2, baseDelay + 7];

    offsets.forEach((daysOffset, index) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + daysOffset);

      const hourSlot =
        DEFAULT_HOURS[index % DEFAULT_HOURS.length] ||
        heures.matin?.[0] ||
        heures.apresMidi?.[0] ||
        '09:00';

      const [hour, minute] = hourSlot.split(':').map((v) => parseInt(v, 10));
      startDate.setHours(hour, minute, 0, 0);

      const endDate = addMinutes(startDate, 30);
      const praticienName = praticiens[index % praticiens.length];

      slots.push({
        start: formatDate(startDate),
        end: formatDate(endDate),
        label: `Option ${index + 1} — ${startDate.toLocaleDateString('fr-FR')} ${hourSlot}`,
        reason: index === 0 ? 'Basé sur le protocole de suivi' : 'Créneau disponible rapproché',
        priority,
        praticienName,
      });
    });

    return slots;
  }

  static async createRendezVous(record: RendezVousRecord): Promise<RendezVousRecord> {
    const payload = {
      patient_id: record.patient_id,
      consultation_id: record.consultation_id || null,
      service: record.service,
      praticien_id: record.praticien_id || null,
      praticien_name: record.praticien_name || null,
      motif: record.motif,
      date_debut: record.date_debut,
      date_fin: record.date_fin || addMinutes(new Date(record.date_debut), record.duree_minutes ?? 20).toISOString(),
      duree_minutes: record.duree_minutes ?? 20,
      statut: record.statut || 'programmé',
      priorite: record.priorite || 'normal',
      notes: record.notes || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('rendez_vous').insert(payload).select().single();
    if (error) throw error;
    return data as RendezVousRecord;
  }

  static async notifyPatient(
    patientId: string,
    rendezVousId: string,
    channel: 'sms' | 'whatsapp' | 'email',
    message: string
  ): Promise<void> {
    console.info(`Notification ${channel} envoyée au patient ${patientId}:`, message, rendezVousId);
  }
}

export default RendezVousService;

