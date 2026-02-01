import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Chip,
  AppBar,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  LocalHospital,
  People,
  Assignment,
  LocalPharmacy,
  Science,
  Image,
  PregnantWoman,
  Vaccines,
  Receipt,
  Inventory,
  Email,
  Phone,
  LocationOn,
  Send,
  CheckCircle,
  Security,
  Speed,
  Support,
  Lock,
  PersonAdd,
  Warning,
} from '@mui/icons-material';
import { Button as ShadcnButton } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { User } from '../../types/auth';
import { gsap } from 'gsap';
import Logo from '../ui/Logo';
import { supabase } from '../../services/supabase';
import ChangePasswordDialog from './ChangePasswordDialog';
import ForgotPasswordDialog from './ForgotPasswordDialog';
import { REGISTRATION_ROLES } from '../../config/roles';
import ThemeToggleButton from '../ui/ThemeToggleButton';
import { SECURITY_QUESTIONS, SecurityQuestionOption } from '../../data/securityQuestions';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

/**
 * Fonction de hachage SHA-256 compatible avec le backend
 * Utilisée pour vérifier les mots de passe des comptes démo (sans auth_user_id)
 */
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'logi_clinic_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Détecter si une erreur ressemble à une panne/maintenance Supabase (réseau / 5xx / indisponibilité)
const isSupabaseMaintenanceLikeError = (err: any): boolean => {
  const msg = String(err?.message || err?.error_description || '').toLowerCase();
  const code = String(err?.code || '').toLowerCase();
  const statusRaw = err?.status ?? err?.statusCode ?? err?.code;
  const status = typeof statusRaw === 'number' ? statusRaw : Number(statusRaw);

  // Réseau / fetch
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('fetcherror') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    code === 'ecconnrefused' ||
    code === 'enotfound' ||
    code === 'etimedout'
  ) {
    return true;
  }

  // Indisponibilité service (Auth/REST) : 5xx / 429
  if ([429, 500, 502, 503, 504].includes(status)) return true;
  if (msg.includes('service unavailable') || msg.includes('temporarily unavailable')) return true;
  if (msg.includes('bad gateway') || msg.includes('gateway timeout')) return true;

  return false;
};

