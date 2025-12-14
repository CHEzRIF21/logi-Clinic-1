/**
 * Service client pour récupérer les tarifs depuis l'API backend
 * Utilise les tarifs spécifiques à la clinique de l'utilisateur connecté
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  '';

export interface PricingInfo {
  tarif: number;
  source: 'clinic' | 'default';
  unite: string;
}

/**
 * Récupère le tarif pour un service et la clinique de l'utilisateur connecté
 */
export async function getPricingForService(
  serviceId: string,
  clinicId?: string
): Promise<PricingInfo> {
  if (!clinicId) {
    // Si pas de clinicId, récupérer depuis le user stocké
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        clinicId = user.clinicId;
      } catch (err) {
        console.error('Erreur lors de la récupération du clinicId:', err);
      }
    }
  }

  if (!clinicId) {
    throw new Error('ClinicId non disponible. Veuillez vous reconnecter.');
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE_URL}/api/pricing/service/${serviceId}?clinicId=${clinicId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du tarif');
    }

    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération du tarif:', error);
    // En cas d'erreur, retourner un tarif par défaut de 0
    return {
      tarif: 0,
      source: 'default',
      unite: 'unité',
    };
  }
}

/**
 * Récupère le tarif depuis un service facturable (fallback si l'API n'est pas disponible)
 */
export function getDefaultPricingFromService(service: {
  tarif_base?: number;
  tarif_defaut?: number;
  unite?: string;
}): PricingInfo {
  const tarif = service.tarif_defaut || service.tarif_base || 0;
  return {
    tarif,
    source: 'default',
    unite: service.unite || 'unité',
  };
}

