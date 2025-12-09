// Réexport du composant générique PatientSelector avec filtre pour les femmes
import PatientSelector from '../shared/PatientSelector';
import { Patient } from '../../services/supabase';

interface PatientSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (patient: Patient) => void;
}

const PatientSelectionDialog: React.FC<PatientSelectionDialogProps> = (props) => {
  return (
    <PatientSelector
      {...props}
      title="Sélectionner une patiente"
      filterBySexe="Féminin"
      filterByService="Maternité"
      allowCreate={true}
      onCreateNew={() => {
        // Rediriger vers la création de patient
        window.location.href = '/patients?action=create&service=Maternité';
      }}
    />
  );
};

export default PatientSelectionDialog;

