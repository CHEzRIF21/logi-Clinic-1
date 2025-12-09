import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://bnfgemmlokvetmohiqch.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Hash password simple (à remplacer par bcrypt en production)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'logi_clinic_salt').digest('hex');
}

// POST /api/auth/register-request - Créer une demande d'inscription
router.post('/register-request', async (req: Request, res: Response) => {
  try {
    const {
      nom,
      prenom,
      email,
      password,
      passwordConfirm,
      telephone,
      adresse,
      roleSouhaite,
      specialite,
      securityQuestions,
    } = req.body;

    // Validations
    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prénom, email et mot de passe sont requis',
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      });
    }

    if (!supabase) {
      console.error('Supabase non configuré');
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    // Vérifier si l'email existe déjà
    const { data: existingUser, error: checkError } = await supabase
      .from('registration_requests')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Une demande avec cet email existe déjà',
      });
    }

    // Vérifier aussi dans la table users
    const { data: existingUserActive } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUserActive) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà',
      });
    }

    // Hash du mot de passe
    const passwordHash = hashPassword(password);

    // Créer la demande d'inscription
    const { data, error } = await supabase
      .from('registration_requests')
      .insert({
        nom,
        prenom,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        telephone,
        adresse,
        role_souhaite: roleSouhaite || 'receptionniste',
        specialite,
        security_questions: securityQuestions,
        statut: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la demande',
        error: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Demande d\'inscription soumise avec succès. Un administrateur va examiner votre demande.',
      data: {
        id: data.id,
        email: data.email,
        statut: data.statut,
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message,
    });
  }
});

// GET /api/auth/registration-requests - Récupérer les demandes d'inscription (admin)
router.get('/registration-requests', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    const { statut } = req.query;

    let query = supabase
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (statut && statut !== '') {
      query = query.eq('statut', statut);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des demandes',
      });
    }

    // Ne pas renvoyer les mots de passe hashés
    const sanitizedData = (data || []).map(({ password_hash, ...rest }) => rest);

    res.json({
      success: true,
      requests: sanitizedData,
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

// POST /api/auth/registration-requests/:id/approve - Approuver une demande
router.post('/registration-requests/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, permissions, notes } = req.body;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    // Récupérer la demande
    const { data: request, error: fetchError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée',
      });
    }

    if (request.statut !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette demande a déjà été traitée',
      });
    }

    // Créer l'utilisateur
    const { error: userError } = await supabase
      .from('users')
      .insert({
        nom: request.nom,
        prenom: request.prenom,
        email: request.email,
        password_hash: request.password_hash,
        role: role || request.role_souhaite,
        specialite: request.specialite,
        telephone: request.telephone,
        adresse: request.adresse,
        actif: true,
      });

    if (userError) {
      console.error('Erreur création utilisateur:', userError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'utilisateur',
      });
    }

    // Mettre à jour le statut de la demande
    const { error: updateError } = await supabase
      .from('registration_requests')
      .update({
        statut: 'approved',
        notes,
        date_approbation: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Erreur mise à jour demande:', updateError);
    }

    res.json({
      success: true,
      message: 'Demande approuvée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

// POST /api/auth/registration-requests/:id/reject - Rejeter une demande
router.post('/registration-requests/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { raisonRejet, notes } = req.body;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    const { error } = await supabase
      .from('registration_requests')
      .update({
        statut: 'rejected',
        raison_rejet: raisonRejet,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Erreur Supabase:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du rejet de la demande',
      });
    }

    res.json({
      success: true,
      message: 'Demande rejetée',
    });
  } catch (error: any) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

// POST /api/auth/login - Connexion
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Service de base de données non disponible',
      });
    }

    const passwordHash = hashPassword(password);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password_hash', passwordHash)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    if (!user.actif) {
      return res.status(401).json({
        success: false,
        message: 'Ce compte est désactivé',
      });
    }

    // Mettre à jour le dernier login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Générer un token simple (à remplacer par JWT en production)
    const token = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        specialite: user.specialite,
      },
      token,
    });
  } catch (error: any) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

export default router;

