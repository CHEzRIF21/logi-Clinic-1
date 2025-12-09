import { supabase } from './supabase';

export type ImagerieType = 'Radiographie' | 'Scanner' | 'IRM' | 'Échographie' | 'Autre';

export interface ImagerieExamen {
  id: string;
  patient_id: string;
  identifiant_patient?: string;
  type_examen: ImagerieType;
  prescripteur?: string;
  medecin_referent?: string;
  date_examen: string;
  statut: 'en_attente' | 'en_cours' | 'termine';
  created_at: string;
  updated_at: string;
}

export interface ImagerieImage {
  id: string;
  examen_id: string;
  storage_path: string; // chemin Storage Supabase
  dicom: boolean; // true si source DICOM
  web_asset_url?: string; // URL optimisée web
  metadata?: any;
  created_at: string;
}

export interface ImagerieAnnotation {
  id: string;
  image_id: string;
  auteur: string;
  type: 'point' | 'ligne' | 'mesure' | 'texte' | 'libre';
  payload: any; // coordonnées + propriétés
  created_at: string;
}

export interface ImagerieRapport {
  id: string;
  examen_id: string;
  modele: string; // nom du modèle choisi
  contenu: string; // texte/HTML du rapport
  signe_par?: string;
  signature_electronique?: string;
  date_signature?: string;
  transmis_a?: string;
  date_transmission?: string;
  created_at: string;
  updated_at: string;
}

export class ImagerieService {
  // Examens
  static async creerExamen(payload: Omit<ImagerieExamen, 'id' | 'created_at' | 'updated_at' | 'statut'> & { statut?: ImagerieExamen['statut'] }): Promise<ImagerieExamen> {
    const toInsert = {
      ...payload,
      statut: payload.statut || 'en_attente',
      date_examen: payload.date_examen || new Date().toISOString(),
    } as any;
    const { data, error } = await supabase.from('imagerie_examens').insert([toInsert]).select('*').single();
    if (error) throw error;
    return data as ImagerieExamen;
  }

  static async listerExamens(filters?: { patient_id?: string; type_examen?: ImagerieType; from?: string; to?: string; medecin?: string }): Promise<ImagerieExamen[]> {
    let q = supabase.from('imagerie_examens').select('*').order('date_examen', { ascending: false });
    if (filters?.patient_id) q = q.eq('patient_id', filters.patient_id);
    if (filters?.type_examen) q = q.eq('type_examen', filters.type_examen);
    if (filters?.medecin) q = q.eq('medecin_referent', filters.medecin);
    if (filters?.from) q = q.gte('date_examen', filters.from);
    if (filters?.to) q = q.lte('date_examen', filters.to);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  // Images & stockage
  static async uploadImage(examen_id: string, file: File, opts?: { dicom?: boolean }): Promise<ImagerieImage> {
    const bucket = 'imagerie';
    const fileName = `${examen_id}/${Date.now()}_${file.name}`;
    const { data: up, error: upErr } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: false });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(up.path);
    const toInsert = {
      examen_id,
      storage_path: up.path,
      dicom: !!opts?.dicom,
      web_asset_url: pub?.publicUrl,
      metadata: { name: file.name, size: file.size, type: file.type },
    } as any;
    const { data, error } = await supabase.from('imagerie_images').insert([toInsert]).select('*').single();
    if (error) throw error;
    return data as ImagerieImage;
  }

  static async listerImages(examen_id: string): Promise<ImagerieImage[]> {
    const { data, error } = await supabase.from('imagerie_images').select('*').eq('examen_id', examen_id).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // Annotations
  static async ajouterAnnotation(image_id: string, auteur: string, type: ImagerieAnnotation['type'], payload: any): Promise<ImagerieAnnotation> {
    const { data, error } = await supabase.from('imagerie_annotations').insert([{ image_id, auteur, type, payload }]).select('*').single();
    if (error) throw error;
    return data as ImagerieAnnotation;
  }

  static async listerAnnotations(image_id: string): Promise<ImagerieAnnotation[]> {
    const { data, error } = await supabase.from('imagerie_annotations').select('*').eq('image_id', image_id).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // Rapports
  static async creerRapport(examen_id: string, modele: string, contenu: string) {
    const { data, error } = await supabase.from('imagerie_rapports').insert([{ examen_id, modele, contenu }]).select('*').single();
    if (error) throw error;
    return data as ImagerieRapport;
  }

  static async signerRapport(rapport_id: string, radiologue: string) {
    const { data, error } = await supabase.from('imagerie_rapports').update({ signe_par: radiologue, signature_electronique: 'SIGN_HASH_PLACEHOLDER', date_signature: new Date().toISOString() }).eq('id', rapport_id).select('*').single();
    if (error) throw error;
    return data as ImagerieRapport;
  }

  static async transmettreRapport(rapport_id: string, medecin: string) {
    const { data, error } = await supabase.from('imagerie_rapports').update({ transmis_a: medecin, date_transmission: new Date().toISOString() }).eq('id', rapport_id).select('*').single();
    if (error) throw error;
    return data as ImagerieRapport;
  }
}


