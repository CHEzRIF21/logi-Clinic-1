import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Snackbar,
  Backdrop,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MedicalServices,
  Event,
  Person,
  Assignment,
  Search,
  Print,
  Visibility,
  Close,
} from '@mui/icons-material';
import { GradientText } from '../components/ui/GradientText';
import { ToolbarBits } from '../components/ui/ToolbarBits';
import { GlassCard } from '../components/ui/GlassCard';
import { StatBadge } from '../components/ui/StatBadge';
import { PatientService } from '../services/patientService';
import { Patient } from '../services/supabase';
import { Consultation, ConsultationService } from '../services/consultationService';
import PatientSelector from '../components/shared/PatientSelector';
import PatientCard from '../components/shared/PatientCard';
import { ConsultationStartDialog } from '../components/consultation/ConsultationStartDialog';
import { ConsultationWorkflow } from '../components/consultation/ConsultationWorkflow';
import { ConsultationPaymentGate } from '../components/consultation/ConsultationPaymentGate';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { PaymentNotification } from '../components/shared/PaymentNotification';

const Consultations: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [openPatientSelector, setOpenPatientSelector] = useState(false);
  const [openStartDialog, setOpenStartDialog] = useState(false);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [paymentAuthorized, setPaymentAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Charger l'ID utilisateur au montage
  useEffect(() => {
    loadUserId();
    loadConsultations();
  }, []);

  const loadUserId = async () => {
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:90',message:'loadUserId - parsed user',data:{hasAuthUserId:!!user.auth_user_id,hasUserId:!!user.id,authUserId:user.auth_user_id,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        // Vérifier que l'ID est un UUID valide
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (user.auth_user_id) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:95',message:'loadUserId - querying by auth_user_id',data:{authUserId:user.auth_user_id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.auth_user_id)
            .maybeSingle();
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:100',message:'loadUserId - query result',data:{hasData:!!data,hasError:!!error,dataId:data?.id,errorMessage:error?.message,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          if (data && data.id && uuidRegex.test(data.id)) {
            setUserId(data.id);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:101',message:'loadUserId - setUserId from auth_user_id',data:{userId:data.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            return;
          } else if (error) {
            console.error('Erreur récupération userId par auth_user_id:', error);
          }
        }
        
        // Vérifier que user.id est un UUID valide avant de l'utiliser
        if (user.id && uuidRegex.test(user.id)) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:109',message:'loadUserId - setUserId from user.id',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setUserId(user.id);
        } else if (user.id) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:112',message:'loadUserId - invalid user.id',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          console.warn('ID utilisateur invalide (pas un UUID):', user.id);
        }
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:114',message:'loadUserId - error',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.error('Erreur chargement userId:', error);
      }
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:117',message:'loadUserId - no userData in localStorage',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  };

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const data = await ConsultationService.getAllConsultations();
      
      // Charger les informations patient pour chaque consultation
      const consultationsWithPatients = await Promise.all(
        (data || []).map(async (c) => {
          try {
            const patient = await PatientService.getPatientById(c.patient_id);
            return { ...c, patient };
          } catch {
            return c;
          }
        })
      );
      
      setConsultations(consultationsWithPatients as any);
    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des consultations',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setOpenPatientSelector(false);
    setOpenStartDialog(true);
  };

  const handleStartConsultation = async (templateId: string, type: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:156',message:'handleStartConsultation entry',data:{selectedPatient:selectedPatient?.id,userId,hasSelectedPatient:!!selectedPatient},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    
    if (!selectedPatient) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:158',message:'No selectedPatient - early return',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner un patient',
        severity: 'error'
      });
      return;
    }

    // Si userId n'est pas chargé, essayer de le recharger avant de continuer
    let currentUserId = userId;
    if (!currentUserId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:166',message:'userId empty - attempting reload',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Récupérer directement depuis localStorage et Supabase (sans passer par le state)
      const userData = localStorage.getItem('user');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:170',message:'Direct userId fetch from localStorage',data:{hasUserData:!!userData},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:175',message:'Parsed user for direct fetch',data:{hasAuthUserId:!!user.auth_user_id,hasUserId:!!user.id,authUserId:user.auth_user_id,userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          if (user.auth_user_id && uuidRegex.test(user.auth_user_id)) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:178',message:'Querying users by auth_user_id',data:{authUserId:user.auth_user_id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            
            const { data, error } = await supabase
              .from('users')
              .select('id')
              .eq('auth_user_id', user.auth_user_id)
              .single();
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:183',message:'Query result for auth_user_id',data:{hasData:!!data,hasError:!!error,dataId:data?.id,errorMessage:error?.message,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            
            if (data?.id && uuidRegex.test(data.id)) {
              currentUserId = data.id;
              setUserId(data.id);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:188',message:'Successfully set userId from auth_user_id',data:{currentUserId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
            }
          } else if (user.id && uuidRegex.test(user.id)) {
            currentUserId = user.id;
            setUserId(user.id);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:193',message:'Successfully set userId from user.id',data:{currentUserId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
          }
        } catch (err) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:196',message:'Error in direct userId fetch',data:{errorMessage:err?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          console.error('Erreur récupération userId:', err);
        }
      }
    }

    if (!currentUserId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:190',message:'No userId after reload - early return',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setSnackbar({
        open: true,
        message: 'Utilisateur non connecté. Veuillez vous reconnecter.',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:195',message:'Before createConsultation',data:{patientId:selectedPatient.id,userId:currentUserId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const consultation = await ConsultationService.createConsultation(
        selectedPatient.id,
        currentUserId
      );

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:200',message:'After createConsultation',data:{consultationId:consultation?.id,hasConsultation:!!consultation},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (type) {
        await ConsultationService.updateConsultation(
          consultation.id,
          { categorie_motif: type } as any,
          currentUserId,
          'categorie_motif'
        );
      }

      // Recharger la consultation complète depuis la base de données
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:210',message:'Before getConsultationById',data:{consultationId:consultation.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const fullConsultation = await ConsultationService.getConsultationById(consultation.id);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:212',message:'After getConsultationById',data:{hasFullConsultation:!!fullConsultation,fullConsultationId:fullConsultation?.id,patientId:fullConsultation?.patient_id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      if (fullConsultation) {
        // S'assurer que le patient est bien chargé
        let patientToUse = selectedPatient;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:217',message:'Before patient check',data:{patientToUseId:patientToUse?.id,fullConsultationPatientId:fullConsultation.patient_id,needsReload:!patientToUse || patientToUse.id !== fullConsultation.patient_id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (!patientToUse || patientToUse.id !== fullConsultation.patient_id) {
          patientToUse = await PatientService.getPatientById(fullConsultation.patient_id);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:219',message:'After reload patient',data:{hasPatientToUse:!!patientToUse,patientToUseId:patientToUse?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
        }
        
        // Définir le patient et la consultation pour afficher le workflow
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:222',message:'Before setState calls',data:{hasPatientToUse:!!patientToUse,hasFullConsultation:!!fullConsultation,patientToUseId:patientToUse?.id,fullConsultationId:fullConsultation?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E,F'})}).catch(()=>{});
        // #endregion
        
        // Utiliser une fonction de callback pour s'assurer que les states sont mis à jour ensemble
        // et fermer le dialog APRÈS la mise à jour du state
        setSelectedPatient(patientToUse);
        setCurrentConsultation(fullConsultation);
        
        // Utiliser setTimeout pour laisser React mettre à jour le state avant de fermer le dialog
        // Cela évite le race condition où onClose réinitialise selectedPatient
        setTimeout(() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:229',message:'Closing dialog after state update',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E,F'})}).catch(()=>{});
          // #endregion
          setOpenStartDialog(false);
        }, 0);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:227',message:'After setState calls - dialog will close in next tick',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E,F'})}).catch(()=>{});
        // #endregion
        
        // Ne pas afficher le snackbar immédiatement car le workflow va s'afficher
        // Le workflow sera visible automatiquement grâce à la condition if (currentConsultation && selectedPatient)
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:231',message:'fullConsultation is null',data:{consultationId:consultation.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw new Error('Impossible de charger la consultation créée');
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:234',message:'Error in handleStartConsultation',data:{errorMessage:error?.message,errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,B,C,D'})}).catch(()=>{});
      // #endregion
      console.error('Erreur lors de la création de la consultation:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors de la création de la consultation',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (step: number, data: any) => {
    // La sauvegarde est gérée dans ConsultationWorkflow
    console.log(`Étape ${step} complétée`);
  };

  const handleCloseConsultation = async () => {
    // Recharger la consultation pour avoir les dernières données
    if (currentConsultation) {
      try {
        const updated = await ConsultationService.getConsultationById(currentConsultation.id);
        if (updated) {
          setCurrentConsultation(updated);
        }
      } catch (error) {
        console.error('Erreur lors du rechargement:', error);
      }
    }

    // Recharger la liste des consultations
    await loadConsultations();
    
        setCurrentConsultation(null);
        setSelectedPatient(null);
        setPaymentAuthorized(false);
        setSnackbar({
          open: true,
          message: 'Consultation fermée',
          severity: 'info'
        });
  };

  const handleNewConsultation = () => {
    if (currentConsultation && currentConsultation.status !== 'CLOTURE') {
      if (window.confirm('Une consultation est en cours. Voulez-vous vraiment en créer une nouvelle ?')) {
        setCurrentConsultation(null);
        setSelectedPatient(null);
        setOpenPatientSelector(true);
      } else {
        return;
      }
    } else {
      setOpenPatientSelector(true);
    }
  };

  const handleResumeConsultation = async (consultation: Consultation) => {
    try {
      setLoading(true);
      // Charger le patient
      const patient = await PatientService.getPatientById(consultation.patient_id);
      
      // Recharger la consultation complète depuis la base de données
      const fullConsultation = await ConsultationService.getConsultationById(consultation.id);
      
      if (!fullConsultation) {
        throw new Error('Consultation non trouvée');
      }
      
      setSelectedPatient(patient);
      setCurrentConsultation(fullConsultation);
      
      setSnackbar({
        open: true,
        message: 'Consultation reprise avec succès',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Erreur lors de la reprise:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors de la reprise de la consultation',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewConsultation = async (consultation: Consultation) => {
    try {
      // Charger le patient
      const patient = await PatientService.getPatientById(consultation.patient_id);
      setSelectedPatient(patient);
      setCurrentConsultation(consultation);
    } catch (error) {
      console.error('Erreur lors de l\'affichage:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement de la consultation',
        severity: 'error'
      });
    }
  };

  const handlePrintConsultation = async (consultation: Consultation) => {
    try {
      // Charger le patient pour l'impression
      const patient = await PatientService.getPatientById(consultation.patient_id);
      
      // Charger les informations du médecin si disponible
      let medecin;
      if (consultation.medecin_id) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('nom, prenom, specialite, numero_ordre')
            .eq('id', consultation.medecin_id)
            .single();
          
          if (userData) {
            medecin = {
              nom: userData.nom || '',
              prenom: userData.prenom || '',
              specialite: userData.specialite || undefined,
              numero_ordre: userData.numero_ordre || undefined,
            };
          }
        } catch (err) {
          console.warn('Impossible de charger les informations du médecin:', err);
        }
      }
      
      // Importer et utiliser le service d'impression
      const { ConsultationPrintService } = await import('../services/consultationPrintService');
      ConsultationPrintService.printConsultation({
        consultation,
        patient,
        medecin,
      });
      
      setSnackbar({
        open: true,
        message: 'Impression de la consultation lancée',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'impression:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Erreur lors de l\'impression de la consultation',
        severity: 'error'
      });
    }
  };

  const filteredConsultations = useMemo(() => {
    if (!search) return consultations;
    return consultations.filter(
      (c) => {
        const patient = (c as any).patient;
        const patientMatch = patient
          ? `${patient.prenom} ${patient.nom} ${patient.identifiant}`.toLowerCase().includes(search.toLowerCase())
          : c.patient_id?.toLowerCase().includes(search.toLowerCase());
        
        const motifMatch = c.motifs?.some(m => m.toLowerCase().includes(search.toLowerCase()));
        const diagnosticMatch = c.diagnostics?.some(d => d.toLowerCase().includes(search.toLowerCase()));
        
        return patientMatch || motifMatch || diagnosticMatch;
      }
    );
  }, [consultations, search]);

  // Calcul des statistiques
  const stats = useMemo(() => {
    const total = consultations.length;
    const terminees = consultations.filter(c => c.status === 'CLOTURE').length;
    const enCours = consultations.filter(c => c.status === 'EN_COURS').length;
    const annulees = consultations.filter(c => c.status === 'ANNULE').length;
    return { total, terminees, enCours, annulees };
  }, [consultations]);

  // Si une consultation est en cours, afficher le workflow
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:335',message:'Render check - workflow condition',data:{hasCurrentConsultation:!!currentConsultation,hasSelectedPatient:!!selectedPatient,currentConsultationId:currentConsultation?.id,selectedPatientId:selectedPatient?.id,willRenderWorkflow:!!(currentConsultation && selectedPatient)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  }
  // #endregion
  
  if (currentConsultation && selectedPatient) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:336',message:'Rendering ConsultationWorkflow',data:{consultationId:currentConsultation.id,patientId:selectedPatient.id,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    return (
      <Box sx={{ height: '100vh', overflow: 'auto' }}>
        {/* Notification de statut de paiement */}
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <PaymentNotification
            consultationId={currentConsultation.id}
            patientId={selectedPatient.id}
            onPaymentConfirmed={() => {
              setPaymentAuthorized(true);
              setSnackbar({
                open: true,
                message: '✅ Paiement confirmé ! Accès à la consultation autorisé.',
                severity: 'success',
              });
            }}
            showNotification={true}
          />
        </Box>

        <ConsultationPaymentGate
          consultationId={currentConsultation.id}
          onAuthorized={() => setPaymentAuthorized(true)}
          onBlocked={() => setPaymentAuthorized(false)}
        />
        {paymentAuthorized && (
          <ConsultationWorkflow
            consultation={currentConsultation}
            patient={selectedPatient}
            onStepComplete={handleStepComplete}
            onClose={handleCloseConsultation}
            userId={userId}
          />
        )}
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  // Page principale : Liste des consultations
  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <ToolbarBits sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <MedicalServices color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <GradientText variant="h4">Consultations</GradientText>
            <Typography variant="body2" color="text.secondary">
              Gestion des consultations médicales et workflow complet
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNewConsultation}
          size="medium"
        >
          Nouvelle Consultation
        </Button>
      </ToolbarBits>

      {/* Statistiques */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={2} mb={3}>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Total consultations" value={stats.total} icon={<Assignment />} color="primary" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Terminées" value={stats.terminees} icon={<Event />} color="success" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="En cours" value={stats.enCours} icon={<MedicalServices />} color="warning" />
        </GlassCard>
        <GlassCard sx={{ p: 2 }}>
          <StatBadge label="Annulées" value={stats.annulees} icon={<Person />} color="error" />
        </GlassCard>
      </Box>

      {/* Patient sélectionné */}
      {selectedPatient && !currentConsultation && (
        <Box sx={{ mb: 3 }}>
          <PatientCard patient={selectedPatient} compact />
        </Box>
      )}

      {/* Barre de recherche */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher une consultation par patient, motif ou diagnostic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Tabs pour filtrer */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label="Toutes" />
          <Tab label="En cours" />
          <Tab label="Terminées" />
          <Tab label="Annulées" />
        </Tabs>
      </Box>

      {/* Liste des consultations */}
      <GlassCard sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Motif</TableCell>
                <TableCell>Diagnostic</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredConsultations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Aucune consultation trouvée
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredConsultations
                  .filter(c => {
                    if (tab === 1) return c.status === 'EN_COURS';
                    if (tab === 2) return c.status === 'CLOTURE';
                    if (tab === 3) return c.status === 'ANNULE';
                    return true;
                  })
                  .map((consultation) => (
                    <TableRow key={consultation.id} hover>
                      <TableCell>
                        {new Date(consultation.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        {(consultation as any).patient ? (
                          <Box>
                            <Typography variant="body2">
                              {(consultation as any).patient.prenom} {(consultation as any).patient.nom}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(consultation as any).patient.identifiant}
                            </Typography>
                          </Box>
                        ) : consultation.patient_id ? (
                          <Chip label={consultation.patient_id.substring(0, 8)} size="small" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {consultation.motifs && consultation.motifs.length > 0
                          ? consultation.motifs[0]
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {consultation.diagnostics && consultation.diagnostics.length > 0
                          ? consultation.diagnostics[0]
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={consultation.status}
                          color={
                            consultation.status === 'CLOTURE'
                              ? 'success'
                              : consultation.status === 'EN_COURS'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {consultation.status === 'EN_COURS' ? (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleResumeConsultation(consultation)}
                            title="Reprendre la consultation"
                          >
                            <Edit />
                          </IconButton>
                        ) : (
                          <IconButton 
                            size="small" 
                            color="primary" 
                            title="Voir les détails"
                            onClick={() => handleViewConsultation(consultation)}
                          >
                            <Visibility />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          color="default" 
                          title="Imprimer"
                          onClick={() => handlePrintConsultation(consultation)}
                        >
                          <Print />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      {/* Dialog de sélection de patient */}
      <PatientSelector
        open={openPatientSelector}
        onClose={() => setOpenPatientSelector(false)}
        onSelect={handleSelectPatient}
        title="Sélectionner un patient pour la consultation"
        allowCreate={true}
        onCreateNew={() => {
          navigate('/patients?action=create&service=Médecine générale');
        }}
      />

      {/* Dialog de démarrage de consultation */}
      <ConsultationStartDialog
        open={openStartDialog}
        onClose={() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:577',message:'Dialog onClose called',data:{hasCurrentConsultation:!!currentConsultation,currentConsultationId:currentConsultation?.id,isLoading:loading,hasSelectedPatient:!!selectedPatient},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,F'})}).catch(()=>{});
          // #endregion
          setOpenStartDialog(false);
          // Ne réinitialiser le patient que si on ferme le dialog sans créer de consultation
          // ET que la création n'est pas en cours
          // ET qu'il n'y a pas de consultation en cours (pour éviter de réinitialiser pendant la création)
          if (!currentConsultation && !loading && !selectedPatient) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Consultations.tsx:580',message:'Resetting selectedPatient to null',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A,F'})}).catch(()=>{});
            // #endregion
            setSelectedPatient(null);
          }
        }}
        onStart={handleStartConsultation}
        patient={selectedPatient}
      />

      {/* Backdrop de chargement */}
      <Backdrop open={loading} sx={{ zIndex: 9999 }}>
        <CircularProgress color="primary" />
      </Backdrop>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Consultations;
