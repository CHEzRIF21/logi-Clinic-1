// Données de démonstration pour Logi Clinic
export const mockUsers = [
  {
    id: '1',
    nom: 'Koné',
    prenom: 'Fatou',
    email: 'fatou.kone@logiclinic.ci',
    role: 'admin',
    specialite: 'Administration',
    statut: 'actif',
    telephone: '+225 0701234567',
    dateCreation: '2024-01-15'
  },
  {
    id: '2',
    nom: 'Traoré',
    prenom: 'Dr. Amadou',
    email: 'amadou.traore@logiclinic.ci',
    role: 'medecin',
    specialite: 'Médecine générale',
    statut: 'actif',
    telephone: '+225 0701234568',
    dateCreation: '2024-01-20'
  },
  {
    id: '3',
    nom: 'Ouattara',
    prenom: 'Dr. Mariam',
    email: 'mariam.ouattara@logiclinic.ci',
    role: 'medecin',
    specialite: 'Pédiatrie',
    statut: 'actif',
    telephone: '+225 0701234569',
    dateCreation: '2024-02-01'
  },
  {
    id: '4',
    nom: 'Bamba',
    prenom: 'Aissatou',
    email: 'aissatou.bamba@logiclinic.ci',
    role: 'pharmacien',
    specialite: 'Pharmacie',
    statut: 'actif',
    telephone: '+225 0701234570',
    dateCreation: '2024-02-10'
  },
  {
    id: '5',
    nom: 'Diabaté',
    prenom: 'Dr. Issouf',
    email: 'issouf.diabate@logiclinic.ci',
    role: 'medecin',
    specialite: 'Gynécologie',
    statut: 'actif',
    telephone: '+225 0701234571',
    dateCreation: '2024-02-15'
  },
  {
    id: '6',
    nom: 'Coulibaly',
    prenom: 'Fanta',
    email: 'fanta.coulibaly@logiclinic.ci',
    role: 'infirmier',
    specialite: 'Soins infirmiers',
    statut: 'actif',
    telephone: '+225 0701234572',
    dateCreation: '2024-03-01'
  }
];

export const mockPatients = [
  {
    id: '1',
    nom: 'Kouassi',
    prenom: 'Aminata',
    identifiant: 'CS-PKO-2025-000001',
    age: 28,
    telephone: '+225 0701234580',
    statut: 'actif',
    adresse: 'Cocody, Abidjan',
    dateNaissance: '1996-05-15',
    groupeSanguin: 'O+',
    antecedents: 'Aucun',
    dateInscription: '2025-01-10'
  },
  {
    id: '2',
    nom: 'Yao',
    prenom: 'Kouamé',
    identifiant: 'CS-PKO-2025-000002',
    age: 45,
    telephone: '+225 0701234581',
    statut: 'actif',
    adresse: 'Yopougon, Abidjan',
    dateNaissance: '1979-08-22',
    groupeSanguin: 'A+',
    antecedents: 'Hypertension',
    dateInscription: '2025-01-12'
  },
  {
    id: '3',
    nom: 'Bénié',
    prenom: 'Fatim',
    identifiant: 'CS-PKO-2025-000003',
    age: 32,
    telephone: '+225 0701234582',
    statut: 'actif',
    adresse: 'Marcory, Abidjan',
    dateNaissance: '1992-12-03',
    groupeSanguin: 'B+',
    antecedents: 'Diabète type 2',
    dateInscription: '2025-01-15'
  },
  {
    id: '4',
    nom: 'Goué',
    prenom: 'Sékou',
    identifiant: 'CS-PKO-2025-000004',
    age: 19,
    telephone: '+225 0701234583',
    statut: 'actif',
    adresse: 'Treichville, Abidjan',
    dateNaissance: '2005-03-18',
    groupeSanguin: 'AB+',
    antecedents: 'Aucun',
    dateInscription: '2025-01-18'
  },
  {
    id: '5',
    nom: 'Kouamé',
    prenom: 'Adama',
    identifiant: 'CS-PKO-2025-000005',
    age: 67,
    telephone: '+225 0701234584',
    statut: 'actif',
    adresse: 'Plateau, Abidjan',
    dateNaissance: '1957-11-30',
    groupeSanguin: 'O-',
    antecedents: 'Arthrite, Hypertension',
    dateInscription: '2025-01-20'
  },
  {
    id: '6',
    nom: 'Bamba',
    prenom: 'Moussa',
    identifiant: 'CS-PKO-2025-000006',
    age: 24,
    telephone: '+225 0701234585',
    statut: 'actif',
    adresse: 'Adjame, Abidjan',
    dateNaissance: '2000-07-14',
    groupeSanguin: 'A-',
    antecedents: 'Aucun',
    dateInscription: '2025-01-22'
  },
  {
    id: '7',
    nom: 'Traoré',
    prenom: 'Hawa',
    identifiant: 'CS-PKO-2025-000007',
    age: 35,
    telephone: '+225 0701234586',
    statut: 'actif',
    adresse: 'Bingerville',
    dateNaissance: '1989-04-25',
    groupeSanguin: 'B-',
    antecedents: 'Asthme',
    dateInscription: '2025-01-25'
  },
  {
    id: '8',
    nom: 'Koné',
    prenom: 'Mamadou',
    identifiant: 'CS-PKO-2025-000008',
    age: 41,
    telephone: '+225 0701234587',
    statut: 'actif',
    adresse: 'Grand-Bassam',
    dateNaissance: '1983-09-08',
    groupeSanguin: 'O+',
    antecedents: 'Aucun',
    dateInscription: '2025-01-28'
  }
];

