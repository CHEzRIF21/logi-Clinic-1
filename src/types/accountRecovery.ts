export type RecoveryRequestStatus = 
  | 'pending' 
  | 'verified' 
  | 'approved' 
  | 'rejected' 
  | 'completed';

export type RequestedDataType = 'username' | 'clinicCode' | 'password';

export interface SecurityQuestion {
  question: string;
  answer: string; // Hashé côté backend
  answerHash?: string; // Pour stockage
}

export interface AccountRecoveryRequest {
  id: string;
  clinicCode?: string; // Optionnel si inconnu
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  securityQuestions: SecurityQuestion[];
  requestedData: RequestedDataType[];
  status: RecoveryRequestStatus;
  adminNotes?: string;
  rejectionReason?: string;
  verifiedBy?: string; // ID de l'admin qui a vérifié
  approvedBy?: string; // ID de l'admin qui a approuvé
  rejectedBy?: string; // ID de l'admin qui a rejeté
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // Expiration après 7 jours
  auditLog?: Array<{
    action: 'created' | 'verified' | 'approved' | 'rejected' | 'completed';
    performedBy?: string;
    timestamp: Date;
    notes?: string;
  }>;
}

export interface CreateRecoveryRequestDto {
  clinicCode?: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  securityQuestions: Array<{
    question: string;
    answer: string; // Non hashé lors de la soumission
  }>;
  requestedData: RequestedDataType[];
}

export interface RecoveryRequestResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

export interface RecoveryData {
  username?: string;
  clinicCode?: string;
  password?: string; // Nouveau mot de passe généré
}

