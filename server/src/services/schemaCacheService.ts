import prisma from '../prisma';

/**
 * Service pour gérer le cache du schéma Prisma
 * Corrige l'erreur "Could not find the table 'public.factures' in the schema cache"
 */
export class SchemaCacheService {
  /**
   * Rafraîchit le cache du schéma Prisma
   * Déconnecte et reconnecte le client Prisma
   */
  static async refreshSchemaCache(): Promise<void> {
    try {
      console.log('[SchemaCache] Tentative de rafraîchissement du cache du schéma...');
      
      // Déconnecter le client actuel
      await prisma.$disconnect();
      
      // Attendre un court délai pour permettre la déconnexion complète
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Exécuter une requête simple pour forcer la réinitialisation
      await prisma.$executeRaw`SELECT 1`;
      
      console.log('[SchemaCache] Cache du schéma rafraîchi avec succès');
    } catch (error: any) {
      console.error('[SchemaCache] Erreur lors du rafraîchissement du cache:', error.message);
      throw error;
    }
  }

  /**
   * Exécute une requête avec retry automatique en cas d'erreur de cache
   */
  static async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || '';
        
        // Vérifier si l'erreur est liée au cache du schéma
        if (
          errorMessage.includes('schema cache') ||
          errorMessage.includes('Could not find the table') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('relation') && errorMessage.includes('does not exist')
        ) {
          if (attempt < maxRetries) {
            console.warn(
              `[SchemaCache] Erreur de cache détectée (tentative ${attempt + 1}/${maxRetries + 1}):`,
              errorMessage
            );
            await this.refreshSchemaCache();
            // Attendre un peu avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        // Si ce n'est pas une erreur de cache ou qu'on a épuisé les tentatives, lancer l'erreur
        throw error;
      }
    }
    
    throw lastError || new Error('Erreur inconnue lors de l\'exécution de la requête');
  }
}

export default SchemaCacheService;

