export interface SecurityQuestionOption {
  id: string;
  question: string;
  category: 'personal' | 'family' | 'childhood' | 'professional';
}

export const SECURITY_QUESTIONS: SecurityQuestionOption[] = [
  {
    id: 'q1',
    question: 'Quel est le nom de votre premier animal de compagnie ?',
    category: 'personal',
  },
  {
    id: 'q2',
    question: 'Dans quelle ville êtes-vous né(e) ?',
    category: 'personal',
  },
  {
    id: 'q3',
    question: 'Quel est le nom de jeune fille de votre mère ?',
    category: 'family',
  },
  {
    id: 'q4',
    question: 'Quel était le nom de votre école primaire ?',
    category: 'childhood',
  },
  {
    id: 'q5',
    question: 'Quel est le prénom de votre meilleur(e) ami(e) d\'enfance ?',
    category: 'childhood',
  },
  {
    id: 'q6',
    question: 'Quel est le nom de votre professeur préféré à l\'école ?',
    category: 'childhood',
  },
  {
    id: 'q7',
    question: 'Quel est le modèle de votre première voiture ?',
    category: 'personal',
  },
  {
    id: 'q8',
    question: 'Quel est le nom de votre ville de naissance ?',
    category: 'personal',
  },
  {
    id: 'q9',
    question: 'Quel est le prénom de votre grand-mère maternelle ?',
    category: 'family',
  },
  {
    id: 'q10',
    question: 'Quel était le nom de votre premier employeur ?',
    category: 'professional',
  },
  {
    id: 'q11',
    question: 'Quel est le nom de votre film préféré ?',
    category: 'personal',
  },
  {
    id: 'q12',
    question: 'Quel est le nom de votre équipe de sport préférée ?',
    category: 'personal',
  },
  {
    id: 'q13',
    question: 'Quel est le prénom de votre parrain/marraine ?',
    category: 'family',
  },
  {
    id: 'q14',
    question: 'Quel est le nom de votre restaurant préféré ?',
    category: 'personal',
  },
  {
    id: 'q15',
    question: 'Quel est le nom de votre premier patron ?',
    category: 'professional',
  },
];

export function getRandomQuestions(count: number = 3): SecurityQuestionOption[] {
  const shuffled = [...SECURITY_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Récupère une question par son ID
 */
export function getQuestionById(id: string): SecurityQuestionOption | undefined {
  return SECURITY_QUESTIONS.find(q => q.id === id);
}

/**
 * Vérifie si une question est valide (existe dans la liste autorisée)
 */
export function isValidQuestion(questionText: string): boolean {
  return SECURITY_QUESTIONS.some(q => q.question === questionText);
}

/**
 * Vérifie si un ID de question est valide
 */
export function isValidQuestionId(questionId: string): boolean {
  return SECURITY_QUESTIONS.some(q => q.id === questionId);
}

