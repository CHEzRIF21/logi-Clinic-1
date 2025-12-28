import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Alert, Paper, Breadcrumbs, Link } from '@mui/material';
import { Home, Group, NavigateNext } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StaffManagement from '../components/admin/StaffManagement';
import { User } from '../types/auth';
import { supabase } from '../services/supabase';

interface StaffManagementPageProps {
  user?: User | null;
}

const StaffManagementPage: React.FC<StaffManagementPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [clinicId, setClinicId] = useState<string | undefined>(undefined);
  const [clinicName, setClinicName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est administrateur
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchClinicInfo = async () => {
      if (!user?.clinicId && !user?.clinicCode) {
        setLoading(false);
        return;
      }

      try {
        let query = supabase.from('clinics').select('id, name, code');
        
        if (user?.clinicId) {
          query = query.eq('id', user.clinicId);
        } else if (user?.clinicCode) {
          query = query.eq('code', user.clinicCode.toUpperCase());
        }

        const { data, error: fetchError } = await query.single();

        if (fetchError) {
          console.error('Erreur récupération clinique:', fetchError);
          setError('Impossible de récupérer les informations de la clinique');
        } else if (data) {
          setClinicId(data.id);
          setClinicName(data.name);
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchClinicInfo();
  }, [user]);

  // Si l'utilisateur n'est pas admin, afficher un message d'accès refusé
  if (!isAdmin) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            Accès refusé. Seul un administrateur de clinique peut accéder à la gestion du staff.
          </Alert>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Chargement...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" />} 
          sx={{ mb: 2 }}
        >
          <Link
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Accueil
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <Group sx={{ mr: 0.5 }} fontSize="inherit" />
            Gestion du Staff
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Gestion du Staff
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {clinicName ? (
              <>
                Gérez les utilisateurs et les demandes d'inscription pour{' '}
                <strong>{clinicName}</strong>
              </>
            ) : (
              'Gérez les utilisateurs et les demandes d\'inscription de votre clinique'
            )}
          </Typography>
        </Paper>

        {/* Staff Management Component */}
        {user && (
          <StaffManagement 
            currentUser={user} 
            clinicId={clinicId}
          />
        )}
      </Box>
    </Container>
  );
};

export default StaffManagementPage;

