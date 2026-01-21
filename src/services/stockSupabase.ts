import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase as mainSupabase } from './supabase';

// Configuration Supabase Stock via variables d'environnement
// IMPORTANT: Ne jamais hardcoder les clés dans le code !
// Support pour Vite (import.meta.env)
const stockSupabaseUrl = import.meta.env.VITE_STOCK_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const stockSupabaseAnonKey = import.meta.env.VITE_STOCK_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const mainSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const mainSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Optimisation: Réutiliser le client principal si les URLs sont identiques
// Cela évite le warning "Multiple GoTrueClient instances"
let supabase: SupabaseClient;

if (!stockSupabaseUrl || !stockSupabaseAnonKey) {
  console.error('❌ Configuration Supabase Stock manquante!');
  console.error('Assurez-vous que les variables VITE_STOCK_SUPABASE_URL sont définies dans .env');
  // Utiliser le client principal en fallback
  supabase = mainSupabase;
} else if (!import.meta.env.VITE_STOCK_SUPABASE_URL && stockSupabaseUrl === mainSupabaseUrl && stockSupabaseAnonKey === mainSupabaseAnonKey) {
  // Si VITE_STOCK_SUPABASE_URL n'est pas défini et que les URLs/clés sont identiques,
  // réutiliser le client principal pour éviter les instances multiples
  supabase = mainSupabase;
} else {
  // Projet Supabase différent ou configuration explicite, créer un nouveau client
  supabase = createClient(stockSupabaseUrl, stockSupabaseAnonKey);
}

export { supabase };

// Types pour les médicaments
export interface MedicamentSupabase {
  id: string;
  code: string;
  nom: string;
  forme: string;
  dosage: string;
  unite: string;
  fournisseur: string;
  prix_unitaire: number;              // Prix unitaire de vente (détail) - utilisé par la pharmacie
  prix_unitaire_entree?: number;      // Prix unitaire d'achat/entrée
  prix_total_entree?: number;         // Prix total d'entrée
  prix_unitaire_detail?: number;      // Prix unitaire de vente au détail (pharmacie) - peut être différent de prix_unitaire
  seuil_alerte: number;
  seuil_rupture: number;
  seuil_maximum?: number;             // Seuil maximum de stock
  emplacement: string;
  categorie: string;
  prescription_requise: boolean;
  dci?: string;                       // Dénomination Commune Internationale
  observations?: string;              // Observations générales
  clinic_id?: string | null;          // ID de la clinique - NULL pour médicaments globaux (toutes les cliniques)
  date_creation: string;
  date_modification: string;
  created_at: string;
  updated_at: string;
}

export interface MedicamentFormData {
  code: string;
  nom: string;
  forme: string;
  dosage: string;
  unite: string;
  fournisseur: string;
  prix_unitaire: number;              // Prix unitaire de vente (détail) - utilisé par la pharmacie
  prix_unitaire_entree?: number;      // Prix unitaire d'achat/entrée
  prix_total_entree?: number;         // Prix total d'entrée
  prix_unitaire_detail?: number;      // Prix unitaire de vente au détail (pharmacie)
  seuil_alerte: number;
  seuil_rupture: number;
  seuil_maximum?: number;             // Seuil maximum de stock
  emplacement: string;
  categorie: string;
  prescription_requise: boolean;
  dci?: string;                       // Dénomination Commune Internationale
  observations?: string;              // Observations générales
}

// Types pour les lots
export interface LotSupabase {
  id: string;
  medicament_id: string;
  numero_lot: string;
  quantite_initiale: number;
  quantite_disponible: number;
  date_reception: string;
  date_expiration: string;
  prix_achat: number;
  fournisseur: string;
  statut: 'actif' | 'expire' | 'epuise';
  magasin: 'gros' | 'detail';
  created_at: string;
  updated_at: string;
}

export interface LotFormData {
  medicament_id: string;
  numero_lot: string;
  quantite_initiale: number;
  quantite_disponible: number;
  date_reception: string;
  date_expiration: string;
  prix_achat: number;
  fournisseur: string;
  statut: 'actif' | 'expire' | 'epuise';
  magasin: 'gros' | 'detail';
}

