import prisma from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import SchemaCacheService from './schemaCacheService';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase pour accéder à services_facturables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface CreatePricingInput {
  clinicId: string;
  serviceId: string;
  tarifBase: number;
  unite?: string;
  active?: boolean;
}

export interface UpdatePricingInput {
  tarifBase?: number;
  unite?: string;
  active?: boolean;
}

export interface PricingWithService {
  id: string;
  clinicId: string;
  serviceId: string;
  tarifBase: number;
  unite: string;
  active: boolean;
  service?: {
    id: string;
    code: string;
    nom: string;
    type_service: string;
    tarif_defaut: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DefaultPricing {
  id: string;
  code: string;
  nom: string;
  type_service: string;
  tarif_defaut: number;
  tarif_base: number;
  unite: string;
  description?: string;
  actif: boolean;
}

export class PricingService {
  /**
   * Récupère le tarif pour un service et une clinique donnés
   * Utilise le tarif de la clinique si disponible, sinon le tarif par défaut
   */
  static async getPricingForService(
    clinicId: string,
    serviceId: string
  ): Promise<{ tarif: number; source: 'clinic' | 'default'; unite: string }> {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Chercher d'abord un tarif spécifique à la clinique
      const clinicPricing = await prisma.clinicPricing.findUnique({
        where: {
          clinicId_serviceId: {
            clinicId,
            serviceId,
          },
        },
      });

      if (clinicPricing && clinicPricing.active) {
        return {
          tarif: Number(clinicPricing.tarifBase),
          source: 'clinic',
          unite: clinicPricing.unite,
        };
      }

      // Sinon, récupérer le tarif par défaut depuis Supabase
      if (!supabase) {
        throw new Error('Supabase non configuré');
      }

      const { data: service, error } = await supabase
        .from('services_facturables')
        .select('tarif_defaut, tarif_base, unite')
        .eq('id', serviceId)
        .eq('actif', true)
        .single();

      if (error || !service) {
        throw new Error(`Service facturable non trouvé: ${serviceId}`);
      }

      const tarifDefaut = service.tarif_defaut || service.tarif_base || 0;

      return {
        tarif: Number(tarifDefaut),
        source: 'default',
        unite: service.unite || 'unité',
      };
    });
  }

