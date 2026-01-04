import { supabase } from './stockSupabase';

type StockMovementItem = {
  medicament_id: string;
  quantite: number;
  // Optionnel: cibler un lot spécifique; sinon FEFO (expiration la plus proche)
  lot_id?: string;
  magasin?: 'gros' | 'detail';
};

export const IntegrationService = {
  // Déduit le stock (Magasin Détail par défaut) suite à une prescription/dispensation
  async registerPrescriptionDispensation(params: {
    patientId: string;
    items: StockMovementItem[];
    utilisateurId?: string;
    motif?: string;
  }): Promise<{ ok: boolean; message?: string }> {
    try {
      const magasin = 'detail';
      for (const item of params.items) {
        // Trouver les lots éligibles (FEFO si lot non précisé)
        let lotId = item.lot_id;
        if (!lotId) {
          const { data: lots } = await supabase
            .from('lots')
            .select('id, medicament_id, quantite_disponible, date_expiration')
            .eq('medicament_id', item.medicament_id)
            .eq('magasin', magasin)
            .gt('quantite_disponible', 0)
            .order('date_expiration', { ascending: true });
          if (!lots || lots.length === 0) throw new Error('Aucun lot disponible');

          // Parcours FEFO pour couvrir la quantité demandée
          let remaining = item.quantite;
          for (const lot of lots) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, lot.quantite_disponible || 0);
            if (take <= 0) continue;

            // Insert mouvement sortie
            const { error: movErr } = await supabase.from('mouvements_stock').insert({
              type: 'sortie',
              source: magasin,
              destination: null,
              lot_id: lot.id,
              medicament_id: item.medicament_id,
              quantite: take,
              date: new Date().toISOString(),
              utilisateur_id: params.utilisateurId || null,
              motif: params.motif || 'Prescription',
            });
            if (movErr) throw movErr;

            // Update lot
            const { error: upErr } = await supabase
              .from('lots')
              .update({ quantite_disponible: (lot.quantite_disponible || 0) - take })
              .eq('id', lot.id);
            if (upErr) throw upErr;

            remaining -= take;
          }
          if (remaining > 0) throw new Error('Stock insuffisant pour couvrir la quantité demandée');
        } else {
          // Lot spécifié: décrémentation directe
          const { data: lot } = await supabase
            .from('lots')
            .select('id, quantite_disponible')
            .eq('id', lotId)
            .single();
          if (!lot) throw new Error('Lot non trouvé');
          if ((lot.quantite_disponible || 0) < item.quantite) throw new Error('Stock insuffisant');

          const { error: movErr } = await supabase.from('mouvements_stock').insert({
            type: 'sortie',
            source: magasin,
            destination: null,
            lot_id: lotId,
            medicament_id: item.medicament_id,
            quantite: item.quantite,
            date: new Date().toISOString(),
            utilisateur_id: params.utilisateurId || null,
            motif: params.motif || 'Prescription',
          });
          if (movErr) throw movErr;

          const { error: upErr } = await supabase
            .from('lots')
            .update({ quantite_disponible: (lot.quantite_disponible || 0) - item.quantite })
            .eq('id', lotId);
          if (upErr) throw upErr;
        }
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  },

  // Crée un rendez-vous de suivi (post-consultation/CPN)
  async scheduleFollowUpRendezVous(params: {
    patientId: string;
    service: string; // ex: 'Médecine générale' | 'Maternité' | 'Vaccination'
    motif: string;
    daysOffset?: number;
    praticien?: string | null;
  }): Promise<{ ok: boolean; message?: string }> {
    try {
      const date = new Date();
      date.setDate(date.getDate() + (params.daysOffset ?? 7));

      // Utilise la table Supabase 'rendez_vous' (avec underscore)
      const { error } = await supabase.from('rendez_vous').insert({
        patient_id: params.patientId,
        service: params.service,
        praticien: params.praticien || null,
        motif: params.motif,
        date_debut: date.toISOString(),
        duree_minutes: 20,
        statut: 'programmé',
        priorite: 'normal',
        created_at: new Date().toISOString(),
      });

      if (error) {
        // Si la table n'existe pas, renvoie un message explicite (fallback possible côté backend)
        throw new Error('Table rendez_vous indisponible côté base. Configurez la migration Supabase.');
      }

      return { ok: true };
    } catch (e: any) {
      return { ok: false, message: e.message };
    }
  },

  // Consommations spécifiques Maternité (fer, SP, ocytociques, vaccins) → sorties stock
  async registerMaternityConsumption(params: {
    patientId: string;
    items: StockMovementItem[];
    utilisateurId?: string;
  }): Promise<{ ok: boolean; message?: string }> {
    return this.registerPrescriptionDispensation({
      patientId: params.patientId,
      items: params.items.map(i => ({ ...i, magasin: i.magasin ?? 'detail' })),
      utilisateurId: params.utilisateurId,
      motif: 'Maternité',
    });
  },
};


