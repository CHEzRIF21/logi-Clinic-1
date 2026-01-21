/**
 * Script d'importation des médicaments dans Supabase
 * 
 * Ce script :
 * 1. Charge la liste complète des médicaments
 * 2. Nettoie et trie alphabétiquement
 * 3. Supprime les doublons
 * 4. Génère des codes uniques
 * 5. Insère dans Supabase
 */

import { supabase } from '../services/stockSupabase';
import { listeMedicamentsComplet, normaliserNomMedicament, extraireForme, extraireDosage, extraireUnite } from '../data/listeMedicamentsComplet';
import { MedicamentIdGenerator } from '../utils/medicamentIdGenerator';

export interface MedicamentImport {
  code: string;
  nom: string;
  forme: string;
  dosage: string;
  unite: string;
  fournisseur: string;
  prix_unitaire: number;
  seuil_alerte: number;
  seuil_rupture: number;
  emplacement: string;
  categorie: string;
  prescription_requise: boolean;
  dci?: string;
  observations?: string;
  clinic_id?: string | null; // NULL pour médicaments globaux (toutes les cliniques)
}

/**
 * Nettoie et déduplique la liste des médicaments
 */
function nettoyerEtDedupliquer(medicaments: typeof listeMedicamentsComplet): string[] {
  const normalises = new Set<string>();
  const resultats: string[] = [];
  
  for (const med of medicaments) {
    const nomNormalise = normaliserNomMedicament(med.nom);
    
    // Vérifier si c'est un doublon exact
    if (!normalises.has(nomNormalise)) {
      normalises.add(nomNormalise);
      resultats.push(med.nom); // Garder le nom original
    }
  }
  
  // Trier alphabétiquement
  return resultats.sort((a, b) => {
    const aNorm = normaliserNomMedicament(a);
    const bNorm = normaliserNomMedicament(b);
    return aNorm.localeCompare(bNorm, 'fr', { sensitivity: 'base' });
  });
}

/**
 * Détermine la catégorie d'un médicament basée sur son nom
 */
