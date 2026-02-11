/**
 * Liste unifiée des médicaments pour les listes déroulantes (fallback)
 * Utilisée quand la base de données est vide ou pour enrichir les options de recherche.
 * Combine medicamentsFrequents (détaillés) et listeMedicamentsComplet (catalogue étendu).
 */

import { medicamentsFrequents } from './medicamentsFrequents';
import { listeMedicamentsComplet } from './listeMedicamentsComplet';
import type { MedicamentSafetyInfo } from '../services/prescriptionSafetyService';

/** Nom normalisé pour déduplication */
function normaliser(nom: string): string {
  return (nom || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

// Construire la liste unifiée (medicamentsFrequents en premier, puis listeMedicamentsComplet sans doublons)
const nomsVus = new Set<string>();
const listeUnifiee: MedicamentSafetyInfo[] = [];

// 1. Ajouter medicamentsFrequents (structure complète)
medicamentsFrequents.forEach((m, idx) => {
  const n = normaliser(m.nom);
  if (!nomsVus.has(n)) {
    nomsVus.add(n);
    listeUnifiee.push({
      id: `fallback-freq-${idx}`,
      code: m.dci?.substring(0, 10) || `FB-${idx}`,
      nom: m.nom,
      dosage: m.dosage,
      unite: m.unite,
      categorie: m.categorie,
      prescription_requise: false,
      seuil_alerte: 0,
      seuil_rupture: 0,
      stock_detail: 0,
      stock_gros: 0,
      stock_total: 0,
      molecules: [],
    });
  }
});

// 2. Ajouter listeMedicamentsComplet (limitée pour performance)
const maxAjout = 300;
let ajoutes = 0;
for (const m of listeMedicamentsComplet) {
  if (ajoutes >= maxAjout) break;
  const n = normaliser(m.nom);
  if (!nomsVus.has(n)) {
    nomsVus.add(n);
    listeUnifiee.push({
      id: `fallback-cat-${ajoutes}`,
      code: m.nom.substring(0, 12).replace(/\s/g, '-') || `CAT-${ajoutes}`,
      nom: m.nom,
      dosage: undefined,
      unite: 'Unité',
      categorie: 'Catalogue',
      prescription_requise: false,
      seuil_alerte: 0,
      seuil_rupture: 0,
      stock_detail: 0,
      stock_gros: 0,
      stock_total: 0,
      molecules: [],
    });
    ajoutes++;
  }
}

/**
 * Retourne les options de fallback pour les listes déroulantes médicament.
 * Filtre par query si fourni.
 */
export function getMedicamentsFallbackOptions(query?: string): MedicamentSafetyInfo[] {
  if (!query || query.trim().length < 1) {
    return listeUnifiee.slice(0, 100);
  }
  const q = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return listeUnifiee
    .filter(
      (m) =>
        m.nom.toLowerCase().includes(q) ||
        (m.code || '').toLowerCase().includes(q) ||
        (m.categorie || '').toLowerCase().includes(q)
    )
    .slice(0, 50);
}
