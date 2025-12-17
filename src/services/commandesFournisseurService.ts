import { supabase } from './supabase';

export type StatutCommandeFournisseur = 'DRAFT' | 'AWAITING_SIGNATURE' | 'SENT_TO_SUPPLIER' | 'RECEIVED';

export interface Fournisseur {
  id: string;
  nom: string;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CommandeFournisseur {
  id: string;
  numero_commande: string;
  supplier_id: string;
  status: StatutCommandeFournisseur;
  delivery_date_requested?: string | null;
  notes?: string | null;
  pdf_link?: string | null;
  created_by?: string | null;
  validated_by?: string | null;
  validated_at?: string | null;
  sent_at?: string | null;
  received_at?: string | null;
  created_at?: string;
  updated_at?: string;
  fournisseurs?: Fournisseur;
  commandes_fournisseur_lignes?: Array<{
    id: string;
    commande_id: string;
    medicament_id: string;
    quantite: number;
    prix_unitaire_estime: number;
    medicaments?: any;
  }>;
}

export class CommandesFournisseurService {
  static async listFournisseurs(): Promise<Fournisseur[]> {
    const { data, error } = await supabase
      .from('fournisseurs')
      .select('*')
      .order('nom', { ascending: true });
    if (error) throw error;
    return (data || []) as Fournisseur[];
  }

  static async createFournisseur(payload: Omit<Fournisseur, 'id'>): Promise<Fournisseur> {
    const { data, error } = await supabase
      .from('fournisseurs')
      .insert({
        nom: payload.nom,
        telephone: payload.telephone ?? null,
        email: payload.email ?? null,
        adresse: payload.adresse ?? null,
        notes: payload.notes ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as Fournisseur;
  }

  static async listCommandes(): Promise<CommandeFournisseur[]> {
    const { data, error } = await supabase
      .from('commandes_fournisseur')
      .select(
        `
        *,
        fournisseurs (*),
        commandes_fournisseur_lignes (
          *,
          medicaments (*)
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data || []) as any;
  }

  static async createCommande(payload: {
    supplier_id: string;
    status?: StatutCommandeFournisseur;
    delivery_date_requested?: string | null;
    notes?: string | null;
    created_by?: string | null;
    lignes: Array<{ medicament_id: string; quantite: number; prix_unitaire_estime: number }>;
  }): Promise<CommandeFournisseur> {
    if (!payload.supplier_id) throw new Error('Fournisseur obligatoire');
    if (!payload.lignes || payload.lignes.length === 0) throw new Error('Au moins une ligne est requise');

    const status: StatutCommandeFournisseur = payload.status || 'DRAFT';

    const { data: commande, error: cmdErr } = await supabase
      .from('commandes_fournisseur')
      .insert({
        numero_commande: '', // trigger
        supplier_id: payload.supplier_id,
        status,
        delivery_date_requested: payload.delivery_date_requested ?? null,
        notes: payload.notes ?? null,
        created_by: payload.created_by ?? null,
      })
      .select('*')
      .single();
    if (cmdErr) throw cmdErr;

    const lignesToInsert = payload.lignes.map((l) => ({
      commande_id: commande.id,
      medicament_id: l.medicament_id,
      quantite: l.quantite,
      prix_unitaire_estime: l.prix_unitaire_estime ?? 0,
    }));

    const { error: lignesErr } = await supabase.from('commandes_fournisseur_lignes').insert(lignesToInsert);
    if (lignesErr) {
      // rollback best-effort
      await supabase.from('commandes_fournisseur').delete().eq('id', commande.id);
      throw lignesErr;
    }

    // re-fetch complet
    const { data: full, error: fullErr } = await supabase
      .from('commandes_fournisseur')
      .select(
        `
        *,
        fournisseurs (*),
        commandes_fournisseur_lignes (
          *,
          medicaments (*)
        )
      `
      )
      .eq('id', commande.id)
      .single();
    if (fullErr) throw fullErr;
    return full as any;
  }

  static async updateStatus(commandeId: string, payload: {
    status: StatutCommandeFournisseur;
    actor_id?: string | null;
  }): Promise<void> {
    const { data: existing, error: exErr } = await supabase
      .from('commandes_fournisseur')
      .select('*')
      .eq('id', commandeId)
      .single();
    if (exErr) throw exErr;

    const now = new Date().toISOString();
    const status = payload.status;
    const update: any = { status };

    if (status === 'AWAITING_SIGNATURE') {
      update.validated_by = payload.actor_id ?? null;
      update.validated_at = now;
    }
    if (status === 'SENT_TO_SUPPLIER') {
      update.validated_by = payload.actor_id ?? null;
      update.validated_at = now;
      update.sent_at = now;
    }
    if (status === 'RECEIVED') {
      update.received_at = now;
    }

    const { error: upErr } = await supabase
      .from('commandes_fournisseur')
      .update(update)
      .eq('id', commandeId);
    if (upErr) throw upErr;

    // log best-effort
    try {
      await supabase.from('stock_audit_log').insert({
        entity_type: 'commande_fournisseur',
        entity_id: commandeId,
        action: 'STATUS_CHANGED',
        actor_id: payload.actor_id ?? 'system',
        old_status: existing.status,
        new_status: status,
        old_data: existing,
        new_data: { ...existing, ...update },
      });
    } catch {
      // ignore
    }
  }
}

