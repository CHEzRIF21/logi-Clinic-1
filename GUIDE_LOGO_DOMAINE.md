# 📱 Guide d'Utilisation du Logo avec Nom de Domaine

## ✅ Modifications Effectuées

### Composant Logo Amélioré

Le composant `src/components/ui/Logo.tsx` a été mis à jour avec deux nouvelles propriétés :

```typescript
interface LogoProps {
  variant?: 'default' | 'compact' | 'icon' | 'withDomain';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  className?: string;
  showDomain?: boolean;  // ✨ NOUVEAU - Affiche "logiclinic.org"
  useImage?: boolean;    // ✨ NOUVEAU - Utilise l'image PNG au lieu du SVG
}
```

## 🎨 Options d'Affichage

### Option 1 : Logo SVG Avec Nom de Domaine (Actuel)

```tsx
<Logo 
  variant="default" 
  size="medium" 
  animated={true}
  showDomain={true}  // Affiche "logiclinic.org" en dessous
/>
```

**Résultat** :
```
    ╔═══════════╗
    ║ LogiClinic║
    ║    (i+)   ║
    ║   Clinic  ║
    ╚═══════════╝
   logiclinic.org
```

### Option 2 : Logo Image PNG Avec Nom de Domaine

```tsx
<Logo 
  variant="default" 
  size="medium" 
  animated={false}
  showDomain={true}
  useImage={true}  // Utilise /logo/logo-light.png ou /logo/logo-dark.png
/>
```

**Résultat** :
```
┌──────────────────────────┐
│ [IMAGE LOGO]  LogiClinic │
│              logiclinic.org │
└──────────────────────────┘
```

### Option 3 : Logo Simple (Sans Domaine)

```tsx
<Logo 
  variant="default" 
  size="medium" 
  animated={true}
/>
```

**Résultat** : Logo normal sans le nom de domaine

## 📍 Emplacements Configurés

### 1. Footer de la Landing Page ✅

**Fichier** : `src/components/auth/Login.tsx` (ligne ~1947)

```tsx
{/* Logo avec nom de domaine */}
<Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
  <Logo 
    variant="default" 
    size="medium" 
    animated={false}
    showDomain={true}  // ✅ Affiche logiclinic.org
  />
</Box>
```

### 2. Header Hero (Landing Page)

**Fichier** : `src/components/auth/Login.tsx` (ligne ~828)

Déjà configuré avec le logo SVG animé grand format.

### 3. Sidebar Navigation

**Fichier** : `src/components/layout/ModernLayout.tsx` (ligne ~346)

Logo dans le menu latéral de l'application.

## 🎨 Personnalisation

### Changer les Tailles

```tsx
// Petit logo
<Logo size="small" showDomain={true} />

// Logo moyen (par défaut)
<Logo size="medium" showDomain={true} />

// Grand logo
<Logo size="large" showDomain={true} />
```

### Tailles définies :

| Taille | Largeur | Hauteur | Font Size |
|--------|---------|---------|-----------|
| small  | 120px   | 40px    | 1.25rem   |
| medium | 180px   | 60px    | 1.75rem   |
| large  | 300px   | 100px   | 3.5rem    |

### Styles du Nom de Domaine

Le texte "logiclinic.org" s'adapte automatiquement au thème :

**Mode Clair** :
- Couleur : `rgba(0, 0, 0, 0.5)` (gris semi-transparent)
- Font : Roboto 500

**Mode Sombre** :
- Couleur : `rgba(255, 255, 255, 0.6)` (blanc semi-transparent)
- Font : Roboto 500

## 🖼️ Images du Logo

Les fichiers d'images sont dans `public/logo/` :

```
public/
  └── logo/
      ├── logo-light.png  // Pour mode sombre (logo en blanc)
      └── logo-dark.png   // Pour mode clair (logo en couleur)
```

**Utilisation automatique** :
- Mode sombre → `logo-light.png` (logo clair sur fond sombre)
- Mode clair → `logo-dark.png` (logo sombre sur fond clair)

## 📱 Exemples d'Utilisation

### Dans un Footer

```tsx
<Box sx={{ textAlign: 'center', py: 4 }}>
  <Logo 
    variant="default" 
    size="medium" 
    animated={false}
    showDomain={true}
  />
  <Typography variant="body2" sx={{ mt: 2 }}>
    © 2024 Tous droits réservés
  </Typography>
</Box>
```

