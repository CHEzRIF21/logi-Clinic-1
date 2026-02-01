# 🔧 Correction Accessibilité - Warning aria-hidden

## ❌ Problème

Warning dans la console Chrome :
```
Blocked aria-hidden on an element because its descendant retained focus. 
The focus must not be hidden from assistive technology users.
```

**Cause** : Quand un Dialog Material-UI s'ouvre, il applique automatiquement `aria-hidden="true"` sur le background (le `div#root`). Si un bouton garde le focus au moment de l'ouverture du Dialog, cela crée un conflit d'accessibilité.

---

## ✅ Solution appliquée

### Principe

Retirer le focus du bouton **AVANT** d'ouvrir le Dialog en utilisant `.blur()` sur l'élément.

### Code corrigé

**Fichier** : `src/components/auth/Login.tsx` (ligne ~2118)

**Avant** :
```typescript
<Button
  variant="text"
  size="small"
  onClick={() => setShowForgotPasswordDialog(true)}
  // ...
>
```

**Après** :
```typescript
<Button
  variant="text"
  size="small"
  onClick={(e) => {
    // Empêche le warning Chrome "Blocked aria-hidden..." :
    // on retire le focus du bouton avant l'ouverture du Dialog (MUI appliquera aria-hidden au background)
    (e.currentTarget as HTMLButtonElement).blur();
    setShowForgotPasswordDialog(true);
  }}
  // ...
>
```

---

## 📋 Pattern à appliquer partout

Pour tous les boutons qui ouvrent un Dialog Material-UI, utiliser ce pattern :

```typescript
<Button
  onClick={(e) => {
    // Empêche le warning Chrome "Blocked aria-hidden..."
    (e.currentTarget as HTMLButtonElement).blur();
    setDialogOpen(true);
  }}
>
  Ouvrir Dialog
</Button>
```

---

## ✅ Fichiers déjà corrigés

- ✅ `src/components/auth/Login.tsx` - Bouton "Mot de passe oublié ?"
- ✅ `src/components/consultation/workflow/WorkflowStep10Ordonnance.tsx` - Bouton "Créer une ordonnance"

---

## 🔍 Autres endroits à vérifier

Si le warning apparaît ailleurs, chercher les patterns suivants :

1. **Boutons qui ouvrent des Dialogs** :
   ```typescript
   onClick={() => setDialogOpen(true)}
   ```

2. **Boutons dans des Dialogs** qui ouvrent d'autres Dialogs :
   ```typescript
   onClick={() => setAnotherDialogOpen(true)}
   ```

3. **Boutons avec IconButton** qui ouvrent des Dialogs :
   ```typescript
   <IconButton onClick={() => setDialogOpen(true)}>
   ```

---

## 🧪 Test

1. Ouvrir la page de login (`/login`)
2. Ouvrir la console du navigateur (F12)
3. Cliquer sur "Mot de passe oublié ?"
4. Vérifier qu'il n'y a **plus** de warning `aria-hidden` dans la console

---

## 📚 Références

- [WAI-ARIA Specification - aria-hidden](https://w3c.github.io/aria/#aria-hidden)
- [Material-UI Dialog - Accessibility](https://mui.com/material-ui/react-dialog/#accessibility)
- Solution inspirée de : `src/components/consultation/workflow/WorkflowStep10Ordonnance.tsx` (ligne 415-418)

---

**Date de correction** : Après amélioration ResetPassword.tsx