// Types pour les mouvements de stock
export interface MouvementStockSupabase {
  id: string;
  type: 'reception' | 'transfert' | 'dispensation' | 'retour' | 'perte' | 'correction';
  medicament_id: string;
  lot_id?: string;
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  motif: string;
  utilisateur_id: string;
  date_mouvement: string;
  magasin_source: 'gros' | 'detail' | 'externe';
  magasin_destination: 'gros' | 'detail' | 'patient' | 'service';
  reference_document?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface MouvementStockFormData {
  type: 'reception' | 'transfert' | 'dispensation' | 'retour' | 'perte' | 'correction';
  medicament_id: string;
  lot_id?: string;
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  motif: string;
  utilisateur_id: string;
  date_mouvement: string;
  magasin_source: 'gros' | 'detail' | 'externe';
  magasin_destination: 'gros' | 'detail' | 'patient' | 'service';
  reference_document?: string;
  observations?: string;
}

// Types pour les transferts
export interface TransfertSupabase {
  id: string;
  numero_transfert: string;
  date_transfert: string;
  magasin_source: 'gros';
  magasin_destination: 'detail';
  statut: 'en_attente' | 'en_cours' | 'valide' | 'refuse' | 'annule' | 'recu';
  utilisateur_source_id: string;
  utilisateur_destination_id?: string;
  date_validation?: string;
  date_reception?: string;
  utilisateur_reception_id?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface TransfertLigneSupabase {
  id: string;
  transfert_id: string;
  medicament_id: string;
  lot_id: string;
  quantite: number;
  quantite_validee?: number;
  created_at: string;
  updated_at: string;
}

// Types pour les dispensations
export interface DispensationSupabase {
  id: string;
  numero_dispensation: string;
  date_dispensation: string;
  patient_id?: string;
  patient_nom?: string;
  patient_prenoms?: string;
  service_id?: string;
  service_nom?: string;
  type_dispensation: 'patient' | 'service';
  statut: 'en_cours' | 'terminee' | 'annulee' | 'validee';
  utilisateur_id: string;
  prescripteur_id?: string;
  prescripteur_nom?: string;
  service_prescripteur?: string;
  consultation_id?: string;
  prescription_id?: string;
  statut_prise_charge?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface DispensationLigneSupabase {
  id: string;
  dispensation_id: string;
  medicament_id: string;
  lot_id: string;
  quantite: number; // Quantité totale (pour compatibilité)
  quantite_prescite: number;
  quantite_delivree: number;
  numero_lot: string;
  date_expiration: string;
  statut: 'delivre' | 'partiellement_delivre' | 'substitution' | 'rupture';
  medicament_substitue_id?: string;
  prix_unitaire: number;
  prix_total: number;
  observations?: string;
  prescription_line_id?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les alertes
export interface AlerteStockSupabase {
  id: string;
  medicament_id: string;
  type: 'rupture' | 'seuil_bas' | 'peremption' | 'stock_surplus';
  niveau: 'critique' | 'avertissement' | 'information';
  message: string;
  date_creation: string;
  date_resolution?: string;
  statut: 'active' | 'resolue' | 'ignoree';
  utilisateur_resolution_id?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les inventaires
export interface InventaireSupabase {
  id: string;
  numero_inventaire: string;
  date_inventaire: string;
  magasin: 'gros' | 'detail';
  statut: 'en_cours' | 'termine' | 'valide';
  utilisateur_id: string;
  date_validation?: string;
  observations?: string;
  created_at: string;
  updated_at: string;
}

export interface InventaireLigneSupabase {
  id: string;
  inventaire_id: string;
  medicament_id: string;
  lot_id: string;
  quantite_theorique: number;
  quantite_reelle: number;
  ecart: number;
  observations?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les pertes et retours
export interface PerteRetourSupabase {
  id: string;
  type: 'perte' | 'retour';
  medicament_id: string;
  lot_id: string;
  quantite: number;
  motif: string;
  utilisateur_id: string;
  date_creation: string;
  statut: 'en_cours' | 'valide' | 'rejete';
  observations?: string;
  reference_document?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les statistiques
export interface StockStats {
  total_medicaments: number;
  total_lots: number;
  total_mouvements: number;
  total_alertes_actives: number;
  total_transferts: number;
  total_dispensations: number;
  valeur_stock_total: number;
  medicaments_rupture: number;
  medicaments_seuil_bas: number;
  lots_expires: number;
  lots_expirant_30j: number;
}

// Types pour les rapports
export interface RapportStockData {
  periode: {
    debut: string;
    fin: string;
  };
  magasin: 'gros' | 'detail' | 'tous';
  medicaments: any[];
  mouvements: MouvementStockSupabase[];
  alertes: AlerteStockSupabase[];
  statistiques: {
    total_entrees: number;
    total_sorties: number;
    total_pertes: number;
    total_retours: number;
    valeur_stock: number;
  };
}
