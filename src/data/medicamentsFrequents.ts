// Liste des médicaments fréquemment vendus dans les centres de santé
// Cette liste peut être utilisée pour pré-remplir les formulaires

export interface MedicamentFrequent {
  nom: string;
  dci: string;
  forme: string;
  dosage: string;
  unite: string;
  categorie: string;
  fournisseur?: string;
  prixUnitaire?: number;
  seuilMinimum?: number;
  seuilMaximum?: number;
  emplacement?: string;
}

export const medicamentsFrequents: MedicamentFrequent[] = [
  // Analgésiques et Antipyrétiques
  {
    nom: 'Paracétamol 500mg',
    dci: 'Paracétamol',
    forme: 'Comprimé',
    dosage: '500mg',
    unite: 'Boîte',
    categorie: 'Analgésiques',
    fournisseur: 'PNLP',
    prixUnitaire: 2500,
    seuilMinimum: 100,
    seuilMaximum: 1000,
    emplacement: 'Rayon A-1',
  },
  {
    nom: 'Paracétamol 1g',
    dci: 'Paracétamol',
    forme: 'Comprimé',
    dosage: '1g',
    unite: 'Boîte',
    categorie: 'Analgésiques',
    fournisseur: 'PNLP',
    prixUnitaire: 3000,
    seuilMinimum: 50,
    seuilMaximum: 500,
    emplacement: 'Rayon A-1',
  },
  {
    nom: 'Ibuprofène 400mg',
    dci: 'Ibuprofène',
    forme: 'Comprimé',
    dosage: '400mg',
    unite: 'Boîte',
    categorie: 'Anti-inflammatoires',
    fournisseur: 'Achat direct',
    prixUnitaire: 3200,
    seuilMinimum: 50,
    seuilMaximum: 200,
    emplacement: 'Rayon A-2',
  },
  {
    nom: 'Aspirine 500mg',
    dci: 'Acide acétylsalicylique',
    forme: 'Comprimé',
    dosage: '500mg',
    unite: 'Boîte',
    categorie: 'Analgésiques',
    fournisseur: 'PNLP',
    prixUnitaire: 2000,
    seuilMinimum: 50,
    seuilMaximum: 300,
    emplacement: 'Rayon A-1',
  },

  // Antibiotiques
  {
    nom: 'Amoxicilline 500mg',
    dci: 'Amoxicilline',
    forme: 'Gélule',
    dosage: '500mg',
    unite: 'Boîte',
    categorie: 'Antibiotiques',
    fournisseur: 'CAME',
    prixUnitaire: 5000,
    seuilMinimum: 30,
    seuilMaximum: 200,
    emplacement: 'Rayon B-1',
  },
  {
    nom: 'Amoxicilline 1g',
    dci: 'Amoxicilline',
    forme: 'Poudre injectable',
    dosage: '1g',
    unite: 'Flacon',
    categorie: 'Antibiotiques',
    fournisseur: 'CAME',
    prixUnitaire: 15000,
    seuilMinimum: 50,
    seuilMaximum: 500,
    emplacement: 'Frigo B-2',
  },
  {
    nom: 'Métronidazole 500mg',
    dci: 'Métronidazole',
    forme: 'Comprimé',
    dosage: '500mg',
    unite: 'Boîte',
    categorie: 'Antibiotiques',
    fournisseur: 'CAME',
    prixUnitaire: 4500,
    seuilMinimum: 20,
    seuilMaximum: 150,
    emplacement: 'Rayon B-2',
  },
  {
    nom: 'Ciprofloxacine 500mg',
    dci: 'Ciprofloxacine',
    forme: 'Comprimé',
    dosage: '500mg',
    unite: 'Boîte',
    categorie: 'Antibiotiques',
    fournisseur: 'CAME',
    prixUnitaire: 6000,
    seuilMinimum: 20,
    seuilMaximum: 100,
    emplacement: 'Rayon B-1',
  },

  // Antipaludiques
  {
    nom: 'Artesunate + Amodiaquine',
    dci: 'Artesunate + Amodiaquine',
    forme: 'Comprimé',
    dosage: '100mg/270mg',
    unite: 'Boîte',
    categorie: 'Antiparasitaires',
    fournisseur: 'PNLP',
    prixUnitaire: 3500,
    seuilMinimum: 100,
    seuilMaximum: 500,
    emplacement: 'Rayon C-1',
  },
  {
    nom: 'Quinine injectable',
    dci: 'Quinine',
    forme: 'Injection',
    dosage: '300mg/ml',
    unite: 'Ampoule',
    categorie: 'Antiparasitaires',
    fournisseur: 'PNLP',
    prixUnitaire: 2500,
    seuilMinimum: 50,
    seuilMaximum: 300,
    emplacement: 'Frigo C-2',
  },

  // Antihypertenseurs
  {
    nom: 'Amlodipine 5mg',
    dci: 'Amlodipine',
    forme: 'Comprimé',
    dosage: '5mg',
    unite: 'Boîte',
    categorie: 'Antihypertenseurs',
    fournisseur: 'CAME',
    prixUnitaire: 4000,
    seuilMinimum: 30,
    seuilMaximum: 200,
    emplacement: 'Rayon D-1',
  },
  {
    nom: 'Hydrochlorothiazide 25mg',
    dci: 'Hydrochlorothiazide',
    forme: 'Comprimé',
    dosage: '25mg',
    unite: 'Boîte',
    categorie: 'Antihypertenseurs',
    fournisseur: 'CAME',
    prixUnitaire: 3000,
    seuilMinimum: 30,
    seuilMaximum: 200,
    emplacement: 'Rayon D-1',
  },

  // Antidiabétiques
  {
    nom: 'Metformine 500mg',
    dci: 'Metformine',
    forme: 'Comprimé',
    dosage: '500mg',
    unite: 'Boîte',
    categorie: 'Antidiabétiques',
    fournisseur: 'CAME',
    prixUnitaire: 3500,
    seuilMinimum: 30,
    seuilMaximum: 200,
    emplacement: 'Rayon E-1',
  },
  {
    nom: 'Glibenclamide 5mg',
    dci: 'Glibenclamide',
    forme: 'Comprimé',
    dosage: '5mg',
    unite: 'Boîte',
    categorie: 'Antidiabétiques',
    fournisseur: 'CAME',
    prixUnitaire: 3000,
    seuilMinimum: 20,
    seuilMaximum: 150,
    emplacement: 'Rayon E-1',
  },

  // Vitamines
  {
    nom: 'Vitamine C 1000mg',
    dci: 'Acide ascorbique',
    forme: 'Comprimé',
    dosage: '1000mg',
    unite: 'Boîte',
    categorie: 'Vitamines',
    fournisseur: 'Achat direct',
    prixUnitaire: 2000,
    seuilMinimum: 50,
    seuilMaximum: 300,
    emplacement: 'Rayon F-1',
  },
  {
    nom: 'Fer + Acide folique',
    dci: 'Sulfate ferreux + Acide folique',
    forme: 'Comprimé',
    dosage: '200mg/5mg',
    unite: 'Boîte',
    categorie: 'Vitamines',
    fournisseur: 'PNLP',
    prixUnitaire: 2500,
    seuilMinimum: 100,
    seuilMaximum: 500,
    emplacement: 'Rayon F-1',
  },

  // Antihistaminiques
  {
    nom: 'Chlorphéniramine 4mg',
    dci: 'Chlorphéniramine',
    forme: 'Comprimé',
    dosage: '4mg',
    unite: 'Boîte',
    categorie: 'Antihistaminiques',
    fournisseur: 'CAME',
    prixUnitaire: 2000,
    seuilMinimum: 30,
    seuilMaximum: 200,
    emplacement: 'Rayon G-1',
  },

  // Antispasmodiques
  {
    nom: 'Hyoscine butylbromure 10mg',
    dci: 'Hyoscine butylbromure',
    forme: 'Comprimé',
    dosage: '10mg',
    unite: 'Boîte',
    categorie: 'Autres',
    fournisseur: 'CAME',
    prixUnitaire: 2500,
    seuilMinimum: 20,
    seuilMaximum: 150,
    emplacement: 'Rayon H-1',
  },

  // Antiacides
  {
    nom: 'Oméprazole 20mg',
    dci: 'Oméprazole',
    forme: 'Gélule',
    dosage: '20mg',
    unite: 'Boîte',
    categorie: 'Autres',
    fournisseur: 'CAME',
    prixUnitaire: 4000,
    seuilMinimum: 30,
    seuilMaximum: 200,
    emplacement: 'Rayon H-2',
  },
];

// Fonction pour rechercher un médicament dans la liste
export const rechercherMedicamentFrequent = (query: string): MedicamentFrequent[] => {
  if (!query || query.trim().length < 2) {
    return [];
  }
  const queryLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return medicamentsFrequents.filter(
    (med) =>
      med.nom.toLowerCase().includes(queryLower) ||
      med.dci.toLowerCase().includes(queryLower) ||
      med.categorie.toLowerCase().includes(queryLower)
  );
};

