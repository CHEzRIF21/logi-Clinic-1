import React, { useState } from 'react';
import { Container, Box, Typography, Alert } from '@mui/material';
import GestionUtilisateursComponent from '../components/stock/GestionUtilisateurs';
import { utilisateursDemo, profilsDemo } from '../data/userData';
import { UtilisateurStock, ProfilUtilisateur } from '../types/permissions';
import { User } from '../types/auth';
import { useLocation } from 'react-router-dom';

interface UtilisateursPermissionsProps {
  user?: User | null;
}

const UtilisateursPermissions: React.FC<UtilisateursPermissionsProps> = ({ user }) => {
  const [utilisateurs, setUtilisateurs] = useState(utilisateursDemo);
  const [profils, setProfils] = useState(profilsDemo);
  
  // Vérifier si l'utilisateur actuel est administrateur
  const isAdmin = user?.role === 'admin';

  const handleCreateUtilisateur = (utilisateur: Omit<UtilisateurStock, 'id'>) => {
    const newUtilisateur = {
      ...utilisateur,
      id: `USER${String(utilisateurs.length + 1).padStart(3, '0')}`,
    } as UtilisateurStock;
    setUtilisateurs([...utilisateurs, newUtilisateur]);
  };

  const handleUpdateUtilisateur = (utilisateur: UtilisateurStock) => {
    setUtilisateurs(utilisateurs.map(u => (u.id === utilisateur.id ? utilisateur : u)));
  };

  const handleDeleteUtilisateur = (utilisateurId: string) => {
    setUtilisateurs(utilisateurs.filter(u => u.id !== utilisateurId));
  };

  const handleCreateProfil = (profil: Omit<ProfilUtilisateur, 'id'>) => {
    const newProfil = {
      ...profil,
      id: `PROF${String(profils.length + 1).padStart(3, '0')}`,
    } as ProfilUtilisateur;
    setProfils([...profils, newProfil]);
  };

  const handleUpdateProfil = (profil: ProfilUtilisateur) => {
    setProfils(profils.map(p => (p.id === profil.id ? profil : p)));
  };

  const handleDeleteProfil = (profilId: string) => {
    setProfils(profils.filter(p => p.id !== profilId));
  };

  // Si l'utilisateur n'est pas admin, afficher un message d'accès refusé
  if (!isAdmin) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            Accès refusé. Seul l'administrateur peut accéder à la gestion des utilisateurs et permissions.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Utilisateurs et Permissions
        </Typography>
        <GestionUtilisateursComponent
          utilisateurs={utilisateurs}
          profils={profils}
          onCreateUtilisateur={handleCreateUtilisateur}
          onUpdateUtilisateur={handleUpdateUtilisateur}
          onDeleteUtilisateur={handleDeleteUtilisateur}
          onCreateProfil={handleCreateProfil}
          onUpdateProfil={handleUpdateProfil}
          onDeleteProfil={handleDeleteProfil}
          currentUserRole={user?.role}
        />
      </Box>
    </Container>
  );
};

export default UtilisateursPermissions;