function determinerCategorie(nom: string): string {
  const nomUpper = nom.toUpperCase();
  
  // Antibiotiques
  if (nomUpper.includes('AMOXICILLINE') || nomUpper.includes('CEFTRIAXONE') || 
      nomUpper.includes('CIPROFLOXACINE') || nomUpper.includes('METRONIDAZOLE') ||
      nomUpper.includes('AZITHROMYCINE') || nomUpper.includes('COTRIMOXAZOLE') ||
      nomUpper.includes('FLUCLOXACILLINE') || nomUpper.includes('SPECTINOMYCINE') ||
      nomUpper.includes('STREPTOMYCINE') || nomUpper.includes('CHLORAMPHENICOL')) {
    return 'Antibiotiques';
  }
  
  // Antalgiques
  if (nomUpper.includes('PARACETAMOL') || nomUpper.includes('TRAMADOL') ||
      nomUpper.includes('MORPHINE') || nomUpper.includes('ASPIRINE') ||
      nomUpper.includes('ACIDE ACETYLSALICYLIQUE') || nomUpper.includes('RESTRIVA')) {
    return 'Antalgiques';
  }
  
  // Anti-inflammatoires
  if (nomUpper.includes('IBUPROFENE') || nomUpper.includes('IBUPROFEN') ||
      nomUpper.includes('DICLOFENAC') || nomUpper.includes('KETOPROFEN') ||
      nomUpper.includes('INDOMETACINE') || nomUpper.includes('KETOROLAC')) {
    return 'Anti-inflammatoires';
  }
  
  // Vitamines
  if (nomUpper.includes('VITAMINE') || nomUpper.includes('VIT ') ||
      nomUpper.includes('CALCIUM') || nomUpper.includes('FER') ||
      nomUpper.includes('MULTIVITAMINE') || nomUpper.includes('JUVAMINE')) {
    return 'Vitamines';
  }
  
  // Anesthésiques
  if (nomUpper.includes('KETAMINE') || nomUpper.includes('PROPOFOL') ||
      nomUpper.includes('LIDOCAINE') || nomUpper.includes('HALOTHANE') ||
      nomUpper.includes('ISOFLURANE') || nomUpper.includes('SEVOFLURANE')) {
    return 'Anesthésiques';
  }
  
  // Cardiovasculaires
  if (nomUpper.includes('NIFEDIPINE') || nomUpper.includes('HYDROCHLOROTHIAZIDE') ||
      nomUpper.includes('RAMITHIAZIDE') || nomUpper.includes('ISOSORBIDE') ||
      nomUpper.includes('NORADRENALINE') || nomUpper.includes('ISOPRENALINE')) {
    return 'Cardiovasculaires';
  }
  
  // Antidiabétiques
  if (nomUpper.includes('INSULINE') || nomUpper.includes('METFORMINE') ||
      nomUpper.includes('GLIBENCLAMIDE')) {
    return 'Antidiabétiques';
  }
  
  // Anticancéreux
  if (nomUpper.includes('VINCRISTINE') || nomUpper.includes('VINBLASTINE') ||
      nomUpper.includes('VINORELBINE') || nomUpper.includes('DOCETAXEL') ||
      nomUpper.includes('TAMOXIFENE') || nomUpper.includes('SORAFENIB') ||
      nomUpper.includes('IMATINIB') || nomUpper.includes('LENALIDOMIDE') ||
      nomUpper.includes('IRINOTECAN') || nomUpper.includes('GEMCITABINE') ||
      nomUpper.includes('DACARBAZINE') || nomUpper.includes('CYCLOPHOSPHAMIDE') ||
      nomUpper.includes('HERCEPTIN') || nomUpper.includes('ZOLADEX')) {
    return 'Anticancéreux';
  }
  
  // Antipsychotiques
  if (nomUpper.includes('HALOPERIDOL') || nomUpper.includes('CHLORPROMAZINE')) {
    return 'Antipsychotiques';
  }
  
  // Antifongiques
  if (nomUpper.includes('FLUCONAZOLE') || nomUpper.includes('KETOCONAZOLE') ||
      nomUpper.includes('GRISEOFULVINE')) {
    return 'Antifongiques';
  }
  
  // Antiviraux
  if (nomUpper.includes('RIBAVIRINE') || nomUpper.includes('TENOFOVIR')) {
    return 'Antiviraux';
  }
  
  // Matériel médical / Consommables
  if (nomUpper.includes('SONDE') || nomUpper.includes('CATHETER') ||
      nomUpper.includes('SERINGUE') || nomUpper.includes('AIGUILLE') ||
      nomUpper.includes('GANT') || nomUpper.includes('COMPRESSE') ||
      nomUpper.includes('BANDE') || nomUpper.includes('FIL DE SUT') ||
      nomUpper.includes('LAME') || nomUpper.includes('TUBE') ||
      nomUpper.includes('PAPIER') || nomUpper.includes('POT') ||
      nomUpper.includes('POCHE') || nomUpper.includes('MASQUE') ||
      nomUpper.includes('THERMOMETRE') || nomUpper.includes('TENSIOMETRE') ||
      nomUpper.includes('GLUCOMETRE') || nomUpper.includes('LARYNGOSCOPE') ||
      nomUpper.includes('AUTOCLAVE') || nomUpper.includes('BEC BUNSEN') ||
      nomUpper.includes('MICROPIPETTE') || nomUpper.includes('CELLULE') ||
      nomUpper.includes('LAMELLE') || nomUpper.includes('RADIO FILM') ||
      nomUpper.includes('KIT') || nomUpper.includes('SOLUTION DE') ||
      nomUpper.includes('FORMOL') || nomUpper.includes('EAU') ||
      nomUpper.includes('BETADINE') || nomUpper.includes('VASELINE')) {
    return 'Matériel médical';
  }
  
  // Tests de laboratoire
  if (nomUpper.includes('TEST') || nomUpper.includes('CASSETTE') ||
      nomUpper.includes('TDR') || nomUpper.includes('RAPID') ||
      nomUpper.includes('SPINREACT') || nomUpper.includes('SPRINREACT') ||
      nomUpper.includes('BIOLABO') || nomUpper.includes('CROMATEST') ||
      nomUpper.includes('ANTIGEN') || nomUpper.includes('SERUM') ||
      nomUpper.includes('CONTROLE')) {
    return 'Tests de laboratoire';
  }
  
  return 'Autres';
}

/**
 * Détermine si un médicament nécessite une prescription
 */
function necessitePrescription(nom: string): boolean {
  const nomUpper = nom.toUpperCase();
  
  // Antibiotiques nécessitent généralement une prescription
  if (nomUpper.includes('AMOXICILLINE') || nomUpper.includes('CEFTRIAXONE') ||
      nomUpper.includes('CIPROFLOXACINE') || nomUpper.includes('METRONIDAZOLE') ||
      nomUpper.includes('AZITHROMYCINE') || nomUpper.includes('COTRIMOXAZOLE')) {
    return true;
  }
  
  // Médicaments contrôlés
  if (nomUpper.includes('MORPHINE') || nomUpper.includes('TRAMADOL') ||
      nomUpper.includes('DIAZEPAM') || nomUpper.includes('KETAMINE') ||
      nomUpper.includes('PROPOFOL') || nomUpper.includes('SUFENTANIL')) {
    return true;
  }
  
  // Anticancéreux
  if (nomUpper.includes('VINCRISTINE') || nomUpper.includes('VINBLASTINE') ||
      nomUpper.includes('DOCETAXEL') || nomUpper.includes('TAMOXIFENE') ||
      nomUpper.includes('SORAFENIB') || nomUpper.includes('IMATINIB')) {
    return true;
  }
  
  return false;
}