  /**
   * Crée ou met à jour un tarif pour une clinique
   * L'historisation est gérée automatiquement par les triggers SQL
   */
  static async upsertPricing(
    input: CreatePricingInput,
    modifiedBy?: string
  ): Promise<PricingWithService> {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Vérifier que la clinique existe
      const clinic = await prisma.clinic.findUnique({
        where: { id: input.clinicId },
      });

      if (!clinic) {
        throw new Error('Clinique non trouvée');
      }

      if (!clinic.active) {
        throw new Error('Impossible de définir un tarif pour une clinique inactive');
      }

      // Vérifier que le service existe
      if (!supabase) {
        throw new Error('Supabase non configuré');
      }

      const { data: service, error } = await supabase
        .from('services_facturables')
        .select('id, code, nom, type_service, tarif_defaut')
        .eq('id', input.serviceId)
        .single();

      if (error || !service) {
        throw new Error(`Service facturable non trouvé: ${input.serviceId}`);
      }

      // Validation du tarif
      if (input.tarifBase < 0) {
        throw new Error('Le tarif doit être supérieur ou égal à 0');
      }

      // Récupérer l'ancien tarif pour l'historique
      const existing = await prisma.clinicPricing.findUnique({
        where: {
          clinicId_serviceId: {
            clinicId: input.clinicId,
            serviceId: input.serviceId,
          },
        },
      });

      // Créer ou mettre à jour le tarif
      const pricing = await prisma.clinicPricing.upsert({
        where: {
          clinicId_serviceId: {
            clinicId: input.clinicId,
            serviceId: input.serviceId,
          },
        },
        create: {
          clinicId: input.clinicId,
          serviceId: input.serviceId,
          tarifBase: new Decimal(input.tarifBase),
          unite: input.unite || service.unite || 'unité',
          active: input.active !== undefined ? input.active : true,
        },
        update: {
          tarifBase: new Decimal(input.tarifBase),
          unite: input.unite || service.unite || 'unité',
          active: input.active,
        },
      });

      // Créer l'entrée d'historique manuellement si c'est une mise à jour
      if (existing && existing.tarifBase.toString() !== input.tarifBase.toString()) {
        // Mettre à jour la date_fin de l'ancienne entrée
        await prisma.$executeRaw`
          UPDATE clinic_pricing_history
          SET date_fin = NOW()
          WHERE clinic_pricing_id = ${pricing.id}
            AND date_fin IS NULL
        `;

        // Créer la nouvelle entrée d'historique
        await prisma.clinicPricingHistory.create({
          data: {
            clinicPricingId: pricing.id,
            tarifAncien: existing.tarifBase,
            tarifNouveau: new Decimal(input.tarifBase),
            dateDebut: new Date(),
            modifiedById: modifiedBy,
          },
        });
      } else if (!existing) {
        // Créer l'entrée d'historique pour une nouvelle création
        await prisma.clinicPricingHistory.create({
          data: {
            clinicPricingId: pricing.id,
            tarifAncien: new Decimal(0),
            tarifNouveau: new Decimal(input.tarifBase),
            dateDebut: new Date(),
            modifiedById: modifiedBy,
          },
        });
      }

      return {
        ...pricing,
        tarifBase: Number(pricing.tarifBase),
        service: {
          id: service.id,
          code: service.code,
          nom: service.nom,
          type_service: service.type_service,
          tarif_defaut: Number(service.tarif_defaut || 0),
        },
      } as PricingWithService;
    });
  }

  /**
   * Récupère tous les tarifs d'une clinique
   */
  static async getClinicPricing(clinicId: string): Promise<PricingWithService[]> {
    return await SchemaCacheService.executeWithRetry(async () => {
      const pricings = await prisma.clinicPricing.findMany({
        where: { clinicId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!supabase) {
        throw new Error('Supabase non configuré');
      }

      // Récupérer les informations des services depuis Supabase
      const serviceIds = pricings.map((p) => p.serviceId);
      const { data: services } = await supabase
        .from('services_facturables')
        .select('id, code, nom, type_service, tarif_defaut')
        .in('id', serviceIds);

      const servicesMap = new Map(
        (services || []).map((s) => [s.id, s])
      );

      return pricings.map((pricing) => ({
        id: pricing.id,
        clinicId: pricing.clinicId,
        serviceId: pricing.serviceId,
        tarifBase: Number(pricing.tarifBase),
        unite: pricing.unite,
        active: pricing.active,
        service: servicesMap.get(pricing.serviceId)
          ? {
              id: servicesMap.get(pricing.serviceId)!.id,
              code: servicesMap.get(pricing.serviceId)!.code,
              nom: servicesMap.get(pricing.serviceId)!.nom,
              type_service: servicesMap.get(pricing.serviceId)!.type_service,
              tarif_defaut: Number(servicesMap.get(pricing.serviceId)!.tarif_defaut || 0),
            }
          : undefined,
        createdAt: pricing.createdAt,
        updatedAt: pricing.updatedAt,
      }));
    });
  }

  /**
   * Récupère tous les tarifs par défaut du système
   */
  static async getDefaultPricing(): Promise<DefaultPricing[]> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }

    const { data, error } = await supabase
      .from('services_facturables')
      .select('*')
      .eq('actif', true)
      .order('nom');

    if (error) {
      throw new Error(`Erreur lors de la récupération des tarifs par défaut: ${error.message}`);
    }

    return (data || []).map((service) => ({
      id: service.id,
      code: service.code,
      nom: service.nom,
      type_service: service.type_service,
      tarif_defaut: Number(service.tarif_defaut || service.tarif_base || 0),
      tarif_base: Number(service.tarif_base || 0),
      unite: service.unite || 'unité',
      description: service.description,
      actif: service.actif,
    }));
  }

  /**
   * Met à jour un tarif par défaut au niveau système
   */
  static async updateDefaultPricing(
    serviceId: string,
    tarifDefaut: number
  ): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase non configuré');
    }

    if (tarifDefaut < 0) {
      throw new Error('Le tarif doit être supérieur ou égal à 0');
    }

    const { error } = await supabase
      .from('services_facturables')
      .update({
        tarif_defaut: tarifDefaut,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serviceId);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du tarif par défaut: ${error.message}`);
    }
  }

  /**
   * Récupère l'historique des tarifs pour une clinique
   */
  static async getPricingHistory(
    clinicId: string,
    serviceId?: string
  ) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = {
        clinicPricing: {
          clinicId,
        },
      };

      if (serviceId) {
        where.clinicPricing = {
          ...where.clinicPricing,
          serviceId,
        };
      }

      const history = await prisma.clinicPricingHistory.findMany({
        where,
        include: {
          clinicPricing: {
            include: {
              clinic: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
          modifiedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          dateDebut: 'desc',
        },
      });

      return history.map((h) => ({
        id: h.id,
        clinicCode: h.clinicPricing.clinic.code,
        clinicName: h.clinicPricing.clinic.name,
        serviceId: h.clinicPricing.serviceId,
        tarifAncien: Number(h.tarifAncien),
        tarifNouveau: Number(h.tarifNouveau),
        dateDebut: h.dateDebut,
        dateFin: h.dateFin,
        modifiedBy: h.modifiedBy
          ? {
              id: h.modifiedBy.id,
              name: h.modifiedBy.name,
              email: h.modifiedBy.email,
            }
          : null,
        createdAt: h.createdAt,
      }));
    });
  }

  /**
   * Supprime un tarif spécifique à une clinique
   * La clinique utilisera alors le tarif par défaut
   */
  static async deleteClinicPricing(
    clinicId: string,
    serviceId: string
  ): Promise<void> {
    return await SchemaCacheService.executeWithRetry(async () => {
      await prisma.clinicPricing.delete({
        where: {
          clinicId_serviceId: {
            clinicId,
            serviceId,
          },
        },
      });
    });
  }

  /**
   * Récupère un résumé des tarifs pour une clinique
   * Inclut les tarifs spécifiques et les tarifs par défaut utilisés
   */
  static async getClinicPricingSummary(clinicId: string) {
    return await SchemaCacheService.executeWithRetry(async () => {
      // Récupérer tous les services facturables
      const defaultPricing = await this.getDefaultPricing();

      // Récupérer les tarifs spécifiques à la clinique
      const clinicPricing = await this.getClinicPricing(clinicId);

      const clinicPricingMap = new Map(
        clinicPricing.map((p) => [p.serviceId, p])
      );

      // Créer le résumé
      return defaultPricing.map((service) => {
        const clinicPrice = clinicPricingMap.get(service.id);
        return {
          serviceId: service.id,
          serviceCode: service.code,
          serviceName: service.nom,
          serviceType: service.type_service,
          tarifDefaut: service.tarif_defaut,
          tarifClinique: clinicPrice ? clinicPrice.tarifBase : null,
          tarifApplique: clinicPrice ? clinicPrice.tarifBase : service.tarif_defaut,
          source: clinicPrice ? 'clinic' : 'default',
          unite: clinicPrice ? clinicPrice.unite : service.unite,
          hasCustomPricing: !!clinicPrice,
        };
      });
    });
  }
}

