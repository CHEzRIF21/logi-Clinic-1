import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export class ExamCatalogController {
  /**
   * GET /api/exams
   * Liste les examens du catalogue avec filtres
   */
  static async list(req: AuthRequest, res: Response) {
    try {
      const { module, categorie, search, actif } = req.query;

      let query = supabaseAdmin
        .from('exam_catalog')
        .select('*')
        .order('categorie', { ascending: true })
        .order('nom', { ascending: true });

      if (module) {
        query = query.eq('module_cible', module);
      }

      if (categorie) {
        query = query.eq('categorie', categorie);
      }

      if (actif !== undefined) {
        query = query.eq('actif', actif === 'true');
      }

      if (search) {
        query = query.or(`nom.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      res.json({ success: true, data: data || [] });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des examens:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des examens',
      });
    }
  }

  /**
   * GET /api/exams/:id
   * Récupère un examen par son ID
   */
  static async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('exam_catalog')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Examen non trouvé',
          });
        }
        throw error;
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'examen:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération de l\'examen',
      });
    }
  }

  /**
   * POST /api/exams
   * Crée un nouvel examen dans le catalogue
   */
  static async create(req: AuthRequest, res: Response) {
    try {
      const payload = req.body;

      const { data, error } = await supabaseAdmin
        .from('exam_catalog')
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'examen:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la création de l\'examen',
      });
    }
  }

  /**
   * PUT /api/exams/:id
   * Met à jour un examen
   */
  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const payload = req.body;

      const { data, error } = await supabaseAdmin
        .from('exam_catalog')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Examen non trouvé',
          });
        }
        throw error;
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'examen:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour de l\'examen',
      });
    }
  }

  /**
   * DELETE /api/exams/:id
   * Archive un examen (soft delete)
   */
  static async archive(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('exam_catalog')
        .update({ actif: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'Examen non trouvé',
          });
        }
        throw error;
      }

      res.json({ success: true, data, message: 'Examen archivé avec succès' });
    } catch (error: any) {
      console.error('Erreur lors de l\'archivage de l\'examen:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'archivage de l\'examen',
      });
    }
  }
}

