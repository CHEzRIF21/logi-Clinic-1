/**
 * Générateur d'identifiants uniques pour les médicaments
 * Format: MED000, MED001, MED002, etc.
 */

export class MedicamentIdGenerator {
  private static readonly PREFIX = 'MED';
  private static readonly PADDING_LENGTH = 3;

  /**
   * Génère un nouvel identifiant unique pour un médicament
   * @param existingIds - Liste des IDs existants pour éviter les doublons
   * @returns Un identifiant unique au format MED000
   */
  static generateId(existingIds: string[] = []): string {
    // Trouver le prochain numéro disponible
    let nextNumber = 0;
    
    // Extraire tous les numéros existants
    const existingNumbers = existingIds
      .filter(id => id.startsWith(this.PREFIX))
      .map(id => {
        const numberPart = id.substring(this.PREFIX.length);
        return parseInt(numberPart, 10);
      })
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    // Trouver le prochain numéro disponible
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }

    // Formater avec le padding approprié
    const paddedNumber = nextNumber.toString().padStart(this.PADDING_LENGTH, '0');
    return `${this.PREFIX}${paddedNumber}`;
  }

  /**
   * Valide le format d'un identifiant de médicament
   * @param id - L'identifiant à valider
   * @returns true si le format est valide
   */
  static isValidFormat(id: string): boolean {
    const regex = new RegExp(`^${this.PREFIX}\\d{${this.PADDING_LENGTH}}$`);
    return regex.test(id);
  }

  /**
   * Extrait le numéro d'un identifiant de médicament
   * @param id - L'identifiant
   * @returns Le numéro ou null si invalide
   */
  static extractNumber(id: string): number | null {
    if (!this.isValidFormat(id)) {
      return null;
    }
    const numberPart = id.substring(this.PREFIX.length);
    return parseInt(numberPart, 10);
  }

  /**
   * Génère un identifiant basé sur un numéro spécifique
   * @param number - Le numéro à utiliser
   * @returns L'identifiant formaté
   */
  static generateFromNumber(number: number): string {
    if (number < 0) {
      throw new Error('Le numéro doit être positif');
    }
    const paddedNumber = number.toString().padStart(this.PADDING_LENGTH, '0');
    return `${this.PREFIX}${paddedNumber}`;
  }
}
