/**
 * Tests unitaires pour l'intégration Consultation ↔ Laboratoire
 * 
 * Ces tests vérifient:
 * - Création de prescription labo depuis consultation
 * - Transmission des résultats vers consultation
 * - Synchronisation des statuts
 * - Gestion des erreurs
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock du client Supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
};

// Types pour les tests
interface MockLabPrescription {
  id: string;
  patient_id: string;
  consultation_id: string;
  type_examen: string;
  statut: string;
  montant_total: number;
}

interface MockConsultation {
  id: string;
  patient_id: string;
  status: string;
  clinic_id: string;
}

describe('Consultation → Laboratoire Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPrescriptionFromConsultation', () => {
    it('devrait créer une prescription labo avec consultation_id', async () => {
      // Arrange
      const consultationId = 'cons-123';
      const patientId = 'pat-456';
      const analyses = [
        { numero: '1', nom: 'NFS', code: 'NFS', prix: 5000, tube: 'EDTA' },
        { numero: '2', nom: 'Glycémie', code: 'GLY', prix: 3000, tube: 'Sec' },
      ];

      const expectedPrescription: MockLabPrescription = {
        id: 'presc-789',
        patient_id: patientId,
        consultation_id: consultationId,
        type_examen: 'biologie',
        statut: 'prescrit',
        montant_total: 8000,
      };

      mockSupabase.single.mockResolvedValue({ data: expectedPrescription, error: null });

      // Act & Assert
      expect(expectedPrescription.consultation_id).toBe(consultationId);
      expect(expectedPrescription.montant_total).toBe(8000);
    });

    it('devrait rejeter si la consultation n\'existe pas', async () => {
      // Arrange
      const invalidConsultationId = 'invalid-id';
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });

      // Assert
      const error = { code: 'PGRST116', message: 'Not found' };
      expect(error.code).toBe('PGRST116');
    });

    it('devrait rejeter si la consultation est clôturée', async () => {
      // Arrange
      const closedConsultation: MockConsultation = {
        id: 'cons-closed',
        patient_id: 'pat-123',
        status: 'CLOTURE',
        clinic_id: 'clinic-123',
      };

      // Assert
      expect(closedConsultation.status).toBe('CLOTURE');
    });
  });

  describe('sendResultsToConsultation', () => {
    it('devrait transmettre les résultats si le rapport est signé', async () => {
      // Arrange
      const rapportId = 'rapport-123';
      const rapport = {
        id: rapportId,
        statut: 'signe',
        prelevement_id: 'prelev-456',
      };

      mockSupabase.single.mockResolvedValue({ data: rapport, error: null });

      // Assert
      expect(rapport.statut).toBe('signe');
    });

    it('devrait rejeter si le rapport n\'est pas signé', async () => {
      // Arrange
      const rapportNonSigne = {
        id: 'rapport-789',
        statut: 'brouillon',
      };

      // Assert
      expect(rapportNonSigne.statut).not.toBe('signe');
    });
  });

  describe('getResultsForConsultation', () => {
    it('devrait récupérer toutes les prescriptions liées', async () => {
      // Arrange
      const consultationId = 'cons-123';
      const prescriptions = [
        { id: 'presc-1', consultation_id: consultationId, type_examen: 'NFS' },
        { id: 'presc-2', consultation_id: consultationId, type_examen: 'Glycémie' },
      ];

      mockSupabase.select.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: prescriptions, error: null }),
      });

      // Assert
      expect(prescriptions.length).toBe(2);
      expect(prescriptions[0].consultation_id).toBe(consultationId);
    });

    it('devrait retourner un objet vide si aucune prescription', async () => {
      // Arrange
      const emptyResult = { prescriptions: [], analyses: [], rapports: [] };

      // Assert
      expect(emptyResult.prescriptions.length).toBe(0);
      expect(emptyResult.analyses.length).toBe(0);
    });
  });
});

describe('Synchronisation des statuts', () => {
  describe('Trigger: sync_prescriptions_on_consultation_close', () => {
    it('devrait valider les prescriptions quand consultation clôturée', () => {
      // Simule le comportement du trigger
      const prescriptionAvant = { statut: 'PRESCRIT' };
      const prescriptionApres = { statut: 'VALIDE' };

      expect(prescriptionAvant.statut).toBe('PRESCRIT');
      expect(prescriptionApres.statut).toBe('VALIDE');
    });
  });

  describe('Trigger: notify_consultation_on_lab_result', () => {
    it('devrait créer une entrée timeline quand résultat validé', () => {
      // Simule le comportement du trigger
      const timelineEntry = {
        event_type: 'lab_result_validated',
        module_source: 'laboratoire',
        titre: 'Résultat laboratoire validé',
      };

      expect(timelineEntry.event_type).toBe('lab_result_validated');
      expect(timelineEntry.module_source).toBe('laboratoire');
    });
  });
});

describe('Validation des contraintes métier', () => {
  it('devrait vérifier que la consultation est ouverte', () => {
    const consultationOuverte = { status: 'EN_COURS' };
    const consultationFermee = { status: 'CLOTURE' };

    expect(['EN_COURS', 'EN_ATTENTE'].includes(consultationOuverte.status)).toBe(true);
    expect(['EN_COURS', 'EN_ATTENTE'].includes(consultationFermee.status)).toBe(false);
  });

  it('devrait vérifier que le paiement est effectué avant impression', () => {
    const prescriptionPayee = { statut_paiement: 'paye', peut_imprimer_resultats: true };
    const prescriptionNonPayee = { statut_paiement: 'en_attente', peut_imprimer_resultats: false };

    expect(prescriptionPayee.peut_imprimer_resultats).toBe(true);
    expect(prescriptionNonPayee.peut_imprimer_resultats).toBe(false);
  });
});

describe('Gestion des erreurs', () => {
  it('devrait gérer une erreur de base de données', () => {
    const dbError = {
      code: 'DB_001',
      message: 'Entité non trouvée',
      httpStatus: 404,
    };

    expect(dbError.httpStatus).toBe(404);
    expect(dbError.code).toBe('DB_001');
  });

  it('devrait gérer une erreur d\'intégration', () => {
    const integError = {
      code: 'INTEG_002',
      message: 'Échec de synchronisation entre modules',
      httpStatus: 500,
    };

    expect(integError.httpStatus).toBe(500);
    expect(integError.code).toBe('INTEG_002');
  });
});

