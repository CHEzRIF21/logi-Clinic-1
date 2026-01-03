/**
 * Utilitaires pour la gestion des transactions et rollback
 * Fournit des mécanismes de transaction manuelle pour Supabase
 */

import { supabase } from './supabase';

export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rollbackActions?: RollbackAction[];
}

export interface RollbackAction {
  table: string;
  operation: 'delete' | 'update' | 'restore';
  id: string;
  previousData?: Record<string, any>;
}

/**
 * Classe pour gérer les transactions manuelles avec rollback
 */
export class TransactionManager {
  private rollbackActions: RollbackAction[] = [];
  private traceId: string;
  private clinicId?: string;

  constructor(clinicId?: string) {
    this.traceId = this.generateTraceId();
    this.clinicId = clinicId;
  }

  /**
   * Génère un ID de trace unique pour le suivi des opérations
   */
  private generateTraceId(): string {
    return `TRX-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Récupère le trace ID pour le logging
   */
  getTraceId(): string {
    return this.traceId;
  }

  /**
   * Enregistre une action de rollback
   */
  registerRollback(action: RollbackAction): void {
    this.rollbackActions.push(action);
  }

  /**
   * Exécute le rollback de toutes les actions enregistrées
   */
  async executeRollback(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Exécuter les rollbacks dans l'ordre inverse
    for (let i = this.rollbackActions.length - 1; i >= 0; i--) {
      const action = this.rollbackActions[i];
      try {
        switch (action.operation) {
          case 'delete':
            // Supprimer l'enregistrement créé
            const { error: deleteError } = await supabase
              .from(action.table)
              .delete()
              .eq('id', action.id);
            if (deleteError) throw deleteError;
            break;

          case 'update':
            // Restaurer les données précédentes
            if (action.previousData) {
              const { error: updateError } = await supabase
                .from(action.table)
                .update(action.previousData)
                .eq('id', action.id);
              if (updateError) throw updateError;
            }
            break;

          case 'restore':
            // Réinsérer les données supprimées
            if (action.previousData) {
              const { error: restoreError } = await supabase
                .from(action.table)
                .insert(action.previousData);
              if (restoreError) throw restoreError;
            }
            break;
        }

        console.log(`[${this.traceId}] Rollback réussi: ${action.operation} sur ${action.table} (${action.id})`);
      } catch (error) {
        const errorMsg = `Rollback échoué pour ${action.table}/${action.id}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        errors.push(errorMsg);
        console.error(`[${this.traceId}] ${errorMsg}`);
      }
    }

    return { success: errors.length === 0, errors };
  }

  /**
   * Insère avec enregistrement de rollback
   */
  async insertWithRollback<T>(
    table: string,
    data: Record<string, any>,
    options?: { select?: boolean }
  ): Promise<{ data: T | null; error: any }> {
    // Ajouter clinic_id si disponible et non présent dans les données
    const insertData = this.clinicId && !data.clinic_id 
      ? { ...data, clinic_id: this.clinicId }
      : data;

    const query = supabase.from(table).insert(insertData);
    const result = options?.select 
      ? await query.select().single()
      : await query.select().single();

    if (!result.error && result.data) {
      this.registerRollback({
        table,
        operation: 'delete',
        id: (result.data as any).id,
      });
    }

    return { data: result.data as T, error: result.error };
  }

  /**
   * Met à jour avec enregistrement de rollback
   */
  async updateWithRollback<T>(
    table: string,
    id: string,
    newData: Record<string, any>
  ): Promise<{ data: T | null; error: any }> {
    // Récupérer les données actuelles pour le rollback
    const { data: currentData, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    // Effectuer la mise à jour
    const { data: updatedData, error: updateError } = await supabase
      .from(table)
      .update(newData)
      .eq('id', id)
      .select()
      .single();

    if (!updateError && currentData) {
      this.registerRollback({
        table,
        operation: 'update',
        id,
        previousData: currentData,
      });
    }

    return { data: updatedData as T, error: updateError };
  }

  /**
   * Supprime avec enregistrement de rollback
   */
  async deleteWithRollback(
    table: string,
    id: string
  ): Promise<{ success: boolean; error: any }> {
    // Récupérer les données actuelles pour le rollback
    const { data: currentData, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError };
    }

    // Effectuer la suppression
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (!deleteError && currentData) {
      this.registerRollback({
        table,
        operation: 'restore',
        id,
        previousData: currentData,
      });
    }

    return { success: !deleteError, error: deleteError };
  }

  /**
   * Nettoie les actions de rollback (à appeler après succès)
   */
  clearRollbackActions(): void {
    this.rollbackActions = [];
  }
}

/**
 * Exécute une fonction dans un contexte de transaction
 */
export async function withTransaction<T>(
  operation: (tx: TransactionManager) => Promise<T>,
  clinicId?: string
): Promise<TransactionResult<T>> {
  const tx = new TransactionManager(clinicId);
  
  try {
    const result = await operation(tx);
    tx.clearRollbackActions();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(`[${tx.getTraceId()}] Erreur transaction, démarrage rollback:`, error);
    
    const rollbackResult = await tx.executeRollback();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      rollbackActions: rollbackResult.errors.length > 0 ? tx['rollbackActions'] : undefined,
    };
  }
}

/**
 * Valide les données d'entrée selon un schéma
 */
export function validateData<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[],
  fieldValidators?: Partial<Record<keyof T, (value: any) => boolean>>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Vérifier les champs requis
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Le champ '${String(field)}' est requis`);
    }
  }

  // Appliquer les validateurs personnalisés
  if (fieldValidators) {
    for (const [field, validator] of Object.entries(fieldValidators)) {
      if (data[field] !== undefined && validator && !validator(data[field])) {
        errors.push(`Le champ '${field}' est invalide`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Vérifie l'existence d'une entité liée
 */
export async function verifyEntityExists(
  table: string,
  id: string,
  clinicId?: string
): Promise<{ exists: boolean; data?: any; error?: string }> {
  try {
    let query = supabase.from(table).select('*').eq('id', id);
    
    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }
    
    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { exists: false, error: `Entité non trouvée dans ${table}` };
      }
      throw error;
    }

    return { exists: true, data };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Erreur de vérification',
    };
  }
}

/**
 * Vérifie que le clinic_id est valide
 */
export async function verifyClinicId(clinicId: string): Promise<{ valid: boolean; error?: string }> {
  const result = await verifyEntityExists('clinics', clinicId);
  return {
    valid: result.exists,
    error: result.exists ? undefined : 'Clinique non trouvée ou accès non autorisé',
  };
}

/**
 * Valide un UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