export const mockConsultations = [
  {
    id: '1',
    patient: 'Aminata Kouassi',
    patientId: '1',
    medecin: 'Dr. Amadou Traoré',
    medecinId: '2',
    date: '2025-01-15',
    heure: '09:00',
    type: 'Première fois',
    statut: 'terminée',
    motif: 'Fièvre et maux de tête',
    diagnostic: 'Grippe',
    prescription: 'Paracétamol 500mg, 3x/jour pendant 5 jours',
    montant: 15000,
    paiement: 'payé'
  },
  {
    id: '2',
    patient: 'Kouamé Yao',
    patientId: '2',
    medecin: 'Dr. Mariam Ouattara',
    medecinId: '3',
    date: '2025-01-16',
    heure: '10:30',
    type: 'Contrôle',
    statut: 'terminée',
    motif: 'Contrôle tension artérielle',
    diagnostic: 'Hypertension contrôlée',
    prescription: 'Amlodipine 5mg, 1x/jour',
    montant: 12000,
    paiement: 'payé'
  },
  {
    id: '3',
    patient: 'Fatim Bénié',
    patientId: '3',
    medecin: 'Dr. Issouf Diabaté',
    medecinId: '5',
    date: '2025-01-17',
    heure: '14:00',
    type: 'Consultation spécialisée',
    statut: 'en cours',
    motif: 'Suivi grossesse',
    diagnostic: 'Grossesse normale - 6ème mois',
    prescription: 'Acide folique, Fer',
    montant: 20000,
    paiement: 'en attente'
  },
  {
    id: '4',
    patient: 'Sékou Goué',
    patientId: '4',
    medecin: 'Dr. Amadou Traoré',
    medecinId: '2',
    date: '2025-01-18',
    heure: '11:15',
    type: 'Urgence',
    statut: 'terminée',
    motif: 'Blessure à la main',
    diagnostic: 'Coupure superficielle',
    prescription: 'Antibiotique local, pansement',
    montant: 18000,
    paiement: 'payé'
  },
  {
    id: '5',
    patient: 'Adama Kouamé',
    patientId: '5',
    medecin: 'Dr. Mariam Ouattara',
    medecinId: '3',
    date: '2025-01-20',
    heure: '08:45',
    type: 'Contrôle',
    statut: 'planifiée',
    motif: 'Contrôle diabète',
    diagnostic: 'À déterminer',
    prescription: 'À déterminer',
    montant: 15000,
    paiement: 'non payé'
  },
  {
    id: '6',
    patient: 'Moussa Bamba',
    patientId: '6',
    medecin: 'Dr. Issouf Diabaté',
    medecinId: '5',
    date: '2025-01-22',
    heure: '16:30',
    type: 'Première fois',
    statut: 'planifiée',
    motif: 'Douleurs abdominales',
    diagnostic: 'À déterminer',
    prescription: 'À déterminer',
    montant: 20000,
    paiement: 'non payé'
  }
];

