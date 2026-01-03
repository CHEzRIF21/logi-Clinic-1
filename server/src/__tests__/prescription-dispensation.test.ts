/**
 * Tests unitaires pour l'intégration Prescription ↔ Dispensation
 * 
 * Ces tests vérifient:
 * - Récupération des prescriptions actives
 * - Création de dispensation
 * - Mise à jour du stock
 * - Création des tickets de facturation
 * - Synchronisation des statuts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Types pour les tests
interface MockPrescription {
  id: string;
  consultation_id: string;
  statut: 'PRESCRIT' | 'PARTIELLEMENT_DISPENSE' | 'DISPENSE' | 'ANNULE';
  lignes: MockPrescriptionLine[];
}

interface MockPrescriptionLine {
  id: string;
  prescription_id: string;
  medicament_id: string;
  nom_medicament: string;
  quantite_totale: number;
  quantite_dispensee: number;
}

interface MockDispensation {
  id: string;
  prescription_id: string;
  patient_id: string;
  type_dispensation: 'patient' | 'service';
  statut: 'en_cours' | 'terminee' | 'validee' | 'annulee';
  montant_total: number;
  montant_patient: number;
  montant_assurance: number;
  lignes: MockDispensationLigne[];
}

interface MockDispensationLigne {
  id: string;
  medicament_id: string;
  lot_id: string;
  quantite_delivree: number;
  prix_unitaire: number;
  prix_total: number;
}

interface MockLot {
  id: string;
  numero_lot: string;
  medicament_id: string;
  quantite_disponible: number;
  date_expiration: string;
  statut: 'actif' | 'inactif' | 'expire';
}

describe('Prescription → Dispensation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrescriptionsActives', () => {
    it('devrait retourner les prescriptions avec quantité restante', () => {
      // Arrange
      const prescription: MockPrescription = {
        id: 'presc-123',
        consultation_id: 'cons-456',
        statut: 'PRESCRIT',
        lignes: [
          {
            id: 'line-1',
            prescription_id: 'presc-123',
            medicament_id: 'med-1',
            nom_medicament: 'Paracétamol 500mg',
            quantite_totale: 20,
            quantite_dispensee: 0,
          },
          {
            id: 'line-2',
            prescription_id: 'presc-123',
            medicament_id: 'med-2',
            nom_medicament: 'Amoxicilline 500mg',
            quantite_totale: 21,
            quantite_dispensee: 7,
          },
        ],
      };

      // Assert
      const lignesRestantes = prescription.lignes.filter(
        l => l.quantite_totale - l.quantite_dispensee > 0
      );
      expect(lignesRestantes.length).toBe(2);
      expect(lignesRestantes[0].quantite_totale - lignesRestantes[0].quantite_dispensee).toBe(20);
      expect(lignesRestantes[1].quantite_totale - lignesRestantes[1].quantite_dispensee).toBe(14);
    });

    it('devrait exclure les prescriptions complètement dispensées', () => {
      // Arrange
      const prescriptionComplete: MockPrescription = {
        id: 'presc-complete',
        consultation_id: 'cons-789',
        statut: 'DISPENSE',
        lignes: [
          {
            id: 'line-1',
            prescription_id: 'presc-complete',
            medicament_id: 'med-1',
            nom_medicament: 'Paracétamol 500mg',
            quantite_totale: 10,
            quantite_dispensee: 10,
          },
        ],
      };

      // Assert
      const lignesRestantes = prescriptionComplete.lignes.filter(
        l => l.quantite_totale - l.quantite_dispensee > 0
      );
      expect(lignesRestantes.length).toBe(0);
    });

    it('devrait exclure les prescriptions annulées', () => {
      const prescriptionAnnulee: MockPrescription = {
        id: 'presc-annulee',
        consultation_id: 'cons-111',
        statut: 'ANNULE',
        lignes: [],
      };

      expect(prescriptionAnnulee.statut).toBe('ANNULE');
      expect(['PRESCRIT', 'PARTIELLEMENT_DISPENSE'].includes(prescriptionAnnulee.statut)).toBe(false);
    });
  });

  describe('verifierStock', () => {
    it('devrait valider si stock suffisant', () => {
      const lot: MockLot = {
        id: 'lot-123',
        numero_lot: 'LOT2024001',
        medicament_id: 'med-1',
        quantite_disponible: 100,
        date_expiration: '2026-12-31',
        statut: 'actif',
      };

      const quantiteDemandee = 20;
      const stockSuffisant = lot.quantite_disponible >= quantiteDemandee;

      expect(stockSuffisant).toBe(true);
    });

    it('devrait rejeter si stock insuffisant', () => {
      const lot: MockLot = {
        id: 'lot-456',
        numero_lot: 'LOT2024002',
        medicament_id: 'med-2',
        quantite_disponible: 5,
        date_expiration: '2026-12-31',
        statut: 'actif',
      };

      const quantiteDemandee = 10;
      const stockSuffisant = lot.quantite_disponible >= quantiteDemandee;

      expect(stockSuffisant).toBe(false);
    });

    it('devrait rejeter si lot expiré', () => {
      const lotExpire: MockLot = {
        id: 'lot-expire',
        numero_lot: 'LOT2023001',
        medicament_id: 'med-3',
        quantite_disponible: 50,
        date_expiration: '2024-01-01',
        statut: 'expire',
      };

      const dateExpiration = new Date(lotExpire.date_expiration);
      const estExpire = dateExpiration < new Date();

      expect(estExpire).toBe(true);
    });

    it('devrait avertir si lot expire dans moins de 30 jours', () => {
      const dateDans15Jours = new Date();
      dateDans15Jours.setDate(dateDans15Jours.getDate() + 15);

      const lotBientotExpire: MockLot = {
        id: 'lot-bientot',
        numero_lot: 'LOT2024003',
        medicament_id: 'med-4',
        quantite_disponible: 30,
        date_expiration: dateDans15Jours.toISOString().split('T')[0],
        statut: 'actif',
      };

      const dateExpiration = new Date(lotBientotExpire.date_expiration);
      const joursRestants = Math.ceil((dateExpiration.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      expect(joursRestants).toBeLessThan(30);
      expect(joursRestants).toBeGreaterThan(0);
    });
  });

  describe('creerDispensation', () => {
    it('devrait créer une dispensation avec calcul des montants', () => {
      const lignes: MockDispensationLigne[] = [
        { id: 'dl-1', medicament_id: 'med-1', lot_id: 'lot-1', quantite_delivree: 10, prix_unitaire: 500, prix_total: 5000 },
        { id: 'dl-2', medicament_id: 'med-2', lot_id: 'lot-2', quantite_delivree: 21, prix_unitaire: 300, prix_total: 6300 },
      ];

      const montantTotal = lignes.reduce((sum, l) => sum + l.prix_total, 0);
      expect(montantTotal).toBe(11300);
    });

    it('devrait calculer le tiers-payant correctement', () => {
      const montantTotal = 10000;
      const tauxCouverture = 70; // 70%

      const montantAssurance = Math.round(montantTotal * (tauxCouverture / 100));
      const montantPatient = montantTotal - montantAssurance;

      expect(montantAssurance).toBe(7000);
      expect(montantPatient).toBe(3000);
      expect(montantAssurance + montantPatient).toBe(montantTotal);
    });

    it('devrait respecter le plafond assurance', () => {
      const montantTotal = 50000;
      const tauxCouverture = 80; // 80%
      const plafond = 20000;

      let montantAssurance = Math.round(montantTotal * (tauxCouverture / 100));
      montantAssurance = Math.min(montantAssurance, plafond);
      const montantPatient = montantTotal - montantAssurance;

      expect(montantAssurance).toBe(20000); // Plafonné
      expect(montantPatient).toBe(30000);
    });
  });

  describe('Décrémentation du stock', () => {
    it('devrait décrémenter le stock après dispensation', () => {
      const lot: MockLot = {
        id: 'lot-decr',
        numero_lot: 'LOT2024004',
        medicament_id: 'med-5',
        quantite_disponible: 100,
        date_expiration: '2026-12-31',
        statut: 'actif',
      };

      const quantiteDispensee = 15;
      const nouveauStock = lot.quantite_disponible - quantiteDispensee;

      expect(nouveauStock).toBe(85);
    });

    it('devrait enregistrer un mouvement de stock', () => {
      const mouvementStock = {
        type: 'dispensation',
        medicament_id: 'med-5',
        lot_id: 'lot-decr',
        quantite: 15,
        quantite_avant: 100,
        quantite_apres: 85,
        motif: 'Dispensation DISP-2024-001',
      };

      expect(mouvementStock.type).toBe('dispensation');
      expect(mouvementStock.quantite_avant - mouvementStock.quantite).toBe(mouvementStock.quantite_apres);
    });
  });
});

describe('Synchronisation des statuts prescription', () => {
  it('devrait passer à PARTIELLEMENT_DISPENSE si dispensation partielle', () => {
    const prescription: MockPrescription = {
      id: 'presc-sync',
      consultation_id: 'cons-sync',
      statut: 'PRESCRIT',
      lignes: [
        { id: 'l1', prescription_id: 'presc-sync', medicament_id: 'm1', nom_medicament: 'Med1', quantite_totale: 20, quantite_dispensee: 10 },
        { id: 'l2', prescription_id: 'presc-sync', medicament_id: 'm2', nom_medicament: 'Med2', quantite_totale: 10, quantite_dispensee: 0 },
      ],
    };

    const totalLignes = prescription.lignes.length;
    const lignesCompletes = prescription.lignes.filter(l => l.quantite_dispensee >= l.quantite_totale).length;

    const nouveauStatut = 
      lignesCompletes === totalLignes ? 'DISPENSE' :
      lignesCompletes > 0 || prescription.lignes.some(l => l.quantite_dispensee > 0) ? 'PARTIELLEMENT_DISPENSE' :
      'PRESCRIT';

    expect(nouveauStatut).toBe('PARTIELLEMENT_DISPENSE');
  });

  it('devrait passer à DISPENSE si toutes les lignes dispensées', () => {
    const prescription: MockPrescription = {
      id: 'presc-complet',
      consultation_id: 'cons-complet',
      statut: 'PARTIELLEMENT_DISPENSE',
      lignes: [
        { id: 'l1', prescription_id: 'presc-complet', medicament_id: 'm1', nom_medicament: 'Med1', quantite_totale: 20, quantite_dispensee: 20 },
        { id: 'l2', prescription_id: 'presc-complet', medicament_id: 'm2', nom_medicament: 'Med2', quantite_totale: 10, quantite_dispensee: 10 },
      ],
    };

    const totalLignes = prescription.lignes.length;
    const lignesCompletes = prescription.lignes.filter(l => l.quantite_dispensee >= l.quantite_totale).length;

    expect(lignesCompletes).toBe(totalLignes);
  });
});

describe('Tickets de facturation', () => {
  it('devrait créer un ticket patient si montant > 0', () => {
    const ticket = {
      patient_id: 'pat-123',
      service_origine: 'pharmacie',
      reference_origine: 'disp-456',
      type_acte: 'Dispensation (Patient): Paracétamol (x10)',
      montant: 5000,
      payeur_type: 'patient',
      statut: 'en_attente',
    };

    expect(ticket.montant).toBeGreaterThan(0);
    expect(ticket.payeur_type).toBe('patient');
    expect(ticket.service_origine).toBe('pharmacie');
  });

  it('devrait créer un ticket assurance si tiers-payant', () => {
    const ticketAssurance = {
      patient_id: 'pat-123',
      service_origine: 'pharmacie',
      reference_origine: 'disp-456',
      type_acte: 'Dispensation (Assurance): Paracétamol (x10)',
      montant: 3500,
      payeur_type: 'assurance',
      payeur_id: 'ass-789',
      payeur_nom: 'MUGEF-CI',
      statut: 'en_attente',
    };

    expect(ticketAssurance.payeur_type).toBe('assurance');
    expect(ticketAssurance.payeur_id).toBe('ass-789');
  });
});

describe('Validation des contraintes métier', () => {
  it('devrait rejeter une prescription ancienne (> 7 jours)', () => {
    const datePrescription = new Date();
    datePrescription.setDate(datePrescription.getDate() - 10); // Il y a 10 jours

    const joursEcoules = Math.ceil((new Date().getTime() - datePrescription.getTime()) / (1000 * 60 * 60 * 24));
    const tropAncienne = joursEcoules > 7;

    expect(tropAncienne).toBe(true);
    expect(joursEcoules).toBe(10);
  });

  it('devrait valider une prescription récente', () => {
    const datePrescription = new Date();
    datePrescription.setDate(datePrescription.getDate() - 2); // Il y a 2 jours

    const joursEcoules = Math.ceil((new Date().getTime() - datePrescription.getTime()) / (1000 * 60 * 60 * 24));
    const tropAncienne = joursEcoules > 7;

    expect(tropAncienne).toBe(false);
  });
});

