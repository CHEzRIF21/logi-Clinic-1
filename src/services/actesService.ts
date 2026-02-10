import { supabase } from './supabase';
import { FacturationService, ServiceFacturable, LigneFacture } from './facturationService';
import { getMyClinicId } from './clinicService';

export interface Acte {
  code: string;
  libelle: string;
  quantite: number;
  prix_unitaire: number;
  type_service?: 'consultation' | 'pharmacie' | 'laboratoire' | 'maternite' | 'vaccination' | 'imagerie' | 'autre';
}

export interface PanierActes {
  id: string;
  patient_id: string;
  consultation_id?: string;
  actes: Acte[];
  total: number;
  statut: 'brouillon' | 'valide' | 'facture';
  facture_id?: string;
  created_at: string;
  updated_at: string;
}

export class ActesService {
  /**
   * Récupère tous les actes facturables disponibles
   */
  static async getActesDisponibles(type?: string): Promise<ServiceFacturable[]> {
    return await FacturationService.getServicesFacturables(type);
  }

  /**
   * Crée un panier d'actes pour un patient
   */
  static async createPanierActes(
    patientId: string,
    actes: Acte[],
    consultationId?: string
  ): Promise<PanierActes> {
    const clinicId = await getMyClinicId();
    if (!clinicId) {
      throw new Error('Clinic ID manquant');
    }

    // Calculer le total
    const total = actes.reduce((sum, acte) => sum + (acte.prix_unitaire * acte.quantite), 0);

    // Créer le panier dans une table temporaire ou en mémoire
    // Pour l'instant, on retourne un objet PanierActes
    const panier: PanierActes = {
      id: `panier-${Date.now()}`,
      patient_id: patientId,
      consultation_id: consultationId,
      actes,
      total,
      statut: 'brouillon',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return panier;
  }

  /**
   * Génère une facture provisoire depuis un panier d'actes
   */
  static async genererFactureDepuisPanier(
    panier: PanierActes,
    consultationId?: string,
    serviceType?: string
  ): Promise<string> {
    const clinicId = await getMyClinicId();
    if (!clinicId) {
      throw new Error('Clinic ID manquant');
    }

    // Convertir les actes en lignes de facture
    const lignes: LigneFacture[] = panier.actes.map((acte) => ({
      code_service: acte.code,
      libelle: acte.libelle,
      quantite: acte.quantite,
      prix_unitaire: acte.prix_unitaire,
      remise_ligne: 0,
      montant_ligne: acte.prix_unitaire * acte.quantite,
    }));

    // Créer la facture avec statut 'en_attente'
    console.log('📝 Création facture depuis panier:', {
      patient_id: panier.patient_id,
      consultation_id: consultationId,
      nombre_lignes: lignes.length,
      montant_total: lignes.reduce((sum, l) => sum + l.montant_ligne, 0),
      service_origine: 'enregistrement',
    });

    // Utiliser le type de service fourni ou 'enregistrement' par défaut
    const serviceOrigine = serviceType || 'enregistrement';
    
    const facture = await FacturationService.createFacture({
      patient_id: panier.patient_id,
      consultation_id: consultationId,
      lignes,
      type_facture: 'normale',
      service_origine: serviceOrigine,
    });

    console.log('✅ Facture créée:', {
      id: facture.id,
      numero_facture: facture.numero_facture,
      statut: facture.statut,
      montant_total: facture.montant_total,
      montant_restant: facture.montant_restant,
      service_origine: facture.service_origine,
      consultation_id: facture.consultation_id,
    });

    return facture.id;
  }

  /**
   * Valide un panier après paiement
   */
  static async validerPanier(panierId: string, factureId: string): Promise<void> {
    // Mettre à jour le statut du panier à 'facture'
    // Pour l'instant, c'est une opération logique car le panier est en mémoire
    // Dans une implémentation complète, on pourrait avoir une table paniers_actes
    console.log(`Panier ${panierId} validé avec facture ${factureId}`);
  }

  /**
   * Récupère les actes par défaut selon le type de consultation
   */
  static async getActesParDefaut(
    typeConsultation: 'generale' | 'specialisee' | 'urgence',
    isUrgent: boolean = false
  ): Promise<Acte[]> {
    const clinicId = await getMyClinicId();
    if (!clinicId) {
      return [];
    }

    try {
      // Récupérer la configuration
      const { data: config } = await supabase
        .from('configurations_facturation')
        .select('actes_defaut_consultation, actes_defaut_dossier, actes_defaut_urgence')
        .eq('clinic_id', clinicId)
        .single();

      if (!config) {
        return [];
      }

      const actes: Acte[] = [];

      // Acte consultation selon le type
      const consultationActe = await this.getActeConsultation(typeConsultation);
      if (consultationActe) {
        actes.push(consultationActe);
      }

      // Acte dossier si configuré
      if (config.actes_defaut_dossier) {
        const dossierActe = await this.getActeDossier();
        if (dossierActe) {
          actes.push(dossierActe);
        }
      }

      // Acte urgence si configuré et urgent
      if (config.actes_defaut_urgence && isUrgent) {
        const urgenceActe = await this.getActeUrgence();
        if (urgenceActe) {
          actes.push(urgenceActe);
        }
      }

      // Actes supplémentaires depuis la configuration
      if (config.actes_defaut_consultation && Array.isArray(config.actes_defaut_consultation)) {
        for (const codeActe of config.actes_defaut_consultation) {
          const service = await FacturationService.getServicesFacturables();
          const acteService = service.find(s => s.code === codeActe);
          if (acteService) {
            actes.push({
              code: acteService.code,
              libelle: acteService.nom,
              quantite: 1,
              prix_unitaire: acteService.tarif_base,
              type_service: acteService.type_service,
            });
          }
        }
      }

      return actes;
    } catch (error) {
      console.error('Erreur récupération actes par défaut:', error);
      return [];
    }
  }

  /**
   * Récupère l'acte de consultation selon le type
   */
  private static async getActeConsultation(
    type: 'generale' | 'specialisee' | 'urgence'
  ): Promise<Acte | null> {
    const services = await FacturationService.getServicesFacturables('consultation');
    const codeMap: Record<string, string> = {
      // Codes alignés sur services_facturables (voir create_facturation_tables / seed)
      generale: 'CONS-GEN',
      specialisee: 'CONS-SPEC',
      urgence: 'CONS-URG',
    };

    const code = codeMap[type] || 'CONS-GEN';

    // D'abord chercher par code exact, puis par nom contenant le type
    const service =
      services.find(s => s.code === code) ||
      services.find(s => s.nom.toLowerCase().includes(type));

    if (service) {
      return {
        code: service.code,
        libelle: service.nom,
        quantite: 1,
        prix_unitaire: service.tarif_base,
        type_service: 'consultation',
      };
    }

    return null;
  }

  /**
   * Récupère l'acte dossier
   */
  private static async getActeDossier(): Promise<Acte | null> {
    const services = await FacturationService.getServicesFacturables();
    const service = services.find(s => 
      s.code === 'DOSSIER' || 
      s.nom.toLowerCase().includes('dossier') ||
      s.nom.toLowerCase().includes('fiche')
    );

    if (service) {
      return {
        code: service.code,
        libelle: service.nom,
        quantite: 1,
        prix_unitaire: service.tarif_base,
        type_service: service.type_service,
      };
    }

    return null;
  }

  /**
   * Récupère l'acte urgence
   */
  private static async getActeUrgence(): Promise<Acte | null> {
    const services = await FacturationService.getServicesFacturables();
    const service = services.find(s => 
      s.code === 'URGENCE' || 
      s.nom.toLowerCase().includes('urgence')
    );

    if (service) {
      return {
        code: service.code,
        libelle: service.nom,
        quantite: 1,
        prix_unitaire: service.tarif_base,
        type_service: service.type_service,
      };
    }

    return null;
  }
}
