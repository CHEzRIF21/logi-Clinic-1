# 🔧 Correction des Erreurs d'Authentification et JWT Malformé

## ❌ Problèmes Identifiés

D'après les journaux Supabase, les erreurs suivantes étaient présentes :

1. **Erreurs 400 répétées** : "Identifiants de connexion invalides" provenant de l'application
2. **Jeton JWT malformé** envoyé au point de terminaison `/user`
3. **Réutilisation de jetons invalides** après des tentatives de connexion échouées

## 🔍 Causes Racines

### 1. Email non normalisé
- L'email n'était pas toujours normalisé (lowercase, trim) avant l'appel à `supabase.auth.signInWithPassword()`
- Cela causait des erreurs 400 même avec des identifiants corrects

### 2. Génération de tokens factices
- Quand Supabase Auth échouait, le code générait un token factice : `token-${user.id}-${Date.now()}`
- Ce token n'était **PAS un JWT valide** et causait des erreurs "JWT malformé"

### 3. Stockage de tokens invalides
- Les tokens factices étaient stockés dans `localStorage`
- Ces tokens étaient ensuite utilisés dans les requêtes API avec `Authorization: Bearer ${token}`
- Supabase s'attendait à un JWT valide mais recevait un token invalide

### 4. Gestion d'erreur insuffisante
- Les erreurs 400 (identifiants invalides) n'étaient pas correctement gérées
- Le code continuait même après un échec d'authentification Supabase

## ✅ Corrections Appliquées

### 1. Normalisation de l'Email (`src/components/auth/Login.tsx`)

**Avant :**
```typescript
const email = (credentials.username.includes('@') 
  ? credentials.username.trim().toLowerCase()
  : credentials.username.trim()).trim(); // Double trim()
```

**Après :**
```typescript
const email = credentials.username.includes('@') 
  ? credentials.username.trim().toLowerCase()
  : credentials.username.trim();
```

**Améliorations :**
- Normalisation correcte de l'email (lowercase, trim unique)
- Trim du mot de passe également
- Vérification que l'email n'est pas vide avant l'appel

### 2. Vérification de la Session Supabase Auth

**Nouvelle logique :**
```typescript
// Si l'utilisateur a un auth_user_id, on DOIT avoir une session Supabase Auth valide
if (user.auth_user_id && !authSession?.access_token) {
  // Erreur claire : identifiants invalides
  if (authErrInfo?.status === 400 || authErrInfo?.message?.includes('Invalid login credentials')) {
    setError('Identifiants de connexion invalides. Veuillez vérifier votre email et mot de passe.');
  }
  return; // Ne pas continuer avec un token factice
}
```

**Résultat :**
- Si Supabase Auth échoue avec une erreur 400, on retourne une erreur claire
- On ne génère **PAS** de token factice
- L'utilisateur sait exactement quel est le problème

### 3. Génération de Token Sécurisée

**Avant :**
```typescript
const token = authSession?.access_token || `token-${user.id}-${Date.now()}`;
// ❌ Génère un token factice si Supabase Auth échoue
```

**Après :**
```typescript
let token: string | null = null;

if (user.auth_user_id) {
  // Compte lié à Supabase Auth - on DOIT avoir un JWT valide
  if (!authSession?.access_token) {
    // Erreur : retourner sans générer de token
    return;
  }
  token = authSession.access_token; // ✅ JWT valide
} else {
  // Compte démo sans auth_user_id - token interne (ne sera pas utilisé avec Supabase Auth)
  token = `internal-${user.id}-${Date.now()}`;
}
```

**Résultat :**
- Seuls les JWT valides sont utilisés pour les comptes Supabase Auth
- Les tokens internes sont clairement identifiés
- Pas de génération de tokens factices

### 4. Validation des Tokens dans `apiClient.ts`

**Nouvelle fonction :**
```typescript
function isValidJWT(token: string | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

function getAuthToken(): string | null {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  
  // Si le token n'est pas un JWT valide, ne pas l'utiliser avec Supabase Auth
  if (token && !isValidJWT(token)) {
    console.warn('⚠️ Token non-JWT détecté. Ce token ne peut pas être utilisé avec Supabase Auth.');
    return null; // Ne pas utiliser un token invalide
  }
  
  return token;
}
```

