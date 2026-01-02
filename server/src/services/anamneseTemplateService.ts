import { supabase } from '../config/supabase';

export interface AnamneseTemplate {
  id: string;
  nom: string;
  contenu: string;
  categorie?: string;
  actif: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  clinic_id?: string;
}

export interface CreateAnamneseTemplateInput {
  nom: string;
  contenu: string;
  categorie?: string;
  actif?: boolean;
  clinic_id?: string;
}

export interface UpdateAnamneseTemplateInput extends Partial<CreateAnamneseTemplateInput> {}

export class AnamneseTemplateService {
  /**
   * Récupère tous les templates d'anamnèse
   */
  static async getTemplates(categorie?: string, clinicId?: string): Promise<AnamneseTemplate[]> {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    let query = supabase
      .from('anamnese_templates')
      .select('*')
      .eq('actif', true);

    if (categorie) {
      query = query.eq('categorie', categorie);
    }

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    } else {
      // Si pas de clinic_id spécifié, récupérer les templates globaux (clinic_id IS NULL)
      query = query.is('clinic_id', null);
    }

    const { data, error } = await query.order('nom', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Récupère un template par ID
   */
  static async getTemplateById(id: string): Promise<AnamneseTemplate> {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    const { data, error } = await supabase
      .from('anamnese_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Template non trouvé');
      }
      throw new Error(`Erreur lors de la récupération du template: ${error.message}`);
    }

    if (!data) {
      throw new Error('Template non trouvé');
    }

    return data;
  }

  /**
   * Crée un nouveau template
   */
  static async createTemplate(input: CreateAnamneseTemplateInput, userId?: string): Promise<AnamneseTemplate> {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    const templateData: any = {
      nom: input.nom,
      contenu: input.contenu,
      categorie: input.categorie || null,
      actif: input.actif !== undefined ? input.actif : true,
      clinic_id: input.clinic_id || null,
    };

    if (userId) {
      templateData.created_by = userId;
    }

    const { data, error } = await supabase
      .from('anamnese_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création du template: ${error.message}`);
    }

    return data;
  }

  /**
   * Met à jour un template
   */
  static async updateTemplate(
    id: string,
    input: UpdateAnamneseTemplateInput
  ): Promise<AnamneseTemplate> {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    const updateData: any = {};

    if (input.nom !== undefined) updateData.nom = input.nom;
    if (input.contenu !== undefined) updateData.contenu = input.contenu;
    if (input.categorie !== undefined) updateData.categorie = input.categorie;
    if (input.actif !== undefined) updateData.actif = input.actif;
    if (input.clinic_id !== undefined) updateData.clinic_id = input.clinic_id;

    const { data, error } = await supabase
      .from('anamnese_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Template non trouvé');
      }
      throw new Error(`Erreur lors de la mise à jour du template: ${error.message}`);
    }

    if (!data) {
      throw new Error('Template non trouvé');
    }

    return data;
  }

  /**
   * Supprime un template (soft delete en mettant actif à false)
   */
  static async deleteTemplate(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Client Supabase non initialisé');
    }

    const { error } = await supabase
      .from('anamnese_templates')
      .update({ actif: false })
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Template non trouvé');
      }
      throw new Error(`Erreur lors de la suppression du template: ${error.message}`);
    }
  }
}

export default AnamneseTemplateService;

