import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useThemeMode } from '../../hooks/useThemeMode';
import { gsap } from 'gsap';

interface LogoProps {
  variant?: 'default' | 'compact' | 'icon';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'default', 
  size = 'medium',
  animated = true,
  className 
}) => {
  const { isDark } = useThemeMode();
  const logoRef = useRef<HTMLDivElement>(null);
  const crossRef = useRef<SVGSVGElement>(null);
  const lettersRef = useRef<HTMLDivElement>(null);

  // Tailles selon la variante
  const sizeMap = {
    small: { width: 120, height: 40, fontSize: '1.25rem' },
    medium: { width: 180, height: 60, fontSize: '1.75rem' },
    large: { width: 300, height: 100, fontSize: '3.5rem' },
  };

  const currentSize = sizeMap[size];

  useEffect(() => {
    if (!animated || typeof window === 'undefined' || typeof gsap === 'undefined') {
      return;
    }

    if (logoRef.current) {
      // Animation d'entrée du logo
      gsap.to(logoRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
      });

      // Animation des lettres
      if (lettersRef.current) {
        const letters = lettersRef.current.querySelectorAll('.logo-letter');
        gsap.to(letters, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          delay: 0.2,
        });
      }

      // Animation du texte Clinic
      const clinicText = logoRef.current.querySelector('.logo-clinic-text');
      if (clinicText) {
        gsap.to(clinicText, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: 0.6,
          ease: 'power2.out',
        });
      }

      // Animation continue du cross
      if (crossRef.current) {
        // Faire apparaître le cross
        gsap.to(crossRef.current, {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          delay: 0.5,
          ease: 'back.out(1.7)',
        });

        const verticalBar = crossRef.current.querySelector('.cross-vertical');
        const horizontalBar = crossRef.current.querySelector('.cross-horizontal');
        const dot = crossRef.current.querySelector('.cross-dot');

        // Rotation subtile du cross (très lente et subtile)
        gsap.to(crossRef.current, {
          rotation: 3,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // Pulsation de la barre verticale
        if (verticalBar) {
          gsap.to(verticalBar, {
            scaleY: 1.1,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        }

        // Pulsation de la barre horizontale
        if (horizontalBar) {
          gsap.to(horizontalBar, {
            scaleX: 1.1,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.5,
          });
        }

        // Animation du point
        if (dot) {
          gsap.to(dot, {
            scale: 1.2,
            opacity: 0.8,
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        }
      }
    }

    // Pour la version icon
    if (variant === 'icon' && crossRef.current) {
      gsap.to(crossRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
      });

      const verticalBar = crossRef.current.querySelector('.cross-vertical');
      const horizontalBar = crossRef.current.querySelector('.cross-horizontal');

      if (verticalBar) {
        gsap.to(verticalBar, {
          scaleY: 1.05,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      if (horizontalBar) {
        gsap.to(horizontalBar, {
          scaleX: 1.05,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 0.5,
        });
      }
    }
  }, [animated, variant]);

  // Logo SVG animé
  const renderLogo = () => {
    const isDarkMode = isDark;
    const primaryColor = isDarkMode ? '#ffffff' : '#1e3a8a'; // Blanc pour dark, bleu foncé pour light
    
    // Ajuster les couleurs selon le contexte (fond sombre ou clair)
    const adjustedCrossColor = isDarkMode ? '#60a5fa' : '#3b82f6';

    if (variant === 'icon') {
      // Version icône seulement (le cross)
      return (
        <svg
          ref={crossRef}
          width={currentSize.height}
          height={currentSize.height}
          viewBox="0 0 60 60"
          className="logo-icon"
          style={{ opacity: 0 }}
        >
          <rect
            x="25"
            y="10"
            width="10"
            height="40"
            rx="2"
            fill={adjustedCrossColor}
            className="cross-vertical"
          />
          <rect
            x="10"
            y="25"
            width="40"
            height="10"
            rx="2"
            fill={adjustedCrossColor}
            className="cross-horizontal"
          />
        </svg>
      );
    }

    // Version complète avec texte
    return (
      <Box
        ref={logoRef}
        className={`logo-container ${className || ''}`}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: variant === 'compact' ? 'auto' : currentSize.width,
          height: currentSize.height,
          opacity: 0,
        }}
      >
        <Box
          ref={lettersRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            fontFamily: '"Outfit", "Roboto", sans-serif',
            fontWeight: 700,
            fontSize: currentSize.fontSize,
            color: primaryColor,
            letterSpacing: '-0.02em',
            textShadow: size === 'large' 
              ? (isDark ? '0 0 30px rgba(96, 165, 250, 0.5), 0 0 60px rgba(96, 165, 250, 0.3)' : '0 2px 10px rgba(30, 58, 138, 0.3)')
              : 'none',
          }}
        >
          {/* Lettre L */}
          <Box
            component="span"
            className="logo-letter"
            sx={{
              opacity: 0,
            }}
          >
            L
          </Box>

          {/* Lettre o */}
          <Box
            component="span"
            className="logo-letter"
            sx={{
              opacity: 0,
            }}
          >
            o
          </Box>

          {/* Lettre g */}
          <Box
            component="span"
            className="logo-letter"
            sx={{
              opacity: 0,
            }}
          >
            g
          </Box>

          {/* Lettre i avec cross intégré */}
          <Box
            component="span"
            className="logo-letter"
            sx={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              ml: 0.5,
              opacity: 0,
            }}
          >
            {/* Barre verticale du i (servant de base au cross) */}
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: '0.08em',
                height: '0.7em',
                bgcolor: primaryColor,
                borderRadius: '2px',
                mr: '0.15em',
              }}
            />

            {/* Cross médical animé avec effet 3D */}
            <svg
              ref={crossRef}
              width={currentSize.fontSize}
              height={currentSize.fontSize}
              viewBox="0 0 24 24"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                marginLeft: '0.08em',
                opacity: 0,
                filter: size === 'large' 
                  ? `drop-shadow(0 4px 12px ${adjustedCrossColor}80) drop-shadow(0 0 20px ${adjustedCrossColor}60)`
                  : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
              className="logo-cross"
            >
              {/* Définition du gradient pour l'effet 3D */}
              <defs>
                <linearGradient id={`cross-gradient-${isDark ? 'dark' : 'light'}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={adjustedCrossColor} stopOpacity="1" />
                  <stop offset="50%" stopColor={adjustedCrossColor} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={isDark ? '#3b82f6' : '#2563eb'} stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Barre verticale du cross avec coins arrondis */}
              <rect
                x="10"
                y="4"
                width="4"
                height="16"
                rx="3"
                fill={`url(#cross-gradient-${isDark ? 'dark' : 'light'})`}
                className="cross-vertical"
                style={{ transformOrigin: '12px 12px' }}
                filter="url(#glow)"
              />
              {/* Barre horizontale du cross avec coins arrondis */}
              <rect
                x="4"
                y="10"
                width="16"
                height="4"
                rx="3"
                fill={`url(#cross-gradient-${isDark ? 'dark' : 'light'})`}
                className="cross-horizontal"
                style={{ transformOrigin: '12px 12px' }}
                filter="url(#glow)"
              />
              {/* Point au-dessus du i (carré comme dans l'image) */}
              <rect
                x="10"
                y="2"
                width="4"
                height="4"
                rx="1"
                fill={adjustedCrossColor}
                className="cross-dot"
                style={{ transformOrigin: '12px 4px' }}
              />
            </svg>
          </Box>
        </Box>

        {/* Texte "Clinic" en dessous */}
        {variant === 'default' && (
          <Box
            className="logo-clinic-text"
            sx={{
              marginTop: '0.15em',
              fontSize: '0.5em',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: primaryColor,
              opacity: 0,
            }}
          >
            Clinic
          </Box>
        )}

        {/* Version compacte avec texte à côté */}
        {variant === 'compact' && (
          <Box
            component="span"
            className="logo-clinic-text"
            sx={{
              marginLeft: '0.5em',
              fontSize: '0.6em',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              opacity: 0,
            }}
          >
            Clinic
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.3s ease',
        filter: size === 'large' ? 'drop-shadow(0 8px 24px rgba(59, 130, 246, 0.4))' : 'none',
        '&:hover': {
          transform: 'scale(1.02)',
          filter: size === 'large' 
            ? 'drop-shadow(0 12px 32px rgba(59, 130, 246, 0.6))' 
            : 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))',
          '& .logo-cross': {
            filter: 'brightness(1.2) drop-shadow(0 0 12px rgba(59, 130, 246, 0.8))',
          },
        },
      }}
    >
      {renderLogo()}
    </Box>
  );
};

export default Logo;

