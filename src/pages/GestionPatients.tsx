import React from 'react';
import { PatientsManagement } from '../components/patients/PatientsManagement';

/**
 * Page de gestion des patients
 * Utilise le composant PatientsManagement qui charge les données depuis Supabase
 */
const GestionPatients: React.FC = () => {
  return <PatientsManagement />;
};

export default GestionPatients;