/**
 * Importe tous les médicaments dans Supabase
 */
export async function importerMedicaments(): Promise<{
  success: boolean;
  total: number;
  importes: number;
  erreurs: number;
  codes: string[];
}> {
  try {
    console.log('🚀 Début de l\'importation des médicaments...');
    
    // 1. Nettoyer et dédupliquer
    const medicamentsNettoyes = nettoyerEtDedupliquer(listeMedicamentsComplet);
    console.log(`📋 ${medicamentsNettoyes.length} médicaments uniques après nettoyage`);
    
    // 2. Récupérer les médicaments existants (codes et noms normalisés)
    const { data: medicamentsExistants, error: errorExistants } = await supabase
      .from('medicaments')
      .select('code, nom');
    
    if (errorExistants) {
      console.error('❌ Erreur lors de la récupération des médicaments existants:', errorExistants);
      throw errorExistants;
    }
    
    const codesExistants = (medicamentsExistants || []).map(m => m.code);
    // Créer un Set des noms normalisés existants pour vérifier les doublons
    const nomsNormalisesExistants = new Set(
      (medicamentsExistants || []).map(m => normaliserNomMedicament(m.nom))
    );
    console.log(`📊 ${codesExistants.length} médicaments existants trouvés`);
    
    // 3. Préparer les données pour l'importation (en excluant les doublons)
    const medicamentsAImporter: MedicamentImport[] = [];
    let codeIndex = 0;
    let doublonsExclus = 0;
    
    for (const nom of medicamentsNettoyes) {
      const nomNormalise = normaliserNomMedicament(nom);
      
      // Vérifier si un médicament avec le même nom normalisé existe déjà
      if (nomsNormalisesExistants.has(nomNormalise)) {
        doublonsExclus++;
        console.log(`⚠️ Doublon exclu: "${nom}" (déjà présent dans la base)`);
        continue;
      }
      
      // Ajouter le nom normalisé au Set pour éviter les doublons dans cette importation
      nomsNormalisesExistants.add(nomNormalise);
      
      // Générer un code unique
      let code: string;
      do {
        code = MedicamentIdGenerator.generateFromNumber(codeIndex);
        codeIndex++;
      } while (codesExistants.includes(code));
      
      codesExistants.push(code);
      
      const medicament: MedicamentImport = {
        code,
        nom: nom.trim(),
        forme: extraireForme(nom),
        dosage: extraireDosage(nom) || 'N/A',
        unite: extraireUnite(nom),
        fournisseur: 'Non spécifié',
        prix_unitaire: 0,
        seuil_alerte: 10,
        seuil_rupture: 5,
        emplacement: '',
        categorie: determinerCategorie(nom),
        prescription_requise: necessitePrescription(nom),
        clinic_id: null, // NULL pour que les médicaments soient disponibles pour toutes les cliniques
      };
      
      medicamentsAImporter.push(medicament);
    }
    
    if (doublonsExclus > 0) {
      console.log(`⚠️ ${doublonsExclus} doublon(s) exclu(s) de l'importation`);
    }
    
    console.log(`✅ ${medicamentsAImporter.length} médicaments préparés pour l'importation`);
    
    // 4. Insérer par lots de 100 pour éviter les timeouts
    const lotSize = 100;
    let importes = 0;
    let erreurs = 0;
    const codesGeneres: string[] = [];
    
    for (let i = 0; i < medicamentsAImporter.length; i += lotSize) {
      const lot = medicamentsAImporter.slice(i, i + lotSize);
      
      const { data, error } = await supabase
        .from('medicaments')
        .insert(lot)
        .select('code');
      
      if (error) {
        console.error(`❌ Erreur lors de l'insertion du lot ${Math.floor(i / lotSize) + 1}:`, error);
        erreurs += lot.length;
      } else {
        importes += data?.length || 0;
        codesGeneres.push(...(data?.map(m => m.code) || []));
        console.log(`✅ Lot ${Math.floor(i / lotSize) + 1} importé: ${data?.length || 0} médicaments`);
      }
    }
    
    console.log(`\n📊 Résumé de l'importation:`);
    console.log(`   Total à importer: ${medicamentsAImporter.length}`);
    console.log(`   Importés avec succès: ${importes}`);
    if (doublonsExclus > 0) {
      console.log(`   Doublons exclus: ${doublonsExclus}`);
    }
    console.log(`   Erreurs: ${erreurs}`);
    
    return {
      success: erreurs === 0,
      total: medicamentsAImporter.length,
      importes,
      erreurs,
      codes: codesGeneres,
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    throw error;
  }
}

/**
 * Fonction pour vérifier les médicaments existants
 */
export async function verifierMedicamentsExistants(): Promise<number> {
  const { count, error } = await supabase
    .from('medicaments')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    throw error;
  }
  
  return count || 0;
}
