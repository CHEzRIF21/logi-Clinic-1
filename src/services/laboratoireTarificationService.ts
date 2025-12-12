/**
 * Service de tarification pour les analyses de laboratoire
 * Basé sur la fiche de tarification fournie
 */

export interface AnalyseTarif {
  numero: string;
  nom: string;
  prix: number; // en XOF
  tube: string;
  code?: string;
}

export const TARIFS_LABORATOIRE: AnalyseTarif[] = [
  { numero: '01', nom: 'Acetonurie', prix: 1000, tube: 'Tube propre', code: 'ACETONURIE' },
  { numero: '02', nom: 'Acide urique (uricémie)', prix: 2000, tube: 'Tube sec', code: 'ACIDE_URIQUE' },
  { numero: '03', nom: 'AgHBs', prix: 2500, tube: 'Tube sec', code: 'AGHBS' },
  { numero: '04', nom: 'Albumine', prix: 1000, tube: 'Tube sec', code: 'ALBUMINE' },
  { numero: '05', nom: 'Alpha foeto proteine', prix: 16000, tube: 'Tube propre', code: 'AFP' },
  { numero: '06', nom: 'Amylase', prix: 6000, tube: 'Tube sec', code: 'AMYLASE' },
  { numero: '07', nom: 'ASLO', prix: 4500, tube: 'Tube sec', code: 'ASLO' },
  { numero: '08', nom: 'Autres cultures', prix: 10000, tube: 'Pot stérile', code: 'CULTURES' },
  { numero: '09', nom: 'Beta HCG quantitatif', prix: 15000, tube: 'Tube stérile', code: 'BHCG_QUANT' },
  { numero: '10', nom: 'Beta HCG qualitatif', prix: 2500, tube: 'Tube sec', code: 'BHCG_QUAL' },
  { numero: '11', nom: 'Bilirubine direct ou conjuguée', prix: 2500, tube: 'Tube sec', code: 'BILIRUBINE_DIRECTE' },
  { numero: '12', nom: 'Bilirubine totale', prix: 2500, tube: 'Tube sec', code: 'BILIRUBINE_TOTALE' },
  { numero: '13', nom: 'Calcémie', prix: 3000, tube: 'Tube sec ou hépariné', code: 'CALCEMIE' },
  { numero: '14', nom: 'Cholesterol HDL', prix: 2500, tube: 'Tube sec', code: 'CHOLESTEROL_HDL' },
  { numero: '15', nom: 'Cholesterole totale', prix: 2500, tube: 'Tube sec', code: 'CHOLESTEROL_TOTAL' },
  { numero: '16', nom: 'Chlore', prix: 2500, tube: 'Tube sec', code: 'CHLORE' },
  { numero: '17', nom: 'Coprologie parasitaire complète', prix: 2500, tube: 'Pot de prélèvement', code: 'COPROLOGIE' },
  { numero: '18', nom: 'CPK', prix: 5000, tube: 'Tube sec', code: 'CPK' },
  { numero: '19', nom: 'Créatinémie', prix: 2000, tube: 'Tube sec', code: 'CREATINEMIE' },
  { numero: '20', nom: 'ECBU SIMPLE', prix: 5000, tube: 'Pot stérile', code: 'ECBU_SIMPLE' },
  { numero: '21', nom: 'ECBU+ATB', prix: 10000, tube: 'Pot stérile', code: 'ECBU_ATB' },
  { numero: '22', nom: 'ECB du LCR', prix: 5000, tube: 'Tubes stérile', code: 'ECB_LCR' },
  { numero: '23', nom: 'ECB du LCR+ chimie', prix: 13000, tube: 'Tube sterile', code: 'ECB_LCR_CHIMIE' },
  { numero: '24', nom: 'Electrophorèse de l\'hemoglobine', prix: 4000, tube: 'EDTA', code: 'ELECTROPHORESE_HB' },
  { numero: '25', nom: 'Electrophorèse des proteines serique', prix: 20000, tube: 'Tube sec', code: 'ELECTROPHORESE_PROT' },
  { numero: '26', nom: 'Facteurs Rhumatoïdes (FR)', prix: 3000, tube: 'Tube sec', code: 'FACTEURS_RHUMATOIDES' },
  { numero: '27', nom: 'FSH', prix: 16000, tube: 'Tubes sec', code: 'FSH' },
  { numero: '28', nom: 'FS+GE+DP', prix: 1500, tube: 'EDTA', code: 'FS_GE_DP' },
  { numero: '29', nom: 'FT3', prix: 16000, tube: 'Tube sec', code: 'FT3' },
  { numero: '30', nom: 'FT4', prix: 16000, tube: 'Tube sec', code: 'FT4' },
  { numero: '31', nom: 'Gamma GT', prix: 4500, tube: 'tube sec', code: 'GAMMA_GT' },
  { numero: '32', nom: 'Glycémie à jeun', prix: 1000, tube: 'Oxalate ou fluorure', code: 'GLYCEMIE_JEUN' },
  { numero: '33', nom: 'Groupage sanguin rhésus', prix: 2500, tube: 'Tube sec ou EDTA', code: 'GROUPAGE_SANGUIN' },
  { numero: '34', nom: 'Glucose post prandiale', prix: 1500, tube: 'fluorure', code: 'GLUCOSE_POST_PRANDIAL' },
  { numero: '35', nom: 'G6PD', prix: 12000, tube: 'EDTA', code: 'G6PD' },
  { numero: '36', nom: 'Hemoglobinurie', prix: 1000, tube: 'Tube propre', code: 'HEMOGLOBINURIE' },
  { numero: '37', nom: 'Hepatite c (HCV)', prix: 5000, tube: 'Tube sec', code: 'HEPATITE_C' },
  { numero: '38', nom: 'HLM', prix: 3000, tube: 'Pot stérile', code: 'HLM' },
  { numero: '39', nom: 'Hyper glycémie provoquée', prix: 4000, tube: 'Oxalate ou fluorure', code: 'HYPER_GLYCEMIE_PROVOQUEE' },
  { numero: '40', nom: 'Ionogramme sanguin', prix: 9000, tube: 'Tube sec ou hépariné', code: 'IONOGRAMME' },
  { numero: '41', nom: 'Ionogramme + calcium', prix: 12000, tube: 'Tube sec ou hépariné', code: 'IONOGRAMME_CALCIUM' },
  { numero: '42', nom: 'LCR: chlorurorachie', prix: 2500, tube: 'Tube sec', code: 'LCR_CHLORURORACHIE' },
  { numero: '43', nom: 'LCR: glycorachie', prix: 1000, tube: 'Tube sec', code: 'LCR_GLYCORACHIE' },
  { numero: '44', nom: 'LCR: protéinorachie', prix: 1500, tube: 'Tube sec', code: 'LCR_PROTEINORACHIE' },
  { numero: '45', nom: 'LCR + ATB', prix: 10000, tube: 'Tube sterile', code: 'LCR_ATB' },
  { numero: '46', nom: 'LH plasmatique', prix: 15000, tube: 'Tube sec', code: 'LH_PLASMATIQUE' },
  { numero: '47', nom: 'LH urique', prix: 15000, tube: 'Pot stérile', code: 'LH_URIQUE' },
  { numero: '48', nom: 'Liquide articulaire + ATB', prix: 10000, tube: 'Tube stérile', code: 'LIQUIDE_ARTICULAIRE_ATB' },
  { numero: '49', nom: 'Magnésémie', prix: 3000, tube: 'Tube sec', code: 'MAGNESEMIE' },
  { numero: '50', nom: 'Methode de Graham (scoth test)', prix: 3000, tube: '', code: 'GRAHAM_SCOOTH' },
  { numero: '51', nom: 'Natrémie', prix: 3000, tube: 'Tube sec ou hépariné', code: 'NATREMIE' },
  { numero: '52', nom: 'Numération blanche', prix: 1000, tube: 'EDTA', code: 'NUMERATION_BLANCHE' },
  { numero: '53', nom: 'Numération formule sanguine+ plaquettes', prix: 3500, tube: 'EDTA', code: 'NFS_PLAQUETTES' },
  { numero: '54', nom: 'Numération plaquettes', prix: 1500, tube: 'EDTA', code: 'NUMERATION_PLAQUETTES' },
  { numero: '55', nom: 'Numération rouge', prix: 1000, tube: 'EDTA', code: 'NUMERATION_ROUGE' },
  { numero: '56', nom: 'Potassium', prix: 3000, tube: 'Tube sec ou hépariné', code: 'POTASSIUM' },
  { numero: '57', nom: 'Phosphatase acide', prix: 4000, tube: 'Tube sec', code: 'PHOSPHATASE_ACIDE' },
  { numero: '58', nom: 'Phosphatase alcaline', prix: 4000, tube: 'Tube sec', code: 'PHOSPHATASE_ALCALINE' },
  { numero: '59', nom: 'Phosphatase prostatique', prix: 4000, tube: 'Tube sec', code: 'PHOSPHATASE_PROSTATIQUE' },
  { numero: '60', nom: 'Phosphore', prix: 5000, tube: 'Tube sec', code: 'PHOSPHORE' },
  { numero: '61', nom: 'Prolactine sérique', prix: 16000, tube: 'Tube sec', code: 'PROLACTINE' },
  { numero: '62', nom: 'Progestérone', prix: 16000, tube: 'Tube sec', code: 'PROGESTERONE' },
  { numero: '63', nom: 'Proteine C Réactive (CRP)', prix: 4000, tube: 'Tube sec', code: 'CRP' },
  { numero: '64', nom: 'Protidémie', prix: 2500, tube: 'Tube sec', code: 'PROTIDEMIE' },
  { numero: '65', nom: 'Proteinurie des 24 heures', prix: 5000, tube: 'Bidon d\'1,5 L', code: 'PROTEINURIE_24H' },
  { numero: '66', nom: 'PSA libre', prix: 16000, tube: 'Tube sec', code: 'PSA_LIBRE' },
  { numero: '67', nom: 'PSA totale', prix: 16000, tube: 'Tube sec', code: 'PSA_TOTALE' },
  { numero: '68', nom: 'PV + ATB', prix: 10000, tube: 'Ecouvillon stérile', code: 'PV_ATB' },
  { numero: '69', nom: 'Recherche d\'agglutinine irrégulière (RAI)', prix: 6000, tube: 'Tube sec+ EDTA', code: 'RAI' },
  { numero: '70', nom: 'Recherche de microfilaire', prix: 5000, tube: 'EDTA', code: 'MICROFILAIRE' },
  { numero: '71', nom: 'Recherche des œufs de Bilharzie', prix: 2000, tube: 'Tube conique', code: 'BILHARZIE' },
  { numero: '72', nom: 'Sels et pigments biliaires', prix: 2000, tube: 'Tube propre', code: 'SELS_PIGMENTS_BILIAIRES' },
  { numero: '73', nom: 'Serologie chlamydiae', prix: 15000, tube: 'Tube sec', code: 'SEROLOGIE_CHLAMYDIAE' },
  { numero: '74', nom: 'Sero diagnostique de Widal (SDW)', prix: 4000, tube: 'Tube sec', code: 'SDW' },
  { numero: '75', nom: 'Serologie toxoplasmose (TOXO)', prix: 16000, tube: 'Tube sec', code: 'TOXOPLASMOSE' },
  { numero: '76', nom: 'Serologie rubéole (rubeole)', prix: 16000, tube: 'Tube sec', code: 'RUBEOLE' },
  { numero: '77', nom: 'Serologie HIV', prix: 2000, tube: 'Tube sec', code: 'SEROLOGIE_HIV' },
  { numero: '78', nom: 'Sodium', prix: 3000, tube: 'Tube sec ou hépariné', code: 'SODIUM' },
  { numero: '79', nom: 'Spermogramme + spermoculture + ATB', prix: 15000, tube: 'A faire au labo', code: 'SPERMOGRAMME_COMPLET' },
  { numero: '80', nom: 'Spermogramme', prix: 10000, tube: 'A faire au labo', code: 'SPERMOGRAMME' },
  { numero: '81', nom: 'Sucre', prix: 1000, tube: 'Tube propre', code: 'SUCRE' },
  { numero: '82', nom: 'Taux d\'hemoglobine', prix: 1000, tube: 'Tube sec', code: 'HEMOGLOBINE' },
  { numero: '83', nom: 'Taux d\'hématocrite', prix: 1000, tube: 'Tube sec', code: 'HEMATOCRITE' },
  { numero: '84', nom: 'Temps de Céphaline Kaolin (TCK)', prix: 4000, tube: 'Citrate', code: 'TCK' },
  { numero: '85', nom: 'Taux de prothrombine (TP + INR)', prix: 4000, tube: 'Citrate', code: 'TP_INR' },
  { numero: '86', nom: 'Temps de saignement (TS)', prix: 1000, tube: 'vaccinostyle', code: 'TS' },
  { numero: '87', nom: 'Temps de coagulation', prix: 1500, tube: '', code: 'TEMPS_COAGULATION' },
  { numero: '88', nom: 'Test biologique de grossesse (TBG)', prix: 2000, tube: 'Tube sec', code: 'TBG' },
  { numero: '89', nom: 'Test d\'Emmel', prix: 1000, tube: 'EDTA', code: 'TEST_EMMEL' },
  { numero: '90', nom: 'Testostérone libre plasmatique', prix: 30000, tube: 'Tube sec', code: 'TESTOSTERONE_LIBRE' },
  { numero: '91', nom: 'Testostérone totale plasmatique', prix: 30000, tube: 'Tube sec', code: 'TESTOSTERONE_TOTALE' },
  { numero: '92', nom: 'Transaminases', prix: 5000, tube: 'Tubes sec', code: 'TRANSAMINASES' },
  { numero: '93', nom: 'Triglycérides', prix: 2500, tube: 'Tube sec', code: 'TRIGLYCERIDES' },
  { numero: '94', nom: 'TPHA', prix: 2000, tube: 'Tube sec', code: 'TPHA' },
  { numero: '95', nom: 'TSH', prix: 16000, tube: 'Tube sec', code: 'TSH' },
  { numero: '96', nom: 'Urémie (Azotémie ou Urée)', prix: 2000, tube: 'Tube sec', code: 'UREMIE' },
  { numero: '97', nom: 'VDRL', prix: 2000, tube: 'Tube sec', code: 'VDRL' },
  { numero: '98', nom: 'Vitesse de sedimentation (VS)', prix: 2000, tube: 'citrate', code: 'VS' },
  { numero: '99', nom: 'Recherche d\'IgE', prix: 16000, tube: 'Tube sec', code: 'IGE' },
  { numero: '100', nom: 'CA 125', prix: 25000, tube: 'Tube sec', code: 'CA_125' },
  { numero: '101', nom: 'Hémoglobine glyquée (HBA1C)', prix: 10000, tube: 'EDTA', code: 'HBA1C' },
  { numero: '102', nom: 'CPK', prix: 6000, tube: 'Tube sec', code: 'CPK_2' },
  { numero: '103', nom: 'Ca 19-9', prix: 30000, tube: 'Tube sec', code: 'CA_19_9' },
  { numero: '104', nom: 'ACE', prix: 25000, tube: 'Tube sec', code: 'ACE' },
  { numero: '105', nom: 'D-Dimer', prix: 20000, tube: 'citrate', code: 'D_DIMER' },
  { numero: '106', nom: 'Œstradiol', prix: 16000, tube: 'Tube sec', code: 'OESTRADIOL' },
  { numero: '107', nom: 'Albuminurie', prix: 1000, tube: 'Urine de 24 h', code: 'ALBUMINURIE' },
  { numero: '108', nom: 'Glucosurie', prix: 1000, tube: 'Urine de 24 h', code: 'GLUCOSURIE' },
  { numero: '109', nom: 'Troponine l', prix: 25000, tube: 'Tube sec', code: 'TROPONINE_I' },
  { numero: '110', nom: 'AC anti Hbs', prix: 15000, tube: 'Tube sec', code: 'AC_ANTI_HBS' },
  { numero: '111', nom: 'AC HBe', prix: 25000, tube: 'Tube sec', code: 'AC_HBE' },
  { numero: '112', nom: 'AC anti HBc', prix: 25000, tube: 'Tube sec', code: 'AC_ANTI_HBC' },
  { numero: '113', nom: 'Quantification de la charge virale Hepatite B', prix: 70000, tube: 'Tube sec + EDTA', code: 'CHARGE_VIRALE_HBV' },
  { numero: '114', nom: 'Test de coombs direct et indirect', prix: 5000, tube: 'Tube sec + EDTA', code: 'COOMBS' },
  { numero: '115', nom: 'Lipasémie', prix: 5000, tube: 'Tube sec', code: 'LIPASEMIE' },
];