export const mockMedicaments = [
  {
    id: '1',
    nom: 'Paracétamol',
    forme: 'Comprimé',
    dosage: '500mg',
    stock: 150,
    prix: 500,
    statut: 'disponible',
    fabricant: 'Pharma-CI',
    dateExpiration: '2026-12-31',
    categorie: 'Antidouleur',
    description: 'Antidouleur et antipyrétique'
  },
  {
    id: '2',
    nom: 'Amoxicilline',
    forme: 'Gélule',
    dosage: '1g',
    stock: 75,
    prix: 1200,
    statut: 'disponible',
    fabricant: 'MediPharm',
    dateExpiration: '2026-06-30',
    categorie: 'Antibiotique',
    description: 'Antibiotique à large spectre'
  },
  {
    id: '3',
    nom: 'Ibuprofène',
    forme: 'Comprimé',
    dosage: '400mg',
    stock: 0,
    prix: 800,
    statut: 'rupture',
    fabricant: 'Pharma-CI',
    dateExpiration: '2026-03-15',
    categorie: 'Anti-inflammatoire',
    description: 'Anti-inflammatoire non stéroïdien'
  },
  {
    id: '4',
    nom: 'Oméprazole',
    forme: 'Gélule',
    dosage: '20mg',
    stock: 45,
    prix: 1500,
    statut: 'disponible',
    fabricant: 'MediPharm',
    dateExpiration: '2026-09-30',
    categorie: 'Anti-ulcéreux',
    description: 'Protecteur gastrique'
  },
  {
    id: '5',
    nom: 'Vitamine C',
    forme: 'Comprimé effervescent',
    dosage: '1000mg',
    stock: 200,
    prix: 300,
    statut: 'disponible',
    fabricant: 'NutriPharm',
    dateExpiration: '2027-01-31',
    categorie: 'Vitamine',
    description: 'Complément vitaminique'
  },
  {
    id: '6',
    nom: 'Métronidazole',
    forme: 'Comprimé',
    dosage: '500mg',
    stock: 30,
    prix: 900,
    statut: 'disponible',
    fabricant: 'Pharma-CI',
    dateExpiration: '2026-04-30',
    categorie: 'Antibiotique',
    description: 'Antibiotique antiparasitaire'
  },
  {
    id: '7',
    nom: 'Aspirine',
    forme: 'Comprimé',
    dosage: '100mg',
    stock: 0,
    prix: 400,
    statut: 'rupture',
    fabricant: 'MediPharm',
    dateExpiration: '2026-02-28',
    categorie: 'Anticoagulant',
    description: 'Anticoagulant et antidouleur'
  },
  {
    id: '8',
    nom: 'Doliprane',
    forme: 'Sirop',
    dosage: '2.4%',
    stock: 25,
    prix: 1200,
    statut: 'disponible',
    fabricant: 'NutriPharm',
    dateExpiration: '2026-08-31',
    categorie: 'Antidouleur',
    description: 'Antidouleur pédiatrique'
  }
];