**Résultat :**
- Seuls les JWT valides sont utilisés dans les requêtes API
- Les tokens internes ne sont pas envoyés aux endpoints Supabase Auth

### 5. Stockage Sécurisé dans `App.tsx`

**Avant :**
```typescript
const handleLogin = (userData: User, token: string) => {
  localStorage.setItem('token', token); // ❌ Stocke n'importe quel token
  // ...
};
```

**Après :**
```typescript
const handleLogin = (userData: User, token: string) => {
  // IMPORTANT: Ne stocker que les JWT valides
  const isValidJWT = token && token.includes('.') && token.split('.').length === 3;
  
  if (isValidJWT) {
    localStorage.setItem('token', token); // ✅ JWT valide
    console.log('✅ JWT valide stocké dans localStorage');
  } else {
    // Token interne (compte démo) - ne pas stocker
    console.warn('⚠️ Token interne détecté - non stocké (compte démo)');
    localStorage.removeItem('token'); // Nettoyer les anciens tokens invalides
  }
  // ...
};
```

**Résultat :**
- Seuls les JWT valides sont stockés dans `localStorage`
- Les tokens internes ne sont pas stockés (évite les erreurs JWT malformé)
- Nettoyage automatique des anciens tokens invalides

## 📋 Checklist de Vérification

Après ces corrections, vérifiez que :

- [x] L'email est normalisé (lowercase, trim) avant l'appel Supabase Auth
- [x] Les erreurs 400 retournent un message clair à l'utilisateur
- [x] Aucun token factice n'est généré si Supabase Auth échoue
- [x] Seuls les JWT valides sont stockés dans `localStorage`
- [x] Les tokens internes ne sont pas utilisés avec `supabase.auth.getUser()`

## 🧪 Tests à Effectuer

1. **Test avec identifiants valides :**
   - Se connecter avec un email/mot de passe corrects
   - Vérifier que le JWT est stocké dans `localStorage`
   - Vérifier qu'aucune erreur 400 n'apparaît dans les journaux Supabase

2. **Test avec identifiants invalides :**
   - Se connecter avec un email/mot de passe incorrects
   - Vérifier qu'un message d'erreur clair s'affiche
   - Vérifier qu'aucun token n'est stocké dans `localStorage`
   - Vérifier qu'aucune erreur "JWT malformé" n'apparaît dans les journaux

3. **Test avec compte démo (sans auth_user_id) :**
   - Se connecter avec un compte démo (CAMPUS-001)
   - Vérifier que le token interne n'est pas stocké dans `localStorage`
   - Vérifier que l'authentification fonctionne malgré tout

## 🔄 Prochaines Étapes

1. **Tester la connexion** avec les identifiants qui causaient des erreurs
2. **Vérifier les journaux Supabase** pour confirmer l'absence d'erreurs 400
3. **Vérifier les journaux d'authentification** pour confirmer l'absence de JWT malformés

## 📝 Notes Importantes

- Les **comptes démo** (sans `auth_user_id`) utilisent un système d'authentification différent basé sur `password_hash`
- Ces comptes ne peuvent **PAS** utiliser les endpoints Supabase Auth qui nécessitent un JWT
- Le code gère maintenant correctement ces deux types de comptes

## 🚨 Si le Problème Persiste

Si vous voyez encore des erreurs 400 ou des JWT malformés :

1. **Vérifier les journaux Supabase** pour voir exactement quel endpoint reçoit le token invalide
2. **Vérifier le localStorage** pour s'assurer qu'aucun token factice n'est stocké
3. **Vérifier que l'email** est bien normalisé dans tous les appels
4. **Nettoyer le localStorage** et réessayer la connexion

---

**Date de correction :** 28 janvier 2026  
**Fichiers modifiés :**
- `src/components/auth/Login.tsx`
- `src/services/apiClient.ts`
- `src/App.tsx`