const supabaseMaintenanceMessage =
  '🔄 Une mise à jour/maintenance du service est en cours (Supabase). Veuillez réessayer dans quelques minutes.';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    clinicCode: '',
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [contactSent, setContactSent] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'signup'>('login');
  
  // État pour le dialogue de changement de mot de passe (première connexion)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordDialogInfo, setPasswordDialogInfo] = useState<{
    clinicName: string;
    clinicCode: string;
    clinicId: string;
    userEmail: string;
    pendingUser: User | null;
    pendingToken: string | null;
    authUserId?: string;
    currentPassword?: string;
  } | null>(null);
  const [signupForm, setSignupForm] = useState({
    clinicCode: '', // Nouveau: code clinique obligatoire
    nom: '',
    prenom: '',
    email: '',
    password: '',
    passwordConfirm: '',
    telephone: '',
    adresse: '',
    roleSouhaite: 'receptionniste',
    specialite: '',
    securityQuestions: {
      question1: { questionId: '', question: '', answer: '' },
      question2: { questionId: '', question: '', answer: '' },
      question3: { questionId: '', question: '', answer: '' },
    },
  });
  const [clinicValidation, setClinicValidation] = useState<{
    isValid: boolean;
    clinicName: string | null;
    isChecking: boolean;
  }>({ isValid: false, clinicName: null, isChecking: false });
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const theme = useTheme();

  // Gestion du chargement progressif de la page
  useEffect(() => {
    const handleLoad = () => {
      // Simuler un chargement progressif
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPageLoading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      // Forcer la fin du chargement après 1 seconde max
      setTimeout(() => {
        clearInterval(interval);
        setLoadingProgress(100);
        setIsPageLoading(false);
      }, 1000);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // Amélioration de la navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigation entre les sections avec Tab
      if (e.key === 'Escape') {
        // Fermer les modales ou réinitialiser les erreurs
        setError('');
        setSignupSuccess(false);
      }
      
      // Navigation rapide avec Ctrl/Cmd + K (recherche)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const loginRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // S'assurer que la page est au top au chargement et empêcher le défilement horizontal
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.body.style.overflowX = 'hidden';
      document.documentElement.style.overflowX = 'hidden';
      
      return () => {
        document.body.style.overflowX = '';
        document.documentElement.style.overflowX = '';
      };
    }
  }, []);

  useEffect(() => {
    // Vérifier que GSAP est disponible et que nous sommes dans le navigateur
    if (typeof window === 'undefined' || typeof gsap === 'undefined') {
      return;
    }

    // Utilisation de IntersectionObserver pour les animations au scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          try {
            // Optimisation: utiliser will-change et force3D
            if (entry.target instanceof HTMLElement) {
              entry.target.style.willChange = 'transform, opacity';
            }
            
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: 'power3.out',
              force3D: true, // Utiliser l'accélération GPU
              onComplete: () => {
                // Nettoyer will-change après l'animation
                if (entry.target instanceof HTMLElement) {
                  entry.target.style.willChange = 'auto';
                }
              },
            });
            observer.unobserve(entry.target);
          } catch (err) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0) scale(1)';
            observer.unobserve(entry.target);
          }
        }
      });
    }, observerOptions);

    // Animations sophistiquées pour la section Hero avec timeline GSAP
    if (heroRef.current) {
      try {
        const heroContainer = heroRef.current.querySelector('.hero-container');
        const heroIcon = heroRef.current.querySelector('.hero-icon');
        const heroTitle = heroRef.current.querySelector('.hero-title');
        const heroSubtitle = heroRef.current.querySelector('.hero-subtitle');
        const heroDescription = heroRef.current.querySelector('.hero-description');
        const heroButton = heroRef.current.querySelector('.hero-button');
        const heroBackground = heroRef.current.querySelector('.hero-background');

        // Timeline pour animations séquentielles
        const heroTimeline = gsap.timeline();

        // Animation des éléments de fond
        if (heroBackground) {
          gsap.from(heroBackground, {
            opacity: 0,
            scale: 1.2,
            duration: 2,
            ease: 'power2.out',
          });
          
          // Animation continue des particules - Optimisée pour performance
          const particles = heroBackground.querySelectorAll('.particle');
          particles.forEach((particle, index) => {
            if (particle instanceof HTMLElement) {
              // Utiliser will-change pour optimiser les performances
              particle.style.willChange = 'transform';
              
              const randomY = (Math.random() - 0.5) * 200;
              const randomX = (Math.random() - 0.5) * 200;
              const randomRotation = (Math.random() - 0.5) * 360;
              const randomDuration = 3 + Math.random() * 3;
              
              gsap.to(particle, {
                y: randomY,
                x: randomX,
                rotation: randomRotation,
                duration: randomDuration,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: index * 0.2,
                force3D: true, // Utiliser l'accélération GPU
              });
            }
          });
        }

        // S'assurer que les éléments sont visibles initialement
        if (heroIcon) {
          gsap.set(heroIcon, { opacity: 1 });
          heroTimeline.from(heroIcon, {
            opacity: 0,
            scale: 0,
            rotation: -180,
            duration: 1.2,
            ease: 'back.out(1.7)',
          });
        }
        
        if (heroTitle) {
          gsap.set(heroTitle, { opacity: 1 });
          heroTimeline.from(heroTitle, {
            opacity: 0,
            y: 80,
            duration: 1,
            ease: 'power4.out',
          }, heroIcon ? '-=0.5' : 0);
        }
        
        if (heroSubtitle) {
          gsap.set(heroSubtitle, { opacity: 1 });
          heroTimeline.from(heroSubtitle, {
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: 'power3.out',
          }, heroTitle ? '-=0.6' : 0);
        }
        
        if (heroDescription) {
          gsap.set(heroDescription, { opacity: 1 });
          heroTimeline.from(heroDescription, {
            opacity: 0,
            y: 30,
            duration: 0.8,
            ease: 'power2.out',
          }, heroSubtitle ? '-=0.4' : 0);
        }
        
        if (heroButton) {
          gsap.set(heroButton, { opacity: 1 });
          heroTimeline.from(heroButton, {
            opacity: 0,
            scale: 0.8,
            y: 20,
            duration: 0.6,
            ease: 'back.out(1.4)',
          }, heroDescription ? '-=0.3' : 0);
        }

        // Animation continue du logo (rotation subtile et pulsation) - Optimisé
        if (heroIcon) {
          // Utiliser will-change pour optimiser les performances
          if (heroIcon instanceof HTMLElement) {
            heroIcon.style.willChange = 'transform';
          }
          
          // Rotation continue très lente - Optimisée avec force3D
          gsap.to(heroIcon, {
            rotation: 360,
            duration: 30,
            repeat: -1,
            ease: 'none',
            force3D: true, // Utiliser l'accélération GPU
          });
          
          // Pulsation subtile - Optimisée
          gsap.to(heroIcon, {
            scale: 1.1,
            duration: 2,
            repeat: -1,
            yoyo: true,
            force3D: true, // Utiliser l'accélération GPU
            ease: 'sine.inOut',
          });
        }
      } catch (err) {
        console.error('Erreur animations Hero:', err);
      }
    }

    // Animations sophistiquées pour les cartes de fonctionnalités
    if (featuresRef.current) {
      const cards = featuresRef.current.querySelectorAll('.feature-card');
      const title = featuresRef.current.querySelector('.features-title');
      
      // Animation du titre
      if (title) {
        gsap.from(title, {
          opacity: 0,
          y: -30,
          duration: 1,
          ease: 'power3.out',
        });
      }

      // Animation stagger des cartes avec effets 3D
      cards.forEach((card, index) => {
        if (card instanceof HTMLElement) {
          try {
            gsap.set(card, { 
              opacity: 0, 
              y: 100,
              rotationX: 15,
              transformPerspective: 1000,
            });
            
            observer.observe(card);
            
            // Animation au hover avec GSAP
            card.addEventListener('mouseenter', () => {
              gsap.to(card, {
                y: -12,
                scale: 1.02,
                rotationX: 0,
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                duration: 0.4,
                ease: 'power2.out',
              });
              
              // Animation de l'icône
              const icon = card.querySelector('.feature-icon');
              if (icon) {
                gsap.to(icon, {
                  scale: 1.2,
                  rotation: 360,
                  duration: 0.6,
                  ease: 'back.out(1.7)',
                });
              }
            });
            
            card.addEventListener('mouseleave', () => {
              gsap.to(card, {
                y: 0,
                scale: 1,
                rotationX: 0,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                duration: 0.4,
                ease: 'power2.out',
              });
              
              const icon = card.querySelector('.feature-icon');
              if (icon) {
                gsap.to(icon, {
                  scale: 1,
                  rotation: 0,
                  duration: 0.4,
                  ease: 'power2.out',
                });
              }
            });
          } catch (err) {
            card.style.opacity = '0';
            observer.observe(card);
          }
        }
      });
    }

    // Animation pour le formulaire de connexion
    if (loginRef.current) {
      try {
        gsap.set(loginRef.current, { opacity: 0, scale: 0.9, y: 50 });
        observer.observe(loginRef.current);
      } catch (err) {
        loginRef.current.style.opacity = '0';
        observer.observe(loginRef.current);
      }
    }

    // Animation pour la section contact
    if (contactRef.current) {
      const contactChildren = Array.from(contactRef.current.children);
      contactChildren.forEach((child) => {
        if (child instanceof HTMLElement) {
          try {
            gsap.set(child, { opacity: 0, y: 30 });
            observer.observe(child);
          } catch (err) {
            child.style.opacity = '0';
            observer.observe(child);
          }
        }
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation des champs
    if (!credentials.clinicCode || !credentials.username || !credentials.password) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Vérifier que le code clinique existe dans Supabase
      const clinicCodeUpper = credentials.clinicCode.toUpperCase().trim();
      
      // #region agent log (debug-session)
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:434',message:'clinic_code_input',data:{original:credentials.clinicCode,transformed:clinicCodeUpper,length:clinicCodeUpper.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion agent log (debug-session)
      
      console.log('🔍 Recherche de la clinique avec le code:', clinicCodeUpper);
      
      // #region agent log (debug-session)
      const supabaseUrl = (supabase as any).supabaseUrl || 'unknown';
      const supabaseKey = (supabase as any).supabaseKey ? 'present' : 'missing';
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:440',message:'supabase_config_check',data:{supabaseUrl,hasKey:supabaseKey!=='missing'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion agent log (debug-session)
      
      // #region agent log (debug-session)
      // Tester aussi la fonction RPC validate_clinic_code
      const { data: rpcResult, error: rpcError } = await supabase.rpc('validate_clinic_code', { p_clinic_code: clinicCodeUpper });
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:444',message:'rpc_validate_test',data:{hasRpcData:!!rpcResult,hasRpcError:!!rpcError,rpcErrorCode:rpcError?.code,rpcErrorMessage:rpcError?.message,rpcResult:rpcResult},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion agent log (debug-session)
      
      // Utiliser la fonction RPC si disponible (contourne RLS)
      let clinicCheck = null;
      let clinicCheckError = null;
      
      if (rpcResult && rpcResult.success && rpcResult.clinic) {
        // Utiliser le résultat de la fonction RPC
        clinicCheck = {
          id: rpcResult.clinic.id,
          code: rpcResult.clinic.code,
          name: rpcResult.clinic.name,
          active: rpcResult.clinic.active,
          is_temporary_code: rpcResult.clinic.is_temporary_code,
          requires_code_change: rpcResult.clinic.requires_code_change
        };
        // #region agent log (debug-session)
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:456',message:'using_rpc_result',data:{clinicFromRpc:clinicCheck},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion agent log (debug-session)
      } else {
        // Fallback: requête directe
        const directQuery = await supabase
          .from('clinics')
          .select('id, code, name, active, is_temporary_code, requires_code_change')
          .eq('code', clinicCodeUpper)
          .maybeSingle();
        clinicCheck = directQuery.data;
        clinicCheckError = directQuery.error;
      }

      // #region agent log (debug-session)
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:452',message:'clinic_query_result',data:{hasData:!!clinicCheck,hasError:!!clinicCheckError,errorCode:clinicCheckError?.code,errorMessage:clinicCheckError?.message,errorDetails:clinicCheckError?.details,errorHint:clinicCheckError?.hint,dataValue:clinicCheck},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion agent log (debug-session)

      console.log('📊 Résultat de la recherche:', { clinicCheck, clinicCheckError });

      // #region agent log (debug-session)
      if (clinicCheckError) {
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:451',message:'clinic_query_error',data:{errorCode:clinicCheckError.code,errorMessage:clinicCheckError.message,errorDetails:clinicCheckError.details,errorHint:clinicCheckError.hint,fullError:JSON.stringify(clinicCheckError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      }
      // #endregion agent log (debug-session)
      
      if (clinicCheckError) {
        console.error('❌ Erreur Supabase lors de la recherche:', clinicCheckError);
        if (isSupabaseMaintenanceLikeError(clinicCheckError)) {
          setError(supabaseMaintenanceMessage);
        } else {
          setError(`Erreur de connexion: ${clinicCheckError.message || 'Impossible de vérifier le code clinique'}`);
        }
        setIsLoading(false);
        return;
      }

      // Si non trouvé, vérifier dans la table des codes temporaires
      let isUsingTempCode = false;
      let tempClinic = clinicCheck;

      if (!clinicCheck) {
        console.log('🔍 Recherche dans les codes temporaires...');
        
        // Rechercher d'abord dans clinic_temporary_codes sans jointure
        const { data: tempCodeData, error: tempCodeError } = await supabase
          .from('clinic_temporary_codes')
          .select(`
            id,
            clinic_id,
            temporary_code,
            is_used,
            is_converted,
            expires_at
          `)
          .eq('temporary_code', clinicCodeUpper)
          .maybeSingle();

        console.log('📊 Résultat recherche code temporaire:', { tempCodeData, tempCodeError });

        if (tempCodeData && !tempCodeError) {
          // Vérifier si le code temporaire a expiré
          if (new Date(tempCodeData.expires_at) < new Date()) {
            setError('Ce code temporaire a expiré. Contactez le Super-Admin pour obtenir un nouveau code.');
            setIsLoading(false);
            return;
          }

          // Vérifier si déjà converti
          if (tempCodeData.is_converted) {
            setError('Ce code temporaire a déjà été converti en code permanent. Utilisez le nouveau code clinique.');
            setIsLoading(false);
            return;
          }

          // Utiliser la fonction SQL qui contourne les RLS policies
          // Cette fonction retourne toutes les données nécessaires
          const { data: clinicDataFromFunction, error: functionError } = await supabase
            .rpc('get_clinic_by_temp_code', { p_temp_code: clinicCodeUpper });

          console.log('📊 Données clinique via fonction RPC:', { clinicDataFromFunction, functionError });

          if (clinicDataFromFunction && clinicDataFromFunction.length > 0 && !functionError) {
            const clinicInfo = clinicDataFromFunction[0];
            tempClinic = {
              id: clinicInfo.clinic_id,
              code: tempCodeData.temporary_code, // Utiliser le code temporaire
              name: clinicInfo.clinic_name,
              active: clinicInfo.clinic_active,
              is_temporary_code: clinicInfo.is_temporary_code ?? true,
              requires_code_change: clinicInfo.requires_code_change ?? true,
            };
            isUsingTempCode = true;
            console.log('✅ Code temporaire trouvé via fonction RPC:', tempClinic);
          } else {
            // Fallback: Essayer de récupérer via la table clinics directement
            console.log('⚠️ Fonction RPC non disponible, tentative via table clinics...');
            const { data: clinicData, error: clinicDataError } = await supabase
              .from('clinics')
              .select('id, code, name, active, is_temporary_code, requires_code_change')
              .eq('id', tempCodeData.clinic_id)
              .maybeSingle();

            console.log('📊 Données clinique récupérées (fallback):', { clinicData, clinicDataError });

            if (clinicData && !clinicDataError) {
              tempClinic = {
                id: clinicData.id,
                code: tempCodeData.temporary_code,
                name: clinicData.name,
                active: clinicData.active,
                is_temporary_code: true,
                requires_code_change: true,
              };
              isUsingTempCode = true;
              console.log('✅ Code temporaire trouvé (fallback):', tempClinic);
            } else {
              // Dernier recours: utiliser les données minimales du code temporaire
              console.warn('⚠️ Clinique non accessible, utilisation des données minimales');
              tempClinic = {
                id: tempCodeData.clinic_id,
                code: tempCodeData.temporary_code,
                name: 'Clinique (Code temporaire)',
                active: true,
                is_temporary_code: true,
                requires_code_change: true,
              };
              isUsingTempCode = true;
              console.log('✅ Code temporaire trouvé (données minimales):', tempClinic);
            }
          }
        } else {
          console.log('❌ Code temporaire non trouvé dans clinic_temporary_codes');
        }
      }

      if (clinicCheckError && !tempClinic) {
        console.error('❌ Erreur Supabase lors de la recherche:', clinicCheckError);
        if (isSupabaseMaintenanceLikeError(clinicCheckError)) {
          setError(supabaseMaintenanceMessage);
        } else {
          setError(`Erreur de connexion: ${clinicCheckError.message || 'Impossible de vérifier le code clinique'}`);
        }
        setIsLoading(false);
        return;
      }

      // #region agent log (debug-session)
      if (!tempClinic) {
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:565',message:'clinic_not_found',data:{clinicCode:clinicCodeUpper,clinicCheckWasNull:!clinicCheck,clinicCheckErrorWasNull:!clinicCheckError,tempClinicWasNull:!tempClinic},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      }
      // #endregion agent log (debug-session)
      
      if (!tempClinic) {
        console.error('❌ Clinique non trouvée:', clinicCodeUpper);
        setError(`Code clinique "${clinicCodeUpper}" introuvable. Vérifiez que le code est correct.`);
        setIsLoading(false);
        return;
      }

      if (!tempClinic.active) {
        console.error('❌ Clinique inactive:', clinicCodeUpper);
        setError(`La clinique "${tempClinic.name}" est inactive. Contactez le Super-Admin.`);
        setIsLoading(false);
        return;
      }

      const clinic = tempClinic;
      console.log('✅ Clinique trouvée:', clinic);

      // 2. Authentifier l'utilisateur via Supabase Auth
      // Le username peut être l'email ou un identifiant
      // IMPORTANT: Normaliser l'email (lowercase, trim) pour éviter les erreurs 400
      const email = credentials.username.includes('@') 
        ? credentials.username.trim().toLowerCase()
        : credentials.username.trim();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:563',message:'Auth attempt start',data:{email,emailLength:email.length,clinicId:clinic.id,clinicCode:clinic.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Essayer d'abord avec Supabase Auth
      let authUser = null;
      let authSession = null;
      let authErrInfo: any = null;

      try {
        // IMPORTANT: S'assurer que l'email est valide et normalisé avant l'appel
        if (!email || email.length === 0) {
          throw new Error('Email invalide');
        }

        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: email,
          password: credentials.password.trim(), // S'assurer que le mot de passe est aussi trimé
        });
        authErrInfo = authErr;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:577',message:'Supabase Auth result',data:{hasUser:!!authData?.user,hasSession:!!authData?.session,hasError:!!authErr,errorMessage:authErr?.message,errorCode:authErr?.status,errorName:authErr?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (authData?.user && authData?.session && !authErr) {
          authUser = authData.user;
          authSession = authData.session;
          console.log('✅ Supabase Auth réussi, session valide obtenue');
        } else {
          // Erreur 400 = identifiants invalides - ne pas continuer avec un token factice
          if (authErr?.status === 400 || authErr?.message?.includes('Invalid login credentials')) {
            console.log('❌ Supabase Auth: Identifiants invalides (400)');
            // On continuera pour vérifier si c'est un compte démo sans auth_user_id
          } else {
            console.log('⚠️ Supabase Auth échoué, recherche dans la table users');
          }
        }
      } catch (err: any) {
        authErrInfo = err;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:585',message:'Supabase Auth exception',data:{errorMessage:err?.message,errorName:err?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Si Supabase Auth échoue, on essaiera avec la table users (pour les comptes démo)
        console.log('⚠️ Tentative Supabase Auth échouée, vérification compte démo');
      }

      // 3. Récupérer l'utilisateur dans la table users
      let user = null;
      let userError = null;
      let authOkButProfileMissing = false;

      // Si on a réussi l'authentification Supabase Auth, chercher par auth_user_id
      if (authUser?.id) {
        const { data: userData, error: err } = await supabase
          .from('users')
          .select(`
            id,
            auth_user_id,
            nom,
            prenom,
            email,
            role,
            status,
            clinic_id,
            specialite,
            actif
          `)
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        // Cas fréquent après suppression/recréation d'un compte Supabase Auth:
        // l'auth fonctionne, mais le profil public.users n'est pas lié au nouveau UID.
        if (!err && !userData) {
          authOkButProfileMissing = true;
        }

        // IMPORTANT:
        // - Le Super Admin doit pouvoir se connecter avec n'importe quel code clinique (contexte),
        //   même si son compte n'est pas "attaché" à une clinique spécifique.
        // - Pour les autres rôles, on impose que l'utilisateur appartienne à la clinique saisie.
        const roleUpper = (userData?.role || '').toUpperCase();
        const isSuperAdmin = roleUpper === 'SUPER_ADMIN';

        if (userData && !err) {
          if (isSuperAdmin) {
            user = userData;
          } else if (userData.clinic_id === clinic.id) {
            user = userData;
          } else {
            user = null;
          }
        }

        userError = err;
      }

      // Si pas trouvé avec auth_user_id, chercher par email et clinic_id
      if (!user) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:617',message:'Searching users table',data:{email,emailLength:email.length,clinicId:clinic.id,clinicCode:clinic.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Utiliser la fonction SQL qui contourne RLS pour les utilisateurs non authentifiés
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:635',message:'Calling RPC authenticate_user_by_email',data:{email,clinicId:clinic.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        const { data: userDataFromRPC, error: rpcError } = await supabase
          .rpc('authenticate_user_by_email', {
            p_email: email,
            p_clinic_id: clinic.id
          });
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:642',message:'RPC authenticate_user_by_email result',data:{found:!!userDataFromRPC && userDataFromRPC.length > 0,hasError:!!rpcError,errorMessage:rpcError?.message,errorCode:rpcError?.code,errorDetails:rpcError?.details,dataLength:userDataFromRPC?.length,userData:userDataFromRPC?.[0]?{id:userDataFromRPC[0].id,email:userDataFromRPC[0].email,role:userDataFromRPC[0].role,status:userDataFromRPC[0].status,clinicId:userDataFromRPC[0].clinic_id}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C,E'})}).catch(()=>{});
        // #endregion
        
        let userData = null;
        let err = rpcError;
        
        if (userDataFromRPC && userDataFromRPC.length > 0) {
          userData = userDataFromRPC[0];
        } else {
          // Fallback: Essayer directement via la table (peut être bloqué par RLS)
          // Pour les Super Admins, chercher aussi ceux avec clinic_id = NULL
          let userDataDirect = null;
          let errDirect = null;
          
          // D'abord essayer avec clinic_id
          const { data: userDataWithClinic, error: errWithClinic } = await supabase
            .from('users')
            .select(`
              id,
              auth_user_id,
              nom,
              prenom,
              email,
              role,
              status,
              clinic_id,
              specialite,
              actif,
              password_hash
            `)
            .eq('email', email)
            .eq('clinic_id', clinic.id)
            .maybeSingle();
          
          // Si pas trouvé, essayer pour Super Admin (clinic_id = NULL)
          if (!userDataWithClinic && !errWithClinic) {
            const { data: userDataSuperAdmin, error: errSuperAdmin } = await supabase
              .from('users')
              .select(`
                id,
                auth_user_id,
                nom,
                prenom,
                email,
                role,
                status,
                clinic_id,
                specialite,
                actif,
                password_hash
              `)
              .eq('email', email)
              .is('clinic_id', null)
              .eq('role', 'SUPER_ADMIN')
              .maybeSingle();
            
            userDataDirect = userDataSuperAdmin;
            errDirect = errSuperAdmin;
          } else {
            userDataDirect = userDataWithClinic;
            errDirect = errWithClinic;
          }
          
          userData = userDataDirect;
          err = errDirect;
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:650',message:'User via direct query (fallback)',data:{found:!!userData,hasError:!!err,errorMessage:err?.message,errorCode:err?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:670',message:'Users table query result',data:{found:!!userData,hasError:!!err,errorMessage:err?.message,errorCode:err?.code,userData:userData?{id:userData.id,email:userData.email,role:userData.role,status:userData.status,clinicId:userData.clinic_id,actif:userData.actif,hasAuthUserId:!!userData?.auth_user_id,hasPasswordHash:!!userData?.password_hash}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C,D,E'})}).catch(()=>{});
        // #endregion
        
        user = userData;
        userError = err;

        // Sécurité: si le compte est lié à Supabase Auth (auth_user_id non NULL),
        // on DOIT avoir une session Supabase Auth valide (sinon contournement mot de passe).
        if (user && user.auth_user_id && !authUser) {
          if (isSupabaseMaintenanceLikeError(authErrInfo)) {
            setError(supabaseMaintenanceMessage);
          } else {
            setError('Mot de passe incorrect (connexion Supabase requise).');
          }
          setIsLoading(false);
          return;
        }

        // Si l'utilisateur n'a pas d'auth_user_id, vérifier le password_hash
        // C'est le cas pour les comptes démo (CLINIC-001)
        if (user && !user.auth_user_id && user.password_hash) {
          console.log('🔐 Vérification du password_hash pour compte démo');
          const inputHash = await hashPassword(credentials.password);
          if (inputHash !== user.password_hash) {
            console.log('❌ Password hash ne correspond pas');
            setError('Mot de passe incorrect');
            setIsLoading(false);
            return;
          }
          console.log('✅ Password hash vérifié avec succès');
        } else if (user && !user.auth_user_id && !user.password_hash) {
          // Utilisateur sans auth_user_id et sans password_hash - impossible de vérifier
          console.log('❌ Utilisateur sans moyen de vérification du mot de passe');
          setError('Configuration du compte incorrecte. Contactez l\'administrateur.');
          setIsLoading(false);
          return;
        }
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:649',message:'User validation check',data:{hasUser:!!user,hasError:!!userError,errorMessage:userError?.message,errorCode:userError?.code,userStatus:user?.status,userActif:user?.actif,userClinicId:user?.clinic_id,expectedClinicId:clinic.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
      // #endregion

      if (userError || !user) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:650',message:'User not found error',data:{hasError:!!userError,errorMessage:userError?.message,errorCode:userError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
        // #endregion
        if (authOkButProfileMissing) {
          setError('Compte Auth OK, mais profil non lié. Contactez l’administrateur pour relier votre UID Supabase Auth au profil (public.users.auth_user_id).');
        } else {
          setError('Email ou mot de passe incorrect, ou utilisateur non associé à cette clinique');
        }
        setIsLoading(false);
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:715',message:'Before checking user active status',data:{userActif:user.actif},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // 4. Vérifier que l'utilisateur est actif
      if (!user.actif) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:718',message:'User inactive',data:{actif:user.actif},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setError('Ce compte est désactivé. Contactez votre administrateur.');
        setIsLoading(false);
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:725',message:'Before checking user status',data:{userStatus:user.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // 5. Vérifier le status
      if (user.status === 'SUSPENDED' || user.status === 'REJECTED') {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:729',message:'User suspended/rejected',data:{status:user.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setError('Ce compte est suspendu ou refusé. Contactez votre administrateur.');
        setIsLoading(false);
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:735',message:'Before mapping permissions',data:{userRole:user.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // 6. Mapper les permissions selon le rôle
      const getPermissionsByRole = (role: string): User['permissions'] => {
        const roleUpper = role.toUpperCase();
        
        if (roleUpper === 'SUPER_ADMIN') {
          return [
            'consultations',
            'patients',
            'pharmacie',
            'maternite',
            'laboratoire',
            'imagerie',
            'vaccination',
            'caisse',
            'rendezvous',
            'stock',
            'parametres',
            'utilisateurs',
          ] as User['permissions'];
        }
        
        if (roleUpper === 'CLINIC_ADMIN') {
          return [
            'consultations',
            'patients',
            'pharmacie',
            'maternite',
            'laboratoire',
            'imagerie',
            'vaccination',
            'caisse',
            'rendezvous',
            'stock',
            'parametres',
            'utilisateurs',
          ] as User['permissions'];
        }
        
        // Mapper les autres rôles
        const roleMap: Record<string, User['permissions']> = {
          'MEDECIN': ['consultations', 'patients', 'rendezvous'],
          'PHARMACIEN': ['pharmacie', 'stock', 'patients'],
          'INFIRMIER': ['consultations', 'patients'],
          'CAISSIER': ['caisse', 'patients'],
          'LABORANTIN': ['laboratoire', 'patients'],
        };
        
        return roleMap[roleUpper] || ['patients'];
      };

      // 7. Mapper le rôle vers UserRole
      const mapRoleToUserRole = (role: string): User['role'] => {
        const roleUpper = role.toUpperCase();
        if (roleUpper === 'SUPER_ADMIN' || roleUpper === 'CLINIC_ADMIN' || roleUpper === 'ADMIN') {
          return 'admin';
        }
        if (roleUpper === 'MEDECIN') return 'medecin';
        if (roleUpper === 'INFIRMIER') return 'infirmier';
        if (roleUpper === 'PHARMACIEN') return 'pharmacien';
        if (roleUpper === 'CAISSIER') return 'caissier';
        if (roleUpper === 'LABORANTIN') return 'laborantin';
        if (roleUpper === 'SECRETAIRE') return 'secretaire';
        if (roleUpper === 'COMPTABLE') return 'comptable';
        return 'admin'; // Par défaut
      };

      // 8. Construire l'objet User pour l'application
      const appUser: User = {
        id: user.id,
        username: user.email,
        email: user.email,
        role: mapRoleToUserRole(user.role),
        nom: user.nom || '',
        prenom: user.prenom || '',
        clinicCode: clinic.code,
        clinicId: user.clinic_id || clinic.id,
        permissions: getPermissionsByRole(user.role),
        status: user.status === 'ACTIVE' ? 'actif' : 
                user.status === 'PENDING' ? 'actif' : 
                'inactif',
      };

      // 9. Générer un token - UTILISER UNIQUEMENT LE JWT SUPABASE VALIDE
      // IMPORTANT: Ne jamais générer de token factice - cela cause des erreurs JWT malformé
      // 
      // Règles:
      // - Si l'utilisateur a un auth_user_id, on DOIT avoir une session Supabase Auth valide
      // - Si l'utilisateur n'a pas d'auth_user_id (compte démo), on peut utiliser password_hash
      //   mais on ne peut PAS utiliser les endpoints Supabase Auth qui nécessitent un JWT
      
      let token: string | null = null;

      if (user.auth_user_id) {
        // Compte lié à Supabase Auth - on DOIT avoir un JWT valide
        if (!authSession?.access_token) {
          console.error('❌ Utilisateur lié à Supabase Auth mais session invalide');
          if (isSupabaseMaintenanceLikeError(authErrInfo)) {
            setError(supabaseMaintenanceMessage);
          } else {
            // Erreur 400 = identifiants invalides
            if (authErrInfo?.status === 400 || authErrInfo?.message?.includes('Invalid login credentials')) {
              setError('Identifiants de connexion invalides. Veuillez vérifier votre email et mot de passe.');
            } else {
              setError('Erreur d\'authentification Supabase. Veuillez réessayer ou contacter l\'administrateur.');
            }
          }
          setIsLoading(false);
          return;
        }
        token = authSession.access_token;
        console.log('✅ JWT Supabase valide obtenu pour utilisateur avec auth_user_id');
      } else {
        // Compte démo sans auth_user_id - utilise password_hash
        // Pour ces comptes, on ne peut pas utiliser les endpoints Supabase Auth
        // On génère un token interne mais il ne doit JAMAIS être utilisé avec supabase.auth.getUser()
        console.warn('⚠️ Compte démo détecté (sans auth_user_id) - token interne généré');
        // Note: Ce token ne fonctionnera PAS avec supabase.auth.getUser() ou les endpoints Supabase Auth
        // Il est utilisé uniquement pour l'authentification interne de l'application
        token = `internal-${user.id}-${Date.now()}`;
      }

      if (!token) {
        console.error('❌ Aucun token disponible');
        setError('Erreur lors de la génération du token. Veuillez réessayer.');
        setIsLoading(false);
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:818',message:'Building app user and token',data:{userId:user.id,userStatus:user.status,hasAuthSession:!!authSession,hasAuthUserId:!!user.auth_user_id,hasToken:!!token,tokenLength:token?.length,isJWT:token?.includes('.'),isInternalToken:token?.startsWith('internal-')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // 10. Mettre à jour last_login
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          first_login_at: !user.first_login_at ? new Date().toISOString() : undefined,
        })
        .eq('id', user.id);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:828',message:'After last_login update',data:{userStatus:user.status,willCheckPending:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // 11. Vérifier si l'utilisateur doit changer son mot de passe (première connexion)
      // NOTE: Le code clinique est TOUJOURS fixe et créé par le backend
      // L'admin ne peut JAMAIS modifier le code clinique, seulement son mot de passe
      if (user.status === 'PENDING') {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:832',message:'PENDING status detected, showing password dialog',data:{userStatus:user.status,clinicCode:clinic.code,userEmail:user.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.log('🔐 Première connexion détectée, affichage du dialogue de changement de mot de passe');
        setPasswordDialogInfo({
          clinicName: clinic.name,
          clinicCode: clinic.code,
          clinicId: clinic.id,
          userEmail: user.email,
          pendingUser: appUser,
          pendingToken: token,
          authUserId: authUser?.id || user.auth_user_id || undefined,
          currentPassword: credentials.password,
        });
        setShowPasswordDialog(true);
        setIsLoading(false);
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fd5cac79-85ca-4f03-aa34-b9d071e2f65f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:844',message:'User not PENDING, calling onLogin',data:{userStatus:user.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // 12. Connecter l'utilisateur
      onLogin(appUser, token);
      
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      if (isSupabaseMaintenanceLikeError(error)) {
        setError(supabaseMaintenanceMessage);
      } else {
        setError(error.message || 'Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation d'envoi de message
    await new Promise(resolve => setTimeout(resolve, 500));
    setContactSent(true);
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setContactSent(false), 5000);
  };

  // Fonction pour valider le code clinique en temps réel
  const validateClinicCode = async (code: string) => {
    if (!code || code.trim().length < 3) {
      setClinicValidation({ isValid: false, clinicName: null, isChecking: false });
      return;
    }

    const clinicCodeUpper = code.toUpperCase().trim();
    
    // Validation côté client : format de base
    const codePattern = /^[A-Z0-9\-_]{3,20}$/;
    if (!codePattern.test(clinicCodeUpper)) {
      setClinicValidation({ 
        isValid: false, 
        clinicName: null, 
        isChecking: false 
      });
      return;
    }

    setClinicValidation(prev => ({ ...prev, isChecking: true }));

    try {
      // Vérifier d'abord dans la table clinics
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id, name, active')
        .eq('code', clinicCodeUpper)
        .eq('active', true)
        .maybeSingle();

      if (clinic) {
        setClinicValidation({ isValid: true, clinicName: clinic.name, isChecking: false });
        return;
      }

      // Si non trouvé, chercher dans les codes temporaires
      const { data: tempCode } = await supabase
        .from('clinic_temporary_codes')
        .select('clinic_id')
        .eq('temporary_code', clinicCodeUpper)
        .eq('is_converted', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (tempCode) {
        // Récupérer le nom de la clinique
        const { data: linkedClinic } = await supabase
          .from('clinics')
          .select('name')
          .eq('id', tempCode.clinic_id)
          .single();
        
        setClinicValidation({ 
          isValid: true, 
          clinicName: linkedClinic?.name || 'Clinique (code temporaire)', 
          isChecking: false 
        });
        return;
      }

      setClinicValidation({ isValid: false, clinicName: null, isChecking: false });
    } catch (err: any) {
      console.error('Erreur lors de la validation du code clinique:', err);
      
      // Fallback : si Supabase n'est pas accessible, on accepte le format valide
      // La validation finale se fera côté serveur
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError') || !navigator.onLine) {
        // Format valide mais validation serveur différée
        setClinicValidation({ 
          isValid: true, 
          clinicName: 'Validation différée (hors ligne)', 
          isChecking: false 
        });
      } else {
      setClinicValidation({ isValid: false, clinicName: null, isChecking: false });
      }
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setError('');

    // Validation du code clinique
    if (!signupForm.clinicCode || signupForm.clinicCode.trim() === '') {
      setError('Le code clinique est requis pour l\'inscription');
      setSignupLoading(false);
      return;
    }

    if (!clinicValidation.isValid) {
      setError('Le code clinique est invalide. Vérifiez le code auprès de votre administrateur.');
      setSignupLoading(false);
      return;
    }

    // Validation du rôle souhaité
    if (!signupForm.roleSouhaite || signupForm.roleSouhaite.trim() === '') {
      setError('Le rôle souhaité est requis pour l\'inscription');
      setSignupLoading(false);
      return;
    }

    // Validation du format email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(signupForm.email)) {
      setError('Veuillez entrer une adresse email valide');
      setSignupLoading(false);
      return;
    }

    // Validation du mot de passe
    if (signupForm.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setSignupLoading(false);
      return;
    }

    if (signupForm.password !== signupForm.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas. Veuillez vérifier votre saisie.');
      setSignupLoading(false);
      return;
    }

    // Validation du format téléphone (optionnel mais si fourni, doit être valide)
    if (signupForm.telephone && signupForm.telephone.trim() !== '') {
      const phonePattern = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      if (!phonePattern.test(signupForm.telephone.replace(/\s/g, ''))) {
        setError('Veuillez entrer un numéro de téléphone valide (ex: +229 XX XX XX XX)');
        setSignupLoading(false);
        return;
      }
    }

    if (!signupForm.securityQuestions.question1.questionId || !signupForm.securityQuestions.question1.answer) {
      setError('Veuillez sélectionner la première question de sécurité et fournir une réponse');
      setSignupLoading(false);
      return;
    }

    if (!signupForm.securityQuestions.question2.questionId || !signupForm.securityQuestions.question2.answer) {
      setError('Veuillez sélectionner la deuxième question de sécurité et fournir une réponse');
      setSignupLoading(false);
      return;
    }

    try {
      // URL de production par défaut (Supabase Edge Functions)
      const PRODUCTION_API_URL = 'https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api';
      const API_BASE_URL = import.meta.env.VITE_API_URL || PRODUCTION_API_URL;
      
      const requestUrl = `${API_BASE_URL}/auth/register-request`;
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicCode: signupForm.clinicCode.toUpperCase().trim(),
          nom: signupForm.nom,
          prenom: signupForm.prenom,
          email: signupForm.email,
          password: signupForm.password,
          passwordConfirm: signupForm.passwordConfirm,
          telephone: signupForm.telephone,
          adresse: signupForm.adresse,
          roleSouhaite: signupForm.roleSouhaite,
          specialite: signupForm.specialite || undefined,
          securityQuestions: {
            question1: {
              question: signupForm.securityQuestions.question1.question,
              answer: signupForm.securityQuestions.question1.answer,
            },
            question2: {
              question: signupForm.securityQuestions.question2.question,
              answer: signupForm.securityQuestions.question2.answer,
            },
            ...(signupForm.securityQuestions.question3.questionId && signupForm.securityQuestions.question3.answer ? {
              question3: {
                question: signupForm.securityQuestions.question3.question,
                answer: signupForm.securityQuestions.question3.answer,
              },
            } : {}),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la soumission de la demande');
      }

      setSignupSuccess(true);
      setSignupForm({
        clinicCode: '',
        nom: '',
        prenom: '',
        email: '',
        password: '',
        passwordConfirm: '',
        telephone: '',
        adresse: '',
        roleSouhaite: 'receptionniste',
        specialite: '',
        securityQuestions: {
          question1: { questionId: '', question: '', answer: '' },
          question2: { questionId: '', question: '', answer: '' },
          question3: { questionId: '', question: '', answer: '' },
        },
      });
      setClinicValidation({ isValid: false, clinicName: null, isChecking: false });
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      
      // Gérer spécifiquement les erreurs réseau
      if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError' || !navigator.onLine) {
        setError('❌ Impossible de se connecter au serveur. Vérifiez votre connexion Internet et réessayez.');
      } else if (error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
        setError('⏱️ La requête a expiré. Le serveur met trop de temps à répondre. Veuillez réessayer.');
      } else if (error?.message?.includes('400') || error?.message?.includes('Bad Request')) {
        setError('⚠️ Les données saisies sont invalides. Veuillez vérifier tous les champs et réessayer.');
      } else if (error?.message?.includes('409') || error?.message?.includes('Conflict')) {
        setError('⚠️ Cette adresse email est déjà utilisée pour cette clinique. Utilisez une autre adresse ou connectez-vous.');
      } else if (error?.message?.includes('500') || error?.message?.includes('Internal Server Error')) {
        setError('🔧 Une erreur serveur s\'est produite. Veuillez réessayer dans quelques instants ou contacter le support.');
      } else if (error?.message) {
        setError(`⚠️ ${error.message}`);
      } else {
        setError('❌ Erreur lors de la soumission de la demande d\'inscription. Veuillez réessayer ou contacter le support si le problème persiste.');
      }
    } finally {
      setSignupLoading(false);
    }
  };

  const features: Feature[] = [
    {
      icon: <Assignment fontSize="large" />,
      title: 'Gestion des Consultations',
      description: 'Workflow complet pour les consultations médicales avec suivi des patients et prescriptions.',
      color: '#2563eb',
    },
    {
      icon: <People fontSize="large" />,
      title: 'Gestion des Patients',
      description: 'Dossier patient complet avec historique médical et suivi des consultations.',
      color: '#16a34a',
    },
    {
      icon: <LocalPharmacy fontSize="large" />,
      title: 'Pharmacie',
      description: 'Gestion des prescriptions, dispensation et suivi des médicaments.',
      color: '#f97316',
    },
    {
      icon: <Science fontSize="large" />,
      title: 'Laboratoire',
      description: 'Demandes d\'examens, résultats et intégration avec les consultations.',
      color: '#8b5cf6',
    },
    {
      icon: <Image fontSize="large" />,
      title: 'Imagerie Médicale',
      description: 'Gestion des examens d\'imagerie avec annotations et rapports.',
      color: '#ec4899',
    },
    {
      icon: <PregnantWoman fontSize="large" />,
      title: 'Maternité',
      description: 'Suivi complet de la grossesse, CPN, accouchement et post-partum.',
      color: '#06b6d4',
    },
    {
      icon: <Vaccines fontSize="large" />,
      title: 'Vaccination',
      description: 'Gestion du calendrier vaccinal et suivi des vaccinations.',
      color: '#10b981',
    },
    {
      icon: <Receipt fontSize="large" />,
      title: 'Caisse',
      description: 'Gestion complète de la facturation, paiements, encaissements et journal de caisse.',
      color: '#f59e0b',
    },
    {
      icon: <Inventory fontSize="large" />,
      title: 'Gestion des Stocks',
      description: 'Suivi des médicaments, alertes de stock et inventaires.',
      color: '#ef4444',
    },
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      overflowX: 'hidden',
      width: '100%',
      position: 'relative',
    }}>
      {/* Bouton de thème discret en position fixe */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1000,
        }}
      >
        <ThemeToggleButton discreet />
      </Box>

      {/* Indicateur de chargement progressif */}
      {isPageLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            zIndex: 9999,
            bgcolor: 'background.paper',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${loadingProgress}%`,
              bgcolor: theme.palette.primary.main,
              transition: 'width 0.3s ease',
            },
          }}
          aria-label="Chargement de la page"
          role="progressbar"
          aria-valuenow={loadingProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      )}
      {/* Section Hero */}
      <Box
        ref={heroRef}
        sx={{
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(10, 14, 26, 0.95)' : 'rgba(248, 250, 252, 0.98)',
        }}
      >
        {/* Éléments de fond animés */}
        <Box
          className="hero-background"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              className="particle"
              sx={{
                position: 'absolute',
                width: { xs: 60, md: 100 },
                height: { xs: 60, md: 100 },
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.05)} 0%, transparent 70%)`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                filter: 'blur(25px)',
                opacity: 0.6,
              }}
            />
          ))}
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '100%', px: { xs: 2, sm: 3, md: 4 } }}>
          <Box className="hero-container" sx={{ textAlign: 'center', mb: 6 }}>
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 4,
                  opacity: 1,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: theme.palette.mode === 'dark'
                      ? `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`
                      : `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                    zIndex: 0,
                    animation: 'pulse 3s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': {
                        opacity: 0.6,
                        transform: 'translate(-50%, -50%) scale(1)',
                      },
                      '50%': {
                        opacity: 1,
                        transform: 'translate(-50%, -50%) scale(1.1)',
                      },
                    },
                  },
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Logo variant="default" size="large" animated={true} />
                </Box>
              </Box>
              <Typography
                className="hero-subtitle"
                variant="h5"
                sx={{ 
                  mb: 4, 
                  maxWidth: '800px', 
                  mx: 'auto', 
                  fontSize: { xs: '1.1rem', md: '1.5rem' },
                  opacity: 1,
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)',
                  fontWeight: 600,
                }}
              >
                Système de gestion de clinique médicale complet et moderne
              </Typography>
              <Typography
                className="hero-description"
                variant="body1"
                sx={{ 
                  maxWidth: '600px', 
                  mx: 'auto', 
                  fontSize: { xs: '0.9rem', md: '1.1rem' }, 
                  mb: 4,
                  opacity: 1,
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.8)',
                  fontWeight: 400,
                }}
              >
                Simplifiez la gestion de votre clinique avec une solution tout-en-un pour les consultations,
                la pharmacie, le laboratoire, l'imagerie et bien plus encore.
              </Typography>
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.7)',
                    fontStyle: 'italic',
                  }}
                >
                  Inscrivez-vous pour créer votre compte et obtenir votre espace de travail après validation
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1.5, sm: 2 }, 
                justifyContent: 'center', 
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' },
                width: { xs: '100%', sm: 'auto' },
                px: { xs: 2, sm: 0 },
              }}>
                <Button
                  className="hero-button"
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setLoginTab('login');
                    loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  aria-label="Se connecter maintenant - Aller à la section de connexion"
                  sx={{
                    py: { xs: 1.25, sm: 1.5 },
                    px: { xs: 3, sm: 4 },
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    fontWeight: 600,
                    width: { xs: '100%', sm: 'auto' },
                    minHeight: { xs: '48px', sm: 'auto' }, // Taille tactile minimale pour mobile
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform, box-shadow',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                      transform: { xs: 'none', sm: 'translateY(-2px)' }, // Pas de transform sur mobile
                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`,
                    },
                    '&:active': {
                      transform: 'scale(0.98)', // Feedback tactile sur mobile
                      transition: 'transform 0.1s ease',
                    },
                    // Amélioration pour le touch sur mobile
                    '@media (hover: none) and (pointer: coarse)': {
                      '&:hover': {
                        transform: 'none',
                      },
                    },
                  }}
                >
                  Se connecter maintenant
                </Button>
                <Button
                  className="hero-button-signup"
                  variant="contained"
                  size="large"
                  startIcon={<PersonAdd aria-hidden="true" />}
                  onClick={() => {
                    setLoginTab('signup');
                    setTimeout(() => {
                      loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                  aria-label="S'inscrire - Aller à la section d'inscription"
                  sx={{
                    py: { xs: 1.25, sm: 1.5 },
                    px: { xs: 3, sm: 4 },
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    fontWeight: 600,
                    width: { xs: '100%', sm: 'auto' },
                    minHeight: { xs: '48px', sm: 'auto' }, // Taille tactile minimale pour mobile
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.success.main || theme.palette.secondary.main} 100%)`,
                    color: 'white',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.4)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform, box-shadow',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.success.dark || theme.palette.secondary.dark} 100%)`,
                      transform: { xs: 'none', sm: 'translateY(-2px)' }, // Pas de transform sur mobile
                      boxShadow: `0 12px 32px ${alpha(theme.palette.secondary.main, 0.5)}`,
                    },
                    '&:active': {
                      transform: 'scale(0.98)', // Feedback tactile sur mobile
                      transition: 'transform 0.1s ease',
                    },
                    // Amélioration pour le touch sur mobile
                    '@media (hover: none) and (pointer: coarse)': {
                      '&:hover': {
                        transform: 'none',
                      },
                    },
                  }}
                >
                  Inscrivez-vous
                </Button>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Section Fonctionnalités */}
      <Box ref={featuresRef} sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.paper', position: 'relative' }}>
        <Container maxWidth="lg">
          <Typography
            className="features-title"
            variant="h3"
            component="h2"
            sx={{
              textAlign: 'center',
              mb: 6,
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' },
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: 1,
              color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary,
            }}
          >
            Fonctionnalités Principales
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card
                  className="feature-card"
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `2px solid ${alpha(feature.color, 0.2)}`,
                    bgcolor: alpha(feature.color, 0.05),
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, ${alpha(feature.color, 0.1)}, transparent)`,
                      transition: 'left 0.5s ease',
                    },
                    '&:hover': {
                      transform: { xs: 'translateY(-4px) scale(1.01)', sm: 'translateY(-8px) scale(1.02)', md: 'translateY(-12px) scale(1.02)' },
                      boxShadow: `0 20px 40px ${alpha(feature.color, 0.3)}`,
                      borderColor: feature.color,
                      '&::before': {
                        left: '100%',
                      },
                    },
                    // Amélioration pour le touch sur mobile
                    '@media (hover: none) and (pointer: coarse)': {
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.01)',
                      },
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Box
                      className="feature-icon"
                      sx={{
                        display: 'inline-flex',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(feature.color, 0.1),
                        color: feature.color,
                        mb: 2,
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          width: 0,
                          height: 0,
                          borderRadius: '50%',
                          bgcolor: alpha(feature.color, 0.2),
                          transform: 'translate(-50%, -50%)',
                          transition: 'all 0.3s ease',
                        },
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        transition: 'color 0.3s ease',
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : theme.palette.text.primary,
                        opacity: 1,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        lineHeight: 1.6,
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.75)',
                        opacity: 1,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Section Connexion/Inscription */}
      <Box
        ref={loginRef}
        sx={{
          py: { xs: 6, md: 10 },
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                mb: 2, 
                fontSize: { xs: '2rem', md: '3rem' },
                color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary,
                opacity: 1,
              }}
            >
              {loginTab === 'login' ? 'Connexion' : 'Inscription'}
            </Typography>
            <Typography 
              variant="body1"
              sx={{
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.8)',
                opacity: 1,
              }}
            >
              {loginTab === 'login' 
                ? 'Accédez à votre espace de travail'
                : 'Créez votre compte et attendez la validation'}
            </Typography>
          </Box>
          <Paper
            elevation={8}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              // Fond adaptatif selon le thème
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%)',
              backdropFilter: 'blur(10px)',
              border: theme.palette.mode === 'dark' 
                ? `1px solid ${alpha(theme.palette.divider, 0.5)}`
                : 'none',
            }}
          >
            <Tabs
              value={loginTab}
              onChange={(e, newValue) => {
                setLoginTab(newValue);
                setError('');
                setSignupSuccess(false);
              }}
              sx={{
                mb: { xs: 2, sm: 3 },
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: { xs: 44, sm: 48 }, // Taille tactile optimale
                  px: { xs: 1.5, sm: 3 },
                  minWidth: { xs: 'auto', sm: 160 },
                },
                '& .Mui-selected': {
                  color: theme.palette.primary.main,
                },
              }}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab 
                label="Connexion" 
                value="login"
                icon={<Lock sx={{ mb: 0.5 }} />}
                iconPosition="start"
              />
              <Tab 
                label="Inscription" 
                value="signup"
                icon={<PersonAdd sx={{ mb: 0.5 }} />}
                iconPosition="start"
              />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {signupSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Votre demande d'inscription a été soumise avec succès. Vous recevrez un email une fois votre compte validé par l'administrateur.
              </Alert>
            )}

            {loginTab === 'login' ? (
            <Box component="form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid w-full items-center gap-2 mb-5">
                <Label 
                  htmlFor="clinicCode"
                  className="text-sm font-semibold"
                  style={{ 
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)'
                  }}
                >
                  Code clinique
                </Label>
                <Input
                  required
                  id="clinicCode"
                  name="clinicCode"
                  autoComplete="off"
                  autoFocus
                  value={credentials.clinicCode}
                  onChange={(e) => setCredentials({ ...credentials, clinicCode: e.target.value.toUpperCase() })}
                  disabled={isLoading}
                  placeholder=""
                />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(15, 23, 42, 0.65)',
                  fontSize: '0.75rem',
                  mt: 0.5
                }}
              >
                Code unique de votre clinique
              </Typography>
              </div>

              <div className="grid w-full items-center gap-2 mb-5">
                <Label 
                  htmlFor="username"
                  className="text-sm font-semibold"
                  style={{ 
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)'
                  }}
                >
                  Nom d'utilisateur
                </Label>
                <Input
                  required
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  disabled={isLoading}
                  placeholder="Entrez votre nom d'utilisateur"
                />
              </div>

              <div className="grid w-full items-center gap-2 mb-6">
                <Label 
                  htmlFor="password"
                  className="text-sm font-semibold"
                  style={{ 
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)'
                  }}
                >
                  Mot de passe
                </Label>
                <Input
                  required
                  name="password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  disabled={isLoading}
                  placeholder="Entrez votre mot de passe"
                />
              </div>

              <ShadcnButton
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
              </ShadcnButton>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={(e) => {
                    // Empêche le warning Chrome "Blocked aria-hidden..." :
                    // on retire le focus du bouton avant l'ouverture du Dialog (MUI appliquera aria-hidden au background)
                    (e.currentTarget as HTMLButtonElement).blur();
                    setShowForgotPasswordDialog(true);
                  }}
                  sx={{ 
                    textTransform: 'none',
                    color: theme.palette.mode === 'dark' 
                      ? theme.palette.primary.light 
                      : theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  Mot de passe oublié ?
                </Button>
              </Box>
            </Box>
            ) : (
            <Box component="form" onSubmit={handleSignupSubmit}>
              <Grid container spacing={2}>
                {/* Code Clinique - Champ obligatoire en premier */}
                <Grid item xs={12} sx={{ mb: 1 }}>
                  <TextField
                    required
                    fullWidth
                    id="clinicCode"
                    label="Code Clinique *"
                    name="clinicCode"
                    value={signupForm.clinicCode}
                    onChange={(e) => {
                      const newCode = e.target.value.toUpperCase();
                      setSignupForm({ ...signupForm, clinicCode: newCode });
                      // Valider le code après un délai
                      if (newCode.length >= 3) {
                        validateClinicCode(newCode);
                      } else {
                        setClinicValidation({ isValid: false, clinicName: null, isChecking: false });
                      }
                    }}
                    disabled={signupLoading}
                    placeholder=""
                    helperText={
                      clinicValidation.isChecking ? 'Vérification du code...' :
                      clinicValidation.isValid ? `✅ Clinique: ${clinicValidation.clinicName}` :
                      signupForm.clinicCode.length >= 3 ? '❌ Code clinique invalide' :
                      'Demandez le code à l\'administrateur de votre clinique'
                    }
                    error={signupForm.clinicCode.length >= 3 && !clinicValidation.isValid && !clinicValidation.isChecking}
                    aria-label="Code clinique - Champ obligatoire"
                    aria-required="true"
                    aria-invalid={signupForm.clinicCode.length >= 3 && !clinicValidation.isValid && !clinicValidation.isChecking}
                    aria-describedby={signupForm.clinicCode.length >= 3 ? "clinicCode-helper-text" : undefined}
                    inputProps={{
                      autoComplete: 'off',
                      'aria-label': 'Code clinique',
                      'aria-describedby': 'clinicCode-helper-text',
                    }}
                    sx={{
                      mt: 0,
                      mb: 1,
                      '& .MuiFormHelperText-root': {
                        color: clinicValidation.isValid ? theme.palette.success.main : undefined,
                        id: 'clinicCode-helper-text',
                      },
                    }}
                    InputProps={{
                      endAdornment: clinicValidation.isChecking ? (
                        <CircularProgress size={20} aria-label="Vérification en cours" />
                      ) : clinicValidation.isValid ? (
                        <CheckCircle sx={{ color: theme.palette.success.main }} aria-label="Code valide" />
                      ) : signupForm.clinicCode.length >= 3 ? (
                        <Warning sx={{ color: theme.palette.error.main }} aria-label="Code invalide" />
                      ) : null,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="nom"
                    label="Nom"
                    name="nom"
                    autoComplete="family-name"
                    value={signupForm.nom}
                    onChange={(e) => setSignupForm({ ...signupForm, nom: e.target.value })}
                    disabled={signupLoading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="prenom"
                    label="Prénom"
                    name="prenom"
                    autoComplete="given-name"
                    value={signupForm.prenom}
                    onChange={(e) => setSignupForm({ ...signupForm, prenom: e.target.value })}
                    disabled={signupLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="off"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    disabled={signupLoading}
                    inputProps={{
                      autoComplete: 'off',
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Mot de passe"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    disabled={signupLoading}
                    helperText="Minimum 6 caractères"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="passwordConfirm"
                    label="Confirmer le mot de passe"
                    type="password"
                    id="passwordConfirm"
                    autoComplete="new-password"
                    value={signupForm.passwordConfirm}
                    onChange={(e) => setSignupForm({ ...signupForm, passwordConfirm: e.target.value })}
                    disabled={signupLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="telephone"
                    label="Téléphone"
                    name="telephone"
                    autoComplete="tel"
                    value={signupForm.telephone}
                    onChange={(e) => setSignupForm({ ...signupForm, telephone: e.target.value })}
                    disabled={signupLoading}
                    placeholder="+225 XX XX XX XX"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="adresse"
                    label="Adresse"
                    name="adresse"
                    autoComplete="street-address"
                    value={signupForm.adresse}
                    onChange={(e) => setSignupForm({ ...signupForm, adresse: e.target.value })}
                    disabled={signupLoading}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    select
                    id="roleSouhaite"
                    label="Rôle souhaité *"
                    name="roleSouhaite"
                    value={signupForm.roleSouhaite}
                    onChange={(e) => setSignupForm({ ...signupForm, roleSouhaite: e.target.value })}
                    disabled={signupLoading}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="">Sélectionnez un rôle</option>
                    {REGISTRATION_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    fullWidth
                    id="specialite"
                    label="Spécialité (si médecin)"
                    name="specialite"
                    value={signupForm.specialite}
                    onChange={(e) => setSignupForm({ ...signupForm, specialite: e.target.value })}
                    disabled={signupLoading || signupForm.roleSouhaite !== 'medecin'}
                    helperText={signupForm.roleSouhaite !== 'medecin' ? 'Uniquement pour les médecins' : ''}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Questions de sécurité (pour récupération de compte)
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Ces questions vous permettront de récupérer votre compte en cas d'oubli de mot de passe.
                </Typography>
                
                <FormControl fullWidth margin="normal" required sx={{ mb: 1 }}>
                  <InputLabel>Question 1</InputLabel>
                  <Select
                    value={signupForm.securityQuestions.question1.questionId || ''}
                    label="Question 1"
                    onChange={(e) => {
                      const value = e.target.value as string;
                      const selectedQuestion = SECURITY_QUESTIONS.find(q => q.id === value);
                      setSignupForm({
                        ...signupForm,
                        securityQuestions: {
                          ...signupForm.securityQuestions,
                          question1: { 
                            questionId: value,
                            question: selectedQuestion?.question || '',
                            answer: signupForm.securityQuestions.question1.answer
                          }
                        }
                      });
                    }}
                    disabled={signupLoading}
                  >
                    {SECURITY_QUESTIONS.map((q) => (
                      <MenuItem 
                        key={q.id} 
                        value={q.id}
                        disabled={
                          q.id === signupForm.securityQuestions.question2.questionId ||
                          q.id === signupForm.securityQuestions.question3.questionId
                        }
                      >
                        {q.question}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="answer1"
                  label="Réponse à la question 1"
                  name="answer1"
                  value={signupForm.securityQuestions.question1.answer}
                  onChange={(e) => setSignupForm({
                    ...signupForm,
                    securityQuestions: {
                      ...signupForm.securityQuestions,
                      question1: { ...signupForm.securityQuestions.question1, answer: e.target.value }
                    }
                  })}
                  disabled={signupLoading || !signupForm.securityQuestions.question1.questionId}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth margin="normal" required sx={{ mb: 1 }}>
                  <InputLabel>Question 2</InputLabel>
                  <Select
                    value={signupForm.securityQuestions.question2.questionId || ''}
                    label="Question 2"
                    onChange={(e) => {
                      const value = e.target.value as string;
                      const selectedQuestion = SECURITY_QUESTIONS.find(q => q.id === value);
                      setSignupForm({
                        ...signupForm,
                        securityQuestions: {
                          ...signupForm.securityQuestions,
                          question2: { 
                            questionId: value,
                            question: selectedQuestion?.question || '',
                            answer: signupForm.securityQuestions.question2.answer
                          }
                        }
                      });
                    }}
                    disabled={signupLoading}
                  >
                    {SECURITY_QUESTIONS.map((q) => (
                      <MenuItem 
                        key={q.id} 
                        value={q.id}
                        disabled={
                          q.id === signupForm.securityQuestions.question1.questionId ||
                          q.id === signupForm.securityQuestions.question3.questionId
                        }
                      >
                        {q.question}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="answer2"
                  label="Réponse à la question 2"
                  name="answer2"
                  value={signupForm.securityQuestions.question2.answer}
                  onChange={(e) => setSignupForm({
                    ...signupForm,
                    securityQuestions: {
                      ...signupForm.securityQuestions,
                      question2: { ...signupForm.securityQuestions.question2, answer: e.target.value }
                    }
                  })}
                  disabled={signupLoading || !signupForm.securityQuestions.question2.questionId}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth margin="normal" sx={{ mb: 1 }}>
                  <InputLabel>Question 3 (optionnelle)</InputLabel>
                  <Select
                    value={signupForm.securityQuestions.question3.questionId || ''}
                    label="Question 3 (optionnelle)"
                    onChange={(e) => {
                      const value = e.target.value as string;
                      if (value === '') {
                        // Si aucune question sélectionnée, vider tout
                        setSignupForm({
                          ...signupForm,
                          securityQuestions: {
                            ...signupForm.securityQuestions,
                            question3: { 
                              questionId: '',
                              question: '',
                              answer: ''
                            }
                          }
                        });
                      } else {
                        const selectedQuestion = SECURITY_QUESTIONS.find(q => q.id === value);
                        setSignupForm({
                          ...signupForm,
                          securityQuestions: {
                            ...signupForm.securityQuestions,
                            question3: { 
                              questionId: value,
                              question: selectedQuestion?.question || '',
                              answer: signupForm.securityQuestions.question3.answer
                            }
                          }
                        });
                      }
                    }}
                    disabled={signupLoading}
                  >
                    <MenuItem value="">Aucune (optionnel)</MenuItem>
                    {SECURITY_QUESTIONS.map((q) => (
                      <MenuItem 
                        key={q.id} 
                        value={q.id}
                        disabled={
                          q.id === signupForm.securityQuestions.question1.questionId ||
                          q.id === signupForm.securityQuestions.question2.questionId
                        }
                      >
                        {q.question}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  margin="normal"
                  fullWidth
                  id="answer3"
                  label="Réponse à la question 3 (si question remplie)"
                  name="answer3"
                  value={signupForm.securityQuestions.question3.answer}
                  onChange={(e) => setSignupForm({
                    ...signupForm,
                    securityQuestions: {
                      ...signupForm.securityQuestions,
                      question3: { ...signupForm.securityQuestions.question3, answer: e.target.value }
                    }
                  })}
                  disabled={signupLoading || !signupForm.securityQuestions.question3.questionId}
                  sx={{ mb: 2 }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={signupLoading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                  },
                }}
              >
                {signupLoading ? <CircularProgress size={24} color="inherit" /> : 'Soumettre la demande d\'inscription'}
              </Button>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Votre demande sera examinée par l'administrateur de votre clinique. 
                  Vous recevrez un email une fois votre compte validé.
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled' }}>
                  💡 Le code clinique vous est fourni par l'administrateur de votre établissement.
                </Typography>
              </Box>
            </Box>
            )}
          </Paper>
        </Container>
      </Box>

      {/* Section Contact/Feedback */}
      <Box ref={contactRef} sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 3, 
                  fontSize: { xs: '2rem', md: '3rem' },
                  color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary,
                  opacity: 1,
                }}
              >
                Contactez-nous
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  mb: 4,
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.8)',
                  opacity: 1,
                }}
              >
                Avez-vous des questions ou des suggestions ? Nous serions ravis d'avoir de vos nouvelles.
                Votre feedback nous aide à améliorer continuellement Logi Clinic.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                    }}
                  >
                    <Email />
                  </Box>
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : theme.palette.text.primary,
                        opacity: 1,
                      }}
                    >
                      Email
                    </Typography>
                    <Typography 
                      component="a"
                      href="mailto:contact@logiclinic.org"
                      variant="body2"
                      sx={{
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.75)',
                        opacity: 1,
                        textDecoration: 'none',
                        '&:hover': {
                          color: theme.palette.primary.main,
                          textDecoration: 'underline',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      contact@logiclinic.org
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.secondary.main, 0.2),
                      color: theme.palette.secondary.main,
                    }}
                  >
                    <Phone />
                  </Box>
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : theme.palette.text.primary,
                        opacity: 1,
                      }}
                    >
                      Téléphone
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.75)',
                        opacity: 1,
                      }}
                    >
                      (00229) 0152818100
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.info.main, 0.2),
                      color: theme.palette.info.main,
                    }}
                  >
                    <LocationOn />
                  </Box>
                  <Box>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : theme.palette.text.primary,
                        opacity: 1,
                      }}
                    >
                      Adresse
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.75)',
                        opacity: 1,
                      }}
                    >
                      Parakou, Bénin
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                  elevation={4}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    bgcolor: 'background.default',
                  }}
                >
                  {contactSent ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        Message envoyé !
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
                      </Typography>
                    </Box>
                  ) : (
                    <Box component="form" onSubmit={handleContactSubmit}>
                      <TextField
                        fullWidth
                        label="Nom"
                        margin="normal"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="Email"
                        margin="normal"
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="Message"
                        margin="normal"
                        multiline
                        rows={5}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        sx={{ mb: 3 }}
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<Send />}
                        sx={{
                          py: 1.5,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                          },
                        }}
                      >
                        Envoyer le message
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Dialogue de changement de mot de passe (première connexion) */}
      {passwordDialogInfo && (
        <ChangePasswordDialog
          open={showPasswordDialog}
          onClose={() => {
            setShowPasswordDialog(false);
            // Connecter quand même l'utilisateur s'il ferme le dialogue
            if (passwordDialogInfo.pendingUser && passwordDialogInfo.pendingToken) {
              onLogin(passwordDialogInfo.pendingUser, passwordDialogInfo.pendingToken);
            }
          }}
          onSuccess={() => {
            setShowPasswordDialog(false);
            // Connecter l'utilisateur après changement de mot de passe réussi
            if (passwordDialogInfo.pendingUser && passwordDialogInfo.pendingToken) {
              const updatedUser = {
                ...passwordDialogInfo.pendingUser,
                status: 'actif' as const,
              };
              onLogin(updatedUser, passwordDialogInfo.pendingToken);
            }
          }}
          clinicName={passwordDialogInfo.clinicName}
          clinicCode={passwordDialogInfo.clinicCode}
          clinicId={passwordDialogInfo.clinicId}
          userEmail={passwordDialogInfo.userEmail}
          authUserId={passwordDialogInfo.authUserId}
          currentPassword={passwordDialogInfo.currentPassword}
        />
      )}

      {/* Footer */}
      <Box
        sx={{
          py: 4,
          bgcolor: 'background.default',
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Logo avec nom de domaine */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Logo 
                variant="default" 
                size="medium" 
                animated={false}
                showDomain={true}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography 
              variant="body2"
              sx={{
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.8)',
                opacity: 1,
              }}
            >
              © 2024 Logi Clinic. Tous droits réservés.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Security sx={{ fontSize: 16, color: theme.palette.success.main }} />
                <Typography 
                  variant="caption"
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.75)',
                    opacity: 1,
                  }}
                >
                  Sécurisé
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Speed sx={{ fontSize: 16, color: theme.palette.info.main }} />
                <Typography 
                  variant="caption"
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.75)',
                    opacity: 1,
                  }}
                >
                  Performant
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Support sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                <Typography 
                  variant="caption"
                  sx={{
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.75)',
                    opacity: 1,
                  }}
                >
                  Support 24/7
                </Typography>
              </Box>
            </Box>
            </Box>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: 2,
                pt: 2,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography 
                variant="body2"
                sx={{ 
                  textAlign: 'center',
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.8)',
                  opacity: 1,
                }}
              >
                ©️ ITA INNOVATE – Conception et direction du projet {' '}
                <Box component="span" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                Développé par CHEzRIF Agency
                </Box>
                {' '}
                <Box component="span" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                  
                </Box>
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Dialog pour le mot de passe oublié */}
      <ForgotPasswordDialog
        open={showForgotPasswordDialog}
        onClose={() => setShowForgotPasswordDialog(false)}
      />
    </Box>
  );
};

export default Login;