export class LaboratoireTarificationService {
  /**
   * Récupère tous les tarifs disponibles
   */
  static getAllTarifs(): AnalyseTarif[] {
    return TARIFS_LABORATOIRE;
  }

  /**
   * Recherche un tarif par nom (insensible à la casse)
   */
  static getTarifByNom(nom: string): AnalyseTarif | undefined {
    return TARIFS_LABORATOIRE.find(
      t => t.nom.toLowerCase().includes(nom.toLowerCase()) || 
           nom.toLowerCase().includes(t.nom.toLowerCase())
    );
  }

  /**
   * Recherche un tarif par code
   */
  static getTarifByCode(code: string): AnalyseTarif | undefined {
    return TARIFS_LABORATOIRE.find(t => t.code?.toUpperCase() === code.toUpperCase());
  }

  /**
   * Recherche un tarif par numéro
   */
  static getTarifByNumero(numero: string): AnalyseTarif | undefined {
    return TARIFS_LABORATOIRE.find(t => t.numero === numero);
  }

  /**
   * Calcule le prix total pour une liste d'analyses
   */
  static calculerPrixTotal(analyses: { nom: string; code?: string }[]): number {
    return analyses.reduce((total, analyse) => {
      const tarif = analyse.code 
        ? this.getTarifByCode(analyse.code)
        : this.getTarifByNom(analyse.nom);
      return total + (tarif?.prix || 0);
    }, 0);
  }

  /**
   * Recherche les analyses correspondant à un terme de recherche
   */
  static rechercherAnalyses(terme: string): AnalyseTarif[] {
    if (!terme.trim()) return TARIFS_LABORATOIRE;
    
    const termeLower = terme.toLowerCase();
    return TARIFS_LABORATOIRE.filter(
      t => t.nom.toLowerCase().includes(termeLower) ||
           t.code?.toLowerCase().includes(termeLower) ||
           t.numero.includes(terme)
    );
  }

  /**
   * Formate le prix en XOF
   */
  static formaterPrix(prix: number): string {
    return `${prix.toLocaleString('fr-FR')} FCFA`;
  }
}