### Dans un Header

```tsx
<AppBar>
  <Toolbar>
    <Logo 
      variant="compact" 
      size="small" 
      animated={false}
      showDomain={true}
    />
  </Toolbar>
</AppBar>
```

### Dans une Card

```tsx
<Card>
  <CardContent sx={{ textAlign: 'center' }}>
    <Logo 
      variant="default" 
      size="large" 
      animated={true}
      showDomain={true}
    />
    <Typography variant="h4">Bienvenue</Typography>
  </CardContent>
</Card>
```

## 🎯 Configuration Actuelle

### Landing Page Footer

✅ **Configuré** : Le logo avec le nom de domaine "logiclinic.org" est maintenant affiché dans le footer de la landing page.

**Emplacement** :
1. Au-dessus du copyright
2. Centré horizontalement
3. Affiche "LogiClinic" avec la croix médicale animée
4. Affiche "Clinic" en dessous
5. Affiche "logiclinic.org" en petit en dessous

**Apparence** :

```
┌────────────────────────────────────┐
│                                    │
│          L o g i C l i n i c      │
│         (avec croix médicale +)    │
│              Clinic                │
│          logiclinic.org            │
│                                    │
│   © 2024 Logi Clinic. Tous...     │
│                                    │
│   🔒 Sécurisé  ⚡ Performant...    │
│                                    │
│   ITA INNOVATE - CHEzRIF Agency    │
└────────────────────────────────────┘
```

## 🚀 Prochaines Étapes Suggérées

### 1. Ajouter dans le Header Principal

Si vous voulez aussi le logo avec domaine dans le header de l'application :

```tsx
// Dans src/App.tsx ou votre layout principal
<AppBar>
  <Toolbar>
    <Logo 
      variant="compact" 
      size="small"
      showDomain={true}
      animated={false}
    />
  </Toolbar>
</AppBar>
```

### 2. Page 404 Personnalisée

```tsx
<Box sx={{ textAlign: 'center', py: 10 }}>
  <Logo 
    variant="default" 
    size="large"
    showDomain={true}
    animated={true}
  />
  <Typography variant="h3" sx={{ mt: 4 }}>
    Page non trouvée
  </Typography>
</Box>
```

### 3. Email Signatures

Utilisez l'image PNG pour les signatures d'email :

```html
<img src="https://logiclinic.org/logo/logo-dark.png" alt="LogiClinic" height="60" />
<p>logiclinic.org</p>
```

## 🎨 Personnalisation Avancée

### Changer la Couleur du Nom de Domaine

Dans `src/components/ui/Logo.tsx`, modifiez la ligne ~429 :

```tsx
<Typography
  variant="caption"
  sx={{
    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
    // ↑ Changez ces couleurs selon vos préférences
  }}
>
  logiclinic.org
</Typography>
```

### Ajouter une Animation au Nom de Domaine

```tsx
<Typography
  variant="caption"
  sx={{
    color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
    animation: 'fadeIn 1s ease-in-out',
    '@keyframes fadeIn': {
      from: { opacity: 0, transform: 'translateY(10px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
  }}
>
  logiclinic.org
</Typography>
```

## 📊 Récapitulatif

| Fonctionnalité | État | Description |
|----------------|------|-------------|
| Logo SVG Animé | ✅ | Logo avec croix médicale animée |
| Affichage Domaine | ✅ | Affiche "logiclinic.org" |
| Support Image PNG | ✅ | Peut utiliser logo-dark.png ou logo-light.png |
| Thème Adaptatif | ✅ | S'adapte au mode clair/sombre |
| Footer Landing Page | ✅ | Logo + domaine configuré |
| Animations GSAP | ✅ | Animations fluides et professionnelles |

## 🎉 Résultat Final

Votre landing page affiche maintenant :

1. ✅ Le logo "LogiClinic" avec la croix médicale animée
2. ✅ Le texte "Clinic" en dessous
3. ✅ Le nom de domaine "logiclinic.org" en petit
4. ✅ Le tout centré dans le footer
5. ✅ Adapté au thème clair/sombre

---

**Configuration effectuée le** : 17 Décembre 2024  
**Version** : 1.1.0 - Logo avec domaine intégré

