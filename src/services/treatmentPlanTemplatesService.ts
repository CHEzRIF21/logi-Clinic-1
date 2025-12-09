/**
 * Service pour gérer les templates de plans de traitement
 */

export interface TreatmentPlanTemplate {
  id: string;
  nom: string;
  categorie: 'hygiene' | 'nutrition' | 'activite' | 'suivi' | 'restrictions' | 'general';
  contenu: string;
  tags?: string[];
}

export class TreatmentPlanTemplatesService {
  /**
   * Templates prédéfinis de conseils
   */
  static getTemplates(): TreatmentPlanTemplate[] {
    return [
      {
        id: 'hygiene-generale',
        nom: 'Hygiène Générale',
        categorie: 'hygiene',
        contenu: '• Se laver les mains régulièrement avec de l\'eau et du savon\n• Prendre une douche quotidienne\n• Maintenir une bonne hygiène bucco-dentaire\n• Changer de vêtements régulièrement',
        tags: ['hygiène', 'prévention'],
      },
      {
        id: 'nutrition-equilibree',
        nom: 'Nutrition Équilibrée',
        categorie: 'nutrition',
        contenu: '• Consommer 5 fruits et légumes par jour\n• Boire au moins 1,5L d\'eau par jour\n• Éviter les aliments trop gras, trop sucrés, trop salés\n• Privilégier les protéines maigres',
        tags: ['nutrition', 'alimentation'],
      },
      {
        id: 'repos-domestique',
        nom: 'Repos à Domicile',
        categorie: 'restrictions',
        contenu: '• Repos au lit recommandé\n• Éviter les efforts physiques intenses\n• Reprendre progressivement les activités quotidiennes\n• Consulter en urgence en cas d\'aggravation',
        tags: ['repos', 'convalescence'],
      },
      {
        id: 'activite-physique-moderee',
        nom: 'Activité Physique Modérée',
        categorie: 'activite',
        contenu: '• Pratiquer une activité physique modérée (marche, natation)\n• Éviter les sports de contact\n• Écouter son corps et s\'arrêter en cas de fatigue\n• Durée recommandée: 30 minutes par jour',
        tags: ['sport', 'activité'],
      },
      {
        id: 'surveillance-signes-alerte',
        nom: 'Surveillance - Signes d\'Alerte',
        categorie: 'suivi',
        contenu: '• Surveiller la température (consulter si > 38°C)\n• Surveiller l\'apparition de nouveaux symptômes\n• Consulter en urgence en cas de: douleur intense, difficultés respiratoires, saignements\n• Retour de consultation prévu dans X jours',
        tags: ['surveillance', 'urgences'],
      },
      {
        id: 'isolement-respiratoire',
        nom: 'Isolement Respiratoire',
        categorie: 'restrictions',
        contenu: '• Porter un masque en présence d\'autres personnes\n• Éviter les contacts rapprochés\n• Aérer régulièrement les pièces\n• Respecter les gestes barrières',
        tags: ['isolement', 'contagion'],
      },
      {
        id: 'regime-sans-residu',
        nom: 'Régime Sans Résidu',
        categorie: 'nutrition',
        contenu: '• Éviter les fibres (fruits, légumes crus, céréales complètes)\n• Privilégier les aliments cuits et mixés\n• Boire beaucoup d\'eau\n• Reprendre progressivement une alimentation normale',
        tags: ['régime', 'digestif'],
      },
      {
        id: 'eviter-alcool-tabac',
        nom: 'Éviter Alcool et Tabac',
        categorie: 'restrictions',
        contenu: '• Arrêter complètement la consommation d\'alcool\n• Arrêter le tabac (aide disponible si nécessaire)\n• Éviter l\'exposition à la fumée secondaire\n• Consulter un professionnel pour un accompagnement',
        tags: ['alcool', 'tabac', 'sevrage'],
      },
      {
        id: 'hydratation-abondante',
        nom: 'Hydratation Abondante',
        categorie: 'nutrition',
        contenu: '• Boire au moins 2L d\'eau par jour\n• Éviter les boissons sucrées et gazeuses\n• Privilégier l\'eau, les tisanes, les bouillons\n• Surveiller la couleur des urines (doit être claire)',
        tags: ['hydratation', 'eau'],
      },
      {
        id: 'suivi-medical-regulier',
        nom: 'Suivi Médical Régulier',
        categorie: 'suivi',
        contenu: '• Respecter les rendez-vous de suivi programmés\n• Prendre les médicaments selon la prescription\n• Noter l\'évolution des symptômes\n• Contacter le médecin en cas de questions ou d\'inquiétudes',
        tags: ['suivi', 'médical'],
      },
    ];
  }

  /**
   * Récupère les templates par catégorie
   */
  static getTemplatesByCategory(categorie: TreatmentPlanTemplate['categorie']): TreatmentPlanTemplate[] {
    return this.getTemplates().filter((t) => t.categorie === categorie);
  }

  /**
   * Recherche de templates par mot-clé
   */
  static searchTemplates(query: string): TreatmentPlanTemplate[] {
    const normalizedQuery = query.toLowerCase();
    return this.getTemplates().filter(
      (t) =>
        t.nom.toLowerCase().includes(normalizedQuery) ||
        t.contenu.toLowerCase().includes(normalizedQuery) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    );
  }

  /**
   * Récupère un template par ID
   */
  static getTemplateById(id: string): TreatmentPlanTemplate | undefined {
    return this.getTemplates().find((t) => t.id === id);
  }
}

