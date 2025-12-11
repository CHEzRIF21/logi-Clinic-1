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
} from '@mui/icons-material';
import { Button as ShadcnButton } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { User } from '../../types/auth';
import { gsap } from 'gsap';
import AccountRecoveryForm from './AccountRecoveryForm';
import { CreateRecoveryRequestDto } from '../../types/accountRecovery';
import Logo from '../ui/Logo';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

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
  const [contactTab, setContactTab] = useState<'contact' | 'recovery'>('contact');
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'signup'>('login');
  const [signupForm, setSignupForm] = useState({
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
      question1: { question: '', answer: '' },
      question2: { question: '', answer: '' },
      question3: { question: '', answer: '' },
    },
  });
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const theme = useTheme();

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
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: 'power3.out',
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
          
          // Animation continue des particules
          const particles = heroBackground.querySelectorAll('.particle');
          particles.forEach((particle, index) => {
            if (particle instanceof HTMLElement) {
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

        // Animation continue du logo (rotation subtile et pulsation)
        if (heroIcon) {
          // Rotation continue très lente
          gsap.to(heroIcon, {
            rotation: 360,
            duration: 30,
            repeat: -1,
            ease: 'none',
          });
          
          // Pulsation subtile
          gsap.to(heroIcon, {
            scale: 1.1,
            duration: 2,
            repeat: -1,
            yoyo: true,
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
      // Simulation d'un appel API - En production, cela sera un appel à votre backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Base de données simulée par code clinique
      // En production, le backend sélectionnera la bonne base selon le code clinique
      const demoClinics: Record<string, any[]> = {
        'CLINIC001': [
          {
            id: '1',
            username: 'admin',
            password: 'admin123',
            email: 'admin@clinique.com',
            role: 'admin' as const,
            nom: 'Administrateur',
            prenom: 'Système',
            clinicCode: 'CLINIC001',
            permissions: [
              'consultations',
              'patients',
              'pharmacie',
              'maternite',
              'laboratoire',
              'imagerie',
              'vaccination',
              'facturation',
              'caisse',
              'rendezvous',
              'stock',
              'parametres',
              'utilisateurs',
            ],
            status: 'actif' as const,
          },
          {
            id: '2',
            username: 'medecin',
            password: 'medecin123',
            email: 'medecin@clinique.com',
            role: 'medecin' as const,
            nom: 'Dupont',
            prenom: 'Dr. Jean',
            clinicCode: 'CLINIC001',
            permissions: ['consultations', 'patients', 'rendezvous'],
            status: 'actif' as const,
          },
          {
            id: '3',
            username: 'pharmacien',
            password: 'pharma123',
            email: 'pharmacien@clinique.com',
            role: 'pharmacien' as const,
            nom: 'Martin',
            prenom: 'Marie',
            clinicCode: 'CLINIC001',
            permissions: ['pharmacie', 'stock', 'patients'],
            status: 'actif' as const,
          },
        ],
        'CLINIC002': [
          {
            id: '4',
            username: 'admin',
            password: 'admin123',
            email: 'admin@clinique2.com',
            role: 'admin' as const,
            nom: 'Admin',
            prenom: 'Clinique 2',
            clinicCode: 'CLINIC002',
            permissions: [
              'consultations',
              'patients',
              'pharmacie',
              'maternite',
              'laboratoire',
              'imagerie',
              'vaccination',
              'facturation',
              'caisse',
              'rendezvous',
              'stock',
              'parametres',
              'utilisateurs',
            ],
            status: 'actif' as const,
          },
        ],
      };

      // Vérifier que le code clinique existe
      const clinicUsers = demoClinics[credentials.clinicCode.toUpperCase()];
      if (!clinicUsers) {
        setError('Code clinique invalide');
        setIsLoading(false);
        return;
      }

      // Rechercher l'utilisateur dans la base de la clinique
      const user = clinicUsers.find(
        u => u.username === credentials.username && u.password === credentials.password
      );

      if (user) {
        const { password, ...userWithoutPassword } = user;
        const token = `demo-token-${user.clinicCode}-${user.id}-${Date.now()}`;
        
        // Récupérer le clinicId depuis l'API si disponible
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 
            (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
            'http://localhost:3000';
          const clinicResponse = await fetch(
            `${API_BASE_URL}/api/clinics?code=${user.clinicCode}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (clinicResponse.ok) {
            const clinicData = await clinicResponse.json();
            if (clinicData.data && clinicData.data.length > 0) {
              userWithoutPassword.clinicId = clinicData.data[0].id;
            }
          }
        } catch (err) {
          console.warn('Impossible de récupérer le clinicId:', err);
          // Continuer sans clinicId si l'API n'est pas disponible
        }
        
        onLogin(userWithoutPassword, token);
      } else {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      }
    } catch (error) {
      setError('Erreur de connexion. Veuillez réessayer.');
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

  const handleRecoverySubmit = async (data: CreateRecoveryRequestDto) => {
    // En production, cela sera un appel API
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // NOTE: Appel API réel à implémenter lorsque le backend sera disponible
      // const response = await fetch('/api/account-recovery/request', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      
      console.log('Demande de récupération soumise:', data);
    } catch (error) {
      throw new Error('Erreur lors de l\'envoi de la demande de récupération');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setError('');

    // Validation
    if (signupForm.password !== signupForm.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      setSignupLoading(false);
      return;
    }

    if (!signupForm.securityQuestions.question1.question || !signupForm.securityQuestions.question1.answer) {
      setError('Veuillez remplir la première question de sécurité');
      setSignupLoading(false);
      return;
    }

    if (!signupForm.securityQuestions.question2.question || !signupForm.securityQuestions.question2.answer) {
      setError('Veuillez remplir la deuxième question de sécurité');
      setSignupLoading(false);
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 
        (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
        'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/auth/register-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
            ...(signupForm.securityQuestions.question3.question && signupForm.securityQuestions.question3.answer ? {
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
          question1: { question: '', answer: '' },
          question2: { question: '', answer: '' },
          question3: { question: '', answer: '' },
        },
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      
      // Gérer spécifiquement l'erreur "Failed to fetch"
      if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 
          (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
          'http://localhost:3000/api';
        setError(`Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur ${API_BASE_URL} et que votre connexion Internet fonctionne.`);
      } else if (error?.message) {
        setError(error.message);
      } else {
        setError('Erreur lors de la soumission de la demande d\'inscription. Veuillez réessayer.');
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
      title: 'Facturation',
      description: 'Gestion complète de la facturation et des paiements.',
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
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  className="hero-button"
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setLoginTab('login');
                    loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.5)}`,
                    },
                  }}
                >
                  Se connecter maintenant
                </Button>
                <Button
                  className="hero-button-signup"
                  variant="contained"
                  size="large"
                  startIcon={<PersonAdd />}
                  onClick={() => {
                    setLoginTab('signup');
                    setTimeout(() => {
                      loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.success.main || theme.palette.secondary.main} 100%)`,
                    color: 'white',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.4)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.success.dark || theme.palette.secondary.dark} 100%)`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 12px 32px ${alpha(theme.palette.secondary.main, 0.5)}`,
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
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
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
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: `0 20px 40px ${alpha(feature.color, 0.3)}`,
                      borderColor: feature.color,
                      '&::before': {
                        left: '100%',
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
                mb: 3,
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: 48,
                },
                '& .Mui-selected': {
                  color: theme.palette.primary.main,
                },
              }}
              indicatorColor="primary"
              textColor="primary"
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
                  autoComplete="organization"
                  autoFocus
                  value={credentials.clinicCode}
                  onChange={(e) => setCredentials({ ...credentials, clinicCode: e.target.value.toUpperCase() })}
                  disabled={isLoading}
                  placeholder="Ex: CLINIC001"
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
                  onClick={() => {
                    setShowRecoveryForm(true);
                    setContactTab('recovery');
                    // Scroll vers la section contact
                    setTimeout(() => {
                      contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
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
                    autoComplete="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    disabled={signupLoading}
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
                    fullWidth
                    select
                    id="roleSouhaite"
                    label="Rôle souhaité"
                    name="roleSouhaite"
                    value={signupForm.roleSouhaite}
                    onChange={(e) => setSignupForm({ ...signupForm, roleSouhaite: e.target.value })}
                    disabled={signupLoading}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="receptionniste">Réceptionniste</option>
                    <option value="medecin">Médecin</option>
                    <option value="pharmacien">Pharmacien</option>
                    <option value="infirmier">Infirmier</option>
                    <option value="admin">Administrateur</option>
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
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="question1"
                  label="Question 1"
                  name="question1"
                  value={signupForm.securityQuestions.question1.question}
                  onChange={(e) => setSignupForm({
                    ...signupForm,
                    securityQuestions: {
                      ...signupForm.securityQuestions,
                      question1: { ...signupForm.securityQuestions.question1, question: e.target.value }
                    }
                  })}
                  disabled={signupLoading}
                  placeholder="Ex: Quel est le nom de jeune fille de votre mère ?"
                  sx={{ mb: 1 }}
                />
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
                  disabled={signupLoading}
                  sx={{ mb: 2 }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="question2"
                  label="Question 2"
                  name="question2"
                  value={signupForm.securityQuestions.question2.question}
                  onChange={(e) => setSignupForm({
                    ...signupForm,
                    securityQuestions: {
                      ...signupForm.securityQuestions,
                      question2: { ...signupForm.securityQuestions.question2, question: e.target.value }
                    }
                  })}
                  disabled={signupLoading}
                  placeholder="Ex: Dans quelle ville êtes-vous né(e) ?"
                  sx={{ mb: 1 }}
                />
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
                  disabled={signupLoading}
                  sx={{ mb: 2 }}
                />

                <TextField
                  margin="normal"
                  fullWidth
                  id="question3"
                  label="Question 3 (optionnelle)"
                  name="question3"
                  value={signupForm.securityQuestions.question3.question}
                  onChange={(e) => setSignupForm({
                    ...signupForm,
                    securityQuestions: {
                      ...signupForm.securityQuestions,
                      question3: { ...signupForm.securityQuestions.question3, question: e.target.value }
                    }
                  })}
                  disabled={signupLoading}
                  placeholder="Ex: Quel est le nom de votre premier animal de compagnie ?"
                  sx={{ mb: 1 }}
                />
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
                  disabled={signupLoading || !signupForm.securityQuestions.question3.question}
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
                  Votre demande sera examinée par un administrateur. Vous recevrez un email une fois votre compte validé.
                </Typography>
              </Box>
            </Box>
            )}
            {loginTab === 'login' && (
            <Box sx={{ 
              mt: 4, 
              p: 3, 
              bgcolor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.info.main, 0.2)
                : alpha(theme.palette.info.main, 0.15), 
              borderRadius: 2, 
              border: `1px solid ${alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.4 : 0.3)}`,
              backdropFilter: 'blur(8px)',
            }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 1.5, 
                  color: theme.palette.mode === 'dark' 
                    ? theme.palette.info.light 
                    : theme.palette.info.main,
                  opacity: 1,
                }}
              >
                Comptes de démonstration :
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2,
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.85)',
                  opacity: 1,
                  fontWeight: 500,
                }}
              >
                <strong>Code clinique :</strong> CLINIC001
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : theme.palette.text.primary,
                      opacity: 1,
                    }}
                  >
                    Admin
                  </Typography>
                  <Typography 
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.75)',
                      opacity: 1,
                      display: 'block',
                    }}
                  >
                    admin / admin123
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : theme.palette.text.primary,
                      opacity: 1,
                    }}
                  >
                    Médecin
                  </Typography>
                  <Typography 
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.75)',
                      opacity: 1,
                      display: 'block',
                    }}
                  >
                    medecin / medecin123
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.95)' : theme.palette.text.primary,
                      opacity: 1,
                    }}
                  >
                    Pharmacien
                  </Typography>
                  <Typography 
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.75)',
                      opacity: 1,
                      display: 'block',
                    }}
                  >
                    pharmacien / pharma123
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            )}
          </Paper>
        </Container>
      </Box>

      {/* Section Contact/Feedback */}
      <Box ref={contactRef} sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Tabs
              value={contactTab}
              onChange={(e, newValue) => {
                setContactTab(newValue);
                setShowRecoveryForm(newValue === 'recovery');
              }}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                mb: 3,
              }}
            >
              <Tab 
                label="Contact général" 
                value="contact"
                icon={<Email />}
                iconPosition="start"
              />
              <Tab 
                label="Récupération de compte" 
                value="recovery"
                icon={<Lock />}
                iconPosition="start"
              />
            </Tabs>
          </Box>
          <Grid container spacing={6}>
            <Grid item xs={12} md={contactTab === 'recovery' ? 12 : 6}>
              {contactTab === 'contact' ? (
                <>
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
                </>
              ) : (
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
                  Récupération de compte
                </Typography>
              )}
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
                      href="mailto:groupita25@gmail.com"
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
                      groupita25@gmail.com
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
            {contactTab === 'contact' && (
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
            )}
            {contactTab === 'recovery' && (
              <Grid item xs={12}>
                <Paper
                  elevation={4}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    bgcolor: 'background.default',
                  }}
                >
                  <AccountRecoveryForm 
                    onSubmit={handleRecoverySubmit}
                    onCancel={() => setContactTab('contact')}
                  />
                </Paper>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

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
    </Box>
  );
};

export default Login;
