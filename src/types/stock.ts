export interface Medicament {
  id: string;
  code: string;
  nom: string;
  forme: string;
  dosage: string;
  unite: string;
  fournisseur: string;
  prixUnitaire: number;
  seuilAlerte: number;
  seuilRupture: number;
  emplacement: string;
  categorie: string;
  prescriptionRequise: boolean;
  dateCreation: Date;
  dateModification: Date;
}

export interface Lot {
  id: string;
  medicamentId: string;
  numeroLot: string;
  quantiteInitiale: number;
  quantiteDisponible: number;
  dateReception: Date;
  dateExpiration: Date;
  prixAchat: number;
  fournisseur: string;
  statut: 'actif' | 'expire' | 'epuise';
  magasin: 'gros' | 'detail';
}

export interface MouvementStock {
  id: string;
  type: 'reception' | 'transfert' | 'dispensation' | 'retour' | 'perte' | 'correction';
  medicamentId: string;
  lotId?: string;
  quantite: number;
  quantiteAvant: number;
  quantiteApres: number;
  motif: string;
  utilisateurId: string;
  dateMouvement: Date;
  magasinSource: 'gros' | 'detail' | 'externe';
  magasinDestination: 'gros' | 'detail' | 'patient' | 'service';
  referenceDocument?: string;
  observations?: string;
}

export interface Transfert {
  id: string;
  numeroTransfert: string;
  dateTransfert: Date;
  magasinSource: 'gros';
  magasinDestination: 'detail';
  statut: 'en_cours' | 'valide' | 'annule';
  medicaments: TransfertLigne[];
  utilisateurSourceId: string;
  utilisateurDestinationId?: string;
  dateValidation?: Date;
  observations?: string;
}

export interface TransfertLigne {
  id: string;
  transfertId: string;
  medicamentId: string;
  lotId: string;
  quantite: number;
  quantiteValidee?: number;
}

export interface Dispensation {
  id: string;
  numeroDispensation: string;
  dateDispensation: Date;
  patientId?: string;
  serviceId?: string;
  typeDispensation: 'patient' | 'service';
  statut: 'en_cours' | 'terminee' | 'annulee';
  medicaments: DispensationLigne[];
  utilisateurId: string;
  prescriptionId?: string;
  observations?: string;
}

export interface DispensationLigne {
  id: string;
  dispensationId: string;
  medicamentId: string;
  lotId: string;
  quantite: number;
  prixUnitaire: number;
  prixTotal: number;
}

export interface AlerteStock {
  id: string;
  medicamentId: string;
  type: 'rupture' | 'seuil_bas' | 'peremption' | 'stock_surplus';
  niveau: 'critique' | 'avertissement' | 'information';
  message: string;
  dateCreation: Date;
  dateResolution?: Date;
  statut: 'active' | 'resolue' | 'ignoree';
  utilisateurResolutionId?: string;
}

export interface Inventaire {
  id: string;
  numeroInventaire: string;
  dateInventaire: Date;
  magasin: 'gros' | 'detail';
  statut: 'en_cours' | 'termine' | 'valide';
  lignes: InventaireLigne[];
  utilisateurId: string;
  dateValidation?: Date;
  observations?: string;
}

export interface InventaireLigne {
  id: string;
  inventaireId: string;
  medicamentId: string;
  lotId: string;
  quantiteTheorique: number;
  quantiteReelle: number;
  ecart: number;
  observations?: string;
}

export interface RapportStock {
  periode: {
    debut: Date;
    fin: Date;
  };
  magasin: 'gros' | 'detail' | 'tous';
  medicaments: RapportMedicament[];
  mouvements: MouvementStock[];
  alertes: AlerteStock[];
  statistiques: {
    totalEntrees: number;
    totalSorties: number;
    totalPertes: number;
    totalRetours: number;
    valeurStock: number;
  };
}

export interface RapportMedicament {
  medicamentId: string;
  nom: string;
  quantiteInitiale: number;
  quantiteFinale: number;
  entrees: number;
  sorties: number;
  pertes: number;
  retours: number;
  valeurStock: number;
  alertes: AlerteStock[];
}