export const mockVentes = [
  {
    id: '1',
    date: '2025-01-15',
    patient: 'Aminata Kouassi',
    medicaments: [
      { nom: 'Paracétamol', quantite: 2, prix: 500, total: 1000 },
      { nom: 'Vitamine C', quantite: 1, prix: 300, total: 300 }
    ],
    total: 1300,
    paiement: 'Espèces',
    vendeur: 'Aissatou Bamba'
  },
  {
    id: '2',
    date: '2025-01-16',
    patient: 'Kouamé Yao',
    medicaments: [
      { nom: 'Amoxicilline', quantite: 1, prix: 1200, total: 1200 },
      { nom: 'Oméprazole', quantite: 1, prix: 1500, total: 1500 }
    ],
    total: 2700,
    paiement: 'Carte bancaire',
    vendeur: 'Aissatou Bamba'
  },
  {
    id: '3',
    date: '2025-01-17',
    patient: 'Fatim Bénié',
    medicaments: [
      { nom: 'Vitamine C', quantite: 2, prix: 300, total: 600 },
      { nom: 'Métronidazole', quantite: 1, prix: 900, total: 900 }
    ],
    total: 1500,
    paiement: 'Mobile Money',
    vendeur: 'Aissatou Bamba'
  }
];

export const mockRendezVous = [
  {
    id: '1',
    patient: 'Aminata Kouassi',
    medecin: 'Dr. Amadou Traoré',
    date: '2025-01-25',
    heure: '09:00',
    motif: 'Contrôle post-grippe',
    statut: 'confirmé',
    type: 'Consultation'
  },
  {
    id: '2',
    patient: 'Fatim Bénié',
    medecin: 'Dr. Issouf Diabaté',
    date: '2025-01-26',
    heure: '14:30',
    motif: 'Échographie grossesse',
    statut: 'confirmé',
    type: 'Examen'
  },
  {
    id: '3',
    patient: 'Adama Kouamé',
    medecin: 'Dr. Mariam Ouattara',
    date: '2025-01-27',
    heure: '10:15',
    motif: 'Contrôle diabète',
    statut: 'en attente',
    type: 'Consultation'
  },
  {
    id: '4',
    patient: 'Moussa Bamba',
    medecin: 'Dr. Amadou Traoré',
    date: '2025-01-28',
    heure: '16:00',
    motif: 'Résultats analyses',
    statut: 'confirmé',
    type: 'Consultation'
  }
];

export const mockMaternite = [
  {
    id: '1',
    patient: 'Fatim Bénié',
    dateAccouchement: '2025-01-20',
    heure: '03:45',
    type: 'Accouchement normal',
    sexeBebe: 'Fille',
    poidsBebe: 3.2,
    tailleBebe: 50,
    medecin: 'Dr. Issouf Diabaté',
    statut: 'Terminé'
  },
  {
    id: '2',
    patient: 'Hawa Traoré',
    dateAccouchement: '2025-01-22',
    heure: '11:20',
    type: 'Césarienne',
    sexeBebe: 'Garçon',
    poidsBebe: 3.8,
    tailleBebe: 52,
    medecin: 'Dr. Issouf Diabaté',
    statut: 'En cours'
  }
];

// Fonction pour générer des données aléatoires supplémentaires
export const generateRandomData = () => {
  const noms = ['Koné', 'Traoré', 'Ouattara', 'Bamba', 'Diabaté', 'Coulibaly', 'Kouassi', 'Yao', 'Bénié', 'Goué'];
  const prenoms = ['Fatou', 'Amadou', 'Mariam', 'Aissatou', 'Issouf', 'Fanta', 'Aminata', 'Kouamé', 'Fatim', 'Sékou'];
  const specialites = ['Médecine générale', 'Pédiatrie', 'Gynécologie', 'Cardiologie', 'Dermatologie', 'Ophtalmologie'];
  const motifs = ['Fièvre', 'Maux de tête', 'Douleurs abdominales', 'Contrôle', 'Vaccination', 'Consultation de routine'];
  const medicaments = ['Paracétamol', 'Amoxicilline', 'Ibuprofène', 'Oméprazole', 'Vitamine C', 'Métronidazole'];

  return {
    nom: noms[Math.floor(Math.random() * noms.length)],
    prenom: prenoms[Math.floor(Math.random() * prenoms.length)],
    specialite: specialites[Math.floor(Math.random() * specialites.length)],
    motif: motifs[Math.floor(Math.random() * motifs.length)],
    medicament: medicaments[Math.floor(Math.random() * medicaments.length)]
  };
};
